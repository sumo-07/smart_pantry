import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { db } from "./firebase-config.js";
import { consolidateDetectedItems } from "./utils/itemNormalizer.js";
// Firebase Admin SDK manages Firestore access

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Set up Multer for in-memory file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here"
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Structured JSON schemas for Gemini calls
const pantryScanSchema = {
  type: SchemaType.OBJECT,
  properties: {
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          quantity: { type: SchemaType.INTEGER }
        },
        required: ["name", "quantity"]
      }
    }
  },
  required: ["items"]
};

// Helper to convert buffer to generative part
function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    }
  };
}

/**
 * Robustly parses and extracts JSON from Gemini model responses.
 * Handles markdown fences, preamble/postamble conversational text,
 * and JSON object/array substrings.
 */
function extractJSON(text) {
  if (!text) return null;
  let cleaned = text.trim();

  // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // 2. Direct parse attempt
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // 3. Extract JSON object substring { ... }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (e) {}
    }

    // 4. Extract JSON array substring [ ... ]
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        const arr = JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
        return { items: arr };
      } catch (e) {}
    }

    // 5. Regex recovery for item names and quantities
    const items = [];
    const itemRegex = /"name"\s*:\s*"([^"]+)"\s*,\s*"quantity"\s*:\s*(\d+)/gi;
    let match;
    while ((match = itemRegex.exec(cleaned)) !== null) {
      items.push({ name: match[1], quantity: parseInt(match[2], 10) });
    }
    if (items.length > 0) {
      return { items };
    }

    return null;
  }
}

/**
 * Calculates consumption rates, days left, and depletion status
 * by comparing a baseline scan with a current scan.
 */
function calculateConsumption(baselineScan, currentScan) {
  const tBase = new Date(baselineScan.timestamp);
  const tCurr = new Date(currentScan.timestamp);
  let daysBetween = (tCurr - tBase) / (1000 * 60 * 60 * 24);

  // Floor the days between scans to 0.1 to avoid infinity rates in quick hackathon tests
  daysBetween = Math.max(daysBetween, 0.1);

  const baseItemsMap = new Map((baselineScan.items || []).map(i => [i.name.toLowerCase(), i]));
  const currItemsMap = new Map((currentScan.items || []).map(i => [i.name.toLowerCase(), i]));

  const predictions = [];
  const shoppingListItems = [];

  // Track all unique item names
  const allItemNames = new Set([
    ...(baselineScan.items || []).map(i => i.name),
    ...(currentScan.items || []).map(i => i.name)
  ]);

  for (const name of allItemNames) {
    const nameKey = name.toLowerCase();
    const baseItem = baseItemsMap.get(nameKey);
    const currItem = currItemsMap.get(nameKey);

    const baseQty = baseItem ? baseItem.quantity : 0;
    const currQty = currItem ? currItem.quantity : 0;

    // Calculate consumption rate
    const consumed = Math.max(0, baseQty - currQty);
    const dailyRate = Number((consumed / daysBetween).toFixed(2));

    let daysLeft = null;
    let status = "Healthy";

    if (currQty === 0) {
      daysLeft = 0;
      status = "Critical";
    } else if (dailyRate > 0) {
      daysLeft = Number((currQty / dailyRate).toFixed(1));
      if (daysLeft <= 1) {
        status = "Critical";
      } else if (daysLeft <= 3) {
        status = "Low";
      } else {
        status = "Healthy";
      }
    } else {
      daysLeft = Infinity;
      status = "Healthy";
    }

    predictions.push({
      name,
      baselineQuantity: baseQty,
      currentQuantity: currQty,
      consumed,
      dailyRate,
      daysLeft: daysLeft === Infinity ? "N/A" : daysLeft,
      status
    });

    // Add to shopping list if running low or critical
    if (status === "Critical" || status === "Low") {
      const quantityNeeded = Math.max(1, baseQty - currQty);
      shoppingListItems.push({
        name,
        quantityNeeded,
        checked: false
      });
    }
  }

  return {
    daysBetweenScans: Number(daysBetween.toFixed(2)),
    predictions,
    shoppingList: shoppingListItems
  };
}

