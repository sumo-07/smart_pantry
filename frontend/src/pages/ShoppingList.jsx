import React, { useState } from "react";
import NumberStepper from "../components/NumberStepper";

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

        <div
          className="lcd"
          style={{
            padding: "10px 20px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            lineHeight: 1
          }}
        >
          <span style={{ fontSize: "34px", lineHeight: 1 }}>{remainingCount}</span>
          <span style={{ fontSize: "16px", lineHeight: 1 }}>TO BUY</span>
        </div>
      </div>

      <div className="mod" style={{ maxWidth: "720px" }}>
        <form
          onSubmit={handleAddSubmit}
          className="tools"
          style={{ marginTop: 0, marginBottom: "14px", alignItems: "center" }}
        >
          <input
            type="text"
            className="field"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add item to shopping list"
            aria-label="Add item to shopping list"
          />
          <NumberStepper
            value={newQty}
            onChange={setNewQty}
            min={1}
            max={99}
            ariaLabel="Quantity needed"
          />
          <button type="submit" className="key sm pri">
            + Add
          </button>
        </form>

        {shoppingList.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              paddingBottom: "12px",
              marginBottom: "4px",
              borderBottom: "2px solid var(--off)"
            }}
          >
            <span className="lab">{shoppingList.length} ITEMS IN LIST</span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button type="button" className="key sm" onClick={handleCopyList}>
                {copied ? "Copied!" : "Copy list"}
              </button>
              <button type="button" className="key sm pri" onClick={handleExportCsv}>
                Export CSV
              </button>
            </div>
          </div>
        )}

        {shoppingList.length > 0 ? (
          <div className="sp-scroll-y" style={{ paddingRight: "6px" }}>
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
