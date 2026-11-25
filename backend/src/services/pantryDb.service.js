import { db } from "../config/firebase.js";
import { calculateConsumption } from "./consumption.service.js";

/**
 * Fetches all scans for a user sorted chronologically (oldest -> newest).
 */
export async function getUserScansChronological(userId) {
  const querySnapshot = await db.collection("scans").where("userId", "==", userId).get();
  const userScans = [];
  querySnapshot.forEach((doc) => {
    userScans.push({ id: doc.id, ...doc.data() });
  });
  userScans.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return userScans;
}

/**
 * Persists predictions and shopping list to Firestore.
 */
export async function savePredictionsAndShoppingList(userId, predictions, shoppingList) {
  const updatedAt = new Date().toISOString();
  await Promise.all([
    db.collection("predictions").doc(userId).set({
      userId,
      predictions,
      updatedAt
    }),
    db.collection("shoppingLists").doc(userId).set({
      userId,
      items: shoppingList,
      updatedAt
    })
  ]);
}

/**
 * Resolves existing item names and baseline context prior to a new scan.
 */
export async function getScanContextForUser(userId, scanType, baselineScanId) {
  let existingItemNames = [];
  let previousBaselineScan = null;
  let latestPreviousScan = null;

  const inventoryDoc = await db.collection("inventories").doc(userId).get();
  if (inventoryDoc.exists) {
    const inventoryData = inventoryDoc.data();
    if (Array.isArray(inventoryData?.items)) {
      existingItemNames = inventoryData.items.map((item) => item.name);
    }
  }

  if (scanType === "subsequent") {
    const userScans = await getUserScansChronological(userId);
    if (userScans.length > 0) {
      latestPreviousScan = userScans[userScans.length - 1];
      if (baselineScanId) {
        previousBaselineScan = userScans.find((s) => s.id === baselineScanId) || null;
        if (!previousBaselineScan) {
          const specificDoc = await db.collection("scans").doc(baselineScanId).get();
          if (specificDoc.exists) {
            previousBaselineScan = { id: specificDoc.id, ...specificDoc.data() };
          }
        }
      }
      if (!previousBaselineScan) {
        for (let i = userScans.length - 1; i >= 0; i--) {
          if (userScans[i].scanType === "baseline") {
            previousBaselineScan = userScans[i];
            break;
          }
        }
      }
    }
  }

  return { existingItemNames, previousBaselineScan, latestPreviousScan };
}

/**
 * Synchronizes user's inventories snapshot, predictions, and shopping list
 * based on remaining scans after one or more scans are deleted.
 */
export async function syncStateAfterScanDeletion(userId, deletedIdsSet) {
  const remainingScans = await getUserScansChronological(userId);

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
