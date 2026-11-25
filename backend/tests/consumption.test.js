import test from "node:test";
import assert from "node:assert/strict";
import { calculateConsumption } from "../src/services/consumption.service.js";

test("calculateConsumption computes healthy, low, and critical statuses accurately", () => {
  const baseline = {
    timestamp: "2026-11-20T00:00:00.000Z",
    items: [
      { name: "Eggs", quantity: 12 },
      { name: "Milk", quantity: 4 },
      { name: "Bread", quantity: 2 }
    ]
  };
  const current = {
    timestamp: "2026-11-22T00:00:00.000Z", // 2 days later
    items: [
      { name: "Eggs", quantity: 10 }, // consumed 2 -> 1/day -> 10 days left -> Healthy
      { name: "Milk", quantity: 2 },  // consumed 2 -> 1/day -> 2 days left -> Low
      { name: "Bread", quantity: 0 }  // 0 left -> Critical
    ]
  };

  const result = calculateConsumption(baseline, current);
  assert.equal(result.daysBetweenScans, 2);
  assert.equal(result.predictions.length, 3);

  const eggs = result.predictions.find((p) => p.name === "Eggs");
  const milk = result.predictions.find((p) => p.name === "Milk");
  const bread = result.predictions.find((p) => p.name === "Bread");

  assert.equal(eggs.status, "Healthy");
  assert.equal(milk.status, "Low");
  assert.equal(bread.status, "Critical");
  assert.equal(result.shoppingList.length, 2);
});

test("calculateConsumption marks baseline-only items as Healthy with N/A daysLeft", () => {
  const baseline = {
    timestamp: "2026-11-20T00:00:00.000Z",
    items: [{ name: "Walnuts", quantity: 3 }]
  };

  const result = calculateConsumption(baseline, baseline);
  assert.equal(result.predictions[0].status, "Healthy");
  assert.equal(result.predictions[0].daysLeft, "N/A");
  assert.equal(result.shoppingList.length, 0);
});
