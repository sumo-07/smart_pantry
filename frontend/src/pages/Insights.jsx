import React from "react";
import InsightCard from "../components/InsightCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";
import { Brain, Sparkles, TrendingUp, Lightbulb } from "lucide-react";

export default function Insights({ predictions = [], isLoading, scansExist }) {

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!scansExist) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState 
          title="No Insights Found" 
          description="AI insights require scan history. Upload scans to let Gemini model analyze your consumption habits."
        />
      </div>
    );
  }

  // Calculate some analytics for visual flair
  const fastConsumingCount = predictions.filter(p => Number(p.dailyRate) >= 1.5).length;
  const healthRatio = predictions.length > 0 
    ? Math.round((predictions.filter(p => p.status === "Healthy").length / predictions.length) * 100) 
    : 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header bar */}
      <div className="border-b border-brand-border pb-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Brain className="h-7 w-7 text-indigo-400" />
          AI Insights
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Smart recommendations to optimize grocery budgets and reduce waste.
        </p>
      </div>

      {/* Mini Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-panel rounded-3xl p-5 flex items-center gap-4 border border-indigo-500/10">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Consumption Rate</h4>
            <p className="text-2xl font-black text-indigo-400 mt-1">
              {fastConsumingCount} Fast Items
            </p>
            <p className="text-[10px] text-gray-500">Items consumed at rates &gt; 1.5/day</p>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5 flex items-center gap-4 border border-emerald-500/10">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Stock Health Score</h4>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {healthRatio}% Healthy
            </p>
            <p className="text-[10px] text-gray-500">Ratio of healthy items to total tracked</p>
          </div>
        </div>
      </div>

      <InsightCard predictions={predictions} />
    </div>
  );
}
