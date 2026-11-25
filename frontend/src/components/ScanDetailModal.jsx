import React, { useEffect, useState } from "react";
import { X, Calendar, Package, Camera, Trash2, Search, ZoomIn, ZoomOut, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Modal for inspecting any previous scan in full detail:
 * displays the saved Firestore scan photo (with zoom toggle), metadata,
 * searchable list of all detected items & quantities, and delete action.
 */
export default function ScanDetailModal({ scan, scanLabel, onClose, onDeleteScan }) {
  const [itemSearch, setItemSearch] = useState("");
  const [isZoomed, setIsZoomed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setItemSearch("");
    setIsZoomed(false);
    setConfirmDelete(false);
    setIsDeleting(false);
  }, [scan?.id]);

  useEffect(() => {
    if (!scan) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scan, onClose]);

  if (!scan) return null;

  const formattedDate = new Date(scan.timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const items = Array.isArray(scan.items) ? scan.items : [];
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(itemSearch.trim().toLowerCase())
  );
  const totalUnits = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const handleConfirmDelete = async () => {
    if (!onDeleteScan || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeleteScan(scan.id);
      onClose();
    } catch (err) {
      console.error("Failed to delete scan:", err);
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10 shadow-2xl"
        >
          {/* Modal Header */}
          <div className="px-6 py-5 border-b border-brand-border flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {scanLabel || "Scan Details"}
                </h3>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    scan.scanType === "baseline"
                      ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/25"
                      : "bg-purple-500/15 text-purple-300 border-purple-500/25"
                  }`}
                >
                  {scan.scanType === "baseline" ? "Baseline Restock" : "Follow-up Scan"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  {formattedDate}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-gray-500" />
                  {items.length} products ({totalUnits} total units)
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close scan details"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto flex-1">
            {/* Left: Scan Photo */}
            <div className="md:col-span-6 p-6 border-b md:border-b-0 md:border-r border-brand-border flex flex-col gap-3 bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Captured Image
                </span>
                {scan.imageUrl && (
                  <button
                    onClick={() => setIsZoomed(prev => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                  >
                    {isZoomed ? (
                      <>
                        <ZoomOut className="h-3.5 w-3.5" /> Fit
                      </>
                    ) : (
                      <>
                        <ZoomIn className="h-3.5 w-3.5" /> Zoom
                      </>
                    )}
                  </button>
                )}
              </div>

              {scan.imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center min-h-[260px] max-h-[440px]">
                  <img
                    src={scan.imageUrl}
                    alt={`${scanLabel || "Pantry"} scan`}
                    onClick={() => setIsZoomed(prev => !prev)}
                    className={`transition-transform duration-300 cursor-pointer ${
                      isZoomed
                        ? "scale-150 object-contain max-h-[440px]"
                        : "w-full h-full max-h-[440px] object-contain"
                    }`}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-700 bg-white/[0.02] flex flex-col items-center justify-center text-center p-8 min-h-[260px] gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gray-800/80 flex items-center justify-center text-gray-500">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <p className="text-sm font-semibold text-gray-300">No Image Saved</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Scans uploaded before database image storage was enabled don&apos;t have a saved photo. New scans will appear here automatically.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Detected Items */}
            <div className="md:col-span-6 p-6 flex flex-col gap-4">
              <div className="relative">
                <Search className="h-4 w-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Filter detected items..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-gray-800 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder-gray-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto max-h-[340px] pr-1 space-y-2">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Package className="h-4 w-4 text-indigo-400 shrink-0" />
                        <span className="text-sm font-medium text-gray-100 truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shrink-0">
                        x{item.quantity}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-xs text-gray-500">
                    {items.length === 0 ? "No items recorded in this scan." : "No items match your filter."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          {onDeleteScan && (
            <div className="px-6 py-4 border-t border-brand-border flex items-center justify-between gap-3 bg-white/[0.01]">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete this scan
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-rose-300 font-medium">Delete permanently?</span>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-semibold text-rose-300 transition cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-gray-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
