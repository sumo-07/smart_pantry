import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  Camera, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  Info, 
  AlertTriangle,
  Clock,
  History,
  CheckCircle,
  RefreshCcw,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit2,
  Save,
  X
} from "lucide-react";
import UploadCard from "../components/UploadCard";
import { motion, AnimatePresence } from "framer-motion";
import { compressImage } from "../utils/compressImage";

export default function ScanUpload({ 
  familySize = 4, 
  onSaveFamilySize, 
  onScanImage, 
  onUpdateScanItems,
  scans = [] 
}) {
  // Household configuration modal
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [sizeInput, setSizeInput] = useState(familySize || 4);

  // Scan state
  const [scanResult, setScanResult] = useState(null);
  const [editableItems, setEditableItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Cycle navigation
  const [activeCycleView, setActiveCycleView] = useState("uncompleted"); // "uncompleted" or "fulfilled"
  const [expandedCycleId, setExpandedCycleId] = useState(null);
  const [selectedBaselineId, setSelectedBaselineId] = useState("");

  // Group all scans chronologically into tracking cycles
  // Every baseline scan represents a cycle; follow-ups pair either explicitly or chronologically
  const cycles = useMemo(() => {
    const sorted = [...scans].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const list = [];
    const baselines = sorted.filter(s => s.scanType === "baseline");

    baselines.forEach((bScan, idx) => {
      const nextBase = baselines[idx + 1];
      const followUps = sorted.filter(s => {
        if (s.scanType !== "subsequent") return false;
        if (s.baselineScanId) return s.baselineScanId === bScan.id;
        const sTime = new Date(s.timestamp).getTime();
        const bTime = new Date(bScan.timestamp).getTime();
        const nTime = nextBase ? new Date(nextBase.timestamp).getTime() : Infinity;
        return sTime >= bTime && sTime < nTime;
      });

      list.push({
        id: bScan.id,
        baselineScan: bScan,
        followUpScans: followUps,
        isFulfilled: followUps.length > 0
      });
    });

    return list;
  }, [scans]);

  // Unfulfilled cycles (all baseline scans awaiting a follow-up)
  const unfulfilledCycles = useMemo(() => {
    return cycles.filter(c => !c.isFulfilled).reverse();
  }, [cycles]);

  // Fulfilled completed cycles
  const fulfilledCycles = useMemo(() => {
    return cycles.filter(c => c.isFulfilled).reverse();
  }, [cycles]);

  // Default scanType: if there are pending uncompleted baselines, default to "subsequent", otherwise "baseline"
  const [scanType, setScanType] = useState(() => (unfulfilledCycles.length > 0 ? "subsequent" : "baseline"));

  // Keep selected baseline synchronized
  useEffect(() => {
    if (unfulfilledCycles.length > 0 && !selectedBaselineId) {
      setSelectedBaselineId(unfulfilledCycles[0].id);
    }
  }, [unfulfilledCycles, selectedBaselineId]);

  // Sync size input when prop updates
  useEffect(() => {
    if (familySize) {
      setSizeInput(familySize);
    }
  }, [familySize]);

  // Sync editable items when scanResult changes
  useEffect(() => {
    if (scanResult?.items) {
      setEditableItems([...scanResult.items]);
    }
  }, [scanResult]);

  const handleHouseholdSubmit = async (e) => {
    e.preventDefault();
    const size = parseInt(sizeInput, 10);
    if (!size || size < 1) {
      alert("Please enter a valid family size (minimum 1).");
      return;
    }
    if (onSaveFamilySize) {
      await onSaveFamilySize(size);
    }
    setShowHouseholdModal(false);
  };

  const handleScan = async (file) => {
    setIsLoading(true);
    setErrorMsg("");
    setSaveSuccessMsg("");
    try {
      let fileToUpload = file;
      if (fileToUpload && fileToUpload.size > 1024 * 1024) {
        try {
          fileToUpload = await compressImage(fileToUpload);
        } catch (compressionErr) {
          console.warn("Image compression failed before upload, using original:", compressionErr);
        }
      }

      // Pass selected baseline ID if uploading a follow-up scan
      const targetBaselineId = scanType === "subsequent" ? selectedBaselineId : null;
      const result = await onScanImage(fileToUpload, scanType, targetBaselineId);
      
      setScanResult(result);
      setEditableItems(result.items || []);
      // Clear image preview on upload completion
      setResetTrigger(prev => prev + 1);
      setShowPopup(true);
    } catch (err) {
      console.error("Scan processing error:", err);
      setErrorMsg(err.message || "Failed to process image scan.");
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD handlers for detected items
  const handleAddItem = (e) => {
    e.preventDefault();
    const name = newItemName.trim();
    if (!name) return;
    const qty = Math.max(1, parseInt(newItemQty, 10) || 1);

    // If item already exists, increase quantity
    const existingIndex = editableItems.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
    if (existingIndex !== -1) {
      const updated = [...editableItems];
      updated[existingIndex].quantity += qty;
      setEditableItems(updated);
    } else {
      setEditableItems([...editableItems, { name, quantity: qty }]);
    }

    setNewItemName("");
    setNewItemQty(1);
    setSaveSuccessMsg("");
  };

  const handleUpdateItemQty = (index, delta) => {
    const updated = [...editableItems];
    const newQty = (updated[index].quantity || 1) + delta;
    if (newQty <= 0) {
      // Remove item if quantity falls to 0
      handleDeleteItem(index);
    } else {
      updated[index].quantity = newQty;
      setEditableItems(updated);
      setSaveSuccessMsg("");
    }
  };

  const handleUpdateItemName = (index, newName) => {
    const updated = [...editableItems];
    updated[index].name = newName;
    setEditableItems(updated);
    setSaveSuccessMsg("");
  };

  const handleDeleteItem = (index) => {
    const updated = editableItems.filter((_, idx) => idx !== index);
    setEditableItems(updated);
    setSaveSuccessMsg("");
  };

  const handleSaveEdits = async () => {
    if (!scanResult?.scanId && !scanResult?.id) return;
    const scanId = scanResult.scanId || scanResult.id;
    setIsSavingEdits(true);
    setSaveSuccessMsg("");
    try {
      if (onUpdateScanItems) {
        await onUpdateScanItems(scanId, editableItems);
      }
      setScanResult(prev => ({ ...prev, items: editableItems }));
      setSaveSuccessMsg("✓ Item edits saved and analysis updated!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    } catch (err) {
      alert("Failed to save changes: " + (err.message || "Server error"));
    } finally {
      setIsSavingEdits(false);
    }
  };

  const handleSelectBaselineForFollowUp = (baselineId) => {
    setSelectedBaselineId(baselineId);
    setScanType("subsequent");
    setScanResult(null);
    setErrorMsg("");
    // Clear previous image preview
    setResetTrigger(prev => prev + 1);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleSwitchToBaselineMode = () => {
    setScanType("baseline");
    setScanResult(null);
    setErrorMsg("");
    // Clear previous image preview
    setResetTrigger(prev => prev + 1);
  };

  const handleSwitchToSubsequentMode = () => {
    if (cycles.length === 0) {
      alert("Please upload an initial baseline scan before uploading a follow-up scan.");
      return;
    }
    setScanType("subsequent");
    setScanResult(null);
    setErrorMsg("");
    // Clear previous image preview
    setResetTrigger(prev => prev + 1);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getDaysAgo = (isoString) => {
    if (!isoString) return 0;
    const diff = Date.now() - new Date(isoString).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const hasAnyBaseline = cycles.length > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header bar with household badge */}
      <div className="border-b border-brand-border pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Camera className="h-7 w-7 text-indigo-400" />
            Pantry Scanner & Cycles
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Capture pantry snapshots to track stock and calculate food consumption.
          </p>
        </div>

        {/* Household Size Badge */}
        <div className="inline-flex items-center gap-2.5 bg-white/5 border border-brand-border px-3.5 py-1.5 rounded-2xl text-xs self-start sm:self-auto">
          <Users className="h-4 w-4 text-indigo-400" />
          <span className="text-gray-300">
            Household: <strong className="text-white">{familySize || 4} members</strong>
          </span>
          <button 
            type="button"
            onClick={() => setShowHouseholdModal(true)} 
            className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold ml-1 cursor-pointer"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Household Edit Modal (Non-blocking) */}
      {showHouseholdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-4 shadow-2xl border border-indigo-500/20"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Users className="h-5 w-5 text-indigo-400" />
                Configure Household
              </div>
              <button 
                type="button"
                onClick={() => setShowHouseholdModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Gemini AI calibrates consumption rates and restock suggestions based on household size.
            </p>

            <form onSubmit={handleHouseholdSubmit} className="space-y-4">
              <div>
                <label htmlFor="modal-family-size" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Number of Household Members
                </label>
                <input
                  id="modal-family-size"
                  type="number"
                  min="1"
                  max="20"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  className="w-full bg-white/5 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowHouseholdModal(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 glow-btn py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Uncompleted Cycles Banner Callout */}
      {unfulfilledCycles.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-amber-500/30 bg-amber-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  {unfulfilledCycles.length} Baseline {unfulfilledCycles.length === 1 ? "Scan" : "Scans"} Awaiting Follow-up
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Action Needed
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                Latest baseline was taken <strong className="text-white">{formatDate(unfulfilledCycles[0].baselineScan.timestamp)}</strong> ({getDaysAgo(unfulfilledCycles[0].baselineScan.timestamp)} days ago). Upload a follow-up scan below to calculate depletion and restock advice.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={handleSwitchToSubsequentMode}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                scanType === "subsequent" 
                  ? "bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20" 
                  : "bg-white/5 text-gray-300 hover:bg-white/10 border border-gray-700"
              }`}
            >
              Upload Follow-up Scan
            </button>
            <button
              type="button"
              onClick={handleSwitchToBaselineMode}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                scanType === "baseline" 
                  ? "bg-indigo-500 text-white shadow" 
                  : "bg-white/5 text-gray-300 hover:bg-white/10 border border-gray-700"
              }`}
            >
              Start New Baseline
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Upload Controls + Scanner & Live Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Uploader Card & Mode Selection */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Scan Mode Selector */}
          <div className="glass-panel rounded-2xl p-3 space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Select Upload Intent
              </span>
              <span className="text-[11px] text-indigo-400 font-semibold">
                {scanType === "subsequent" ? "Comparing against Baseline" : "Initializing Fresh Baseline"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSwitchToBaselineMode}
                className={`text-left p-3 rounded-xl border transition cursor-pointer ${
                  scanType === "baseline"
                    ? "bg-indigo-500/10 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                    : "bg-white/3 border-gray-800 text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <RefreshCcw className="h-3.5 w-3.5 text-indigo-400" />
                  New Baseline Scan
                </div>
                <div className="text-[10px] text-gray-400 mt-1 leading-snug">
                  Fresh grocery restock. Creates a new baseline tracking snapshot.
                </div>
              </button>

              <button
                type="button"
                onClick={handleSwitchToSubsequentMode}
                className={`text-left p-3 rounded-xl border transition ${
                  scanType === "subsequent"
                    ? "bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/10"
                    : "bg-white/3 border-gray-800 text-gray-400 hover:bg-white/5 hover:text-gray-200"
                } ${!hasAnyBaseline ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  Follow-up Scan
                </div>
                <div className="text-[10px] text-gray-400 mt-1 leading-snug">
                  Compares with earlier baseline scan to compute consumption.
                </div>
              </button>
            </div>

            {/* Baseline Target Selector when Subsequent Mode is selected */}
            {scanType === "subsequent" && cycles.length > 0 && (
              <div className="pt-2 border-t border-gray-800 space-y-1.5">
                <label htmlFor="baseline-picker" className="block text-[11px] font-semibold text-gray-300">
                  Target Baseline to Compare Against:
                </label>
                <select
                  id="baseline-picker"
                  value={selectedBaselineId}
                  onChange={(e) => {
                    setSelectedBaselineId(e.target.value);
                    setResetTrigger(prev => prev + 1);
                  }}
                  className="w-full bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                >
                  {unfulfilledCycles.length > 0 && (
                    <optgroup label="⚡ In-Progress Baselines (Awaiting Follow-up)">
                      {unfulfilledCycles.map(c => (
                        <option key={c.id} value={c.id}>
                          Baseline • {formatDate(c.baselineScan.timestamp)} ({c.baselineScan.items?.length || 0} items)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {fulfilledCycles.length > 0 && (
                    <optgroup label="✓ Previously Completed Cycles">
                      {fulfilledCycles.map(c => (
                        <option key={c.id} value={c.id}>
                          Baseline • {formatDate(c.baselineScan.timestamp)} (Fulfilled)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            )}
          </div>

          <UploadCard 
            onUpload={handleScan} 
            isLoading={isLoading} 
            scanType={scanType} 
            resetTrigger={resetTrigger}
          />
        </div>

        {/* Right: Scan Results Visualizer & Full CRUD Editor */}
        <div className="lg:col-span-6 space-y-4">
          {errorMsg && (
            <div className="glass-panel rounded-3xl p-5 border-rose-500/20 bg-rose-500/5 flex gap-3 text-left">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Analysis Failed</h4>
                <p className="text-xs text-gray-400 leading-relaxed mt-1">{errorMsg}</p>
              </div>
            </div>
          )}

          {scanResult ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel rounded-3xl p-6 space-y-4 shadow-xl border border-indigo-500/20"
            >
              <div className="flex justify-between items-center pb-3 border-b border-brand-border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Detection Results (Editable)</h3>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                  {scanResult.scanType === "baseline" ? "Baseline Snapshot" : "Follow-up Snapshot"}
                </span>
              </div>

              {/* CRUD Items List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {editableItems.length > 0 ? (
                  editableItems.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-2.5 bg-white/3 hover:bg-white/5 rounded-xl border border-gray-800 gap-2 transition"
                    >
                      {/* Editable item name */}
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItemName(idx, e.target.value)}
                        className="bg-transparent text-sm font-semibold text-gray-200 border-b border-transparent hover:border-gray-600 focus:border-indigo-400 focus:outline-none flex-1 px-1 py-0.5"
                      />

                      {/* Quantity stepper controls */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-black/40 rounded-lg p-1 border border-gray-750">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, -1)}
                          className="h-6 w-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 text-xs font-bold transition"
                          title="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-indigo-300 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, 1)}
                          className="h-6 w-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 text-xs font-bold transition"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Delete button (remove false positive) */}
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                        title="Delete item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-gray-800 rounded-xl">
                    No items in list. Add items manually below.
                  </div>
                )}
              </div>

              {/* Add New Item Form Row */}
              <form onSubmit={handleAddItem} className="pt-2 border-t border-gray-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add item (e.g. Milk, Eggs)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="flex-1 bg-white/5 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  className="w-16 bg-white/5 border border-gray-700 rounded-xl px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-indigo-500"
                  title="Quantity"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-gray-700 text-xs font-semibold text-white transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </form>

              {/* Save & Apply Edits Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-xs text-emerald-400 font-semibold min-h-[16px]">
                  {saveSuccessMsg}
                </span>

                <button
                  type="button"
                  onClick={handleSaveEdits}
                  disabled={isSavingEdits}
                  className="w-full sm:w-auto glow-btn inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-700 transition cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSavingEdits ? "Saving Changes..." : "Save & Apply Edits"}
                </button>
              </div>

              <div className="pt-2 text-[11px] text-gray-400 flex items-start gap-1.5 bg-white/2 p-2.5 rounded-xl border border-brand-border">
                <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  You can freely add missed grocery items, correct counts, or delete false detections. Click <strong>"Save & Apply Edits"</strong> to commit them to your pantry analysis.
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="glass-panel rounded-3xl p-8 border-dashed border-gray-800 text-center h-[280px] flex flex-col justify-center items-center space-y-3">
              <Camera className="h-8 w-8 text-gray-600" />
              <h4 className="text-sm font-bold text-gray-400">Awaiting Image Capture</h4>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                Upload a pantry photo above. Gemini AI will detect items, and you will have full control to edit, add, or delete items.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Panes: In-Progress / Uncompleted Baseline Scans vs Fulfilled Cycles */}
      <div className="glass-panel rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-brand-border gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Pantry Tracking Cycles</h3>
          </div>

          {/* View switcher tabs */}
          <div className="flex rounded-xl bg-black/40 p-1 border border-gray-800 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveCycleView("uncompleted")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeCycleView === "uncompleted"
                  ? "bg-indigo-500 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              In-Progress Baselines ({unfulfilledCycles.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCycleView("fulfilled")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeCycleView === "fulfilled"
                  ? "bg-indigo-500 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Completed Cycles ({fulfilledCycles.length})
            </button>
          </div>
        </div>

        {/* TAB 1: In-Progress / Uncompleted Baselines View */}
        {activeCycleView === "uncompleted" && (
          <div className="space-y-4">
            {unfulfilledCycles.length > 0 ? (
              unfulfilledCycles.map((cycle, index) => {
                const isSelected = selectedBaselineId === cycle.id && scanType === "subsequent";
                return (
                  <div 
                    key={cycle.id || index}
                    className={`rounded-2xl p-4 sm:p-5 border transition space-y-4 ${
                      isSelected 
                        ? "bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10" 
                        : "bg-white/2 border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            Baseline #{unfulfilledCycles.length - index} • In-Progress
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-black">
                              Currently Selected for Follow-up
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-0.5">
                          Captured: {formatDate(cycle.baselineScan?.timestamp)}
                        </h4>
                      </div>
                      <span className="text-xs text-gray-400">
                        {getDaysAgo(cycle.baselineScan?.timestamp)} days elapsed
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-gray-400 block mb-2">
                        Baseline Items ({cycle.baselineScan?.items?.length || 0}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {cycle.baselineScan?.items?.map(item => (
                          <span 
                            key={item.name} 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-gray-750 text-xs text-gray-200"
                          >
                            <span>{item.name}</span>
                            <strong className="text-indigo-400 font-bold">x{item.quantity}</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-800/80 flex flex-wrap justify-between items-center gap-2">
                      <span className="text-[11px] text-gray-400">
                        Upload a follow-up image to compare against this specific baseline.
                      </span>

                      <button
                        type="button"
                        onClick={() => handleSelectBaselineForFollowUp(cycle.id)}
                        className="glow-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition cursor-pointer font-bold shadow"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Pair with Follow-up Scan
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 space-y-2 border border-dashed border-gray-800 rounded-2xl">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">No In-Progress Baselines</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  All previous baseline scans have been paired with follow-up scans. Choose <strong>"New Baseline Scan"</strong> above when you next restock your pantry.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Completed / Fulfilled Cycles View */}
        {activeCycleView === "fulfilled" && (
          <div className="space-y-3">
            {fulfilledCycles.length > 0 ? (
              fulfilledCycles.map((cycle, index) => {
                const isExpanded = expandedCycleId === cycle.id;
                const latestFollowUp = cycle.followUpScans[cycle.followUpScans.length - 1];

                return (
                  <div 
                    key={cycle.id || index}
                    className="bg-white/2 rounded-2xl p-4 border border-gray-800 space-y-3 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">
                              Cycle #{fulfilledCycles.length - index}
                            </h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Fulfilled ({cycle.followUpScans.length} follow-up{cycle.followUpScans.length > 1 ? "s" : ""})
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Baseline: {formatDate(cycle.baselineScan?.timestamp)} ➔ Follow-up: {formatDate(latestFollowUp?.timestamp)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleSelectBaselineForFollowUp(cycle.id)}
                          className="text-xs text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 transition cursor-pointer font-semibold"
                          title="Add another follow-up scan to this cycle"
                        >
                          + Add Checkpoint
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedCycleId(isExpanded ? null : cycle.id)}
                          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-gray-750 cursor-pointer"
                        >
                          <span>{isExpanded ? "Hide Details" : "View Items"}</span>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable item details */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-gray-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-black/30 p-3 rounded-xl border border-gray-800">
                          <span className="font-bold text-gray-400 block mb-1">
                            Baseline Items ({cycle.baselineScan?.items?.length || 0})
                          </span>
                          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                            {cycle.baselineScan?.items?.map(i => (
                              <div key={i.name} className="flex justify-between text-gray-300 text-[11px]">
                                <span>{i.name}</span>
                                <span className="font-semibold text-indigo-400">Qty: {i.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-black/30 p-3 rounded-xl border border-gray-800">
                          <span className="font-bold text-gray-400 block mb-1">
                            Follow-up Snapshot Items ({latestFollowUp?.items?.length || 0})
                          </span>
                          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                            {latestFollowUp?.items?.map(i => (
                              <div key={i.name} className="flex justify-between text-gray-300 text-[11px]">
                                <span>{i.name}</span>
                                <span className="font-semibold text-amber-400">Qty: {i.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-gray-500 border border-dashed border-gray-800 rounded-2xl">
                No completed scan cycles yet. Complete your first cycle by uploading a baseline and follow-up scan!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Completion Modal Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-3xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl border border-indigo-500/20"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Scan Complete!</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {scanResult?.scanType === "baseline" 
                  ? "Your baseline scan has been successfully uploaded and processed. You can review or edit the detected items now."
                  : "Your follow-up scan has been analyzed! Smart predictions and shopping lists are now updated."}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link 
                to="/dashboard"
                className="glow-btn inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition cursor-pointer"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
              <button 
                type="button"
                onClick={() => setShowPopup(false)}
                className="rounded-xl bg-white/5 border border-gray-750 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
              >
                Review & Edit Items
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
