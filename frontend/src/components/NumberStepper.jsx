import React from "react";

/**
 * Tactile hardware-styled numeric stepper (- [value] +) replacing native browser spin buttons.
 */
export default function NumberStepper({ value, onChange, min = 1, max = 99, ariaLabel = "Quantity" }) {
  const num = Number(value) || min;

  const decrement = () => {
    onChange(Math.max(min, num - 1));
  };

  const increment = () => {
    onChange(Math.min(max, num + 1));
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <button
        type="button"
        className="key sm"
        onClick={decrement}
        disabled={num <= min}
        aria-label={`Decrease ${ariaLabel}`}
        style={{ minWidth: "34px", padding: "6px 10px" }}
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const parsed = parseInt(e.target.value, 10);
          if (Number.isNaN(parsed)) {
            onChange(min);
          } else {
            onChange(Math.max(min, Math.min(max, parsed)));
          }
        }}
        aria-label={ariaLabel}
        className="field no-spin"
        style={{
          width: "58px",
          minWidth: "58px",
          flex: "none",
          textAlign: "center",
          fontFamily: "var(--dot)",
          fontWeight: 800,
          fontSize: "16px",
          padding: "6px 6px"
        }}
      />
      <button
        type="button"
        className="key sm"
        onClick={increment}
        disabled={num >= max}
        aria-label={`Increase ${ariaLabel}`}
        style={{ minWidth: "34px", padding: "6px 10px" }}
      >
        +
      </button>
    </div>
  );
}
