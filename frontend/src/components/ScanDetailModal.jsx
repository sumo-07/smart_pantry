import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Calendar,
  Package,
  Camera,
  Trash2,
  Search,
  ZoomIn,
  ZoomOut,
  Layers,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Reusable single-scan panel rendered inside ScanDetailModal (used for both Baseline div and Follow-up div).
 */
function ScanColumn({
  title,
  badgeText,
  badgeClass,
  scan,
  itemSearch,
  onDeleteScan,
  onAfterDelete
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsZoomed(false);
    setConfirmDelete(false);
    setIsDeleting(false);
  }, [scan?.id]);

  if (!scan) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-700 bg-white/[0.02] p-6 flex flex-col items-center justify-center text-center min-h-[360px] gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gray-800/80 flex items-center justify-center text-gray-500">
          <Camera className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-xs">
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            No follow-up scan has been uploaded for this cycle yet.
          </p>
        </div>
        <Link
          to="/scan"
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-xs font-semibold text-indigo-300 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Upload Follow-up
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(scan.timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const items = Array.isArray(scan.items) ? scan.items : [];
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(itemSearch.trim().toLowerCase())
  );
  const totalUnits = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const handleConfirmDelete = async () => {
    if (!onDeleteScan || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeleteScan(scan.id);
      if (onAfterDelete) onAfterDelete(scan.id);
    } catch (err) {
      console.error("Failed to delete scan:", err);
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-4">
      {/* Column Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-bold text-white">{title}</h4>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}>
              {badgeText}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-500" />
              {formattedDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3 w-3 text-gray-500" />
              {items.length} items ({totalUnits} units)
            </span>
          </div>
        </div>

        {scan.imageUrl && (
          <button
            onClick={() => setIsZoomed((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition cursor-pointer shrink-0"
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

      {/* Captured Image */}
      {scan.imageUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center h-52">
          <img
            src={scan.imageUrl}
            alt={title}
            onClick={() => setIsZoomed((prev) => !prev)}
            className={`transition-transform duration-300 cursor-pointer ${
              isZoomed ? "scale-150 object-contain h-52" : "w-full h-full object-contain"
            }`}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-800 bg-black/20 flex flex-col items-center justify-center text-center h-40 p-4 gap-2">
          <Camera className="h-5 w-5 text-gray-600" />
          <p className="text-xs text-gray-500">No saved image for this scan</p>
        </div>
      )}

      {/* Detected Items */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, idx) => (
            <div
              key={`${item.name}-${idx}`}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Package className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-100 truncate">
                  {item.name}
                </span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shrink-0">
                x{item.quantity}
              </span>
            </div>
          ))
        ) : (
          <p className="text-center py-6 text-xs text-gray-500">
            {items.length === 0 ? "No items recorded." : "No items match your filter."}
          </p>
        )}
      </div>

      {/* Delete Scan Action */}
      {onDeleteScan && (
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete {title}
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] text-rose-300 font-medium">Delete permanently?</span>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-[11px] font-semibold text-rose-300 transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[11px] text-gray-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Modal displaying a Baseline + Follow-up scan pair in two separate side-by-side divs.
 */
export default function ScanDetailModal({ cycle, onClose, onDeleteScan, onDeleteScanPair }) {
  const [itemSearch, setItemSearch] = useState("");
  const [activeFollowUpIdx, setActiveFollowUpIdx] = useState(0);
  const [confirmDeletePair, setConfirmDeletePair] = useState(false);
  const [isDeletingPair, setIsDeletingPair] = useState(false);

  const followUps = cycle?.followUps || [];

  useEffect(() => {
    setItemSearch("");
    setActiveFollowUpIdx(followUps.length > 0 ? followUps.length - 1 : 0);
    setConfirmDeletePair(false);
    setIsDeletingPair(false);
  }, [cycle?.id, followUps.length]);

  useEffect(() => {
    if (!cycle) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cycle, onClose]);

  if (!cycle) return null;

  const activeFollowUp = followUps[activeFollowUpIdx] || null;
  const allCycleScanIds = [
    ...(cycle.baseline?.id ? [cycle.baseline.id] : []),
    ...followUps.map((f) => f.id).filter(Boolean)
  ];

  const handleConfirmDeletePair = async () => {
    if (!onDeleteScanPair || allCycleScanIds.length === 0 || isDeletingPair) return;
    setIsDeletingPair(true);
    try {
      await onDeleteScanPair(allCycleScanIds);
      onClose();
    } catch (err) {
      console.error("Failed to delete scan pair:", err);
      setIsDeletingPair(false);
      setConfirmDeletePair(false);
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
          className="glass-panel rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10 shadow-2xl"
        >
          {/* Modal Header */}
          <div className="px-6 py-5 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-white">{cycle.title}</h3>
              <p className="text-xs text-gray-400">
                Side-by-side view of your Baseline Restock and Follow-up Scan
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search items in pair..."
                  className="pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-gray-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-gray-500 w-48 sm:w-56"
                />
              </div>

              <button
                onClick={onClose}
                aria-label="Close scan details"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Two Separate Divs: Baseline Scan & Follow-up Scan */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {followUps.length > 1 && (
              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                <span className="text-xs text-gray-400 mr-1">Follow-up:</span>
                {followUps.map((f, idx) => (
                  <button
                    key={f.id || idx}
                    onClick={() => setActiveFollowUpIdx(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeFollowUpIdx === idx
                        ? "bg-purple-500/25 text-purple-200 border border-purple-500/40"
                        : "bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* DIV 1: Baseline Scan */}
              <ScanColumn
                title="Baseline Scan"
                badgeText="Restock"
                badgeClass="bg-indigo-500/15 text-indigo-300 border-indigo-500/25"
                scan={cycle.baseline}
                itemSearch={itemSearch}
                onDeleteScan={onDeleteScan}
                onAfterDelete={onClose}
              />

              {/* DIV 2: Follow-up Scan */}
              <ScanColumn
                title={followUps.length > 1 ? `Follow-up Scan #${activeFollowUpIdx + 1}` : "Follow-up Scan"}
                badgeText="Check-in"
                badgeClass="bg-purple-500/15 text-purple-300 border-purple-500/25"
                scan={activeFollowUp}
                itemSearch={itemSearch}
                onDeleteScan={onDeleteScan}
                onAfterDelete={onClose}
              />
            </div>
          </div>

          {/* Modal Footer: Whole-Pair Delete & Close */}
          <div className="px-6 py-4 border-t border-brand-border flex flex-wrap items-center justify-between gap-3 bg-white/[0.01]">
            {onDeleteScanPair && allCycleScanIds.length > 0 ? (
              !confirmDeletePair ? (
                <button
                  onClick={() => setConfirmDeletePair(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {allCycleScanIds.length > 1
                    ? `Delete Entire Pair (${allCycleScanIds.length} scans)`
                    : "Delete Cycle"}
                </button>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-rose-300 font-medium">
                    Delete all {allCycleScanIds.length} scan{allCycleScanIds.length > 1 ? "s" : ""} in this pair permanently?
                  </span>
                  <button
                    onClick={handleConfirmDeletePair}
                    disabled={isDeletingPair}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 border border-rose-500/35 text-xs font-semibold text-rose-200 transition cursor-pointer disabled:opacity-50"
                  >
                    {isDeletingPair ? "Deleting..." : "Confirm Delete All"}
                  </button>
                  <button
                    onClick={() => setConfirmDeletePair(false)}
                    className="text-xs text-gray-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )
            ) : (
              <div />
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer ml-auto"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
