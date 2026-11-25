import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { env } from "./env.js";

export const genAI =
  env.geminiApiKey && env.geminiApiKey !== "your_gemini_api_key_here"
    ? new GoogleGenerativeAI(env.geminiApiKey)
    : null;

export const pantryScanSchema = {
  type: SchemaType.OBJECT,
  properties: {
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          quantity: { type: SchemaType.INTEGER },
          category: { type: SchemaType.STRING }
        },
        required: ["name", "quantity", "category"]
      }
    }
  },
  required: ["items"]
};
