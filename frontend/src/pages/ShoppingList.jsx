import React, { useState } from "react";

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
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <section className="view">
        <div className="lcd" style={{ textAlign: "center", padding: "32px" }}>
          LOADING SHOPPING LIST...
        </div>
      </section>
    );
  }

  const remainingCount = shoppingList.filter((item) => !item.checked && !item.bought).length;

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || !onAddItem) return;
    await onAddItem(trimmed, Math.max(1, parseInt(newQty, 10) || 1));
    setNewName("");
    setNewQty(1);
  };

  const handleCopyList = async () => {
    if (shoppingList.length === 0) return;
    const lines = shoppingList.map((item) => {
      const mark = item.checked || item.bought ? "[x]" : "[ ]";
      const qty = item.quantityNeeded ? ` (x${item.quantityNeeded})` : "";
      const cat = item.category ? ` [${item.category}]` : "";
      return `${mark} ${item.name}${qty}${cat}`;
    });
    try {
      await navigator.clipboard.writeText(`Smart Pantry Shopping List:\n${lines.join("\n")}`);
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
    <section className="view">
      <div className="top">
        <div>
          <h1 className="sp-h1">Shopping list</h1>
          <p>Built from items that are low, critical or out of stock.</p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {shoppingList.length > 0 && (
            <>
              <button type="button" className="key sm" onClick={handleCopyList}>
                {copied ? "Copied!" : "Copy list"}
              </button>
              <button type="button" className="key sm pri" onClick={handleExportCsv}>
                Export CSV
              </button>
            </>
          )}
          <div className="lcd" style={{ padding: "8px 18px" }}>
            <span style={{ fontSize: "34px" }}>{remainingCount}</span> TO BUY
          </div>
        </div>
      </div>

      <div className="mod" style={{ maxWidth: "720px" }}>
        <form onSubmit={handleAddSubmit} className="tools" style={{ marginTop: 0, marginBottom: "14px" }}>
          <input
            type="text"
            className="field"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add item to shopping list"
            aria-label="Add item to shopping list"
          />
          <input
            type="number"
            min="1"
            className="field"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            aria-label="Quantity needed"
            style={{ maxWidth: "85px", flex: "none" }}
          />
          <button type="submit" className="key sm pri">
            + Add
          </button>
        </form>

        {shoppingList.length > 0 ? (
          <div>
            {shoppingList.map((item, idx) => {
              const isChecked = !!(item.checked || item.bought);
              const detailText =
                item.quantityNeeded !== undefined
                  ? `${item.quantityNeeded} needed`
                  : item.urgency || "Restock";
              return (
                <button
                  key={`${item.name}-${idx}`}
                  type="button"
                  className="li"
                  aria-pressed={isChecked}
                  onClick={() => onToggleItem && onToggleItem(idx)}
                >
                  <i />
                  <span>{item.name}</span>
                  <small>{detailText}</small>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="lab" style={{ padding: "18px 0" }}>
            Your shopping list is empty. Everything is stocked up!
          </p>
        )}
      </div>
    </section>
  );
}
