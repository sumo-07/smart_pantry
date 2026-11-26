import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ScanUpload from "./pages/ScanUpload";
import ShoppingList from "./pages/ShoppingList";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { db, useFirebase } from "./firebase";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Loader2 } from "lucide-react";
import { createThumbnailDataUrl } from "./utils/compressImage";

// Lazy load secondary/heavy routes for dynamic code splitting
const Insights = lazy(() => import("./pages/Insights"));
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
  const { pathname } = useLocation();
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      allowNestedScroll: true,
      respectReducedMotion: true,
    });
    lenisRef.current = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  const [familySize, setFamilySize] = useState(() => {
    try {
      const cached = localStorage.getItem("pantry_global_familySize");
      return cached ? parseInt(cached, 10) : 4;
    } catch {
      return 4;
    }
  });
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

    // Restore cached family size immediately to prevent screen flickers
    const cachedUserFamilySize = localStorage.getItem(`pantry_familySize_${userId}`) || localStorage.getItem("pantry_global_familySize");
    if (cachedUserFamilySize) {
      setFamilySize(parseInt(cachedUserFamilySize, 10));
    }

    async function loadData() {
      setDbLoading(true);
      try {
        if (useFirebase) {
          // Fetch family size, scans, predictions, and shopping list in parallel
          const [userDoc, scansSnap, predDoc, listDoc] = await Promise.all([
            getDoc(doc(db, "users", userId)),
            getDocs(query(collection(db, "scans"), where("userId", "==", userId))),
            getDoc(doc(db, "predictions", userId)),
            getDoc(doc(db, "shoppingLists", userId))
          ]);

          // 1. Process Family Size
          if (userDoc.exists() && userDoc.data().familySize) {
            const fs = userDoc.data().familySize;
            setFamilySize(fs);
            localStorage.setItem(`pantry_familySize_${userId}`, fs.toString());
            localStorage.setItem("pantry_global_familySize", fs.toString());
          } else if (cachedUserFamilySize) {
            setFamilySize(parseInt(cachedUserFamilySize, 10));
          } else {
            setFamilySize(4);
            localStorage.setItem(`pantry_familySize_${userId}`, "4");
            localStorage.setItem("pantry_global_familySize", "4");
          }

          // 2. Process Scans
          const loadedScans = [];
          scansSnap.forEach(doc => {
            loadedScans.push({ id: doc.id, ...doc.data() });
          });
          loadedScans.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          setScans(loadedScans);

          // 3. Process Predictions
          if (predDoc.exists()) {
            setPredictions(predDoc.data().predictions || []);
          } else {
            setPredictions([]);
          }

          // 4. Process Shopping List
          if (listDoc.exists()) {
            setShoppingList(listDoc.data().items || []);
          } else {
            setShoppingList([]);
          }
        } else {
          // LocalStorage fallback
          const localFamilySize = localStorage.getItem(`pantry_familySize_${userId}`);
          if (localFamilySize) {
            setFamilySize(parseInt(localFamilySize, 10));
          } else {
            setFamilySize(4);
            localStorage.setItem(`pantry_familySize_${userId}`, "4");
            localStorage.setItem("pantry_global_familySize", "4");
          }

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
      localStorage.setItem(`pantry_familySize_${userId}`, size.toString());
      localStorage.setItem("pantry_global_familySize", size.toString());
      if (useFirebase) {
        await setDoc(doc(db, "users", userId), { familySize: size, userId }, { merge: true });
      }
    } catch (err) {
      console.error("Failed to save family size:", err);
    }
  };

  // Handle Image Upload Scan
  const handleScanImage = async (file, scanType, baselineScanId = null) => {
    if (!userId) throw new Error("Please log in first.");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("userId", userId);
    formData.append("scanType", scanType);
    if (baselineScanId) {
      formData.append("baselineScanId", baselineScanId);
    }

    // Generate lightweight JPEG thumbnail for Firestore DB storage (never saved to localStorage)
    try {
      const thumbnail = await createThumbnailDataUrl(file);
      if (thumbnail) {
        formData.append("thumbnail", thumbnail);
      }
    } catch (thumbErr) {
      console.warn("Thumbnail generation skipped:", thumbErr);
    }

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

    const newScan = {
      id: result.scanId || "scan_" + Date.now(),
      userId,
      timestamp: result.timestamp || new Date().toISOString(),
      scanType: result.scanType || scanType,
      baselineScanId: baselineScanId || null,
      items: result.items || [],
      imageUrl: result.imageUrl || null
    };

    const finalScans = [...scans, newScan].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Atomic state update for scans, predictions, and shopping list
    setScans(finalScans);
    if (result.predictions) {
      setPredictions(result.predictions);
    }
    if (result.shoppingList) {
      setShoppingList(result.shoppingList);
    }

    // Persist metadata to local storage ONLY in fallback mode (never store imageUrl in localStorage)
    if (!useFirebase) {
      const scansWithoutImages = finalScans.map(({ imageUrl, ...rest }) => rest);
      localStorage.setItem(`pantry_scans_${userId}`, JSON.stringify(scansWithoutImages));
      if (result.predictions) {
        localStorage.setItem(`pantry_predictions_${userId}`, JSON.stringify(result.predictions));
      }
      if (result.shoppingList) {
        localStorage.setItem(`pantry_shoppingList_${userId}`, JSON.stringify(result.shoppingList));
      }
    }

    return result;
  };

  // Handle manual CRUD updates to scan items via backend
  const handleUpdateScanItems = async (scanId, updatedItems) => {
    if (!userId) return;
    try {
      // 1. Call backend endpoint as sole authoritative source
      const res = await fetch(`${API_URL}/scans/${scanId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, items: updatedItems })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update scan items on server.");
      }

      const data = await res.json();

      // 2. Update frontend state
      setScans(prev =>
        prev.map(s => (s.id === scanId ? { ...s, items: data.items || updatedItems } : s))
      );
      if (data.predictions) {
        setPredictions(data.predictions);
      }
      if (data.shoppingList) {
        setShoppingList(data.shoppingList);
      }

      // 3. Fallback localStorage update (never store imageUrl in localStorage)
      if (!useFirebase) {
        const localScans = scans.map(s => s.id === scanId ? { ...s, items: data.items || updatedItems } : s)
          .map(({ imageUrl, ...rest }) => rest);
        localStorage.setItem(`pantry_scans_${userId}`, JSON.stringify(localScans));
      }

      return data;
    } catch (err) {
      console.error("Error updating scan items:", err);
      throw err;
    }
  };

  // Helper to apply predictions/shoppingList and localStorage fallback after scan deletion
  const applyPostDeleteState = (deletedIdsSet, data) => {
    setScans(prev => {
      const nextScans = prev.filter(s => !deletedIdsSet.has(s.id));
      if (!useFirebase) {
        const scansWithoutImages = nextScans.map(({ imageUrl: _img, ...rest }) => rest);
        localStorage.setItem(`pantry_scans_${userId}`, JSON.stringify(scansWithoutImages));
      }
      return nextScans;
    });

    if (Array.isArray(data?.predictions)) {
      setPredictions(data.predictions);
      if (!useFirebase) {
        localStorage.setItem(`pantry_predictions_${userId}`, JSON.stringify(data.predictions));
      }
    }
    if (Array.isArray(data?.shoppingList)) {
      setShoppingList(data.shoppingList);
      if (!useFirebase) {
        localStorage.setItem(`pantry_shoppingList_${userId}`, JSON.stringify(data.shoppingList));
      }
    }
  };

  // Handle deleting a single scan via backend
  const handleDeleteScan = async (scanId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/scans/${scanId}?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete scan on server.");
      }

      const data = await res.json();
      applyPostDeleteState(new Set([scanId]), data);
    } catch (err) {
      console.error("Error deleting scan:", err);
      throw err;
    }
  };

  // Handle deleting an entire scan pair/cycle atomically via backend
  const handleDeleteScanPair = async (scanIds) => {
    if (!userId || !Array.isArray(scanIds) || scanIds.length === 0) return;
    try {
      const res = await fetch(`${API_URL}/scans/delete-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, scanIds })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete scan pair on server.");
      }

      const data = await res.json();
      const deletedSet = new Set(data.deletedIds || scanIds);
      applyPostDeleteState(deletedSet, data);
    } catch (err) {
      console.error("Error deleting scan pair:", err);
      throw err;
    }
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
      <div className="view" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div className="lcd" style={{ textAlign: "center" }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ margin: "0 auto 8px" }} />
          <div>INITIALIZING AUTH...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar familySize={familySize} />

      <main style={{ flex: 1 }}>
        <Suspense
          fallback={
            <div className="view" style={{ display: "grid", placeItems: "center", minHeight: "40vh" }}>
              <div className="lcd">LOADING MODULE...</div>
            </div>
          }
        >
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
                      shoppingList={shoppingList}
                      familySize={familySize}
                      isLoading={dbLoading}
                      onDeleteScan={handleDeleteScan}
                      onDeleteScanPair={handleDeleteScanPair}
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
                    onUpdateScanItems={handleUpdateScanItems}
                    onDeleteScan={handleDeleteScan}
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
                  <ShoppingList 
                    shoppingList={shoppingList}
                    onToggleItem={handleToggleShoppingItem}
                    onAddItem={handleAddShoppingItem}
                    isLoading={dbLoading}
                    scansExist={scans.length > 0}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            <Route 
              path="/insights" 
              element={
                user ? (
                  <Insights 
                    predictions={predictions}
                    isLoading={dbLoading}
                    scansExist={scans.length > 0}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
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
