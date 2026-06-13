import React from "react";
import { Link } from "react-router-dom";
import { Package, AlertTriangle, RefreshCw, Users, Clock, Plus, BarChart3, Bot } from "lucide-react";
import StatCard from "../components/StatCard";
import InventoryTable from "../components/InventoryTable";
import LoadingSkeleton from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";
import { motion } from "framer-motion";

export default function Dashboard({ 
  scans = [], 
  predictions = [], 
  familySize, 
  isLoading, 
  onTriggerCompare,
  isComparing
}) {
  
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(n => <LoadingSkeleton key={n} />)}
        </div>
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState />
      </div>
    );
  }

  // Calculate statistics
  const itemsTrackedCount = predictions.length || (scans[scans.length - 1]?.items.length || 0);
  const itemsRunningLowCount = predictions.filter(p => p.status === "Low" || p.status === "Critical").length;
  const predictedRestocksCount = predictions.filter(p => p.status === "Critical").length;

  // Render recent scans timeline
  const renderTimeline = () => {
    return (
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
        <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-400" />
          Recent Scan Timeline
        </h3>
        
        <div className="relative border-l-2 border-gray-800 ml-3.5 pl-6 space-y-6">
          {scans.map((scan, idx) => {
            const scanDate = new Date(scan.timestamp).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });
            let scanTitle = idx === 0 ? "Initial Scan" : "Pantry Restocked";
            if (scan.scanType !== "baseline") {
              // Find the closest preceding baseline scan to compute the accurate time difference
              let baselineScan = null;
              for (let i = idx - 1; i >= 0; i--) {
                if (scans[i].scanType === "baseline") {
                  baselineScan = scans[i];
                  break;
                }
              }

              if (baselineScan) {
                // Clear seconds and milliseconds to align with displayed clock minutes
                const tCurr = new Date(scan.timestamp);
                tCurr.setSeconds(0, 0);
                const tBase = new Date(baselineScan.timestamp);
                tBase.setSeconds(0, 0);

                const diffMs = tCurr - tBase;
                const diffSec = Math.floor(diffMs / 1000);
                const diffMin = Math.floor(diffSec / 60);
                const diffHour = Math.floor(diffMin / 60);
                const diffDay = (diffMs / (1000 * 60 * 60 * 24)).toFixed(1);

                if (diffSec < 60) {
                  scanTitle = "Just after restock";
                } else if (diffMin < 60) {
                  scanTitle = `${diffMin} min${diffMin > 1 ? "s" : ""} later`;
                } else if (diffHour < 24) {
                  scanTitle = `${diffHour} hour${diffHour > 1 ? "s" : ""} later`;
                } else {
                  scanTitle = `${diffDay} day${Number(diffDay) > 1 ? "s" : ""} later`;
                }
              } else {
                scanTitle = "Subsequent Scan";
              }
            }

            return (
              <div key={scan.id || idx} className="relative">
                {/* Node icon */}
                <div className="absolute -left-[35px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-dark border-2 border-indigo-500" />
                
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-sm font-bold text-white">{scanTitle}</span>
                    <span className="text-xs text-gray-500 font-medium">{scanDate}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Detected {scan.items?.length || 0} grocery items.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {scan.items?.slice(0, 4).map(item => (
                      <span key={item.name} className="text-[10px] font-semibold px-2 py-0.5 bg-gray-800 text-gray-300 rounded-lg">
                        {item.name} ({item.quantity})
                      </span>
                    ))}
                    {scan.items?.length > 4 && (
                      <span className="text-[10px] text-gray-500 px-2 py-0.5">
                        +{scan.items.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border pb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Pantry Dashboard</h2>
          <p className="text-sm text-gray-400">Scan-driven consumption analysis and stock tracking.</p>
        </div>

        <div className="flex items-center gap-3">
          {scans.length >= 2 && (
            <button
              onClick={onTriggerCompare}
              disabled={isComparing}
              className="cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center rounded-xl bg-white/5 border border-gray-700 hover:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4.5 w-4.5 mr-2 ${isComparing ? "animate-spin" : ""}`} />
              Recalculate Predictions
            </button>
          )}

          <Link
            to="/scan"
            className="glow-btn inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition"
          >
            <Plus className="h-4.5 w-4.5 mr-1.5" />
            Upload Scan
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Items Tracked" 
          value={itemsTrackedCount} 
          icon={Package} 
          description="Total items found in pantry"
          delay={0}
        />
        <StatCard 
          title="Items Running Low" 
          value={itemsRunningLowCount} 
          icon={AlertTriangle} 
          description="Status: Low or Critical"
          trend={itemsRunningLowCount > 0 ? { type: "negative", value: `${itemsRunningLowCount} items`, label: "need restock" } : null}
          delay={0.05}
        />
        <StatCard 
          title="Predicted Restocks" 
          value={predictedRestocksCount} 
          icon={BarChart3} 
          description="Depleting in <= 1 day"
          delay={0.1}
        />
        <StatCard 
          title="Family Size" 
          value={familySize || "-"} 
          icon={Users} 
          description="Configured household size"
          delay={0.15}
        />
      </div>

      {/* Main dashboard contents */}
      <div className="grid grid-cols-1 layout-split:grid-cols-12 gap-6 items-start">
        
        {/* Timeline (Left/Right) */}
        <div className="layout-split:col-span-4 space-y-6">
          {renderTimeline()}
          
          {scans.length < 2 && (
            <div className="glass-panel rounded-3xl p-5 border-amber-500/20 bg-amber-500/5 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Upload Another Scan</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  You have uploaded {scans.length} scan. You need at least 2 scans to calculate depletion rates and predict when items will run out.
                </p>
                <Link to="/scan" className="inline-block text-xs font-bold text-indigo-400 hover:underline pt-1">
                  Upload Scan Now →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Table & Comparisons */}
        <div className="layout-split:col-span-8 space-y-6">
          <InventoryTable 
            items={predictions} 
            latestScanItems={scans[scans.length - 1]?.items || []} 
          />
        </div>

      </div>
    </div>
  );
}
