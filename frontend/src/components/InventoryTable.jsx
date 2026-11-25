import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";

export default function InventoryTable({
  items = [],
  latestScanItems = [],
  statusFilter = "All",
  onStatusFilterChange
}) {
  const [view, setView] = useState(items.length > 0 ? "predictions" : "latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [internalFilter, setInternalFilter] = useState("All");

  const activeFilter = onStatusFilterChange ? statusFilter : internalFilter;
  const setFilter = onStatusFilterChange || setInternalFilter;

  const filteredPredictions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !q || item.name.toLowerCase().includes(q);
      const matchesStatus = activeFilter === "All" || item.status === activeFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, activeFilter]);

  const filteredLatest = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return latestScanItems.filter((item) => !q || item.name.toLowerCase().includes(q));
  }, [latestScanItems, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Healthy":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
            Healthy
          </span>
        );
      case "Low":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/15">
            Low
          </span>
        );
      case "Critical":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/15">
            Critical
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/15">
            {status}
          </span>
        );
    }
  };

  const renderDaysLeftClass = (daysLeft) => {
    if (daysLeft === 0 || daysLeft === "0") return "text-rose-400";
    if (daysLeft <= 3) return "text-amber-400";
    return "text-gray-300";
  };

  const formatDaysLeft = (daysLeft) => {
    if (daysLeft === "N/A" || daysLeft === Infinity || daysLeft === null || daysLeft === undefined) return "∞";
    if (daysLeft === 0 || daysLeft === "0") return "Out of stock";
    return `${daysLeft} days`;
  };

  const statusTabs = ["All", "Healthy", "Low", "Critical"];

  return (
    <div className="glass-panel rounded-3xl overflow-hidden">
      {/* Header & Controls */}
      <div className="px-6 py-5 border-b border-brand-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">Tracked Inventory</h3>
            <p className="text-xs text-gray-400">
              {view === "predictions"
                ? "Consumption rate and days remaining per item."
                : "Items detected in your most recent scan."}
            </p>
          </div>

          {latestScanItems && latestScanItems.length > 0 && items && items.length > 0 && (
            <div className="bg-white/5 p-1 rounded-xl flex border border-white/5 self-start sm:self-auto">
              <button
                onClick={() => setView("predictions")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition duration-150 cursor-pointer ${
                  view === "predictions"
                    ? "bg-indigo-500 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                AI Predictions
              </button>
              <button
                onClick={() => setView("latest")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition duration-150 cursor-pointer ${
                  view === "latest"
                    ? "bg-indigo-500 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Latest Scan
              </button>
            </div>
          )}
        </div>

        {/* Clean Search + Status Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="h-4 w-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-gray-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-gray-500"
            />
          </div>

          {view === "predictions" && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeFilter === tab
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-white/[0.03] text-gray-400 border border-transparent hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto overflow-x-auto relative">
        {/* VIEW 1: Predictions - Desktop Table */}
        {view === "predictions" && (
          <>
            <table className="hidden table-split:table w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="sticky top-0 bg-[#111827] z-10 px-6 py-4 border-b border-brand-border">Item</th>
                  <th className="sticky top-0 bg-[#111827] z-10 px-6 py-4 text-center border-b border-brand-border">Current Qty</th>
                  <th className="sticky top-0 bg-[#111827] z-10 px-6 py-4 text-center border-b border-brand-border">Consumed</th>
                  <th className="sticky top-0 bg-[#111827] z-10 px-6 py-4 text-center border-b border-brand-border">Daily Rate</th>
                  <th className="sticky top-0 bg-[#111827] z-10 px-6 py-4 text-center border-b border-brand-border">Days Left</th>
                  <th className="sticky top-0 bg-[#111827] z-10 px-6 py-4 text-right border-b border-brand-border">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredPredictions.length > 0 ? (
                  filteredPredictions.map((item) => (
                    <tr key={item.name} className="hover:bg-white/[0.02] transition duration-200">
                      <td className="px-6 py-4 text-sm font-semibold text-white">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-200">{item.currentQuantity}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-400">
                        {item.consumed !== undefined ? item.consumed : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-indigo-400 font-medium">
                        {item.dailyRate !== undefined ? `${item.dailyRate}/day` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className={`font-semibold ${renderDaysLeftClass(item.daysLeft)}`}>
                          {formatDaysLeft(item.daysLeft)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">{getStatusBadge(item.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-xs text-gray-500">
                      No items match your current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* VIEW 1: Predictions - Mobile Card List */}
            <div className="table-split:hidden divide-y divide-brand-border">
              {filteredPredictions.length > 0 ? (
                filteredPredictions.map((item) => (
                  <div key={item.name} className="p-4 space-y-3 hover:bg-white/[0.01] transition duration-150">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">{item.name}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                      <div>
                        <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Current Qty</span>
                        <span className="text-sm font-medium text-gray-200">{item.currentQuantity}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Consumed</span>
                        <span className="text-sm font-medium text-gray-400">{item.consumed !== undefined ? item.consumed : "-"}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Daily Rate</span>
                        <span className="text-sm font-semibold text-indigo-400">
                          {item.dailyRate !== undefined ? `${item.dailyRate}/day` : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Days Left</span>
                        <span className={`text-sm font-bold ${renderDaysLeftClass(item.daysLeft)}`}>
                          {formatDaysLeft(item.daysLeft)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-gray-500">
                  No items match your current filter.
                </div>
              )}
            </div>
          </>
        )}

        {/* VIEW 2: Latest Scan */}
        {view === "latest" && (
          <>
            <table className="hidden table-split:table w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="sticky top-0 bg-[#111827] z-10 px-6 py-4 border-b border-brand-border">Item Name</th>
                  <th className="sticky top-0 bg-[#111827] z-10 px-6 py-4 text-right border-b border-brand-border">Quantity Detected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredLatest.length > 0 ? (
                  filteredLatest.map((item) => (
                    <tr key={item.name} className="hover:bg-white/[0.02] transition duration-200">
                      <td className="px-6 py-4 text-sm font-semibold text-white">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-right text-indigo-400 font-bold">{item.quantity}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-10 text-center text-xs text-gray-500">
                      No items match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="table-split:hidden divide-y divide-brand-border">
              {filteredLatest.length > 0 ? (
                filteredLatest.map((item) => (
                  <div key={item.name} className="p-4 flex justify-between items-center hover:bg-white/[0.01] transition duration-150">
                    <span className="text-sm font-bold text-white">{item.name}</span>
                    <span className="text-sm font-bold text-indigo-400">Qty: {item.quantity}</span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-gray-500">
                  No items match your search.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
