import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  AlertTriangle,
  Users,
  Clock,
  Plus,
  BarChart3,
  Camera,
  ShoppingCart,
  ArrowRight,
  Eye
} from "lucide-react";
import StatCard from "../components/StatCard";
import InventoryTable from "../components/InventoryTable";
import LoadingSkeleton from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";
import ScanDetailModal from "../components/ScanDetailModal";

/**
 * Computes a human-readable label for a scan relative to its preceding baseline scan.
 */
function getScanLabel(scan, idx, scans) {
  if (idx === 0) return "Initial Scan";
  if (scan.scanType === "baseline") return "Pantry Restocked";

  let baselineScan = null;
  for (let i = idx - 1; i >= 0; i--) {
    if (scans[i].scanType === "baseline") {
      baselineScan = scans[i];
      break;
    }
  }

  if (!baselineScan) return "Subsequent Scan";

  const tCurr = new Date(scan.timestamp);
  tCurr.setSeconds(0, 0);
  const tBase = new Date(baselineScan.timestamp);
  tBase.setSeconds(0, 0);

  const diffMs = Math.max(0, tCurr - tBase);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = (diffMs / (1000 * 60 * 60 * 24)).toFixed(1);

  if (diffSec < 60) return "Just after restock";
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} later`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} later`;
  return `${diffDay} day${Number(diffDay) > 1 ? "s" : ""} later`;
}

