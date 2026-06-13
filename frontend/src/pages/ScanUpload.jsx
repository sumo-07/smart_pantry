import React, { useState } from "react";
import { Users, Camera, ArrowRight, Sparkles, CheckCircle2, ChevronRight, Info, AlertTriangle } from "lucide-react";
import UploadCard from "../components/UploadCard";
import { motion } from "framer-motion";

export default function ScanUpload({ 
  familySize, 
  onSaveFamilySize, 
  onScanImage, 
  scans = [] 
}) {
  const [step, setStep] = useState(familySize ? 2 : 1);
  const [sizeInput, setSizeInput] = useState(familySize || "");
  const [scanType, setScanType] = useState("baseline"); // "baseline" or "subsequent"
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFamilySizeSubmit = async (e) => {
    e.preventDefault();
    const size = parseInt(sizeInput);
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
      // Send image to backend
      const result = await onScanImage(file, scanType);
      setScanResult(result);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to analyze image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasBaseline = scans.some(s => s.scanType === "baseline");

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header bar */}
      <div className="border-b border-brand-border pb-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Camera className="h-7 w-7 text-indigo-400" />
          Setup & Scan Pantry
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Complete the steps to initialize your household tracking.
        </p>
      </div>

      {/* Progress Steps Indicators */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`flex items-center gap-2 pb-3 border-b-2 transition duration-200 ${
          step === 1 ? "border-indigo-500 text-indigo-400" : "border-gray-800 text-gray-500"
        }`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-xs font-bold">1</span>
          <span className="text-xs font-semibold hidden sm:inline">Family Size</span>
        </div>
        <div className={`flex items-center gap-2 pb-3 border-b-2 transition duration-200 ${
          step === 2 && scanType === "baseline" ? "border-indigo-500 text-indigo-400" : "border-gray-800 text-gray-500"
        }`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-xs font-bold">2</span>
          <span className="text-xs font-semibold hidden sm:inline">Baseline Scan</span>
        </div>
        <div className={`flex items-center gap-2 pb-3 border-b-2 transition duration-200 ${
          step === 2 && scanType === "subsequent" ? "border-indigo-500 text-indigo-400" : "border-gray-800 text-gray-500"
        }`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-xs font-bold">3</span>
          <span className="text-xs font-semibold hidden sm:inline">Subsequent Scan</span>
        </div>
      </div>

      {/* STEP 1: Set Family Size */}
      {step === 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 max-w-md mx-auto space-y-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Household Setup</h3>
            <p className="text-xs text-gray-400 mt-1">
              Enter your family size. This helps Gemini AI customize consumption limits and restock quantities.
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
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full glow-btn inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition"
            >
              Continue to Scanning
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </form>
        </motion.div>
      )}

      {/* STEP 2/3: Scanning View */}
      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Uploader Card */}
          <div className="md:col-span-6 space-y-4">
            
            {/* Scan Type Toggle */}
            <div className="glass-panel rounded-2xl p-1.5 flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setScanType("baseline");
                  setScanResult(null);
                  setErrorMsg("");
                }}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl transition ${
                  scanType === "baseline" 
                    ? "bg-indigo-500 text-white shadow" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Baseline Scan (1st)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!hasBaseline) {
                    alert("Please upload a baseline scan first.");
                    return;
                  }
                  setScanType("subsequent");
                  setScanResult(null);
                  setErrorMsg("");
                }}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl transition ${
                  scanType === "subsequent" 
                    ? "bg-indigo-500 text-white shadow" 
                    : "text-gray-400 hover:text-white"
                } ${!hasBaseline ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                Follow-up Scan (2nd)
              </button>
            </div>

            <UploadCard 
              onUpload={handleScan} 
              isLoading={isLoading} 
              scanType={scanType} 
            />

            {familySize && (
              <div className="flex items-center justify-between text-xs text-gray-500 px-2">
                <span>Household Size: {familySize} members</span>
                <button 
                  onClick={() => setStep(1)}
                  className="text-indigo-400 hover:underline font-semibold"
                >
                  Change size
                </button>
              </div>
            )}
          </div>

          {/* Results Visualizer */}
          <div className="md:col-span-6 space-y-4">
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
                    {scanResult.scanType === "baseline" ? "Baseline Snapshot" : "Current Snapshot"}
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {scanResult.items.map(item => (
                    <div key={item.name} className="flex justify-between items-center p-2.5 bg-white/3 rounded-xl border border-gray-800">
                      <span className="text-sm font-semibold text-gray-200">{item.name}</span>
                      <span className="text-xs font-bold text-indigo-400">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-xs text-gray-400 flex items-start gap-1.5 bg-white/1 p-3 rounded-2xl border border-brand-border">
                  <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    {scanResult.scanType === "baseline" 
                      ? "This snapshot has been saved as your baseline pantry index. Upload another scan in a few days to compute consumption."
                      : "Snapshot saved successfully! Head over to the Dashboard to review rate calculations."}
                  </span>
                </div>
              </motion.div>
            ) : (
              <div className="glass-panel rounded-3xl p-8 border-dashed border-gray-800 text-center h-[280px] flex flex-col justify-center items-center space-y-3">
                <Camera className="h-8 w-8 text-gray-600" />
                <h4 className="text-sm font-bold text-gray-400">Detection Results</h4>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Select and scan a photo of your pantry to visualize the AI detection items and quantities.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
