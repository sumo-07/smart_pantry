import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ title, value, icon: Icon, description, trend, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-panel glass-panel-hover rounded-3xl p-6 relative overflow-hidden"
    >
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight text-white">{value}</h3>
          {description && (
            <p className="text-xs text-gray-500 font-medium">{description}</p>
          )}
        </div>
        
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-400">
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend.type === "positive" 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" 
              : "bg-amber-500/10 text-amber-400 border border-amber-500/10"
          }`}>
            {trend.value}
          </span>
          <span className="text-xs text-gray-500">{trend.label}</span>
        </div>
      )}
    </motion.div>
  );
}