/**
 * Persists predictions and shopping list to Firestore.
 */
async function savePredictionsAndShoppingList(userId, predictions, shoppingList) {
  const predDocRef = db.collection("predictions").doc(userId);
  await predDocRef.set({
    userId,
    predictions,
    updatedAt: new Date().toISOString()
  });

  const listDocRef = db.collection("shoppingLists").doc(userId);
  await listDocRef.set({
    userId,
    items: shoppingList,
    updatedAt: new Date().toISOString()
  });
}
// ----------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiEnabled: !!genAI });
});

/**
 * POST /api/scan
 * Uploads an image, analyzes it using Gemini Vision, saves the scan list,
 * and atomically calculates consumption comparison and updates predictions & shopping list.
 */
app.post("/api/scan", upload.single("image"), async (req, res) => {
  try {
    const { userId, scanType, baselineScanId } = req.body; // scanType: "baseline" or "subsequent"
    if (!userId) {
      return res.status(400).json({ error: "Missing userId in request." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    let items = [];

    // Fetch existing items for naming consistency (O(1) lookup) and previous baseline scan
    let existingItemNames = [];
    let previousBaselineScan = null;
    let latestPreviousScan = null;

    try {
      // 1. O(1) inventory lookup for naming consistency
      const inventoryDoc = await db.collection("inventories").doc(userId).get();
      if (inventoryDoc.exists) {
        const inventoryData = inventoryDoc.data();
        if (Array.isArray(inventoryData?.items)) {
          existingItemNames = inventoryData.items.map(item => item.name);
        }
      }

      // 2. Fetch baseline scan if subsequent scan
      if (scanType === "subsequent") {
        const scansRef = db.collection("scans");
        const querySnapshot = await scansRef.where("userId", "==", userId).get();
        const userScans = [];
        querySnapshot.forEach(doc => {
          userScans.push({ id: doc.id, ...doc.data() });
        });
        if (userScans.length > 0) {
          userScans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          latestPreviousScan = userScans[0];
          if (baselineScanId) {
            previousBaselineScan = userScans.find(s => s.id === baselineScanId) || null;
            if (!previousBaselineScan) {
              const specificDoc = await scansRef.doc(baselineScanId).get();
              if (specificDoc.exists) {
                previousBaselineScan = { id: specificDoc.id, ...specificDoc.data() };
              }
            }
          }
          if (!previousBaselineScan) {
            previousBaselineScan = userScans.find(s => s.scanType === "baseline") || null;
          }
        }
      }
    } catch (err) {
      console.error("Error fetching previous scan items for consistency and baseline:", err);
    }

    if (!genAI) {
      console.warn("GEMINI_API_KEY is not set or invalid. Using simulated image analysis.");
      // Simulated items for testing without API key
      const simulatedItems = [
        { name: "Eggs", quantity: scanType === "baseline" ? 12 : 4 },
        { name: "Milk", quantity: scanType === "baseline" ? 4 : 1 },
        { name: "Bread", quantity: scanType === "baseline" ? 2 : 0 },
        { name: "Tomatoes", quantity: scanType === "baseline" ? 8 : 3 },
        { name: "Spinach", quantity: scanType === "baseline" ? 3 : 2 }
      ];
      items = consolidateDetectedItems(simulatedItems, existingItemNames);
    } else {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: pantryScanSchema,
          temperature: 0.1,
          maxOutputTokens: 4096
        }
      });
      let prompt = `You are an expert inventory auditor. Perform an exhaustive visual scan of whatever storage space, container, surface, or environment is shown in this image, regardless of its type, location, or layout.

MANDATORY SCANNING INSTRUCTIONS:
1. SPATIAL SWEEP: Systematically inspect all visible areas, surfaces, levels, rows, tiers, compartments, and containers across the entire frame from TOP to BOTTOM and LEFT to RIGHT.
2. EXHAUSTIVE DETECTION: Do NOT summarize, stop early, or limit detection to prominent foreground items. Detect EVERY visible, identifiable food, beverage, grocery, or packaged product anywhere in the image.
3. DISTINCT IDENTITIES: Differentiate separate product varieties, flavors, and brands (e.g., "ProV Cashew" vs "Nutraj Cashews", "Whole Milk" vs "Skim Milk", "California Inshell Walnuts" vs "Walnut Kernels").
4. ACCURATE COUNTS: For each product, count all identical units visibly present. If items are stacked behind or arranged side-by-side, estimate the total visible count.
5. CLEAN NAMING: Use concise, professional product titles (e.g., "California Inshell Walnuts", "ProV Jumbo Cashews", "Eggs", "Cheddar Cheese").

Return JSON only matching the schema:
{
  "items": [
    {
      "name": "Exact Product Name",
      "quantity": 1
    }
  ]
}`;

      if (existingItemNames.length > 0) {
        prompt += `\n\n5. EXISTING USER PANTRY ITEMS: The user currently has these items in their pantry: ${JSON.stringify(existingItemNames)}.
If you detect any of these exact items, use the exact canonical name from this list to keep tracking continuous. However, if an item is a distinct variant (such as "Whole Milk" vs "Milk", or "Diet Coke" vs "Coke"), maintain its distinct name.`;
      }

      const imagePart = bufferToGenerativePart(req.file.buffer, req.file.mimetype);
      const result = await model.generateContent([prompt, imagePart]);

      const responseText = result.response.text();
      const parsed = extractJSON(responseText);
      if (parsed) {
        const rawItems = Array.isArray(parsed) ? parsed : (parsed.items || parsed.inventory || []);
        const mappedItems = rawItems.map(item => ({
          name: String(item.name || item.item || item.product || "Unknown Item").trim(),
          quantity: Math.max(1, parseInt(item.quantity, 10) || 1)
        }));
        // Consolidate identical items, linguistic variations (singular/plural), while strictly preserving product variants
        items = consolidateDetectedItems(mappedItems, existingItemNames);
      } else {
        console.warn("Could not parse structured JSON from Gemini vision response, defaulting to empty items:", responseText);
        items = [];
      }
    }

    // Validate optional lightweight thumbnail data URL for Firestore storage (must stay well under 1 MB doc limit)
    const rawThumbnail = typeof req.body?.thumbnail === "string" ? req.body.thumbnail.trim() : "";
    const validatedThumbnail =
      rawThumbnail.startsWith("data:image/") && rawThumbnail.length <= 450000
        ? rawThumbnail
        : null;

    // Save scan to scans collection
    const scanRef = db.collection("scans");
    const timestamp = new Date().toISOString();
    const resolvedBaselineScanId = scanType === "subsequent" ? (baselineScanId || previousBaselineScan?.id || null) : null;
    const newScan = {
      userId,
      timestamp,
      scanType,
      baselineScanId: resolvedBaselineScanId,
      items,
      ...(validatedThumbnail ? { imageUrl: validatedThumbnail } : {})
    };
    const docRef = await scanRef.add(newScan);
    const createdScan = { id: docRef.id, ...newScan };

    // Save to inventories collection as current snapshot
    const inventoryRef = db.collection("inventories").doc(userId);
    await inventoryRef.set({
      userId,
      items,
      lastScanId: docRef.id,
      updatedAt: timestamp,
      scanType
    });

    // Calculate consumption immediately for subsequent scan or reset for baseline scan
    let predictions = [];
    let shoppingList = [];

    if (scanType === "subsequent") {
      const baselineScan = previousBaselineScan || latestPreviousScan || createdScan;
      const comparison = calculateConsumption(baselineScan, createdScan);
      predictions = comparison.predictions;
      shoppingList = comparison.shoppingList;
      await savePredictionsAndShoppingList(userId, predictions, shoppingList);
    } else {
      // Baseline scan: initialize/reset predictions for new cycle (all healthy, empty shopping list)
      const comparison = calculateConsumption(createdScan, createdScan);
      predictions = comparison.predictions;
      shoppingList = comparison.shoppingList;
      await savePredictionsAndShoppingList(userId, predictions, shoppingList);
    }

    res.json({
      scanId: docRef.id,
      scanType,
      baselineScanId: resolvedBaselineScanId,
      items,
      imageUrl: validatedThumbnail,
      timestamp,
      predictions,
      shoppingList,
      message: "Scan processed and saved successfully."
    });

  } catch (error) {
    console.error("Error in /api/scan:", error);
    res.status(500).json({ error: error.message || "Failed to process image scan." });
  }
});

