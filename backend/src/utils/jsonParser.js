/**
 * Robustly parses and extracts JSON from Gemini model responses.
 * Handles markdown fences, preamble/postamble conversational text,
 * JSON object/array substrings, and regex item recovery.
 *
 * @param {string} text
 * @returns {{items: Array<{name: string, quantity: number}>} | Array | Object | null}
 */
export function extractJSON(text) {
  if (!text) return null;
  let cleaned = String(text).trim();

  // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // 2. Direct parse attempt
  try {
    return JSON.parse(cleaned);
  } catch {
    // 3. Extract JSON object substring { ... }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch {
        // continue to array fallback
      }
    }

    // 4. Extract JSON array substring [ ... ]
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        const arr = JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
        return { items: arr };
      } catch {
        // continue to regex fallback
      }
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
