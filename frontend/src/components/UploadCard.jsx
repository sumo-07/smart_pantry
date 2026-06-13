import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Image, X, Loader2, Sparkles, RefreshCw } from "lucide-react";

export default function UploadCard({ onUpload, isLoading, scanType }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    // Check if image
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, JPEG).");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    onUpload(selectedFile);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          Upload {scanType === "baseline" ? "Baseline" : "Follow-up"} Scan
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          {scanType === "baseline" 
            ? "Upload an image right after you restock your pantry or fridge." 
            : "Upload another image several days later to analyze consumption."}
        </p>
      </div>

      <form 
        onSubmit={handleScanSubmit}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className="space-y-4"
      >
        <input
          ref={fileInputRef}
          type="file"
          id="pantry-image-upload"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
          disabled={isLoading}
        />

        {!previewUrl ? (
          <label
            htmlFor="pantry-image-upload"
            className={`flex flex-col items-center justify-center h-56 border border-dashed rounded-2xl cursor-pointer transition ${
              dragActive 
                ? "border-indigo-500 bg-indigo-500/5" 
                : "border-gray-700 hover:border-gray-600 bg-white/5"
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
              <div className="p-3 bg-gray-800 rounded-xl mb-3 border border-gray-700">
                <UploadCloud className="h-6 w-6 text-indigo-400" />
              </div>
              <p className="text-sm font-semibold text-gray-200">
                Drag & drop your pantry photo, or <span className="text-indigo-400 hover:underline">browse</span>
              </p>
              <p className="text-xs text-gray-500 mt-1.5">
                PNG, JPG, or WEBP (Max 10MB)
              </p>
            </div>
          </label>
        ) : (
          <div className="relative h-56 rounded-2xl overflow-hidden border border-gray-700 bg-black/20 flex items-center justify-center">
            <img 
              src={previewUrl} 
              alt="Pantry Preview" 
              className="max-h-full max-w-full object-contain"
            />
            {!isLoading && (
              <button
                type="button"
                onClick={clearSelection}
                className="absolute top-3 right-3 p-1.5 bg-gray-900/80 border border-gray-700 text-gray-400 hover:text-white rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!selectedFile || isLoading}
            className="flex-1 glow-btn inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing with Gemini...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze Image
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
