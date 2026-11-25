import React, { useState } from "react";
import ShoppingListCard from "../components/ShoppingListCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { ShoppingBag, Copy, Check, Download } from "lucide-react";

function escapeCsvCell(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ShoppingList({
  shoppingList = [],
  onToggleItem,
  onAddItem,
  isLoading
}) {
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <LoadingSkeleton />
      </div>
    );
  }

  const handleCopyList = async () => {
    if (shoppingList.length === 0) return;
    const lines = shoppingList.map((item) => {
      const mark = item.checked || item.bought ? "[x]" : "[ ]";
      const qty = item.quantityNeeded ? ` (x${item.quantityNeeded})` : "";
      const cat = item.category ? ` [${item.category}]` : "";
      return `${mark} ${item.name}${qty}${cat}`;
    });
    const text = `Smart Pantry Shopping List:\n${lines.join("\n")}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy shopping list:", err);
    }
  };

  const handleExportCsv = () => {
    if (shoppingList.length === 0) return;
    const header = ["Item", "Quantity Needed", "Category", "Status"];
    const rows = shoppingList.map((item) => [
      escapeCsvCell(item.name),
      escapeCsvCell(item.quantityNeeded || 1),
      escapeCsvCell(item.category || "Other"),
      escapeCsvCell(item.checked || item.bought ? "Purchased" : "Pending")
    ]);

    const csvContent = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smart-pantry-shopping-list-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="h-7 w-7 text-indigo-400" />
            Shopping List
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Review restocks calculated by AI scans or add custom entries.
          </p>
        </div>

        {shoppingList.length > 0 && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={handleCopyList}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-gray-700 text-xs font-semibold text-gray-200 hover:text-white transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-indigo-400" />
                  Copy List
                </>
              )}
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-xs font-semibold text-indigo-300 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        )}
      </div>

      <ShoppingListCard
        items={shoppingList}
        onToggleItem={onToggleItem}
        onAddItem={onAddItem}
      />
    </div>
  );
}
