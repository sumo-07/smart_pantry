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
  ChevronUp
} from "lucide-react";
import UploadCard from "../components/UploadCard";
import { motion, AnimatePresence } from "framer-motion";
import { compressImage } from "../utils/compressImage";

export default function ScanUpload({ 
  familySize, 
  onSaveFamilySize, 
  onScanImage, 
  scans = [] 
}) {
  const [step, setStep] = useState(familySize ? 2 : 1);
  const [sizeInput, setSizeInput] = useState(familySize || "");
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [activeCycleView, setActiveCycleView] = useState("active"); // "active" or "fulfilled"
  const [expandedCycleId, setExpandedCycleId] = useState(null);

  // Group scans chronologically into tracking cycles
  // A baseline scan initiates a cycle; any subsequent scans complete or checkpoint that cycle.
  const cycles = useMemo(() => {
    const list = [];
    let currentCycle = null;

    for (const scan of scans) {
      if (scan.scanType === "baseline") {
        if (currentCycle) {
          list.push(currentCycle);
        }
        currentCycle = {
          id: scan.id,
          baselineScan: scan,
          followUpScans: [],
          isFulfilled: false
        };
      } else if (scan.scanType === "subsequent") {
        if (currentCycle) {
          currentCycle.followUpScans.push(scan);
          currentCycle.isFulfilled = true;
        } else {
          list.push({
            id: scan.id,
            baselineScan: null,
            followUpScans: [scan],
            isFulfilled: true
          });
        }
      }
    }
    if (currentCycle) {
      list.push(currentCycle);
    }
    return list;
  }, [scans]);

  // Active uncompleted cycle (baseline exists without a follow-up)
  const activeCycle = useMemo(() => {
    if (cycles.length === 0) return null;
    const latest = cycles[cycles.length - 1];
    return !latest.isFulfilled && latest.baselineScan ? latest : null;
  }, [cycles]);

  // Fulfilled completed cycles
  const fulfilledCycles = useMemo(() => {
    return cycles.filter(c => c.isFulfilled).reverse();
  }, [cycles]);

  // Intelligently default scanType:
  // If an active cycle is awaiting its follow-up scan, default to "subsequent".
  // If all cycles are fulfilled (or no scans exist), default to "baseline".
  const [scanType, setScanType] = useState(() => (activeCycle ? "subsequent" : "baseline"));

  // Keep family size state and step synchronized when user profile loads
  useEffect(() => {
    if (familySize) {
      setSizeInput(familySize);
      setStep(2);
    }
  }, [familySize]);

  // Update default scanType whenever activeCycle changes
  useEffect(() => {
    if (activeCycle) {
      setScanType("subsequent");
    } else {
      setScanType("baseline");
    }
  }, [activeCycle]);

  const handleFamilySizeSubmit = async (e) => {
    e.preventDefault();
    const size = parseInt(sizeInput, 10);
    if (!size || size < 1) {
      alert("Please enter a valid family size (minimum 1).");
      return;
    }
    await onSaveFamilySize(size);
    setStep(2);
  };

  const handleScan = async (file) => {
    setIsLoading(true);
    setErrorMsg("");
    setScanResult(null);
    try {
      // Compress and downscale camera/large images before uploading
      let fileToUpload = file;
      if (fileToUpload && fileToUpload.size > 1024 * 1024) {
        try {
          fileToUpload = await compressImage(fileToUpload);
        } catch (compressionErr) {
          console.warn("Image compression failed before upload, using original:", compressionErr);
        }
      }

      // Send image to backend
      const result = await onScanImage(fileToUpload, scanType);
      setScanResult(result);
      setShowPopup(true);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to analyze image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasBaseline = scans.some(s => s.scanType === "baseline");

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header bar */}
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

        {familySize && (
          <div className="inline-flex items-center gap-2.5 bg-white/5 border border-brand-border px-3.5 py-1.5 rounded-2xl text-xs">
            <Users className="h-4 w-4 text-indigo-400" />
            <span className="text-gray-300">
              Household: <strong className="text-white">{familySize} members</strong>
            </span>
            <button 
              onClick={() => setStep(1)} 
              className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold ml-1 cursor-pointer"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* STEP 1: Set Family Size */}
      {step === 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md mx-auto space-y-4 shadow-xl border border-indigo-500/20"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Household Setup</h3>
            <p className="text-xs text-gray-400 mt-1">
              Enter your family size. This helps Gemini AI calibrate consumption limits and restock recommendations.
            </p>
          </div>

          <form onSubmit={handleFamilySizeSubmit} className="space-y-4">
            <div>
              <label htmlFor="family-size-input" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Family Size / Members
              </label>
              <input
                id="family-size-input"
                type="number"
                min="1"
                placeholder="Example: 4"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full glow-btn inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition cursor-pointer"
            >
              Save & Continue to Scanner
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </form>
        </motion.div>
      )}

      {/* STEP 2: Scanning View with Cycle Panes */}
      {step === 2 && (
        <div className="space-y-6">
          
          {/* Active Cycle Callout Banner */}
          {activeCycle ? (
            <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-amber-500/30 bg-amber-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Active Pantry Cycle in Progress</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                      Awaiting Follow-up
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    Baseline snapshot was captured <strong className="text-white">{formatDate(activeCycle.baselineScan.timestamp)}</strong> ({getDaysAgo(activeCycle.baselineScan.timestamp)} days ago) with <strong className="text-white">{activeCycle.baselineScan.items?.length || 0} items</strong> detected.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setScanType("subsequent");
                    setScanResult(null);
                    setErrorMsg("");
                  }}
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
                  onClick={() => {
                    setScanType("baseline");
                    setScanResult(null);
                    setErrorMsg("");
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                    scanType === "baseline" 
                      ? "bg-indigo-500 text-white shadow" 
                      : "bg-white/5 text-gray-300 hover:bg-white/10 border border-gray-700"
                  }`}
                >
                  Start Fresh Cycle
                </button>
              </div>
            </div>
          ) : fulfilledCycles.length > 0 ? (
            <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-emerald-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">All Previous Scan Cycles Completed</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                      Fulfilled
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    Your previous pantry cycles have both a baseline and follow-up scan. Ready to start a brand new grocery restock cycle!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setScanType("baseline");
                  setScanResult(null);
                  setErrorMsg("");
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition cursor-pointer shrink-0 self-start md:self-auto"
              >
                + New Baseline Restock Scan
              </button>
            </div>
          ) : null}

          {/* Main Grid: Upload Controls + Scanner & Live Results */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Uploader Card & Mode Selection */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Scan Mode Selector */}
              <div className="glass-panel rounded-2xl p-2 space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Select Upload Intent
                  </span>
                  <span className="text-[11px] text-indigo-400 font-semibold">
                    {scanType === "subsequent" ? "Comparing with Baseline" : "Starting Day 0"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScanType("baseline");
                      setScanResult(null);
                      setErrorMsg("");
                    }}
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
                      Fresh grocery shopping. Resets inventory to 100% full stock.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!hasBaseline) {
                        alert("Please upload an initial baseline scan before uploading a follow-up scan.");
                        return;
                      }
                      setScanType("subsequent");
                      setScanResult(null);
                      setErrorMsg("");
                    }}
                    className={`text-left p-3 rounded-xl border transition ${
                      scanType === "subsequent"
                        ? "bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/10"
                        : "bg-white/3 border-gray-800 text-gray-400 hover:bg-white/5 hover:text-gray-200"
                    } ${!hasBaseline ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      Follow-up Scan
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 leading-snug">
                      {activeCycle ? "Completes your active cycle & calculates rate." : "Adds checkpoint scan to latest baseline."}
                    </div>
                  </button>
                </div>
              </div>

              <UploadCard 
                onUpload={handleScan} 
                isLoading={isLoading} 
                scanType={scanType} 
              />
            </div>

            {/* Right: Scan Results Visualizer */}
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
                  className="glass-panel rounded-3xl p-6 space-y-4"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-brand-border">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">Detection Successful</h3>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                      {scanResult.scanType === "baseline" ? "Baseline Snapshot" : "Follow-up Snapshot"}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {scanResult.items?.length > 0 ? (
                      scanResult.items.map(item => (
                        <div key={item.name} className="flex justify-between items-center p-2.5 bg-white/3 rounded-xl border border-gray-800">
                          <span className="text-sm font-semibold text-gray-200">{item.name}</span>
                          <span className="text-xs font-bold text-indigo-400">Qty: {item.quantity}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-gray-500">
                        No identifiable grocery items detected in this image.
                      </div>
                    )}
                  </div>

                  <div className="pt-2 text-xs text-gray-400 flex items-start gap-1.5 bg-white/1 p-3 rounded-2xl border border-brand-border">
                    <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      {scanResult.scanType === "baseline" 
                        ? "This snapshot has been saved as your baseline pantry index. Upload a follow-up scan in a few days to compute consumption."
                        : "Follow-up snapshot analyzed! Smart predictions and shopping lists are now updated."}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="glass-panel rounded-3xl p-8 border-dashed border-gray-800 text-center h-[280px] flex flex-col justify-center items-center space-y-3">
                  <Camera className="h-8 w-8 text-gray-600" />
                  <h4 className="text-sm font-bold text-gray-400">Awaiting Image Capture</h4>
                  <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                    Select or take a photo of your fridge/pantry above. Gemini AI will automatically extract items and estimate quantities.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Bottom Panes: Active Cycle Details vs Previous Fulfilled Cycles */}
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
                  onClick={() => setActiveCycleView("active")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeCycleView === "active"
                      ? "bg-indigo-500 text-white shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Active Cycle {activeCycle ? "(1)" : "(0)"}
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
                  Previous Scans ({fulfilledCycles.length})
                </button>
              </div>
            </div>

            {/* TAB 1: Active Cycle View */}
            {activeCycleView === "active" && (
              <div>
                {activeCycle ? (
                  <div className="space-y-4">
                    <div className="bg-white/2 rounded-2xl p-4 sm:p-5 border border-gray-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            Uncompleted Cycle • Awaiting Follow-up
                          </span>
                          <h4 className="text-sm font-bold text-white mt-0.5">
                            Baseline: {formatDate(activeCycle.baselineScan.timestamp)}
                          </h4>
                        </div>
                        <span className="text-xs text-gray-400">
                          {getDaysAgo(activeCycle.baselineScan.timestamp)} days elapsed
                        </span>
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-gray-400 block mb-2">
                          Items detected at baseline ({activeCycle.baselineScan.items?.length || 0}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {activeCycle.baselineScan.items?.map(item => (
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

                      <div className="pt-2 border-t border-gray-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setScanType("subsequent");
                            window.scrollTo({ top: 200, behavior: "smooth" });
                          }}
                          className="glow-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition cursor-pointer"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Complete this Cycle with a Follow-up
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-2 border border-dashed border-gray-800 rounded-2xl">
                    <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">No Pending Cycles</h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      All your previous scans are fulfilled. Choose <strong>"New Baseline Scan"</strong> above when you next restock your kitchen.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Fulfilled Previous Scans View */}
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
                                  Fulfilled
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                Baseline: {formatDate(cycle.baselineScan?.timestamp)} ➔ Follow-up: {formatDate(latestFollowUp?.timestamp)}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedCycleId(isExpanded ? null : cycle.id)}
                            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 self-end sm:self-auto px-2 py-1 rounded-lg bg-white/5 border border-gray-750 cursor-pointer"
                          >
                            <span>{isExpanded ? "Hide Details" : "View Items"}</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
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

        </div>
      )}

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
                  ? "Your baseline scan has been successfully uploaded and processed. Upload a follow-up scan in a few days to compute consumption rates."
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
                onClick={() => setShowPopup(false)}
                className="rounded-xl bg-white/5 border border-gray-750 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
              >
                Keep Scanning
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