/**
 * PUT /api/scans/:id
 * Updates items in an existing scan (CRUD edit support), and synchronizes inventory and predictions.
 */
app.put("/api/scans/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, items } = req.body;
    if (!userId || !Array.isArray(items)) {
      return res.status(400).json({ error: "Missing userId or valid items array." });
    }

    const scanDocRef = db.collection("scans").doc(id);
    const scanDoc = await scanDocRef.get();
    if (!scanDoc.exists) {
      return res.status(404).json({ error: "Scan not found." });
    }

    const scanData = scanDoc.data();
    if (scanData.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized: Scan does not belong to user." });
    }
    const sanitizedItems = items
      .map(item => ({
        name: String(item.name || "").trim(),
        quantity: Math.max(0, parseInt(item.quantity, 10) || 0)
      }))
      .filter(i => i.name.length > 0 && i.quantity > 0);
    const consolidatedItems = consolidateDetectedItems(sanitizedItems);

    const updatedAt = new Date().toISOString();
    await scanDocRef.update({
      items: consolidatedItems,
      updatedAt
    });

    // Check if this scan matches latest inventory
    const inventoryDocRef = db.collection("inventories").doc(userId);
    const invDoc = await inventoryDocRef.get();
    if (invDoc.exists && invDoc.data().lastScanId === id) {
      await inventoryDocRef.update({
        items: consolidatedItems,
        updatedAt
      });
    }

    // Recalculate consumption and update predictions if applicable
    let predictions = [];
    let shoppingList = [];
    try {
      const scansRef = db.collection("scans");
      const querySnapshot = await scansRef.where("userId", "==", userId).get();
      const userScans = [];
      querySnapshot.forEach(doc => {
        if (doc.id === id) {
          userScans.push({ id: doc.id, ...scanData, items: consolidatedItems, updatedAt });
        } else {
          userScans.push({ id: doc.id, ...doc.data() });
        }
      });

      if (userScans.length >= 2) {
        userScans.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        let baseScan = null;
        let currScan = null;

        if (scanData.scanType === "subsequent" && scanData.baselineScanId) {
          baseScan = userScans.find(s => s.id === scanData.baselineScanId);
          currScan = userScans.find(s => s.id === id);
        } else if (scanData.scanType === "baseline") {
          baseScan = userScans.find(s => s.id === id);
          currScan = userScans.find(s => s.baselineScanId === id) || userScans.filter(s => s.scanType === "subsequent").pop();
        }

        if (!baseScan || !currScan) {
          baseScan = userScans.find(s => s.scanType === "baseline");
          currScan = userScans.filter(s => s.scanType === "subsequent").pop() || userScans[userScans.length - 1];
        }

        if (baseScan && currScan && baseScan.id !== currScan.id) {
          const comp = calculateConsumption(baseScan, currScan);
          predictions = comp.predictions;
          shoppingList = comp.shoppingList;
          await savePredictionsAndShoppingList(userId, predictions, shoppingList);
        }
      }
    } catch (calcErr) {
      console.warn("Could not recalculate predictions after scan update:", calcErr);
    }

    res.json({
      success: true,
      scanId: id,
      items: consolidatedItems,
      predictions,
      shoppingList,
      message: "Scan items updated successfully."
    });
  } catch (error) {
    console.error("Error in PUT /api/scans/:id:", error);
    res.status(500).json({ error: error.message || "Failed to update scan items." });
  }
});

