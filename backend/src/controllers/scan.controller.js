import { db } from "../config/firebase.js";
import { analyzePantryImage } from "../services/geminiVision.service.js";
import { calculateConsumption } from "../services/consumption.service.js";
import { consolidateDetectedItems } from "../utils/itemNormalizer.js";
import {
  getScanContextForUser,
  getUserScansChronological,
  savePredictionsAndShoppingList,
  syncStateAfterScanDeletion
} from "../services/pantryDb.service.js";

/**
 * POST /api/scan
 */
export async function handleScanUpload(req, res) {
  try {
    const { userId, scanType, baselineScanId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId in request." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    let context = { existingItemNames: [], previousBaselineScan: null, latestPreviousScan: null };
    try {
      context = await getScanContextForUser(userId, scanType, baselineScanId);
    } catch (err) {
      console.error("Error fetching previous scan items for consistency and baseline:", err);
    }

    const items = await analyzePantryImage({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      existingItemNames: context.existingItemNames,
      scanType
    });

    const rawThumbnail = typeof req.body?.thumbnail === "string" ? req.body.thumbnail.trim() : "";
    const validatedThumbnail =
      rawThumbnail.startsWith("data:image/") && rawThumbnail.length <= 450000
        ? rawThumbnail
        : null;

    const timestamp = new Date().toISOString();
    const resolvedBaselineScanId =
      scanType === "subsequent"
        ? baselineScanId || context.previousBaselineScan?.id || null
        : null;

    const newScan = {
      userId,
      timestamp,
      scanType,
      baselineScanId: resolvedBaselineScanId,
      items,
      ...(validatedThumbnail ? { imageUrl: validatedThumbnail } : {})
    };

    const docRef = await db.collection("scans").add(newScan);
    const createdScan = { id: docRef.id, ...newScan };

    await db.collection("inventories").doc(userId).set({
      userId,
      items,
      lastScanId: docRef.id,
      updatedAt: timestamp,
      scanType
    });

    const baselineScan =
      scanType === "subsequent"
        ? context.previousBaselineScan || context.latestPreviousScan || createdScan
        : createdScan;

    const { predictions, shoppingList } = calculateConsumption(baselineScan, createdScan);
    await savePredictionsAndShoppingList(userId, predictions, shoppingList);

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
}

/**
 * PUT /api/scans/:id
 */
export async function handleUpdateScan(req, res) {
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
      .map((item) => ({
        name: String(item.name || "").trim(),
        quantity: Math.max(0, parseInt(item.quantity, 10) || 0),
        ...(item.category ? { category: String(item.category).trim() } : {})
      }))
      .filter((i) => i.name.length > 0 && i.quantity > 0);
    const consolidatedItems = consolidateDetectedItems(sanitizedItems);

    const updatedAt = new Date().toISOString();
    await scanDocRef.update({ items: consolidatedItems, updatedAt });

    const inventoryDocRef = db.collection("inventories").doc(userId);
    const invDoc = await inventoryDocRef.get();
    if (invDoc.exists && invDoc.data().lastScanId === id) {
      await inventoryDocRef.update({ items: consolidatedItems, updatedAt });
    }

    let predictions = [];
    let shoppingList = [];
    try {
      const userScans = await getUserScansChronological(userId);
      const updatedUserScans = userScans.map((s) =>
        s.id === id ? { ...s, items: consolidatedItems, updatedAt } : s
      );

      if (updatedUserScans.length >= 2) {
        let baseScan = null;
        let currScan = null;

        if (scanData.scanType === "subsequent" && scanData.baselineScanId) {
          baseScan = updatedUserScans.find((s) => s.id === scanData.baselineScanId);
          currScan = updatedUserScans.find((s) => s.id === id);
        } else if (scanData.scanType === "baseline") {
          baseScan = updatedUserScans.find((s) => s.id === id);
          currScan =
            updatedUserScans.find((s) => s.baselineScanId === id) ||
            updatedUserScans.filter((s) => s.scanType === "subsequent").pop();
        }

        if (!baseScan || !currScan) {
          baseScan = updatedUserScans.find((s) => s.scanType === "baseline");
          currScan =
            updatedUserScans.filter((s) => s.scanType === "subsequent").pop() ||
            updatedUserScans[updatedUserScans.length - 1];
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
}

/**
 * DELETE /api/scans/:id
 */
export async function handleDeleteScan(req, res) {
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

    if (scanDoc.data().userId !== userId) {
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
}

/**
 * POST /api/scans/delete-batch
 */
export async function handleBatchDeleteScans(req, res) {
  try {
    const { userId, scanIds } = req.body;
    if (!userId || !Array.isArray(scanIds) || scanIds.length === 0) {
      return res.status(400).json({ error: "Missing userId or valid scanIds array." });
    }

    const uniqueIds = [...new Set(scanIds.map((id) => String(id).trim()).filter(Boolean))];
    if (uniqueIds.length === 0) {
      return res.status(400).json({ error: "No valid scanIds provided." });
    }

    const docs = await Promise.all(uniqueIds.map((id) => db.collection("scans").doc(id).get()));
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

    const { predictions, shoppingList } = await syncStateAfterScanDeletion(
      userId,
      new Set(deletedIds)
    );

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
}
