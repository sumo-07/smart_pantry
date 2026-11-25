import test from "node:test";
import assert from "node:assert/strict";
import { extractJSON } from "../src/utils/jsonParser.js";

test("extractJSON parses markdown-fenced JSON response", () => {
  const raw = "```json\n{\"items\":[{\"name\":\"Eggs\",\"quantity\":12}]}\n```";
  const parsed = extractJSON(raw);
  assert.deepEqual(parsed, { items: [{ name: "Eggs", quantity: 12 }] });
});

test("extractJSON extracts JSON embedded in conversational prose", () => {
  const raw = "Here are the items found:\n{\"items\":[{\"name\":\"Milk\",\"quantity\":2}]}\nDone!";
  const parsed = extractJSON(raw);
  assert.deepEqual(parsed, { items: [{ name: "Milk", quantity: 2 }] });
});

test("extractJSON falls back to regex recovery on truncated JSON", () => {
  const raw = "{\"items\":[{\"name\":\"Cashews\",\"quantity\":4},{\"name\":\"Almonds\",\"quantity\":2";
  const parsed = extractJSON(raw);
  assert.deepEqual(parsed, {
    items: [
      { name: "Cashews", quantity: 4 },
      { name: "Almonds", quantity: 2 }
    ]
  });
});
