import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ScanColumn({
  title,
  badgeText,
  scan,
  baselineId,
  itemSearch,
  onDeleteScan,
  onAfterDelete
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [armed, setArmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsZoomed(false);
    setArmed(false);
    setIsDeleting(false);
  }, [scan?.id]);

  if (!scan) {
    return (
      <div className="lcd" style={{ display: "grid", placeItems: "center", textAlign: "center", minHeight: "260px", gap: "12px" }}>
        <div>
          <div className="lab" style={{ color: "inherit", opacity: 0.7 }}>{title.toUpperCase()}</div>
          <p style={{ marginTop: "8px", fontSize: "15px" }}>NO FOLLOW-UP SCAN IN THIS CYCLE YET</p>
          <Link
            to={`/scan?type=subsequent${baselineId ? `&baselineId=${encodeURIComponent(baselineId)}` : ""}`}
            className="key sm pri"
            style={{ marginTop: "14px" }}
          >
            + Pair follow-up scan
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(scan.timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const items = Array.isArray(scan.items) ? scan.items : [];
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(itemSearch.trim().toLowerCase())
  );

  const handleDeleteClick = async () => {
    if (!onDeleteScan || isDeleting) return;
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 3000);
      return;
    }
    setIsDeleting(true);
    try {
      await onDeleteScan(scan.id);
      if (onAfterDelete) onAfterDelete();
    } catch (err) {
      console.error("Failed to delete scan:", err);
      setIsDeleting(false);
      setArmed(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <b style={{ fontSize: "16px" }}>{title}</b>{" "}
          <span className="lab" style={{ marginLeft: "6px" }}>{badgeText} · {formattedDate}</span>
        </div>
        {scan.imageUrl && (
          <button type="button" className="key sm" onClick={() => setIsZoomed((z) => !z)}>
            {isZoomed ? "Fit photo" : "Zoom photo"}
          </button>
        )}
      </div>

      {scan.imageUrl ? (
        <div className="lcd" style={{ padding: "8px", display: "grid", placeItems: "center", height: "200px", overflow: "hidden" }}>
          <img
            src={scan.imageUrl}
            alt={title}
            onClick={() => setIsZoomed((z) => !z)}
            style={{
              maxHeight: "180px",
              width: "100%",
              objectFit: "contain",
              cursor: "pointer",
              transform: isZoomed ? "scale(1.5)" : "scale(1)",
              transition: "transform .2s"
            }}
          />
        </div>
      ) : (
        <div className="lcd" style={{ padding: "18px", textAlign: "center", opacity: 0.8 }}>
          NO SAVED PHOTO (LEGACY SCAN)
        </div>
      )}

      <div className="lcd" style={{ maxHeight: "220px", overflowY: "auto", fontSize: "15px" }}>
        <div className="lab" style={{ color: "inherit", opacity: 0.7, fontFamily: "var(--sans)", marginBottom: "6px" }}>
          DETECTED ITEMS ({filteredItems.length})
        </div>
        {filteredItems.length > 0 ? (
          filteredItems.map((item, idx) => (
            <div className="r" key={`${item.name}-${idx}`}>
              <span>{item.name}</span>
              <em>QTY: {item.quantity}</em>
            </div>
          ))
        ) : (
          <div>NO MATCHING ITEMS</div>
        )}
      </div>

      {onDeleteScan && (
        <div>
          <button
            type="button"
            className={`key sm del${armed ? " arm" : ""}`}
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : armed ? "Confirm delete?" : `Delete ${title}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ScanDetailModal({ cycle, onClose, onDeleteScan, onDeleteScanPair }) {
  const [itemSearch, setItemSearch] = useState("");
  const [activeFollowUpIdx, setActiveFollowUpIdx] = useState(0);
  const [armedPair, setArmedPair] = useState(false);
  const [isDeletingPair, setIsDeletingPair] = useState(false);

  const followUps = cycle?.followUps || [];

  useEffect(() => {
    setItemSearch("");
    setActiveFollowUpIdx(followUps.length > 0 ? followUps.length - 1 : 0);
    setArmedPair(false);
    setIsDeletingPair(false);
  }, [cycle?.id, followUps.length]);

  useEffect(() => {
    if (!cycle) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycle, onClose]);

  if (!cycle) return null;

  const activeFollowUp = followUps[activeFollowUpIdx] || null;
  const allCycleScanIds = [
    ...(cycle.baseline?.id ? [cycle.baseline.id] : []),
    ...followUps.map((f) => f.id).filter(Boolean)
  ];

  const handleDeletePair = async () => {
    if (!onDeleteScanPair || allCycleScanIds.length === 0 || isDeletingPair) return;
    if (!armedPair) {
      setArmedPair(true);
      setTimeout(() => setArmedPair(false), 3000);
      return;
    }
    setIsDeletingPair(true);
    try {
      await onDeleteScanPair(allCycleScanIds);
      onClose();
    } catch (err) {
      console.error("Failed to delete scan pair:", err);
      setIsDeletingPair(false);
      setArmedPair(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,.65)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        padding: "16px"
      }}
    >
      <div
        className="mod"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "980px", maxHeight: "90vh", overflowY: "auto", display: "grid", gap: "18px" }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <div>
            <h2 className="sp-h2">{cycle.title}</h2>
            <span className="lab">Side-by-side Baseline & Follow-up inspection</span>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="search"
              className="field"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Search items in pair"
              style={{ minWidth: "180px" }}
            />
            <button type="button" className="key sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {followUps.length > 1 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span className="lab">Follow-up:</span>
            {followUps.map((f, idx) => (
              <button
                key={f.id || idx}
                type="button"
                className={`key sm${activeFollowUpIdx === idx ? " on" : ""}`}
                onClick={() => setActiveFollowUpIdx(idx)}
              >
                #{idx + 1}
              </button>
            ))}
          </div>
        )}

        <div className="cy-b" style={{ display: "grid", marginTop: 0 }}>
          <ScanColumn
            title="Baseline scan"
            badgeText="RESTOCK"
            scan={cycle.baseline}
            itemSearch={itemSearch}
            onDeleteScan={onDeleteScan}
            onAfterDelete={onClose}
          />
          <ScanColumn
            title={followUps.length > 1 ? `Follow-up #${activeFollowUpIdx + 1}` : "Follow-up scan"}
            badgeText="CHECK-IN"
            scan={activeFollowUp}
            baselineId={cycle.baseline?.id}
            itemSearch={itemSearch}
            onDeleteScan={onDeleteScan}
            onAfterDelete={onClose}
          />
        </div>

        {onDeleteScanPair && allCycleScanIds.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", paddingTop: "10px", borderTop: "2px solid var(--off)" }}>
            <button
              type="button"
              className={`key sm del${armedPair ? " arm" : ""}`}
              onClick={handleDeletePair}
              disabled={isDeletingPair}
            >
              {isDeletingPair
                ? "Deleting..."
                : armedPair
                ? `Confirm delete all (${allCycleScanIds.length})?`
                : allCycleScanIds.length > 1
                ? `Delete entire pair (${allCycleScanIds.length} scans)`
                : "Delete cycle"}
            </button>
            <span className="lab">Press ESC or click outside to close</span>
          </div>
        )}
      </div>
    </div>
  );
}
