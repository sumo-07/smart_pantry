import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { compressImage } from "../utils/compressImage";
import { areItemsIdentical } from "../utils/itemNormalizer";
import NumberStepper from "../components/NumberStepper";

export default function ScanUpload({
  familySize = 4,
  onSaveFamilySize,
  onScanImage,
  onUpdateScanItems,
  onDeleteScan,
  scans = []
}) {
  const [searchParams] = useSearchParams();
  const requestedType = searchParams.get("type");
  const requestedBaselineId = searchParams.get("baselineId");

  const fileInputRef = useRef(null);
  const vfRef = useRef(null);

  // Household size quick edit
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [sizeInput, setSizeInput] = useState(familySize || 4);

  // Upload & scan state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [editableItems, setEditableItems] = useState([]);
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Cycles UI state
  const [activeCycleTab, setActiveCycleTab] = useState("prog"); // "prog" | "done"
  const [openBaselines, setOpenBaselines] = useState({});
  const [openCompleted, setOpenCompleted] = useState({});
  const [armedDeleteId, setArmedDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedBaselineId, setSelectedBaselineId] = useState("");
  const [baselineMenuOpen, setBaselineMenuOpen] = useState(false);
  const baselineMenuRef = useRef(null);

  useEffect(() => {
    if (!baselineMenuOpen) return;
    const onOutside = (e) => {
      if (baselineMenuRef.current && !baselineMenuRef.current.contains(e.target)) {
        setBaselineMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setBaselineMenuOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      window.removeEventListener("keydown", onKey);
    };
  }, [baselineMenuOpen]);

  const cycles = useMemo(() => {
    const sorted = [...scans].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const list = [];
    const baselines = sorted.filter((s) => s.scanType === "baseline");

    baselines.forEach((bScan, idx) => {
      const nextBase = baselines[idx + 1];
      const followUps = sorted.filter((s) => {
        if (s.scanType !== "subsequent") return false;
        if (s.baselineScanId) return s.baselineScanId === bScan.id;
        const sTime = new Date(s.timestamp).getTime();
        const bTime = new Date(bScan.timestamp).getTime();
        const nTime = nextBase ? new Date(nextBase.timestamp).getTime() : Infinity;
        return sTime >= bTime && sTime < nTime;
      });

      list.push({
        id: bScan.id,
        number: idx + 1,
        baselineScan: bScan,
        followUpScans: followUps,
        isFulfilled: followUps.length > 0
      });
    });

    return list;
  }, [scans]);

  const unfulfilledCycles = useMemo(() => cycles.filter((c) => !c.isFulfilled).reverse(), [cycles]);
  const fulfilledCycles = useMemo(() => cycles.filter((c) => c.isFulfilled).reverse(), [cycles]);
  const activeBaselineCycle = useMemo(
    () => unfulfilledCycles.find((c) => c.id === selectedBaselineId) || unfulfilledCycles[0] || null,
    [unfulfilledCycles, selectedBaselineId]
  );

  const [scanType, setScanType] = useState(() =>
    requestedType === "subsequent" && unfulfilledCycles.length > 0 ? "subsequent" : "baseline"
  );

  useEffect(() => {
    if (requestedType === "subsequent" && unfulfilledCycles.length > 0) {
      setScanType("subsequent");
      if (requestedBaselineId && unfulfilledCycles.some((c) => c.id === requestedBaselineId)) {
        setSelectedBaselineId(requestedBaselineId);
      } else {
        setSelectedBaselineId(unfulfilledCycles[0].id);
      }
    } else if (requestedType === "baseline" || !requestedType) {
      setScanType("baseline");
    }
  }, [requestedType, requestedBaselineId, unfulfilledCycles]);

  // Open the newest unfulfilled baseline & newest completed cycle by default
  useEffect(() => {
    if (unfulfilledCycles.length > 0) {
      setOpenBaselines((prev) =>
        Object.keys(prev).length === 0 ? { [unfulfilledCycles[0].id]: true } : prev
      );
      if (!selectedBaselineId) setSelectedBaselineId(unfulfilledCycles[0].id);
    }
  }, [unfulfilledCycles, selectedBaselineId]);

  useEffect(() => {
    if (fulfilledCycles.length > 0) {
      setOpenCompleted((prev) =>
        Object.keys(prev).length === 0 ? { [fulfilledCycles[0].id]: true } : prev
      );
    }
  }, [fulfilledCycles]);

  useEffect(() => {
    if (familySize) setSizeInput(familySize);
  }, [familySize]);

  useEffect(() => {
    if (scanResult?.items) {
      setEditableItems([...scanResult.items]);
    }
  }, [scanResult]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg("");
    setSaveMsg("");
    setScanResult(null);

    let processed = file;
    if (file.size > 3 * 1024 * 1024) {
      try {
        processed = await compressImage(file);
      } catch (err) {
        console.warn("Image compression skipped:", err);
      }
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(processed);
    setPreviewUrl(URL.createObjectURL(processed));
  };

  const handleScan = async () => {
    if (!selectedFile) {
      fileInputRef.current?.click();
      return;
    }

    setIsScanning(true);
    setErrorMsg("");
    setSaveMsg("");
    setIsEditingItems(false);

    try {
      const targetBaselineId =
        scanType === "subsequent"
          ? selectedBaselineId || unfulfilledCycles[0]?.id || null
          : null;
      const result = await onScanImage(selectedFile, scanType, targetBaselineId);
      setScanResult(result);
    } catch (err) {
      setErrorMsg(err.message || "Scan failed. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddManualItem = (e) => {
    e.preventDefault();
    const name = newItemName.trim();
    if (!name) return;
    const qty = Math.max(1, parseInt(newItemQty, 10) || 1);
    const existingIdx = editableItems.findIndex((i) => areItemsIdentical(i.name, name));

    if (existingIdx !== -1) {
      const updated = [...editableItems];
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: updated[existingIdx].quantity + qty
      };
      setEditableItems(updated);
    } else {
      setEditableItems([...editableItems, { name, quantity: qty }]);
    }
    setNewItemName("");
    setNewItemQty(1);
  };

  const handleSaveEdits = async () => {
    if (!scanResult?.scanId || !onUpdateScanItems) return;
    setIsSavingEdits(true);
    setSaveMsg("");
    try {
      const data = await onUpdateScanItems(scanResult.scanId, editableItems);
      setScanResult((prev) => ({ ...prev, items: data?.items || editableItems }));
      setIsEditingItems(false);
      setSaveMsg("CHANGES SAVED");
    } catch (err) {
      setErrorMsg(err.message || "Failed to save edits.");
    } finally {
      setIsSavingEdits(false);
    }
  };

  const handleDeleteBaseline = async (cycleId) => {
    if (!onDeleteScan || deletingId) return;
    if (armedDeleteId !== cycleId) {
      setArmedDeleteId(cycleId);
      setTimeout(() => {
        setArmedDeleteId((curr) => (curr === cycleId ? null : curr));
      }, 3000);
      return;
    }
    setDeletingId(cycleId);
    try {
      await onDeleteScan(cycleId);
      setArmedDeleteId(null);
    } catch (err) {
      setErrorMsg(err.message || "Failed to delete baseline.");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePairFollowUp = (cycleId) => {
    setScanType("subsequent");
    setSelectedBaselineId(cycleId);
    fileInputRef.current?.click();
    vfRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleHouseholdSubmit = async (e) => {
    e.preventDefault();
    const size = parseInt(sizeInput, 10);
    if (!size || size < 1) return;
    if (onSaveFamilySize) await onSaveFamilySize(size);
    setShowHouseholdModal(false);
  };

  const formatTimestamp = (ts) =>
    new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  const getDaysElapsed = (ts) =>
    Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60 * 24)));

  const detectedCount = editableItems.length;

  return (
    <section className="view">
      <div className="top">
        <div>
          <h1 className="sp-h1">Pantry scanner</h1>
          <p>Take or upload a photo of your shelves. Results arrive in about 10 seconds.</p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="key sm"
            onClick={() => setShowHouseholdModal((v) => !v)}
          >
            Household: {familySize || 4}
          </button>
          <label className="key pri up">
            Choose photo
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>

      {showHouseholdModal && (
        <form
          onSubmit={handleHouseholdSubmit}
          className="mod"
          style={{ marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}
        >
          <span className="lab">HOUSEHOLD MEMBERS:</span>
          <NumberStepper
            value={sizeInput}
            onChange={setSizeInput}
            min={1}
            max={20}
            ariaLabel="Household members"
          />
          <button type="submit" className="key sm pri">
            Save size
          </button>
          <button type="button" className="key sm" onClick={() => setShowHouseholdModal(false)}>
            Cancel
          </button>
        </form>
      )}

      <div className="grid">
        {/* Viewfinder */}
        <div className="mod s7" ref={vfRef}>
          <div className={`lcd vf${isScanning ? " run" : ""}`}>
            {previewUrl && <img src={previewUrl} alt="Selected pantry preview" />}
            <i className="c a" />
            <i className="c b" />
            <i className="c c2" />
            <i className="c d" />
            <i className="ln" />
            <div className="msg">
              {isScanning ? (
                <>
                  SCANNING<span className="blink">_</span>
                </>
              ) : scanResult ? (
                <>
                  DONE
                  <br />
                  {detectedCount} ITEMS FOUND
                </>
              ) : previewUrl ? (
                <>
                  PHOTO READY
                  <br />
                  PRESS SCAN
                </>
              ) : (
                <>
                  NO IMAGE
                  <br />
                  CHOOSE PHOTO
                </>
              )}
            </div>
          </div>

          <div className="scanrow" style={{ marginTop: "22px", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="key scan"
                onClick={handleScan}
                disabled={isScanning}
              >
                {isScanning ? "..." : "SCAN"}
              </button>
              <span className="lab">
                {scanType === "subsequent" && activeBaselineCycle ? (
                  <>
                    Pairing with{" "}
                    <b style={{ color: "var(--ink)" }}>
                      Baseline #{activeBaselineCycle.number}
                    </b>{" "}
                    ({formatTimestamp(activeBaselineCycle.baselineScan.timestamp)} ·{" "}
                    {(activeBaselineCycle.baselineScan.items || []).length} items)
                  </>
                ) : (
                  "Fresh baseline mode · starts a new cycle"
                )}
                <br />
                {errorMsg ? (
                  <span style={{ color: "var(--r)" }}>{errorMsg}</span>
                ) : selectedFile ? (
                  `${selectedFile.name} ready`
                ) : (
                  "Select any fridge, pantry, or shelf image."
                )}
              </span>
            </div>

            {unfulfilledCycles.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  className={`key sm${scanType === "baseline" ? " on" : ""}`}
                  onClick={() => {
                    setScanType("baseline");
                    setBaselineMenuOpen(false);
                  }}
                >
                  New baseline
                </button>
                <button
                  type="button"
                  className={`key sm${scanType === "subsequent" ? " on" : ""}`}
                  onClick={() => setScanType("subsequent")}
                >
                  Follow-up
                </button>

                {scanType === "subsequent" && unfulfilledCycles.length > 1 && activeBaselineCycle && (
                  <div ref={baselineMenuRef} style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="key sm"
                      onClick={() => setBaselineMenuOpen((o) => !o)}
                      aria-expanded={baselineMenuOpen}
                      aria-haspopup="listbox"
                      aria-label="Select target baseline"
                    >
                      <span>Baseline #{activeBaselineCycle.number}</span>
                      <ChevronDown
                        size={14}
                        style={{
                          transform: baselineMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform .15s"
                        }}
                      />
                    </button>

                    {baselineMenuOpen && (
                      <div
                        className="mod"
                        role="listbox"
                        aria-label="In-progress baselines"
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "calc(100% + 8px)",
                          zIndex: 20,
                          padding: "10px",
                          minWidth: "240px",
                          maxHeight: "220px",
                          overflowY: "auto",
                          display: "grid",
                          gap: "6px",
                          borderRadius: "16px"
                        }}
                      >
                        {unfulfilledCycles.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            role="option"
                            aria-selected={c.id === activeBaselineCycle.id}
                            className={`key sm${c.id === activeBaselineCycle.id ? " on" : ""}`}
                            onClick={() => {
                              setSelectedBaselineId(c.id);
                              setBaselineMenuOpen(false);
                            }}
                            style={{ width: "100%", justifyContent: "space-between" }}
                          >
                            <span>#{c.number} · {formatTimestamp(c.baselineScan.timestamp)}</span>
                            <span>{(c.baselineScan.items || []).length}i</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Detected Items Readout */}
        <div className="mod s5">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <h2 className="sp-h2">Detected items</h2>
            {scanResult && (
              <button
                type="button"
                className="key sm"
                onClick={() => setIsEditingItems((e) => !e)}
              >
                {isEditingItems ? "Done editing" : "Edit items"}
              </button>
            )}
          </div>

          <div className="lcd log" style={{ marginTop: "12px" }} aria-live="polite">
            {isScanning ? (
              <>
                ANALYZING SHELVES<span className="blink">_</span>
              </>
            ) : scanResult ? (
              <>
                {editableItems.map((item, idx) => (
                  <div className="log-row" key={`${item.name}-${idx}`}>
                    {isEditingItems ? (
                      <>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const next = [...editableItems];
                            next[idx] = { ...next[idx], name: e.target.value };
                            setEditableItems(next);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            borderBottom: "2px dashed rgba(27,36,21,.4)",
                            color: "inherit",
                            font: "inherit",
                            flex: 1,
                            minWidth: 0
                          }}
                        />
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const next = [...editableItems];
                            next[idx] = {
                              ...next[idx],
                              quantity: Math.max(1, parseInt(e.target.value, 10) || 1)
                            };
                            setEditableItems(next);
                          }}
                          className="no-spin"
                          style={{
                            background: "transparent",
                            border: "none",
                            borderBottom: "2px dashed rgba(27,36,21,.4)",
                            color: "inherit",
                            font: "inherit",
                            width: "52px",
                            textAlign: "right"
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setEditableItems(editableItems.filter((_, i) => i !== idx))}
                          style={{ background: "none", border: 0, color: "#9b1c1c", cursor: "pointer", fontWeight: 800 }}
                          aria-label={`Remove ${item.name}`}
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.name}
                        </span>
                        <span style={{ whiteSpace: "nowrap" }}>×{item.quantity}</span>
                      </>
                    )}
                  </div>
                ))}
                <div
                  className="log-row"
                  style={{ marginTop: "8px", paddingTop: "6px", borderTop: "2px dashed rgba(27,36,21,.4)" }}
                >
                  <span>{saveMsg || "SAVED TO CYCLE"}</span>
                  <span>OK</span>
                </div>
              </>
            ) : (
              <>
                WAITING FOR SCAN<span className="blink">_</span>
              </>
            )}
          </div>

          {isEditingItems && scanResult && (
            <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
              <form onSubmit={handleAddManualItem} style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text"
                  className="field"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Add item name"
                />
                <NumberStepper
                  value={newItemQty}
                  onChange={setNewItemQty}
                  min={1}
                  max={999}
                  ariaLabel="New item quantity"
                />
                <button type="submit" className="key sm">
                  + Add
                </button>
              </form>
              <button
                type="button"
                className="key sm pri"
                onClick={handleSaveEdits}
                disabled={isSavingEdits}
              >
                {isSavingEdits ? "Saving..." : "Save changes"}
              </button>
            </div>
          )}

          <div className="leds h" style={{ marginTop: "14px" }}>
            {Array.from({ length: Math.max(8, Math.min(detectedCount, 18)) }).map((_, i) => (
              <i
                key={i}
                className={scanResult && i < detectedCount ? "g" : ""}
                style={{ "--i": i }}
              />
            ))}
          </div>
        </div>

        {/* Pantry Tracking Cycles */}
        <div className="mod s12">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="sp-h2">Pantry tracking cycles</h2>
            <div className="tools" style={{ margin: 0 }} role="tablist" aria-label="Cycle type">
              <button
                type="button"
                role="tab"
                aria-selected={activeCycleTab === "prog"}
                className={`key sm${activeCycleTab === "prog" ? " on" : ""}`}
                onClick={() => setActiveCycleTab("prog")}
              >
                In-progress baselines ({unfulfilledCycles.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCycleTab === "done"}
                className={`key sm${activeCycleTab === "done" ? " on" : ""}`}
                onClick={() => setActiveCycleTab("done")}
              >
                Completed cycles ({fulfilledCycles.length})
              </button>
            </div>
          </div>

          {activeCycleTab === "prog" ? (
            <div className="cycles-scroll" style={{ marginTop: "16px" }}>
              {unfulfilledCycles.length > 0 ? (
                unfulfilledCycles.map((cycle) => {
                  const b = cycle.baselineScan;
                  const isOpen = !!openBaselines[cycle.id];
                  const days = getDaysElapsed(b.timestamp);
                  const ageText = days ? `${days} DAY${days > 1 ? "S" : ""} ELAPSED` : "CAPTURED TODAY";
                  const totalUnits = (b.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
                  const isArmed = armedDeleteId === cycle.id;

                  return (
                    <div key={cycle.id} className={`lcd cyc-card${isOpen ? " open" : ""}`}>
                      <button
                        type="button"
                        className="bl-h"
                        aria-expanded={isOpen}
                        onClick={() =>
                          setOpenBaselines((prev) => (prev[cycle.id] ? {} : { [cycle.id]: true }))
                        }
                      >
                        <div className="tt">
                          <span className="lab" style={{ color: "#8a5a00", fontFamily: "var(--sans)" }}>
                            BASELINE #{cycle.number} · IN-PROGRESS
                          </span>
                          <div className="cyc-title">Captured: {formatTimestamp(b.timestamp)}</div>
                          <div className="bl-sum">
                            {(b.items || []).length} items · {totalUnits} units
                          </div>
                        </div>
                        <div className="meta">
                          <span className="cyc-age">{ageText}</span>
                          {days >= 3 && <span className="due">FOLLOW-UP DUE</span>}
                        </div>
                        <span className="car" aria-hidden="true">
                          ▾
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: "easeInOut" }}
                            style={{ overflow: "hidden" }}
                          >
                            <div className="bl-b">
                              <div
                                className="lab"
                                style={{ color: "inherit", opacity: 0.7, fontFamily: "var(--sans)", marginBottom: "8px" }}
                              >
                                BASELINE ITEMS ({(b.items || []).length})
                              </div>
                              <div className="chips">
                                {(b.items || []).map((item, idx) => (
                                  <span key={`${item.name}-${idx}`}>
                                    {item.name}
                                    <b>×{item.quantity}</b>
                                  </span>
                                ))}
                              </div>
                              <div className="cyc-foot">
                                <span className="lab" style={{ color: "inherit", opacity: 0.7, fontFamily: "var(--sans)" }}>
                                  Upload a follow-up image to compare against this baseline.
                                </span>
                                <span style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                  {onDeleteScan && (
                                    <button
                                      type="button"
                                      className={`key sm del${isArmed ? " arm" : ""}`}
                                      disabled={deletingId === cycle.id}
                                      onClick={() => handleDeleteBaseline(cycle.id)}
                                    >
                                      {deletingId === cycle.id
                                        ? "Deleting..."
                                        : isArmed
                                        ? "Confirm delete?"
                                        : "Delete cycle"}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="key sm pri"
                                    onClick={() => handlePairFollowUp(cycle.id)}
                                  >
                                    Pair with follow-up scan
                                  </button>
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <p className="lab" style={{ padding: "18px 0" }}>
                  No baselines in progress. Upload a photo above to start a new cycle.
                </p>
              )}
            </div>
          ) : (
            <div className="cycles-scroll" style={{ marginTop: "16px" }}>
              {fulfilledCycles.length > 0 ? (
                fulfilledCycles.map((cycle) => {
                  const b = cycle.baselineScan;
                  const f = cycle.followUpScans[cycle.followUpScans.length - 1];
                  const isOpen = !!openCompleted[cycle.id];

                  return (
                    <div key={cycle.id} className={`cy${isOpen ? " open" : ""}`}>
                      <div className="cy-h">
                        <span className="ok" aria-hidden="true">
                          ✓
                        </span>
                        <div className="t">
                          <b>Cycle #{cycle.number}</b>
                          <span className="badge">FULFILLED</span>
                          <span>
                            Baseline: {formatTimestamp(b.timestamp)} → Follow-up: {formatTimestamp(f.timestamp)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="key sm"
                          aria-expanded={isOpen}
                          onClick={() =>
                            setOpenCompleted((prev) => (prev[cycle.id] ? {} : { [cycle.id]: true }))
                          }
                        >
                          {isOpen ? "Hide details" : "View items"}
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: "easeInOut" }}
                            style={{ overflow: "hidden" }}
                          >
                            <div className="cy-b">
                              <div className="lcd">
                                <div className="lab">BASELINE ITEMS ({(b.items || []).length})</div>
                                {(b.items || []).map((item, idx) => (
                                  <div className="r" key={`${item.name}-${idx}`}>
                                    <span>{item.name}</span>
                                    <em>QTY: {item.quantity}</em>
                                  </div>
                                ))}
                              </div>

                              <div className="lcd fu">
                                <div className="lab">FOLLOW-UP SNAPSHOT ITEMS ({(f.items || []).length})</div>
                                {(f.items || []).map((item, idx) => (
                                  <div className="r" key={`${item.name}-${idx}`}>
                                    <span>{item.name}</span>
                                    <em>QTY: {item.quantity}</em>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <p className="lab" style={{ padding: "18px 0" }}>
                  No completed cycles yet. Pair a baseline with a follow-up scan to see comparisons.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
