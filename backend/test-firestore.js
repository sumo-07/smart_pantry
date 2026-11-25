import { db } from "./src/config/firebase.js";

db.settings({
  preferRest: true
});

console.log("Attempting to write a test document to 'scans' collection...");
const testDoc = {
  userId: "test_user_id",
  timestamp: new Date().toISOString(),
  scanType: "baseline",
  items: [{ name: "Test Apple", quantity: 5 }]
};

try {
  const docRef = await db.collection("scans").add(testDoc);
  console.log("Success! Document written with ID:", docRef.id);
  
  console.log("Attempting to read it back...");
  const readDoc = await db.collection("scans").doc(docRef.id).get();
  console.log("Success! Read document data:", readDoc.data());
  
  console.log("Cleaning up test document...");
  await db.collection("scans").doc(docRef.id).delete();
  console.log("Success! Cleaned up.");
  
  process.exit(0);
} catch (error) {
  console.error("Firestore test failed with error:", error);
  process.exit(1);
}
