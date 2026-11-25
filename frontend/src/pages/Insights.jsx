import React, { useMemo } from "react";
import { Link } from "react-router-dom";

export default function Insights({ predictions = [], isLoading, scansExist }) {
  const topConsumed = useMemo(() => {
    return [...predictions]
      .filter((p) => Number(p.dailyRate) > 0)
      .sort((a, b) => Number(b.dailyRate) - Number(a.dailyRate))
      .slice(0, 5);
  }, [predictions]);

  const maxRate = useMemo(() => {
    if (topConsumed.length === 0) return 1;
    return Math.max(...topConsumed.map((p) => Number(p.dailyRate) || 0), 1);
  }, [topConsumed]);

  const criticalItems = predictions.filter((p) => p.status === "Critical");
  const lowItems = predictions.filter((p) => p.status === "Low");

  if (isLoading) {
    return (
      <section className="view">
        <div className="lcd" style={{ textAlign: "center", padding: "32px" }}>
          LOADING AI INSIGHTS...
        </div>
      </section>
    );
  }

  if (!scansExist) {
    return (
      <section className="view">
        <div className="top">
          <div>
            <h1 className="sp-h1">AI insights</h1>
            <p>Upload scans to analyze household consumption habits.</p>
          </div>
          <Link className="key pri" to="/scan">
            + Upload scan
          </Link>
        </div>
        <div className="mod">
          <div className="lcd" style={{ textAlign: "center", padding: "36px" }}>
            NO SCAN HISTORY YET · UPLOAD SCANS TO GENERATE INSIGHTS
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="view">
      <div className="top">
        <div>
          <h1 className="sp-h1">AI insights</h1>
          <p>What your household uses fastest, based on your scan history.</p>
        </div>
      </div>

      <div className="grid">
        <div className="mod s8">
          <h2 className="sp-h2">Daily consumption</h2>
          <span className="lab">Units used per day</span>

          {topConsumed.length > 0 ? (
            <>
              <div className="bars">
                {topConsumed.map((item, i) => {
                  const rate = Number(item.dailyRate) || 0;
                  const heightPct = Math.max(8, Math.round((rate / maxRate) * 78));
                  return (
                    <div key={item.name}>
                      {rate}
                      <span
                        style={{
                          height: `${heightPct}%`,
                          animationDelay: `${i * 90}ms`
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="names">
                {topConsumed.map((item) => (
                  <span key={item.name}>{item.name}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="lcd" style={{ marginTop: "16px", textAlign: "center", padding: "32px" }}>
              ADD A FOLLOW-UP SCAN TO MEASURE DAILY CONSUMPTION RATES
            </div>
          )}
        </div>

        <div className="mod s4">
          <h2 className="sp-h2">Prediction notes</h2>

          {topConsumed.length > 0 ? (
            <div className="tip">
              <b>{topConsumed[0].name} goes fastest</b>
              <span>
                Used at {topConsumed[0].dailyRate} units/day.{" "}
                {topConsumed[0].daysLeft === 0
                  ? "Currently out of stock."
                  : topConsumed[0].daysLeft !== "N/A"
                  ? `Estimated ${topConsumed[0].daysLeft} days left.`
                  : ""}
              </span>
            </div>
          ) : (
            <div className="tip">
              <b>Waiting on cycle comparison</b>
              <span>Pair a baseline with a follow-up scan to unlock consumption notes.</span>
            </div>
          )}

          {lowItems.length > 0 && (
            <div className="tip">
              <b>
                {lowItems.length} item{lowItems.length > 1 ? "s" : ""} running low
              </b>
              <span>
                {lowItems
                  .slice(0, 3)
                  .map((i) => i.name)
                  .join(", ")}{" "}
                will need restocking within 3 days.
              </span>
            </div>
          )}

          <div className="tip">
            <b>
              {criticalItems.length} item{criticalItems.length === 1 ? " is" : "s are"} critical
            </b>
            <span>
              {criticalItems.length > 0
                ? "Critical items run out within 1 day or are already empty and have been added to your shopping list."
                : "No critical items right now—all tracked essentials are in good shape."}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
