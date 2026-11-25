import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import InventoryTable from "../components/InventoryTable";
import ScanDetailModal from "../components/ScanDetailModal";

const PADS_PER_PAGE = 13;

function groupScansIntoCycles(scans) {
  const cycles = [];
  const baselineMap = new Map();

  for (const scan of scans) {
    if (scan.scanType === "baseline") {
      const cycle = {
        id: scan.id || scan.timestamp,
        baseline: scan,
        followUps: []
      };
      cycles.push(cycle);
      if (scan.id) baselineMap.set(scan.id, cycle);
    } else {
      const targetCycle =
        (scan.baselineScanId && baselineMap.get(scan.baselineScanId)) ||
        cycles[cycles.length - 1];

      if (targetCycle) {
        targetCycle.followUps.push(scan);
      } else {
        cycles.push({
          id: scan.id || scan.timestamp,
          baseline: null,
          followUps: [scan]
        });
      }
    }
  }

  return cycles.map((cycle, index) => {
    const primaryScan = cycle.baseline || cycle.followUps[0];
    const dateLabel = new Date(primaryScan.timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
    const isLatest = index === cycles.length - 1;
    const title = isLatest ? `Current cycle · ${dateLabel}` : `Cycle #${index + 1} · ${dateLabel}`;
    return { ...cycle, number: index + 1, title };
  });
}

export default function Dashboard({
  scans = [],
  predictions = [],
  shoppingList = [],
  familySize,
  isLoading,
  onDeleteScan,
  onDeleteScanPair
}) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [animatedCount, setAnimatedCount] = useState(0);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [modalCycleId, setModalCycleId] = useState(null);
  const [padPage, setPadPage] = useState(1);

  const cycles = useMemo(() => groupScansIntoCycles(scans), [scans]);
  const totalCycles = cycles.length;
  const totalPages = Math.max(1, Math.ceil(totalCycles / PADS_PER_PAGE));

  useEffect(() => {
    if (totalCycles > 0) {
      setPadPage(Math.ceil(totalCycles / PADS_PER_PAGE));
      setSelectedCycleId(cycles[cycles.length - 1].id);
    }
  }, [totalCycles]);

  const itemsTrackedCount = predictions.length || scans[scans.length - 1]?.items?.length || 0;

  useEffect(() => {
    if (itemsTrackedCount <= 0) {
      setAnimatedCount(0);
      return;
    }
    let val = 0;
    const step = Math.max(1, Math.ceil(itemsTrackedCount / 25));
    const timer = setInterval(() => {
      val = Math.min(itemsTrackedCount, val + step);
      setAnimatedCount(val);
      if (val >= itemsTrackedCount) clearInterval(timer);
    }, 35);
    return () => clearInterval(timer);
  }, [itemsTrackedCount]);

  const healthCounts = useMemo(() => {
    const healthy = predictions.filter((p) => p.status === "Healthy").length;
    const low = predictions.filter((p) => p.status === "Low").length;
    const critical = predictions.filter((p) => p.status === "Critical").length;
    const total = healthy + low + critical;
    return { healthy, low, critical, total };
  }, [predictions]);

  const activeCycleStart = useMemo(() => {
    if (cycles.length === 0) return "";
    const latest = cycles[cycles.length - 1];
    const anchor = latest.baseline || latest.followUps[0];
    return new Date(anchor.timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  }, [cycles]);

  if (isLoading) {
    return (
      <section className="view">
        <div className="lcd" style={{ textAlign: "center", padding: "32px" }}>
          LOADING PANTRY TELEMETRY...
        </div>
      </section>
    );
  }

  if (scans.length === 0) {
    return (
      <section className="view">
        <div className="top">
          <div>
            <h1 className="sp-h1">Pantry dashboard</h1>
            <p>No scans recorded yet. Upload your first pantry photo to start tracking.</p>
          </div>
          <Link className="key pri" to="/scan">
            + Upload scan
          </Link>
        </div>
        <div className="mod">
          <div className="lcd" style={{ textAlign: "center", padding: "36px" }}>
            NO ACTIVE INVENTORY · PRESS UPLOAD SCAN TO BEGIN
          </div>
        </div>
      </section>
    );
  }

  const needsAttentionCount = healthCounts.low + healthCounts.critical;
  const criticalCount = healthCounts.critical;
  const padStart = (padPage - 1) * PADS_PER_PAGE;
  const visiblePadCycles = cycles.slice(padStart, padStart + PADS_PER_PAGE);
  const selectedCycle = cycles.find((c) => c.id === selectedCycleId) || cycles[cycles.length - 1];
  const modalCycle = cycles.find((c) => c.id === modalCycleId) || null;

  const restockItems = predictions.filter((p) => p.status === "Critical" || p.status === "Low");
  const pendingShoppingCount = shoppingList.filter((i) => !i.checked && !i.bought).length;
  const queueItems = restockItems.length > 0 ? restockItems : shoppingList;

  const healthyPct = healthCounts.total ? Math.round((healthCounts.healthy / healthCounts.total) * 100) : 100;
  const lowPct = healthCounts.total ? Math.round((healthCounts.low / healthCounts.total) * 100) : 0;
  const criticalPct = healthCounts.total ? Math.max(0, 100 - healthyPct - lowPct) : 0;

  const padNumber = (n) => String(n).padStart(2, "0");

  const renderCycleSummary = (cycle) => {
    if (!cycle) return "";
    const latestFollowUp = cycle.followUps[cycle.followUps.length - 1];
    const baseCount = cycle.baseline?.items?.length || 0;
    const followCount = latestFollowUp?.items?.length || 0;
    if (cycle.baseline && latestFollowUp) {
      return `Baseline + follow-up · ${baseCount} → ${followCount} items`;
    }
    if (cycle.baseline) {
      return `Baseline only · ${baseCount} items`;
    }
    return `Follow-up scan · ${followCount} items`;
  };

  return (
    <section className="view">
      <div className="top">
        <div>
          <h1 className="sp-h1">Pantry dashboard</h1>
          <p>
            Active cycle started {activeCycleStart} · {totalCycles} scan cycle{totalCycles === 1 ? "" : "s"} recorded
          </p>
        </div>
        <Link className="key pri" to="/scan">
          + Upload scan
        </Link>
      </div>

      <div className="grid">
        {/* KPI 1: Items tracked */}
        <div className="mod s5">
          <div className="lab">Items tracked</div>
          <div className="lcd" style={{ marginTop: "12px" }}>
            <span className="big">{animatedCount}</span>
            <span>ACTIVE ITEMS IN CURRENT CYCLE</span>
          </div>
          <div
            className="leds"
            aria-label={`${healthCounts.healthy} healthy, ${healthCounts.low} low, ${healthCounts.critical} critical`}
          >
            {Array.from({ length: Math.min(healthCounts.healthy, 30) }).map((_, i) => (
              <i key={`g-${i}`} className="g" style={{ "--i": i }} />
            ))}
            {Array.from({ length: Math.min(healthCounts.low, 15) }).map((_, i) => (
              <i key={`y-${i}`} className="y" style={{ "--i": healthCounts.healthy + i }} />
            ))}
            {Array.from({ length: Math.min(healthCounts.critical, 15) }).map((_, i) => (
              <i
                key={`r-${i}`}
                className="r"
                style={{ "--i": healthCounts.healthy + healthCounts.low + i }}
              />
            ))}
          </div>
        </div>

        {/* KPI 2: Needs attention */}
        <div className="mod s3">
          <div className="lab">Needs attention</div>
          <div className="lcd" style={{ marginTop: "12px" }}>
            <span className="small">{padNumber(needsAttentionCount)}</span>
            LOW OR CRITICAL
          </div>
        </div>

        {/* KPI 3 & 4: Critical restocks & Household */}
        <div className="mod s4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <div className="lab">Critical restocks</div>
            <div className="lcd" style={{ marginTop: "12px" }}>
              <span className="small">{padNumber(criticalCount)}</span>
              ≤ 1 DAY
            </div>
          </div>
          <div>
            <div className="lab">Household</div>
            <div className="lcd" style={{ marginTop: "12px" }}>
              <span className="small">{padNumber(familySize || 4)}</span>
              MEMBERS
            </div>
          </div>
        </div>

        {/* Stock Health Bar */}
        {healthCounts.total > 0 && (
          <div className="mod s12">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "space-between", alignItems: "center" }}>
              <div className="lab">Stock health</div>
              <div className="legend" style={{ margin: 0 }}>
                <span>
                  <b>{healthCounts.healthy}</b> healthy
                </span>
                <span>
                  <b>{healthCounts.low}</b> low
                </span>
                <span>
                  <b>{healthCounts.critical}</b> critical
                </span>
              </div>
            </div>
            <div
              className="bar"
              role="img"
              aria-label={`${healthyPct}% healthy, ${lowPct}% low, ${criticalPct}% critical`}
            >
              <span className="g" style={{ width: `${healthyPct}%` }} />
              <span className="y" style={{ width: `${lowPct}%` }} />
              <span className="r" style={{ width: `${criticalPct}%` }} />
            </div>
          </div>
        )}

        {/* Tracked Inventory */}
        <div className="mod s8">
          <InventoryTable
            items={predictions}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        {/* Restock Queue */}
        <div className="mod s4">
          <h2 className="sp-h2">Restock queue</h2>
          {queueItems.length > 0 ? (
            <>
              <div className="q">
                {queueItems.slice(0, 4).map((item, idx) => (
                  <Link className="key" to="/shopping-list" key={`${item.name}-${idx}`}>
                    {item.name}
                  </Link>
                ))}
              </div>
              {Math.max(queueItems.length, pendingShoppingCount) > 4 && (
                <p className="lab" style={{ marginBottom: "14px" }}>
                  +{Math.max(queueItems.length, pendingShoppingCount) - 4} more on your shopping list
                </p>
              )}
            </>
          ) : (
            <p className="lab" style={{ margin: "18px 0" }}>
              All tracked items are stocked up!
            </p>
          )}
          <Link className="key pri" to="/shopping-list">
            Open list →
          </Link>
        </div>

        {/* Previous Scans Drum Pads */}
        <div className="mod s12">
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            <h2 className="sp-h2">Previous scans</h2>
            <span className="lab">{totalCycles} cycles · tap a pad to inspect</span>
          </div>

          <div className="pads">
            {visiblePadCycles.map((c) => (
              <button
                key={c.id}
                type="button"
                className={selectedCycle?.id === c.id ? "on" : ""}
                aria-label={`Scan cycle ${c.number}${c.number === totalCycles ? " (latest)" : ""}`}
                onClick={() => setSelectedCycleId(c.id)}
              >
                {c.number}
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pager">
              <button
                type="button"
                className="key sm"
                disabled={padPage <= 1}
                onClick={() => setPadPage((p) => Math.max(1, p - 1))}
              >
                ← Older
              </button>
              <span className="lab">
                Scans {padStart + 1}–{Math.min(totalCycles, padStart + PADS_PER_PAGE)} of {totalCycles}
              </span>
              <button
                type="button"
                className="key sm"
                disabled={padPage >= totalPages}
                onClick={() => setPadPage((p) => Math.min(totalPages, p + 1))}
              >
                Newer →
              </button>
              <button
                type="button"
                className="key sm"
                disabled={padPage >= totalPages}
                onClick={() => {
                  setPadPage(totalPages);
                  if (cycles.length > 0) setSelectedCycleId(cycles[cycles.length - 1].id);
                }}
              >
                Latest
              </button>
            </div>
          )}

          {selectedCycle && (
            <div
              className="lcd cyc"
              aria-live="polite"
              style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}
            >
              <div>
                <b>{selectedCycle.title}</b>
                <span className="cyc-sub">{renderCycleSummary(selectedCycle)}</span>
              </div>
              <button
                type="button"
                className="key sm pri"
                onClick={() => setModalCycleId(selectedCycle.id)}
              >
                Inspect photos &amp; items
              </button>
            </div>
          )}
        </div>
      </div>

      <ScanDetailModal
        cycle={modalCycle}
        onClose={() => setModalCycleId(null)}
        onDeleteScan={onDeleteScan}
        onDeleteScanPair={onDeleteScanPair}
      />
    </section>
  );
}
