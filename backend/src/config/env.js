import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load backend/.env regardless of where the process was launched from
dotenv.config({ path: join(__dirname, "../../.env") });

export const env = {
  port: process.env.PORT || 5000,
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  firebaseProjectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || "",
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || ""
};
