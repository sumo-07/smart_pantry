import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ScanUpload from "./pages/ScanUpload";
import ShoppingList from "./pages/ShoppingList";
import Insights from "./pages/Insights";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { db, useFirebase } from "./firebase";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Loader2 } from "lucide-react";
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where
} from "firebase/firestore";

// Base API URL from environment variables or default to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const userId = user ? user.uid : null;

  const [familySize, setFamilySize] = useState(null);
  const [scans, setScans] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  // Load initial data from Firebase or LocalStorage when userId changes
  useEffect(() => {
    if (!userId) {
      // Clear local states on logout
      setFamilySize(null);
      setScans([]);
      setPredictions([]);
      setShoppingList([]);
      return;
    }

    async function loadData() {
      setDbLoading(true);
      try {
        if (useFirebase) {
          // 1. Fetch Family Size
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            setFamilySize(userDoc.data().familySize);
          } else {
            setFamilySize(null);
          }

          // 2. Fetch Scans
          const scansQuery = query(collection(db, "scans"), where("userId", "==", userId));
          const scansSnap = await getDocs(scansQuery);
          const loadedScans = [];
          scansSnap.forEach(doc => {
            loadedScans.push({ id: doc.id, ...doc.data() });
          });
          loadedScans.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          setScans(loadedScans);

          // 3. Fetch Predictions
          const predDoc = await getDoc(doc(db, "predictions", userId));
          if (predDoc.exists()) {
            setPredictions(predDoc.data().predictions || []);
          } else {
            setPredictions([]);
          }

          // 4. Fetch Shopping List
          const listDoc = await getDoc(doc(db, "shoppingLists", userId));
          if (listDoc.exists()) {
            setShoppingList(listDoc.data().items || []);
          } else {
            setShoppingList([]);
          }
        } else {
          // LocalStorage fallback
          const localFamilySize = localStorage.getItem(`pantry_familySize_${userId}`);
          if (localFamilySize) setFamilySize(parseInt(localFamilySize));
          else setFamilySize(null);

          const localScans = localStorage.getItem(`pantry_scans_${userId}`);
          if (localScans) setScans(JSON.parse(localScans));
          else setScans([]);

          const localPredictions = localStorage.getItem(`pantry_predictions_${userId}`);
          if (localPredictions) setPredictions(JSON.parse(localPredictions));
          else setPredictions([]);

          const localList = localStorage.getItem(`pantry_shoppingList_${userId}`);
          if (localList) setShoppingList(JSON.parse(localList));
          else setShoppingList([]);
        }
      } catch (err) {
        console.error("Error loading pantry data:", err);
      } finally {
        setDbLoading(false);
      }
    }

    loadData();
  }, [userId]);

  // Handle Save Family Size
  const handleSaveFamilySize = async (size) => {
    setFamilySize(size);
    try {
      if (useFirebase) {
        await setDoc(doc(db, "users", userId), { familySize: size, userId });
      } else {
        localStorage.setItem(`pantry_familySize_${userId}`, size.toString());
      }
    } catch (err) {
      console.error("Failed to save family size:", err);
    }
  };

  // Handle Image Upload Scan
  const handleScanImage = async (file, scanType) => {
    if (!userId) throw new Error("Please log in first.");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("userId", userId);
    formData.append("scanType", scanType);

    // Call backend API
    const response = await fetch(`${API_URL}/scan`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to scan image.");
    }

    const result = await response.json();

    // If using LocalStorage fallback mode, simulate database write
    let finalScans = [];
    if (!useFirebase) {
      const newScan = {
        id: result.scanId || "scan_" + Date.now(),
        userId,
        timestamp: new Date().toISOString(),
        scanType,
        items: result.items
      };
      
      finalScans = [...scans, newScan].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setScans(finalScans);
      localStorage.setItem(`pantry_scans_${userId}`, JSON.stringify(finalScans));
    } else {
      // Reload scans from Firestore
      const scansQuery = query(collection(db, "scans"), where("userId", "==", userId));
      const scansSnap = await getDocs(scansQuery);
      finalScans = [];
      scansSnap.forEach(doc => {
        finalScans.push({ id: doc.id, ...doc.data() });
      });

      // If the newly created scan is missing due to index replication lag, manually inject it so the UI updates immediately
      if (result.scanId && !finalScans.some(s => s.id === result.scanId)) {
        finalScans.push({
          id: result.scanId,
          userId,
          timestamp: new Date().toISOString(),
          scanType,
          items: result.items
        });
      }

      finalScans.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setScans(finalScans);
    }

    // Auto-trigger inventory comparison if we now have at least two scans
    if (finalScans.length >= 2) {
      // Find the latest baseline scan ID and current scan ID for strongly consistent fetch
      let baselineScanId = null;
      let currentScanId = result.scanId || finalScans[finalScans.length - 1].id;

      // Find the latest scan of type "baseline"
      const baseScan = finalScans.slice().reverse().find(s => s.scanType === "baseline");
      if (baseScan) {
        baselineScanId = baseScan.id;
      }

      // If we don't have a baseline scan ID (or if it's the same as the current scan),
      // default to the second-to-last scan
      if (!baselineScanId || baselineScanId === currentScanId) {
        const secondToLast = finalScans[finalScans.length - 2];
        baselineScanId = secondToLast.id;
      }

      await handleCompare(baselineScanId, currentScanId);
    }

    return result;
  };

  // Handle Comparison and predictions
  const handleCompare = async (baselineScanId = null, currentScanId = null) => {
    if (!userId) return;
    setIsComparing(true);
    try {
      const response = await fetch(`${API_URL}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, baselineScanId, currentScanId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to compare inventories.");
      }

      const result = await response.json();
      setPredictions(result.predictions);
      setShoppingList(result.shoppingList);

      if (!useFirebase) {
        localStorage.setItem(`pantry_predictions_${userId}`, JSON.stringify(result.predictions));
        localStorage.setItem(`pantry_shoppingList_${userId}`, JSON.stringify(result.shoppingList));
      }
    } catch (err) {
      console.error("Error comparing scans:", err);
      simulateLocalComparison();
    } finally {
      setIsComparing(false);
    }
  };

  const simulateLocalComparison = () => {
    if (scans.length < 2) return;
    
    // Find the latest baseline scan
    let lastBaseIdx = -1;
    for (let i = scans.length - 1; i >= 0; i--) {
      if (scans[i].scanType === "baseline") {
        lastBaseIdx = i;
        break;
      }
    }

    let baseScan;
    let currScan = scans[scans.length - 1];

    if (lastBaseIdx !== -1 && lastBaseIdx < scans.length - 1) {
      baseScan = scans[lastBaseIdx];
    } else {
      baseScan = scans[scans.length - 2];
    }

    const tBase = new Date(baseScan.timestamp);
    const tCurr = new Date(currScan.timestamp);

    let daysBetween = (tCurr - tBase) / (1000 * 60 * 60 * 24);
    daysBetween = Math.max(daysBetween, 0.1);

    const baseItemsMap = new Map(baseScan.items.map(i => [i.name.toLowerCase(), i]));
    const currItemsMap = new Map(currScan.items.map(i => [i.name.toLowerCase(), i]));
    const allItemNames = new Set([...baseScan.items.map(i => i.name), ...currScan.items.map(i => i.name)]);

    const localPredictions = [];
    const localShopping = [];

    allItemNames.forEach(name => {
      const key = name.toLowerCase();
      const baseItem = baseItemsMap.get(key);
      const currItem = currItemsMap.get(key);

      const baseQty = baseItem ? baseItem.quantity : 0;
      const currQty = currItem ? currItem.quantity : 0;

      const consumed = Math.max(0, baseQty - currQty);
      const dailyRate = Number((consumed / daysBetween).toFixed(2));
      let daysLeft = null;
      let status = "Healthy";

      if (currQty === 0) {
        daysLeft = 0;
        status = "Critical";
      } else if (dailyRate > 0) {
        daysLeft = Number((currQty / dailyRate).toFixed(1));
        status = daysLeft <= 1 ? "Critical" : daysLeft <= 3 ? "Low" : "Healthy";
      } else {
        daysLeft = Infinity;
        status = "Healthy";
      }

      localPredictions.push({
        name,
        baselineQuantity: baseQty,
        currentQuantity: currQty,
        consumed,
        dailyRate,
        daysLeft: daysLeft === Infinity ? "N/A" : daysLeft,
        status
      });

      if (status === "Critical" || status === "Low") {
        localShopping.push({
          name,
          quantityNeeded: Math.max(1, baseQty - currQty),
          checked: false
        });
      }
    });

    setPredictions(localPredictions);
    setShoppingList(localShopping);
    localStorage.setItem(`pantry_predictions_${userId}`, JSON.stringify(localPredictions));
    localStorage.setItem(`pantry_shoppingList_${userId}`, JSON.stringify(localShopping));
  };

  const handleToggleShoppingItem = async (index) => {
    const updated = [...shoppingList];
    updated[index].checked = !updated[index].checked;
    setShoppingList(updated);

    try {
      if (useFirebase) {
        await setDoc(doc(db, "shoppingLists", userId), {
          userId,
          items: updated,
          updatedAt: new Date().toISOString()
        });
      } else {
        localStorage.setItem(`pantry_shoppingList_${userId}`, JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Failed to toggle shopping item:", err);
    }
  };

  const handleAddShoppingItem = async (name, qty) => {
    if (shoppingList.some(item => item.name.toLowerCase() === name.toLowerCase())) {
      alert(`${name} is already in the shopping list.`);
      return;
    }

    const newItem = {
      name,
      quantityNeeded: qty,
      checked: false
    };

    const updated = [newItem, ...shoppingList];
    setShoppingList(updated);

    try {
      if (useFirebase) {
        await setDoc(doc(db, "shoppingLists", userId), {
          userId,
          items: updated,
          updatedAt: new Date().toISOString()
        });
      } else {
        localStorage.setItem(`pantry_shoppingList_${userId}`, JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Failed to add shopping item:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center">
        <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
        <span className="text-xs text-gray-500 mt-2.5 font-semibold tracking-wider">SECURE AUTH INITIALIZING...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      <Navbar familySize={familySize} />

      <div className="flex flex-1">
        {/* Show sidebar only if user has a configured session */}
        {user && familySize && <Sidebar familySize={familySize} />}

        <main className="flex-1 overflow-y-auto">
          <Routes>
            {/* Landing Page - Accessible to everyone */}
            <Route path="/" element={<LandingPage userId={user && familySize ? userId : null} />} />

            {/* Auth pages - Redirection if already logged in */}
            <Route 
              path="/login" 
              element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
            />
            <Route 
              path="/register" 
              element={!user ? <Register /> : <Navigate to="/dashboard" replace />} 
            />

            {/* Protected Dashboard Pages */}
            <Route 
              path="/dashboard" 
              element={
                user ? (
                  familySize ? (
                    <Dashboard 
                      scans={scans} 
                      predictions={predictions} 
                      familySize={familySize}
                      isLoading={dbLoading}
                      onTriggerCompare={handleCompare}
                      isComparing={isComparing}
                    />
                  ) : (
                    <Navigate to="/scan" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            <Route 
              path="/scan" 
              element={
                user ? (
                  <ScanUpload 
                    familySize={familySize}
                    onSaveFamilySize={handleSaveFamilySize}
                    onScanImage={handleScanImage}
                    scans={scans}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            <Route 
              path="/shopping-list" 
              element={
                user ? (
                  familySize ? (
                    <ShoppingList 
                      shoppingList={shoppingList}
                      onToggleItem={handleToggleShoppingItem}
                      onAddItem={handleAddShoppingItem}
                      isLoading={dbLoading}
                      scansExist={scans.length > 0}
                    />
                  ) : (
                    <Navigate to="/scan" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            <Route 
              path="/insights" 
              element={
                user ? (
                  familySize ? (
                    <Insights 
                      predictions={predictions}
                      isLoading={dbLoading}
                      scansExist={scans.length > 0}
                    />
                  ) : (
                    <Navigate to="/scan" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
