import { genAI, pantryScanSchema } from "../config/gemini.js";
import { extractJSON } from "../utils/jsonParser.js";
import { consolidateDetectedItems } from "../utils/itemNormalizer.js";

function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    }
  };
}

function buildVisionPrompt(existingItemNames) {
  let prompt = `You are an expert inventory auditor. Perform an exhaustive visual scan of whatever storage space, container, surface, or environment is shown in this image, regardless of its type, location, or layout.

MANDATORY SCANNING INSTRUCTIONS:
1. SPATIAL SWEEP: Systematically inspect all visible areas, surfaces, levels, rows, tiers, compartments, and containers across the entire frame from TOP to BOTTOM and LEFT to RIGHT.
2. EXHAUSTIVE DETECTION: Do NOT summarize, stop early, or limit detection to prominent foreground items. Detect EVERY visible, identifiable food, beverage, grocery, or packaged product anywhere in the image.
3. DISTINCT IDENTITIES: Differentiate separate product varieties, flavors, and brands (e.g., "ProV Cashew" vs "Nutraj Cashews", "Whole Milk" vs "Skim Milk", "California Inshell Walnuts" vs "Walnut Kernels").
4. ACCURATE COUNTS: For each product, count all identical units visibly present. If items are stacked behind or arranged side-by-side, estimate the total visible count.
5. CLEAN NAMING: Use concise, professional product titles (e.g., "California Inshell Walnuts", "ProV Jumbo Cashews", "Eggs", "Cheddar Cheese").

Return JSON only matching the schema:
{
  "items": [
    {
      "name": "Exact Product Name",
      "quantity": 1
    }
  ]
}`;

  if (existingItemNames.length > 0) {
    prompt += `\n\n5. EXISTING USER PANTRY ITEMS: The user currently has these items in their pantry: ${JSON.stringify(existingItemNames)}.
If you detect any of these exact items, use the exact canonical name from this list to keep tracking continuous. However, if an item is a distinct variant (such as "Whole Milk" vs "Milk", or "Diet Coke" vs "Coke"), maintain its distinct name.`;
  }

  return prompt;
}

/**
 * Analyzes a pantry/storage image using Gemini Vision (or simulated fallback if API key is unset)
 * and returns consolidated, deduplicated item counts.
 */
export async function analyzePantryImage({ buffer, mimeType, existingItemNames = [], scanType = "baseline" }) {
  if (!genAI) {
    console.warn("GEMINI_API_KEY is not set or invalid. Using simulated image analysis.");
    const simulatedItems = [
      { name: "Eggs", quantity: scanType === "baseline" ? 12 : 4 },
      { name: "Milk", quantity: scanType === "baseline" ? 4 : 1 },
      { name: "Bread", quantity: scanType === "baseline" ? 2 : 0 },
      { name: "Tomatoes", quantity: scanType === "baseline" ? 8 : 3 },
      { name: "Spinach", quantity: scanType === "baseline" ? 3 : 2 }
    ];
    return consolidateDetectedItems(simulatedItems, existingItemNames);
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: pantryScanSchema,
      temperature: 0.1,
      maxOutputTokens: 4096
    }
  });

  const prompt = buildVisionPrompt(existingItemNames);
  const imagePart = bufferToGenerativePart(buffer, mimeType);
  const result = await model.generateContent([prompt, imagePart]);

  const responseText = result.response.text();
  const parsed = extractJSON(responseText);
  if (!parsed) {
    console.warn("Could not parse structured JSON from Gemini vision response, defaulting to empty items:", responseText);
    return [];
  }

  const rawItems = Array.isArray(parsed) ? parsed : (parsed.items || parsed.inventory || []);
  const mappedItems = rawItems.map((item) => ({
    name: String(item.name || item.item || item.product || "Unknown Item").trim(),
    quantity: Math.max(1, parseInt(item.quantity, 10) || 1)
  }));

  return consolidateDetectedItems(mappedItems, existingItemNames);
}
