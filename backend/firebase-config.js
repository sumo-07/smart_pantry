import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve service account key
let credential;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    credential = cert(serviceAccount);
    console.log("Firebase Admin SDK initialized using environment variable.");
  } catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", error.message);
  }
}

if (!credential) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || join(__dirname, "firebase-key.json");
  try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    credential = cert(serviceAccount);
    console.log("Firebase Admin SDK initialized using local firebase-key.json.");
  } catch (error) {
    console.warn("Could not load Firebase service account JSON. Falling back to Application Default Credentials:", error.message);
    credential = undefined;
  }
}

// Initialize Firebase Admin SDK
const app = initializeApp({
  credential,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID
});

export const db = getFirestore(app);