export default function Dashboard({
  scans = [],
  predictions = [],
  shoppingList = [],
  familySize,
  isLoading,
  onDeleteScan
}) {
  const [selectedScanEntry, setSelectedScanEntry] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAllScans, setShowAllScans] = useState(false);

  const healthCounts = useMemo(() => {
    const healthy = predictions.filter((p) => p.status === "Healthy").length;
    const low = predictions.filter((p) => p.status === "Low").length;
    const critical = predictions.filter((p) => p.status === "Critical").length;
    const total = healthy + low + critical;
    return { healthy, low, critical, total };
  }, [predictions]);

  const activeCycleInfo = useMemo(() => {
    if (scans.length === 0) return null;
    let latestBaseline = scans[0];
    for (let i = scans.length - 1; i >= 0; i--) {
      if (scans[i].scanType === "baseline") {
        latestBaseline = scans[i];
        break;
      }
    }
    const startLabel = new Date(latestBaseline.timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
    return { startLabel, totalScans: scans.length };
  }, [scans]);

  // Display newest scans first in Previous Scans card so recent activity is immediately visible
  const orderedScans = useMemo(() => {
    return scans
      .map((scan, idx) => ({
        scan,
        label: getScanLabel(scan, idx, scans)
      }))
      .reverse();
  }, [scans]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <LoadingSkeleton key={n} />
          ))}
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

  const itemsTrackedCount = predictions.length || scans[scans.length - 1]?.items?.length || 0;
  const itemsRunningLowCount = healthCounts.low + healthCounts.critical;
  const predictedRestocksCount = healthCounts.critical;
  const pendingShoppingItems = shoppingList.filter((item) => !item.bought);
  const visibleScans = showAllScans ? orderedScans : orderedScans.slice(0, 4);

  return (
    <div className="space-y-7 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Clean Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border pb-5">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Pantry Dashboard
          </h2>
          <p className="text-sm text-gray-400">
            {activeCycleInfo
              ? `Active cycle started ${activeCycleInfo.startLabel} · ${activeCycleInfo.totalScans} scan${activeCycleInfo.totalScans > 1 ? "s" : ""} recorded`
              : "Scan-driven consumption analysis and stock tracking."}
          </p>
        </div>

        <Link
          to="/scan"
          className="glow-btn inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Upload Scan
        </Link>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Items Tracked"
          value={itemsTrackedCount}
          icon={Package}
          description="Active items in current cycle"
          delay={0}
        />
        <StatCard
          title="Needs Attention"
          value={itemsRunningLowCount}
          icon={AlertTriangle}
          description="Low or Critical supply"
          trend={
            itemsRunningLowCount > 0
              ? { type: "negative", value: `${itemsRunningLowCount} items`, label: "running low" }
              : null
          }
          delay={0.05}
        />
        <StatCard
          title="Critical Restocks"
          value={predictedRestocksCount}
          icon={BarChart3}
          description="Depleting in <= 1 day"
          delay={0.1}
        />
        <StatCard
          title="Household Size"
          value={familySize ? `${familySize}` : "-"}
          icon={Users}
          description="Configured family members"
          delay={0.15}
        />
      </div>

      {/* Compact Stock Health Bar */}
      {healthCounts.total > 0 && (
        <div className="glass-panel rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Stock Health
            </span>
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setStatusFilter(statusFilter === "Healthy" ? "All" : "Healthy")}
                className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {healthCounts.healthy} Healthy
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === "Low" ? "All" : "Low")}
                className="inline-flex items-center gap-1.5 text-amber-400 hover:underline cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {healthCounts.low} Low
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === "Critical" ? "All" : "Critical")}
                className="inline-flex items-center gap-1.5 text-rose-400 hover:underline cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                {healthCounts.critical} Critical
              </button>
            </div>
          </div>

          <div className="w-full sm:w-64 h-2.5 rounded-full bg-gray-800 overflow-hidden flex">
            {healthCounts.healthy > 0 && (
              <div
                style={{ width: `${(healthCounts.healthy / healthCounts.total) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
              />
            )}
            {healthCounts.low > 0 && (
              <div
                style={{ width: `${(healthCounts.low / healthCounts.total) * 100}%` }}
                className="bg-amber-500 transition-all duration-500"
              />
            )}
            {healthCounts.critical > 0 && (
              <div
                style={{ width: `${(healthCounts.critical / healthCounts.total) * 100}%` }}
                className="bg-rose-500 transition-all duration-500"
              />
            )}
          </div>
        </div>
      )}

      {/* Main 2-Column Spacious Layout */}
      <div className="grid grid-cols-1 layout-split:grid-cols-12 gap-6 items-start">
        {/* Left/Main: Tracked Inventory Table */}
        <div className="layout-split:col-span-8">
          <InventoryTable
            items={predictions}
            latestScanItems={scans[scans.length - 1]?.items || []}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        {/* Right Sidebar: Previous Scans (with Images) & Quick Shopping Preview */}
        <div className="layout-split:col-span-4 space-y-6">
          {/* Previous Scans Card */}
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-400" />
                Previous Scans
              </h3>
              <span className="text-xs font-medium text-gray-500">
                {orderedScans.length} total
              </span>
            </div>

            <div className="space-y-3">
              {visibleScans.map(({ scan, label }) => {
                const scanDate = new Date(scan.timestamp).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });
                return (
                  <button
                    key={scan.id || scan.timestamp}
                    onClick={() => setSelectedScanEntry({ scan, label })}
                    className="w-full text-left p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-indigo-500/30 transition flex items-center gap-3.5 group cursor-pointer"
                  >
                    {/* Thumbnail Preview */}
                    {scan.imageUrl ? (
                      <img
                        src={scan.imageUrl}
                        alt={label}
                        className="h-14 w-14 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-gray-800/80 border border-white/5 flex items-center justify-center text-gray-500 shrink-0">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}

                    {/* Scan Metadata */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">
                          {label}
                        </span>
                        <Eye className="h-3.5 w-3.5 text-gray-500 group-hover:text-indigo-400 shrink-0 transition" />
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {scan.items?.length || 0} items · {scanDate}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {orderedScans.length > 4 && (
              <button
                onClick={() => setShowAllScans((prev) => !prev)}
                className="w-full py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
              >
                {showAllScans ? "Show Fewer Scans" : `View All ${orderedScans.length} Scans`}
              </button>
            )}
          </div>

          {/* Prompt when only 1 scan exists */}
          {scans.length < 2 && (
            <div className="glass-panel rounded-3xl p-5 border-amber-500/20 bg-amber-500/5 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Upload Another Scan</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Add a follow-up scan later to unlock consumption rates and depletion forecasts.
                </p>
                <Link to="/scan" className="inline-block text-xs font-bold text-indigo-400 hover:underline pt-1">
                  Upload Scan Now →
                </Link>
              </div>
            </div>
          )}

          {/* Compact Shopping List Preview */}
          {scans.length >= 2 && (
            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="h-4.5 w-4.5 text-indigo-400" />
                  Restock Queue
                </h3>
                <Link
                  to="/shopping-list"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  Open List
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {pendingShoppingItems.length > 0 ? (
                <div className="space-y-2">
                  {pendingShoppingItems.slice(0, 4).map((item, idx) => (
                    <div
                      key={`${item.name}-${idx}`}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
                    >
                      <span className="font-medium text-gray-200 truncate">{item.name}</span>
                      <span className="text-rose-400 font-semibold shrink-0 ml-2">
                        {item.urgency || "Restock"}
                      </span>
                    </div>
                  ))}
                  {pendingShoppingItems.length > 4 && (
                    <p className="text-[11px] text-gray-500 text-center pt-1">
                      +{pendingShoppingItems.length - 4} more items on your shopping list
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Everything is stocked up! No urgent items to buy right now.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scan Detail Modal */}
      <ScanDetailModal
        scan={selectedScanEntry?.scan || null}
        scanLabel={selectedScanEntry?.label || ""}
        onClose={() => setSelectedScanEntry(null)}
        onDeleteScan={onDeleteScan}
      />
    </div>
  );
}
