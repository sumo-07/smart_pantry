/**
 * Calculates consumption rates, days left, and depletion status
 * by comparing a baseline scan with a current scan.
 *
 * @param {Object} baselineScan
 * @param {Object} currentScan
 * @returns {{daysBetweenScans: number, predictions: Array, shoppingList: Array}}
 */
export function calculateConsumption(baselineScan, currentScan) {
  const tBase = new Date(baselineScan.timestamp);
  const tCurr = new Date(currentScan.timestamp);
  let daysBetween = (tCurr - tBase) / (1000 * 60 * 60 * 24);

  // Floor the days between scans to 0.1 to avoid infinity rates in quick tests
  daysBetween = Math.max(daysBetween, 0.1);

  const baseItemsMap = new Map((baselineScan.items || []).map((i) => [i.name.toLowerCase(), i]));
  const currItemsMap = new Map((currentScan.items || []).map((i) => [i.name.toLowerCase(), i]));

  const predictions = [];
  const shoppingListItems = [];

  const allItemNames = new Set([
    ...(baselineScan.items || []).map((i) => i.name),
    ...(currentScan.items || []).map((i) => i.name)
  ]);

  for (const name of allItemNames) {
    const nameKey = name.toLowerCase();
    const baseItem = baseItemsMap.get(nameKey);
    const currItem = currItemsMap.get(nameKey);

    const baseQty = baseItem ? baseItem.quantity : 0;
    const currQty = currItem ? currItem.quantity : 0;

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