/**
 * Synchronizes user's inventories snapshot, predictions, and shopping list
 * based on remaining scans after one or more scans are deleted.
 */
async function syncStateAfterScanDeletion(userId, deletedIdsSet) {
  const remainingSnap = await db.collection("scans").where("userId", "==", userId).get();
  const remainingScans = [];
  remainingSnap.forEach(d => remainingScans.push({ id: d.id, ...d.data() }));
  // Sort oldest -> newest
  remainingScans.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Update inventories snapshot if the previous lastScanId was deleted
  const inventoryDocRef = db.collection("inventories").doc(userId);
  const invDoc = await inventoryDocRef.get();
  if (!invDoc.exists || deletedIdsSet.has(invDoc.data().lastScanId)) {
    if (remainingScans.length > 0) {
      const latest = remainingScans[remainingScans.length - 1];
      await inventoryDocRef.set({
        userId,
        items: latest.items || [],
        lastScanId: latest.id,
        updatedAt: new Date().toISOString(),
        scanType: latest.scanType
      });
    } else {
      await inventoryDocRef.set({
        userId,
        items: [],
        lastScanId: null,
        updatedAt: new Date().toISOString(),
        scanType: null
      });
    }
  }

  // Recalculate or clear predictions & shopping list
  if (remainingScans.length === 0) {
    await savePredictionsAndShoppingList(userId, [], []);
    return { predictions: [], shoppingList: [] };
  }

  const newest = remainingScans[remainingScans.length - 1];
  let baselineScan = newest;

  if (newest.scanType !== "baseline") {
    let latestBase = null;
    for (let i = remainingScans.length - 1; i >= 0; i--) {
      if (remainingScans[i].scanType === "baseline") {
        latestBase = remainingScans[i];
        break;
      }
    }
    if (latestBase) {
      baselineScan = latestBase;
    } else if (remainingScans.length >= 2) {
      baselineScan = remainingScans[remainingScans.length - 2];
    }
  }

  const { predictions, shoppingList } = calculateConsumption(baselineScan, newest);
  await savePredictionsAndShoppingList(userId, predictions, shoppingList);
  return { predictions, shoppingList };
}

