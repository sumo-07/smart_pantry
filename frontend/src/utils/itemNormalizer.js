/**
 * Smart Inventory Item Normalizer & Deduplicator (Frontend Utility)
 * 
 * Rules:
 * 1. Merges exact duplicate items and linguistic variations (singular/plural, e.g. "Egg" & "Eggs" -> "Eggs").
 * 2. Strictly PRESERVES distinct product identity modifiers (e.g. "Diet Coke" != "Coca-Cola", "Whole Milk" != "Milk").
 * 3. Consolidates quantities when items share the exact same product identity.
 */

const PRODUCT_QUALIFIERS = new Set([
  "diet", "zero", "light", "lite", "max",
  "whole", "skim", "skimmed", "almond", "oat", "soy", "coconut", "cashew", "lactose-free", "lactose free",
  "brown", "white", "dark", "milk", "wheat", "multigrain", "rye", "sourdough",
  "greek", "cheddar", "mozzarella", "parmesan", "swiss", "feta", "gouda", "brie",
  "extra virgin", "olive", "canola", "vegetable", "sesame", "peanut", "sunflower",
  "red", "green", "yellow", "black", "blue", "orange",
  "salted", "unsalted", "sweet", "spicy", "hot", "mild",
  "organic", "sparkling", "still", "tonic", "club",
  "canned", "fresh", "frozen", "dried"
]);

/**
 * Checks if two item names represent the EXACT same underlying grocery item,
 * taking into account singular/plural variations and case differences,
 * while STRICTLY ensuring different product variants remain completely separate.
 *
 * @param {string} nameA 
 * @param {string} nameB 
 * @returns {boolean}
 */
export function areItemsIdentical(nameA, nameB) {
  if (!nameA || !nameB) return false;
  const a = String(nameA).trim().toLowerCase();
  const b = String(nameB).trim().toLowerCase();

  // 1. Exact match (case-insensitive)
  if (a === b) return true;

  // 2. Extract words
  const wordsA = a.split(/[\s\-_]+/).filter(Boolean);
  const wordsB = b.split(/[\s\-_]+/).filter(Boolean);

  // If word count difference is > 1, they likely carry extra distinct descriptors
  if (Math.abs(wordsA.length - wordsB.length) > 1) {
    return false;
  }

  // Check if distinguishing qualifiers are present on one side but not the other
  const qualifiersA = wordsA.filter(w => PRODUCT_QUALIFIERS.has(w)).sort().join(" ");
  const qualifiersB = wordsB.filter(w => PRODUCT_QUALIFIERS.has(w)).sort().join(" ");
  if (qualifiersA !== qualifiersB) {
    // Different qualifiers (e.g. "diet" vs none, or "whole" vs "almond") -> NEVER GROUP!
    return false;
  }

  // 3. Check singular/plural inflection
  if (wordsA.length === wordsB.length) {
    let allPrefixesMatch = true;
    for (let i = 0; i < wordsA.length - 1; i++) {
      if (wordsA[i] !== wordsB[i]) {
        allPrefixesMatch = false;
        break;
      }
    }
    if (allPrefixesMatch) {
      const lastA = wordsA[wordsA.length - 1];
      const lastB = wordsB[wordsB.length - 1];

      if (lastA === lastB) return true;
      if (lastA + "s" === lastB || lastB + "s" === lastA) return true;
      if (lastA + "es" === lastB || lastB + "es" === lastA) return true;
      if (lastA.endsWith("y") && lastA.slice(0, -1) + "ies" === lastB) return true;
      if (lastB.endsWith("y") && lastB.slice(0, -1) + "ies" === lastA) return true;
    }
  }

  return false;
}
