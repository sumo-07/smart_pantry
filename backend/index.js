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

/**
 * POST /api/amazon-now/generate-cart
 * Generates an urgent quick-commerce shopping cart based on a natural language scenario using Gemini.
 */
app.post("/api/amazon-now/generate-cart", async (req, res) => {
  try {
    const { scenario } = req.body;
    if (!scenario) {
      return res.status(400).json({ error: "Missing scenario in request body." });
    }

    let cart = [];
    let recommendation_reason = [];
    let urgency_score = 50;

    if (!genAI) {
      console.warn("GEMINI_API_KEY is not set. Using simulated emergency shopping cart.");
      const normalizedScenario = scenario.toLowerCase();
      
      if (normalizedScenario.includes("guest") || normalizedScenario.includes("party") || normalizedScenario.includes("friend") || normalizedScenario.includes("minute")) {
        cart = [
          { name: "Soft Drinks", quantity: 2, price: 3.99 },
          { name: "Chips", quantity: 3, price: 2.49 },
          { name: "Ice Cream", quantity: 1, price: 5.99 },
          { name: "Paper Plates", quantity: 1, price: 2.99 }
        ];
        recommendation_reason = [
          "Drinks and snacks are hosting essentials that require zero prep time.",
          "Paper plates eliminate cleanup, saving time for when guests arrive.",
          "Ice cream serves as a quick, crowd-pleasing dessert."
        ];
        urgency_score = 95;
      } else if (normalizedScenario.includes("headache") || normalizedScenario.includes("sick") || normalizedScenario.includes("fever") || normalizedScenario.includes("cold") || normalizedScenario.includes("pain")) {
        cart = [
          { name: "ORS", quantity: 2, price: 1.99 },
          { name: "Water Bottles", quantity: 4, price: 0.99 },
          { name: "Pain Relief", quantity: 1, price: 6.49 },
          { name: "Light Snacks", quantity: 1, price: 3.49 }
        ];
        recommendation_reason = [
          "ORS and Water are critical for maintaining hydration when feeling ill.",
          "Over-the-counter pain relief targets headaches and fever symptoms directly.",
          "Light snacks provide easy-to-digest energy without stressing your stomach."
        ];
        urgency_score = 90;
      } else if (normalizedScenario.includes("study") || normalizedScenario.includes("night") || normalizedScenario.includes("exam") || normalizedScenario.includes("work")) {
        cart = [
          { name: "Coffee", quantity: 2, price: 4.99 },
          { name: "Energy Drink", quantity: 2, price: 2.99 },
          { name: "Instant Noodles", quantity: 3, price: 1.29 },
          { name: "Biscuits", quantity: 2, price: 1.99 }
        ];
        recommendation_reason = [
          "Coffee and energy drinks provide the caffeine boost required for staying alert.",
          "Instant noodles offer a quick hot meal that takes less than 5 minutes to prepare.",
          "Biscuits are a convenient, mess-free snack to graze on while reading."
        ];
        urgency_score = 75;
      } else if (normalizedScenario.includes("breakfast") || normalizedScenario.includes("morning") || normalizedScenario.includes("people")) {
        cart = [
          { name: "Eggs (12-pack)", quantity: 1, price: 3.99 },
          { name: "White Bread", quantity: 1, price: 2.49 },
          { name: "Fresh Milk", quantity: 1, price: 3.29 },
          { name: "Orange Juice", quantity: 1, price: 4.49 }
        ];
        recommendation_reason = [
          "Eggs and toast make a high-protein, quick breakfast standard.",
          "Milk and orange juice cover basic beverage needs for a complete meal.",
          "Portions are scaled appropriately for breakfast for multiple people."
        ];
        urgency_score = 60;
      } else if (normalizedScenario.includes("movie") || normalizedScenario.includes("show") || normalizedScenario.includes("netflix") || normalizedScenario.includes("date")) {
        cart = [
          { name: "Popcorn", quantity: 2, price: 2.99 },
          { name: "Chocolates", quantity: 3, price: 1.99 },
          { name: "Soft Drinks", quantity: 2, price: 3.99 }
        ];
        recommendation_reason = [
          "Popcorn is the classic movie-watching snack, quick to microwave.",
          "Chocolates satisfy sweet cravings during the film.",
          "Soft drinks wash down the salty snacks."
        ];
        urgency_score = 50;
      } else {
        // Generic fallback
        cart = [
          { name: "Instant Noodles", quantity: 2, price: 1.29 },
          { name: "Water Bottles", quantity: 2, price: 1.99 },
          { name: "Potato Chips", quantity: 1, price: 2.49 }
        ];
        recommendation_reason = [
          "Instant food helps satisfy immediate hunger in general emergencies.",
          "Water bottles ensure clean drinking water is on hand.",
          "Salty snacks provide quick, shelf-stable energy."
        ];
        urgency_score = 40;
      }
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Act as an Amazon Now quick-commerce shopping assistant.
Given a real-life scenario, generate a practical, concise emergency shopping cart optimized for urgent delivery.

Scenario: "${scenario}"

Rules:
1. Recommend only essential items that directly address the scenario.
2. Keep the cart concise (usually 3-6 unique items).
3. Include quantity recommendations.
4. Estimate a realistic price in USD (as a floating-point number, e.g., 2.99 or 4.50) for each item.
5. Provide a list of 2-3 specific reasons (as an array of strings called "recommendation_reason") explaining why these items were selected for this scenario.
6. Calculate an "urgency_score" (integer between 1 and 100) representing how time-critical this shopping trip is (e.g. medical emergencies or guests arriving in 30 mins are 90+, while general movie night or planning tomorrow's breakfast is lower).
7. Return valid JSON only.

Format:
{
  "scenario": "${scenario}",
  "cart": [
    {
      "name": "Soft Drinks",
      "quantity": 2,
      "price": 2.99
    },
    {
      "name": "Chips",
      "quantity": 3,
      "price": 3.49
    }
  ],
  "recommendation_reason": [
    "Drinks and snacks are hosting essentials that require zero prep time.",
    "Matches the quick arrival timeline specified in the scenario."
  ],
  "urgency_score": 95
}`;

      const result = await model.generateContent(prompt, {
        generationConfig: { responseMimeType: "application/json" }
      });

      const responseText = result.response.text();
      try {
        const cleanedText = cleanJSONResponse(responseText);
        const parsed = JSON.parse(cleanedText);
        cart = parsed.cart || [];
        recommendation_reason = parsed.recommendation_reason || [];
        urgency_score = typeof parsed.urgency_score === 'number' ? parsed.urgency_score : 50;

        // Clean/ensure formats
        cart = cart.map(item => ({
          name: item.name || "Unknown Item",
          quantity: typeof item.quantity === 'number' ? item.quantity : 1,
          price: typeof item.price === 'number' ? item.price : parseFloat((Math.random() * 5 + 1.5).toFixed(2))
        }));
      } catch (parseErr) {
        console.error("Failed to parse Gemini response for generate-cart:", responseText, parseErr);
        return res.status(500).json({ error: "Gemini returned invalid JSON structure." });
      }
    }

    res.json({
      scenario,
      cart,
      recommendation_reason,
      urgency_score
    });
  } catch (error) {
    console.error("Error in /api/amazon-now/generate-cart:", error);
    res.status(500).json({ error: error.message || "Failed to generate shopping cart." });
  }
});

// ----------------------------------------------------
// ORDERS ENDPOINTS
// ----------------------------------------------------

/**
 * POST /api/orders
 * Creates a new order and saves it to Firebase.
 * Body: { userId, items: [...], totalPrice, deliveryAddress, notes }
 */
app.post("/api/orders", async (req, res) => {
  try {
    const { userId, items, totalPrice, deliveryAddress, notes } = req.body;
    
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: "Missing required fields: userId, items (non-empty array)" 
      });
    }

    const ordersRef = collection(db, "orders");
    const newOrder = {
      userId,
      items,
      totalPrice: Number(totalPrice) || 0,
      deliveryAddress: deliveryAddress || "",
      notes: notes || "",
      status: "Placing", // Status: Placing → Preparing → Packing → Out For Delivery → Delivered
      createdAt: new Date().toISOString(),
      estimatedDeliveryTime: new Date(Date.now() + 15 * 60000).toISOString() // 15 mins default
    };

    const docRef = await addDoc(ordersRef, newOrder);

    res.status(201).json({
      orderId: docRef.id,
      ...newOrder,
      message: "Order created successfully"
    });

  } catch (error) {
    console.error("Error in /api/orders POST:", error);
    res.status(500).json({ error: error.message || "Failed to create order." });
  }
});

/**
 * GET /api/orders
 * Fetches all orders for a specific user.
 * Query params: userId
 */
app.get("/api/orders", async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "Missing userId query param." });
    }

    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const orders = [];
    querySnapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      userId,
      orders,
      totalOrders: orders.length
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

/**
 * GET /api/orders/:orderId
 * Fetches a specific order by ID.
 */
app.get("/api/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ error: "Missing orderId param." });
    }

    const orderDoc = await getDoc(doc(db, "orders", orderId));
    
    if (!orderDoc.exists()) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json({
      id: orderId,
      ...orderDoc.data()
    });

  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order." });
  }
});

/**
 * PUT /api/orders/:orderId
 * Updates an order's status or details.
 * Body: { status, estimatedDeliveryTime, notes }
 */
app.put("/api/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, estimatedDeliveryTime, notes } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Missing orderId param." });
    }

    const orderRef = doc(db, "orders", orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return res.status(404).json({ error: "Order not found." });
    }

    const updateData = {
      updatedAt: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (estimatedDeliveryTime) updateData.estimatedDeliveryTime = estimatedDeliveryTime;
    if (notes !== undefined) updateData.notes = notes;

    await setDoc(orderRef, updateData, { merge: true });

    res.json({
      id: orderId,
      ...orderDoc.data(),
      ...updateData,
      message: "Order updated successfully"
    });

  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: error.message || "Failed to update order." });
  }
});

/**
 * DELETE /api/orders/:orderId
 * Deletes an order (soft delete - marks as cancelled).
 */
app.delete("/api/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: "Missing orderId param." });
    }

    const orderRef = doc(db, "orders", orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Soft delete - mark as cancelled
    await setDoc(orderRef, {
      status: "Cancelled",
      cancelledAt: new Date().toISOString()
    }, { merge: true });

    res.json({
      id: orderId,
      message: "Order cancelled successfully"
    });

  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: error.message || "Failed to cancel order." });
  }
});

app.listen(PORT, () => {
  console.log(`Smart Pantry Backend running on http://localhost:${PORT}`);
});