/**
 * DELETE /api/scans/:id
 * Deletes a scan and synchronizes inventories, predictions, and shopping list.
 */
app.delete("/api/scans/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId || req.body?.userId;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId." });
    }

    const scanDocRef = db.collection("scans").doc(id);
    const scanDoc = await scanDocRef.get();
    if (!scanDoc.exists) {
      return res.status(404).json({ error: "Scan not found." });
    }

    const scanData = scanDoc.data();
    if (scanData.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized: Scan does not belong to user." });
    }

    await scanDocRef.delete();

    const { predictions, shoppingList } = await syncStateAfterScanDeletion(userId, new Set([id]));

    res.json({
      success: true,
      scanId: id,
      predictions,
      shoppingList,
      message: "Scan deleted successfully."
    });
  } catch (error) {
    console.error("Error in DELETE /api/scans/:id:", error);
    res.status(500).json({ error: error.message || "Failed to delete scan." });
  }
});

/**
 * POST /api/scans/delete-batch
 * Atomically deletes a whole scan cycle/pair (baseline + follow-ups) and recalculates predictions once.
 */
app.post("/api/scans/delete-batch", async (req, res) => {
  try {
    const { userId, scanIds } = req.body;
    if (!userId || !Array.isArray(scanIds) || scanIds.length === 0) {
      return res.status(400).json({ error: "Missing userId or valid scanIds array." });
    }

    const uniqueIds = [...new Set(scanIds.map(id => String(id).trim()).filter(Boolean))];
    if (uniqueIds.length === 0) {
      return res.status(400).json({ error: "No valid scanIds provided." });
    }

    const docRefs = uniqueIds.map(id => db.collection("scans").doc(id));
    const docs = await Promise.all(docRefs.map(ref => ref.get()));

    const batch = db.batch();
    const deletedIds = [];

    for (const scanDoc of docs) {
      if (!scanDoc.exists) continue;
      if (scanDoc.data().userId !== userId) {
        return res.status(403).json({ error: "Unauthorized: One or more scans do not belong to user." });
      }
      batch.delete(scanDoc.ref);
      deletedIds.push(scanDoc.id);
    }

    if (deletedIds.length > 0) {
      await batch.commit();
    }

    const { predictions, shoppingList } = await syncStateAfterScanDeletion(userId, new Set(deletedIds));

    res.json({
      success: true,
      deletedIds,
      predictions,
      shoppingList,
      message: "Scan pair deleted successfully."
    });
  } catch (error) {
    console.error("Error in POST /api/scans/delete-batch:", error);
    res.status(500).json({ error: error.message || "Failed to delete scan pair." });
  }
});

