import React from "react";
import { Hourglass, AlertCircle, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function PredictionCard({ predictions = [] }) {
  // Filter predictions to show items running low (low or critical status)
  const sortedPredictions = [...predictions].sort((a, b) => {
    const aVal = a.daysLeft === "N/A" || a.daysLeft === Infinity ? 999 : Number(a.daysLeft);
    const bVal = b.daysLeft === "N/A" || b.daysLeft === Infinity ? 999 : Number(b.daysLeft);
    return aVal - bVal;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "Critical":
        return <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 animate-pulse-slow" />;
      case "Low":
        return <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />;
      default:
        return <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />;
    }
  };

  const getStatusBarColor = (status) => {
    switch (status) {
      case "Critical":
        return "bg-rose-500 shadow-rose-500/20";
      case "Low":
        return "bg-amber-500 shadow-amber-500/20";
      default:
        return "bg-emerald-500 shadow-emerald-500/20";
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-violet-500/5 blur-2xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-brand-border">
        <Hourglass className="h-5 w-5 text-indigo-400" />
        <div>
          <h3 className="text-lg font-bold text-white">Smart Predictions</h3>
          <p className="text-xs text-gray-400 mt-1">
            Calculated restock recommendations based on scan history
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedPredictions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            Upload scans to calculate consumption timelines.
          </p>
        ) : (
          sortedPredictions.map((pred) => {
            const isN/A = pred.daysLeft === "N/A" || pred.daysLeft === Infinity;
            const daysNum = isN/A ? 999 : Number(pred.daysLeft);
            
            // Calculate a progress percentage for depletion bar
            // Assuming 14 days as max range for display purposes
            const percent = isN/A ? 100 : Math.min(100, (daysNum / 14) * 100);

            return (
              <div key={pred.name} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {getStatusIcon(pred.status)}
                    <span className="text-sm font-semibold text-gray-200">
                      {pred.name}
                    </span>
                  </div>
                  
                  <span className="text-xs font-semibold text-gray-400">
                    {pred.daysLeft === 0 
                      ? "Out of stock" 
                      : isN/A 
                      ? "Stable quantity" 
                      : `Runs out in ${pred.daysLeft} days`}
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full shadow-lg ${getStatusBarColor(pred.status)}`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
