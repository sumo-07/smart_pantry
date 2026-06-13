import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === "your_gemini_api_key_here") {
  console.error("GEMINI_API_KEY not configured in backend/.env!");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  try {
    console.log("Listing available models...");
    // The listModels API in older SDKs was genAI.listModels()
    // Let's call it or get the generative model for standard names
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log("Supported Models:");
    data.models?.forEach(m => {
      console.log(`- ${m.name} (${m.displayName}) -> supports: ${m.supportedGenerationMethods.join(", ")}`);
    });
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

run();
