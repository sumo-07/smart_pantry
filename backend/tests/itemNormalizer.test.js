import test from "node:test";
import assert from "node:assert/strict";
import { areItemsIdentical, consolidateDetectedItems } from "../src/utils/itemNormalizer.js";

test("areItemsIdentical merges singular/plural but protects distinct product variants", () => {
  assert.equal(areItemsIdentical("Egg", "Eggs"), true);
  assert.equal(areItemsIdentical("Tomato", "Tomatoes"), true);
  assert.equal(areItemsIdentical("Diet Coke", "Coca-Cola"), false);
  assert.equal(areItemsIdentical("Whole Milk", "Milk"), false);
  assert.equal(areItemsIdentical("Greek Yogurt", "Yogurt"), false);
});

test("consolidateDetectedItems sums duplicate quantities and preserves canonical names", () => {
  const result = consolidateDetectedItems(
    [
      { name: "Egg", quantity: 6 },
      { name: "Eggs", quantity: 6 },
      { name: "Whole Milk", quantity: 1 },
      { name: "Milk", quantity: 2 }
    ],
    ["Eggs"]
  );

  assert.equal(result.length, 3);
  assert.deepEqual(result.find((i) => i.name === "Eggs"), { name: "Eggs", quantity: 12 });
  assert.deepEqual(result.find((i) => i.name === "Whole Milk"), { name: "Whole Milk", quantity: 1 });
  assert.deepEqual(result.find((i) => i.name === "Milk"), { name: "Milk", quantity: 2 });
});

test("consolidateDetectedItems preserves category when provided", () => {
  const result = consolidateDetectedItems([
    { name: "Tomato", quantity: 2, category: "Produce" },
    { name: "Tomatoes", quantity: 3, category: "Produce" }
  ]);
  assert.deepEqual(result, [{ name: "Tomatoes", quantity: 5, category: "Produce" }]);
});
