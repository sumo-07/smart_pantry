import React from "react";
import { Link } from "react-router-dom";
import { Camera, Sparkles, Inbox } from "lucide-react";
import { motion } from "framer-motion";

export default function EmptyState({ 
  title = "No Scan Data Available", 
  description = "Get started by entering your household size and uploading a photo of your pantry right after restocking.",
  actionText = "Upload First Scan",
  actionPath = "/scan" 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="glass-panel rounded-3xl p-8 text-center max-w-lg mx-auto flex flex-col items-center justify-center space-y-5"
    >
      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
        <Inbox className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
          {description}
        </p>
      </div>

      <Link
        to={actionPath}
        className="glow-btn inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition"
      >
        <Camera className="h-4 w-4 mr-2" />
        {actionText}
      </Link>
    </motion.div>
  );
}
