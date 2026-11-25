import { db } from "../config/firebase.js";
import { genAI } from "../config/gemini.js";
import { calculateConsumption } from "../services/consumption.service.js";
import {
  getUserScansChronological,
  savePredictionsAndShoppingList
} from "../services/pantryDb.service.js";

/**
 * GET /api/health
 */
export function handleHealth(req, res) {
  res.json({ status: "ok", geminiEnabled: !!genAI });
}

/**
 * POST /api/compare
 */
export async function handleCompare(req, res) {
  try {
    const { userId, baselineScanId, currentScanId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId." });
    }

    let baselineScan = null;
    let currentScan = null;

    if (baselineScanId && currentScanId) {
      const [baseDoc, currDoc] = await Promise.all([
        db.collection("scans").doc(baselineScanId).get(),
        db.collection("scans").doc(currentScanId).get()
      ]);
      if (baseDoc.exists) baselineScan = baseDoc.data();
      if (currDoc.exists) currentScan = currDoc.data();
    } else {
      const userScans = await getUserScansChronological(userId);
      if (userScans.length < 2) {
        return res.status(400).json({
          error: "Need at least two scans (a baseline and a follow-up) to perform a comparison."
        });
      }

      let lastBaseIdx = -1;
      for (let i = userScans.length - 1; i >= 0; i--) {
        if (userScans[i].scanType === "baseline") {
          lastBaseIdx = i;
          break;
        }
      }

      const newest = userScans[userScans.length - 1];
      if (newest.scanType === "baseline") {
        baselineScan = newest;
        currentScan = newest;
      } else if (lastBaseIdx !== -1 && lastBaseIdx < userScans.length - 1) {
        baselineScan = userScans[lastBaseIdx];
        currentScan = newest;
      } else {
        baselineScan = userScans[userScans.length - 2];
        currentScan = newest;
      }
    }

    if (!baselineScan || !currentScan) {
      return res.status(404).json({ error: "Baseline or current scan not found." });
    }

    const { daysBetweenScans, predictions, shoppingList } = calculateConsumption(
      baselineScan,
      currentScan
    );
    await savePredictionsAndShoppingList(userId, predictions, shoppingList);

    res.json({ daysBetweenScans, predictions, shoppingList });
  } catch (error) {
    console.error("Error in /api/compare:", error);
    res.status(500).json({ error: error.message || "Failed to compare inventories." });
  }
}

/**
 * GET /api/predictions
 */
export async function handleGetPredictions(req, res) {
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
}

/**
 * GET /api/shopping-list
 */
export async function handleGetShoppingList(req, res) {
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
}
