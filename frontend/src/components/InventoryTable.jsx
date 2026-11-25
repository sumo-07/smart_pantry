import React, { useState, useMemo } from "react";

export default function InventoryTable({
  items = [],
  statusFilter = "All",
  onStatusFilterChange
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [internalFilter, setInternalFilter] = useState("All");

  const activeFilter = onStatusFilterChange ? statusFilter : internalFilter;
  const setFilter = onStatusFilterChange || setInternalFilter;

  const availableCategories = useMemo(() => {
    const cats = new Set();
    items.forEach((item) => {
      if (item.category && item.category.trim()) {
        cats.add(item.category.trim());
      }
    });
    return ["All", ...Array.from(cats).sort()];
  }, [items]);

  const filteredPredictions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !q || item.name.toLowerCase().includes(q);
      const matchesStatus = activeFilter === "All" || item.status === activeFilter;
      const itemCat = (item.category || "Other").trim();
      const matchesCategory = categoryFilter === "All" || itemCat === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchQuery, activeFilter, categoryFilter]);

  const statusTabs = ["All", "Healthy", "Low", "Critical"];

  const statusToCode = (status) => {
    if (status === "Critical") return "r";
    if (status === "Low") return "y";
    return "g";
  };

  const formatDaysLeft = (daysLeft) => {
    if (daysLeft === "N/A" || daysLeft === Infinity || daysLeft === null || daysLeft === undefined) {
      return "∞";
    }
    if (daysLeft === 0 || daysLeft === "0") return "Out of stock";
    return `${daysLeft}d`;
  };

  const computeLedLevel = (item) => {
    if (item.status === "Critical" || item.currentQuantity === 0) return 1;
    if (item.status === "Low") return 4;
    return 8;
  };

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="sp-h2">Tracked inventory</h2>
        {availableCategories.length > 1 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="key sm"
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "All" ? "All categories" : cat}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="tools">
        <input
          className="field"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items"
          aria-label="Search items"
        />
        <span style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {statusTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`key sm${activeFilter === tab ? " on" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </span>
      </div>

      <div className="scroll">
        <div className="inv">
          <div className="ir hd lab">
            <span />
            <span>Item</span>
            <span>Level</span>
            <span>Qty</span>
            <span>Used</span>
            <span>Days left</span>
            <span>Status</span>
          </div>

          {filteredPredictions.length > 0 ? (
            filteredPredictions.map((item) => {
              const code = statusToCode(item.status);
              const litCount = computeLedLevel(item);
              return (
                <div className="ir" key={item.name}>
                  <span className={`dot${code === "g" ? "" : ` ${code}`}`} />
                  <div>
                    <b>{item.name}</b>
                    {item.category && (
                      <div className="lab" style={{ fontSize: "11px", marginTop: "2px" }}>
                        {item.category}
                      </div>
                    )}
                  </div>
                  <div className="leds h">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <i
                        key={idx}
                        className={idx < litCount ? code : ""}
                        style={{ "--i": idx }}
                      />
                    ))}
                  </div>
                  <span>{item.currentQuantity}</span>
                  <span className="d">
                    {item.consumed !== undefined ? `${item.dailyRate ?? 0}/d` : "-"}
                  </span>
                  <span>{formatDaysLeft(item.daysLeft)}</span>
                  <span className={`st ${code}`}>{item.status}</span>
                </div>
              );
            })
          ) : (
            <p className="lab" style={{ padding: "18px 0" }}>
              No items match. Clear the search or pick another filter.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
