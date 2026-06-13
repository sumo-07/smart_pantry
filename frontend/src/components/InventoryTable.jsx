import React from "react";

export default function InventoryTable({ items = [], latestScanItems = [] }) {
  const [view, setView] = React.useState(items.length > 0 ? "predictions" : "latest");

  const getStatusBadge = (status) => {
    switch (status) {
      case "Healthy":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
            Healthy
          </span>
        );
      case "Low":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/10">
            Low
          </span>
        );
      case "Critical":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/10">
            Critical
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/10">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-3xl overflow-hidden">
      <div className="px-6 py-5 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">Tracked Inventory</h3>
          <p className="text-xs text-gray-400">
            {view === "predictions" 
              ? "Consumption and depletion predictions per item." 
              : "Raw item quantities detected in your latest image scan."}
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
      
      <div className="max-h-[360px] overflow-y-auto overflow-x-auto relative">
        {/* VIEW 1: Predictions - Desktop View Table */}
        {view === "predictions" && (
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
              {items.map((item, index) => (
                <tr 
                  key={item.name} 
                  className="hover:bg-white/2 transition duration-200"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-white">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-200">
                    {item.currentQuantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-400">
                    {item.consumed !== undefined ? item.consumed : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-indigo-400 font-medium">
                    {item.dailyRate !== undefined ? `${item.dailyRate}/day` : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className={`font-semibold ${
                      item.daysLeft === 0 || item.daysLeft === "0"
                        ? "text-rose-455"
                        : item.daysLeft <= 3 
                        ? "text-amber-455"
                        : "text-gray-300"
                    }`}>
                      {item.daysLeft === "N/A" || item.daysLeft === Infinity 
                        ? "∞" 
                        : item.daysLeft === 0 
                        ? "Out of stock" 
                        : `${item.daysLeft} days`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* VIEW 1: Predictions - Mobile View Card List */}
        {view === "predictions" && (
          <div className="table-split:hidden divide-y divide-brand-border">
            {items.map((item) => (
              <div key={item.name} className="p-4 space-y-3 hover:bg-white/1 transition duration-150">
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
                    <span className="text-sm font-semibold text-indigo-400">{item.dailyRate !== undefined ? `${item.dailyRate}/day` : "-"}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Days Left</span>
                    <span className={`text-sm font-bold ${
                      item.daysLeft === 0 || item.daysLeft === "0"
                        ? "text-rose-400"
                        : item.daysLeft <= 3 
                        ? "text-amber-450"
                        : "text-gray-300"
                    }`}>
                      {item.daysLeft === "N/A" || item.daysLeft === Infinity 
                        ? "∞" 
                        : item.daysLeft === 0 
                        ? "Out of stock" 
                        : `${item.daysLeft} days`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 2: Latest Scan - Desktop View Table */}
        {view === "latest" && (
          <table className="hidden table-split:table w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                <th className="sticky top-0 bg-[#111827] z-10 px-6 py-4 border-b border-brand-border">Item Name</th>
                <th className="sticky top-0 bg-[#111827] z-10 px-6 py-4 text-right border-b border-brand-border">Quantity Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {latestScanItems.map((item) => (
                <tr 
                  key={item.name} 
                  className="hover:bg-white/2 transition duration-200"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-white">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-indigo-400 font-bold">
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* VIEW 2: Latest Scan - Mobile View List */}
        {view === "latest" && (
          <div className="table-split:hidden divide-y divide-brand-border">
            {latestScanItems.map((item) => (
              <div key={item.name} className="p-4 flex justify-between items-center hover:bg-white/1 transition duration-150">
                <span className="text-sm font-bold text-white">{item.name}</span>
                <span className="text-sm font-bold text-indigo-400">Qty: {item.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
