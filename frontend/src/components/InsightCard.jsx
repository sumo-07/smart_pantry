import React from "react";
import { Brain, Lightbulb, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function InsightCard({ predictions = [] }) {
  // Generate insights based on predictions
  const generateInsights = () => {
    const insights = [];

    predictions.forEach(pred => {
      const name = pred.name;
      const rate = Number(pred.dailyRate);
      const days = pred.daysLeft;

      if (days === 0) {
        insights.push({
          id: `oos-${name}`,
          type: "critical",
          icon: AlertCircle,
          title: `${name} is out of stock`,
          desc: `Your baseline shows you usually stock ${pred.baselineQuantity} items of ${name}. We added it to your shopping list.`,
          bgColor: "bg-rose-500/10 border-rose-500/20",
          iconColor: "text-rose-400"
        });
      } else if (days <= 3 && days > 0) {
        insights.push({
          id: `low-${name}`,
          type: "warning",
          icon: Lightbulb,
          title: `${name} running low`,
          desc: `At your current rate of ${rate} units/day, ${name} will deplete in ${days} days.`,
          bgColor: "bg-amber-500/10 border-amber-500/20",
          iconColor: "text-amber-400"
        });
      }

      if (rate >= 1.5) {
        insights.push({
          id: `high-rate-${name}`,
          type: "info",
          icon: TrendingUp,
          title: `Rapid consumption of ${name}`,
          desc: `You consume ${name} rapidly (${rate} per day). Consider buying bulk or larger packs to save trips.`,
          bgColor: "bg-indigo-500/10 border-indigo-500/20",
          iconColor: "text-indigo-400"
        });
      }
    });

    // Default insights for empty state or to make it look robust
    if (insights.length === 0) {
      insights.push({
        id: "default-1",
        type: "tip",
        icon: Sparkles,
        title: "Scanning habits",
        desc: "Upload a pantry image every 5 days. Regular interval scans increase prediction accuracy.",
        bgColor: "bg-gray-800/40 border-gray-700/50",
        iconColor: "text-indigo-400"
      });
      insights.push({
        id: "default-2",
        type: "tip",
        icon: Lightbulb,
        title: "Optimized Shopping",
        desc: "Restock notifications are automatically synced. Check your shopping list before heading out.",
        bgColor: "bg-gray-800/40 border-gray-700/50",
        iconColor: "text-indigo-400"
      });
    }

    return insights;
  };

  const insightsList = generateInsights();

  return (
    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-brand-border">
        <Brain className="h-5 w-5 text-indigo-400" />
        <div>
          <h3 className="text-lg font-bold text-white">AI Pantry Insights</h3>
          <p className="text-xs text-gray-400 mt-1">
            Machine intelligence analyzing your household habits
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {insightsList.map((insight, idx) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className={`p-4 rounded-2xl border flex gap-3.5 ${insight.bgColor}`}
            >
              <div className="mt-0.5 shrink-0">
                <Icon className={`h-5 w-5 ${insight.iconColor}`} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{insight.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {insight.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
