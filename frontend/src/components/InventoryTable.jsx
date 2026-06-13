import React from "react";

export default function InventoryTable({ items }) {
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
      <div className="px-6 py-5 border-b border-brand-border flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Tracked Inventory</h3>
          <p className="text-xs text-gray-400">Consumption and depletion predictions per item.</p>
        </div>
      </div>
      
      <div className="max-h-[360px] overflow-y-auto overflow-x-auto relative">
        <table className="w-full text-left border-collapse">
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
                      ? "text-rose-400"
                      : item.daysLeft <= 3 
                      ? "text-amber-400"
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
      </div>
    </div>
  );
}
