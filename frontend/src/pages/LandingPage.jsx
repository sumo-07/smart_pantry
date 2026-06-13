import React from "react";
import { Link } from "react-router-dom";
import { Bot, ArrowRight, ShieldCheck, Sparkles, Zap, Smartphone, CheckSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage({ userId }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="relative isolate overflow-hidden bg-brand-dark min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      {/* Dynamic Radial Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.900),theme(colors.brand.dark))] opacity-40" />
      <div className="absolute top-1/4 left-1/3 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 -z-10 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl animate-pulse-slow" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Pitch Area */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 text-center lg:text-left space-y-6"
          >
            {/* Tag Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Next-gen Grocery Tracker
            </motion.div>

            <motion.h1 
              variants={itemVariants} 
              className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-sans leading-none"
            >
              Smart Pantry <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">AI</span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-lg sm:text-xl text-gray-300 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0"
            >
              Know what to restock before you run out. AI-powered pantry intelligence for modern households. Compare images, track depletion, and restock seamlessly.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2"
            >
              <Link
                to={userId ? "/scan" : "/scan"}
                className="glow-btn inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition"
              >
                Start Scanning
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </motion.div>

            {/* Mini Trust Stats */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-3 gap-4 border-t border-brand-border pt-8 mt-4"
            >
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-bold text-white">99%</p>
                <p className="text-xs text-gray-500">Gemini Vision accuracy</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-bold text-white">10s</p>
                <p className="text-xs text-gray-500">Fast scan results</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-bold text-white">0%</p>
                <p className="text-xs text-gray-500">Wasted grocery cost</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Animated Mock Interface Illustration */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="lg:col-span-5 relative"
          >
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-20 blur-xl animate-pulse-slow" />
            
            {/* The Glassmorphism card container */}
            <div className="glass-panel rounded-3xl p-5 shadow-2xl relative overflow-hidden border border-gray-800/80 animate-float">
              {/* Card Title */}
              <div className="flex items-center justify-between pb-3 border-b border-brand-border mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] text-gray-500 font-mono">PANTRY_SNAPSHOT_1.IMG</span>
              </div>

              {/* Inside details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/3 border border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🥚</span>
                    <span className="text-sm font-semibold text-gray-200">Eggs</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/10">Critical (4 left)</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/3 border border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🥛</span>
                    <span className="text-sm font-semibold text-gray-200">Milk</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/10">Low (1L left)</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/3 border border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🥬</span>
                    <span className="text-sm font-semibold text-gray-200">Spinach</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">Healthy (3 packs)</span>
                </div>

                {/* Simulated depletion widget */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Depletion Alert</span>
                    <span>Eggs run out in 3 days</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 w-1/4 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* floating visual elements */}
            <div className="absolute -bottom-6 -left-6 glass-panel rounded-2xl p-3 shadow-lg flex items-center gap-2 bg-indigo-950/80 border-indigo-500/30">
              <Zap className="h-4 w-4 text-indigo-400" />
              <span className="text-xs text-gray-200 font-semibold">Smart shopping lists generated!</span>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
