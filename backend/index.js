import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc
} from "firebase/firestore";

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

// Helper to convert buffer to generative part
function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    }
  };
}

// Helper to sanitize Gemini response text by stripping Markdown wraps
function cleanJSONResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, "");
    cleaned = cleaned.replace(/\n?```$/, "");
  }
  return cleaned.trim();
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
 * Uploads an image, analyzes it using Gemini Vision, and saves the scan list.
 */
app.post("/api/scan", upload.single("image"), async (req, res) => {
  try {
    const { userId, scanType } = req.body; // scanType: "baseline" or "subsequent"
    if (!userId) {
      return res.status(400).json({ error: "Missing userId in request." });
    }

    let items = [];

    // Fetch existing items for naming consistency
    let existingItemNames = [];
    try {
      const scansRef = collection(db, "scans");
      const q = query(scansRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const userScans = [];
      querySnapshot.forEach(doc => {
        userScans.push(doc.data());
      });
      if (userScans.length > 0) {
        userScans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        existingItemNames = userScans[0].items.map(item => item.name);
      }
    } catch (err) {
      console.error("Error fetching previous scan items for consistency:", err);
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    if (!genAI) {
      console.warn("GEMINI_API_KEY is not set or invalid. Using simulated image analysis.");
      // Simulated items for testing without API key
      items = [
        { name: "Eggs", quantity: scanType === "baseline" ? 12 : 4 },
        { name: "Milk", quantity: scanType === "baseline" ? 4 : 1 },
        { name: "Bread", quantity: scanType === "baseline" ? 2 : 0 },
        { name: "Tomatoes", quantity: scanType === "baseline" ? 8 : 3 },
        { name: "Spinach", quantity: scanType === "baseline" ? 3 : 2 }
      ];
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      let prompt = `Analyze this fridge or pantry image.
Identify visible grocery items.
Estimate quantity.
Return JSON only.
Format:
{
  "items": [
    {
      "name": "Eggs",
      "quantity": 12
    }
  ]
}`;

      if (existingItemNames.length > 0) {
        prompt += `\n\nCRITICAL: The user currently has these items in their pantry: ${JSON.stringify(existingItemNames)}. 
If you detect any of these items in the new image, you MUST use the exact same name from this list (case-sensitive) to keep tracking consistent. For example, if you see milk cartons and the list contains "Milk", use "Milk". Do not invent new names or variations like "milk carton" if it corresponds to an existing item in the list.`;
      }

      const imagePart = bufferToGenerativePart(req.file.buffer, req.file.mimetype);
      const result = await model.generateContent([prompt, imagePart], {
        generationConfig: { responseMimeType: "application/json" }
      });

      const responseText = result.response.text();
      try {
        const cleanedText = cleanJSONResponse(responseText);
        const parsed = JSON.parse(cleanedText);
        items = parsed.items || [];
      } catch (parseErr) {
        console.error("Failed to parse Gemini response:", responseText, parseErr);
        return res.status(500).json({ error: "Gemini Vision returned invalid JSON structure." });
      }
    }

    // Save scan to scans collection
    const scanRef = collection(db, "scans");
    const newScan = {
      userId,
      timestamp: new Date().toISOString(),
      scanType,
      items
    };
    const docRef = await addDoc(scanRef, newScan);

    // Save to inventories collection as current snapshot
    const inventoryRef = doc(db, "inventories", userId);
    await setDoc(inventoryRef, {
      userId,
      items,
      lastScanId: docRef.id,
      updatedAt: new Date().toISOString(),
      scanType
    });

    res.json({
      scanId: docRef.id,
      scanType,
      items,
      message: "Scan processed and saved successfully."
    });

  } catch (error) {
    console.error("Error in /api/scan:", error);
    res.status(500).json({ error: error.message || "Failed to process image scan." });
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

    const scansRef = collection(db, "scans");

    if (baselineScanId && currentScanId) {
      // Fetch specific scans
      const baseDoc = await getDoc(doc(db, "scans", baselineScanId));
      const currDoc = await getDoc(doc(db, "scans", currentScanId));
      if (baseDoc.exists()) baselineScan = baseDoc.data();
      if (currDoc.exists()) currentScan = currDoc.data();
    } else {
      // Auto-detect scans for this user:
      // Fetch all scans for user ordered by timestamp
      const q = query(where(scansRef, "userId", "==", userId));
      const querySnapshot = await getDocs(q);
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

    const tBase = new Date(baselineScan.timestamp);
    const tCurr = new Date(currentScan.timestamp);
    let daysBetween = (tCurr - tBase) / (1000 * 60 * 60 * 24);

    // Floor the days between scans to 0.1 to avoid infinity rates in quick hackathon tests
    daysBetween = Math.max(daysBetween, 0.1);

    const baseItemsMap = new Map(baselineScan.items.map(i => [i.name.toLowerCase(), i]));
    const currItemsMap = new Map(currentScan.items.map(i => [i.name.toLowerCase(), i]));

    const predictions = [];
    const shoppingListItems = [];

    // Track all unique item names
    const allItemNames = new Set([
      ...baselineScan.items.map(i => i.name),
      ...currentScan.items.map(i => i.name)
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

    // Save predictions to database
    const predDocRef = doc(db, "predictions", userId);
    await setDoc(predDocRef, {
      userId,
      predictions,
      updatedAt: new Date().toISOString()
    });

    // Save shopping list to database
    const listDocRef = doc(db, "shoppingLists", userId);
    await setDoc(listDocRef, {
      userId,
      items: shoppingListItems,
      updatedAt: new Date().toISOString()
    });

    res.json({
      daysBetweenScans: Number(daysBetween.toFixed(2)),
      predictions,
      shoppingList: shoppingListItems
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

    const predDoc = await getDoc(doc(db, "predictions", userId));
    if (!predDoc.exists()) {
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

    const listDoc = await getDoc(doc(db, "shoppingLists", userId));
    if (!listDoc.exists()) {
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
