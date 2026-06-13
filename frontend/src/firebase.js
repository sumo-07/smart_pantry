import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

const isConfigured = 
  apiKey && 
  apiKey !== "your_firebase_api_key_here" && 
  projectId && 
  projectId !== "your_firebase_project_id_here";

let db = null;
let auth = null;
let googleProvider = null;
let useFirebase = false;

if (isConfigured) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    useFirebase = true;
    console.log("Firebase Auth & Firestore initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed, using local storage fallback:", error);
  }
} else {
  console.warn("Firebase credentials not fully configured in frontend/.env. Running in Local Storage demo mode.");
}

export { db, auth, googleProvider, useFirebase };
export default db;
