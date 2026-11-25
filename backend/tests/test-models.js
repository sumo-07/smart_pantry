import { env } from "../src/config/env.js";

const apiKey = env.geminiApiKey;

if (!apiKey || apiKey === "your_gemini_api_key_here") {
  console.error("GEMINI_API_KEY not configured in backend/.env!");
  process.exit(1);
}

async function run() {
  try {
    console.log("Listing available models...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log("Supported Models:");
    data.models?.forEach((m) => {
      console.log(
        `- ${m.name} (${m.displayName}) -> supports: ${m.supportedGenerationMethods.join(", ")}`
      );
    });
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

run();