/**
 * POST /api/compare
 * Compares a baseline scan and a current scan, calculates consumption,
 * and updates predictions & shopping list.
 */
app.post("/api/compare", async (req, res) => {
  try {
    const { userId, baselineScanId, currentScanId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId." });
    }

    let baselineScan = null;
    let currentScan = null;

    const scansRef = db.collection("scans");

    if (baselineScanId && currentScanId) {
      // Fetch specific scans
      const baseDoc = await db.collection("scans").doc(baselineScanId).get();
      const currDoc = await db.collection("scans").doc(currentScanId).get();
      if (baseDoc.exists) baselineScan = baseDoc.data();
      if (currDoc.exists) currentScan = currDoc.data();
    } else {
      // Auto-detect scans for this user:
      // Fetch all scans for user ordered by timestamp
      const querySnapshot = await scansRef.where("userId", "==", userId).get();
      const userScans = [];
      querySnapshot.forEach(doc => {
        userScans.push({ id: doc.id, ...doc.data() });
      });

      // Sort scans chronologically
      userScans.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      if (userScans.length < 2) {
        return res.status(400).json({
          error: "Need at least two scans (a baseline and a follow-up) to perform a comparison."
        });
      }

      // Find the latest baseline scan
      let lastBaseIdx = -1;
      for (let i = userScans.length - 1; i >= 0; i--) {
        if (userScans[i].scanType === "baseline") {
          lastBaseIdx = i;
          break;
        }
      }

      // If the latest scan in history is a baseline scan, compare it to itself (resets predictions for new cycle)
      if (userScans[userScans.length - 1].scanType === "baseline") {
        baselineScan = userScans[userScans.length - 1];
        currentScan = userScans[userScans.length - 1];
      }
      // If we found a baseline scan and there is at least one subsequent scan after it:
      else if (lastBaseIdx !== -1 && lastBaseIdx < userScans.length - 1) {
        baselineScan = userScans[lastBaseIdx];
        currentScan = userScans[userScans.length - 1];
      } else {
        // Default to comparing the last two scans in history
        baselineScan = userScans[userScans.length - 2];
        currentScan = userScans[userScans.length - 1];
      }
    }

    if (!baselineScan || !currentScan) {
      return res.status(404).json({ error: "Baseline or current scan not found." });
    }

    const { daysBetweenScans, predictions, shoppingList } = calculateConsumption(baselineScan, currentScan);
    await savePredictionsAndShoppingList(userId, predictions, shoppingList);

    res.json({
      daysBetweenScans,
      predictions,
      shoppingList
    });

  } catch (error) {
    console.error("Error in /api/compare:", error);
    res.status(500).json({ error: error.message || "Failed to compare inventories." });
  }
});

/**
 * GET /api/predictions
 * Returns the latest depletion predictions for a user.
 */
app.get("/api/predictions", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId query param." });
    }

    const predDoc = await db.collection("predictions").doc(userId).get();
    if (!predDoc.exists) {
      return res.json({ predictions: [], message: "No predictions generated yet." });
    }

    res.json(predDoc.data());
  } catch (error) {
    console.error("Error fetching predictions:", error);
    res.status(500).json({ error: "Failed to fetch predictions." });
  }
});

/**
 * GET /api/shopping-list
 * Returns the latest shopping list items for a user.
 */
app.get("/api/shopping-list", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId query param." });
    }

    const listDoc = await db.collection("shoppingLists").doc(userId).get();
    if (!listDoc.exists) {
      return res.json({ items: [], message: "No shopping list generated yet." });
    }

    res.json(listDoc.data());
  } catch (error) {
    console.error("Error fetching shopping list:", error);
    res.status(500).json({ error: "Failed to fetch shopping list." });
  }
});

app.listen(PORT, () => {
  console.log(`Smart Pantry Backend running on http://localhost:${PORT}`);
});

