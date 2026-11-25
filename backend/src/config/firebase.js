import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { env } from "./env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function resolveCredential() {
  if (env.firebaseServiceAccount) {
    try {
      const parsed = JSON.parse(env.firebaseServiceAccount);
      console.log("Firebase Admin SDK initialized using environment variable.");
      return cert(parsed);
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", error.message);
    }
  }

  const serviceAccountPath =
    env.firebaseServiceAccountPath || join(__dirname, "../../firebase-key.json");
  try {
    const parsed = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    console.log("Firebase Admin SDK initialized using local firebase-key.json.");
    return cert(parsed);
  } catch (error) {
    console.warn(
      "Could not load Firebase service account JSON. Falling back to Application Default Credentials:",
      error.message
    );
    return undefined;
  }
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: resolveCredential(),
      projectId: env.firebaseProjectId
    });

export const db = getFirestore(app);
