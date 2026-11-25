import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const SAMPLE_ALERTS = [
  ["EGGS RUN OUT IN 03 DAYS", 3],
  ["MILK RUNS OUT IN 02 DAYS", 2],
  ["LEMONS ARE OUT. RESTOCK NOW", 0]
];

export default function LandingPage() {
  const [alertIdx, setAlertIdx] = useState(0);
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    const [fullText] = SAMPLE_ALERTS[alertIdx % SAMPLE_ALERTS.length];
    let charIdx = 0;
    setTypedText("");

    const typeTimer = setInterval(() => {
      charIdx += 1;
      setTypedText(fullText.slice(0, charIdx));
      if (charIdx >= fullText.length) clearInterval(typeTimer);
    }, 45);

    const rotateTimer = setInterval(() => {
      setAlertIdx((prev) => (prev + 1) % SAMPLE_ALERTS.length);
    }, 4200);

    return () => {
      clearInterval(typeTimer);
      clearInterval(rotateTimer);
    };
  }, [alertIdx]);

  const activeDays = SAMPLE_ALERTS[alertIdx % SAMPLE_ALERTS.length][1];
  const litLedCount = Math.max(1, 7 - activeDays * 2);

  return (
    <section className="view">
      <div className="hero">
        <div>
          <p className="lab" style={{ marginBottom: "18px" }}>
            Next-gen grocery tracker
          </p>
          <h1 className="sp-h1">Know before you run out.</h1>
          <p className="lede">
            Snap your pantry, compare it with the last scan, and see exactly what will be gone and when.
          </p>
          <div className="scanrow">
            <Link className="key scan" to="/scan">
              SCAN
            </Link>
            <span className="lab">
              Press to start
              <br />a pantry scan
            </span>
          </div>
        </div>

        <div className="lcd" aria-live="off" aria-label="Sample pantry readout">
          <div
            className="lab"
            style={{ color: "inherit", opacity: 0.7, marginBottom: "8px", fontFamily: "var(--sans)" }}
          >
            PANTRY_SNAPSHOT_1.IMG
          </div>
          <div className="row">
            <span>EGGS</span>
            <span>
              04 <s>▲</s> CRIT
            </span>
          </div>
          <div className="row">
            <span>MILK</span>
            <span>
              1L <s>▲</s> LOW
            </span>
          </div>
          <div className="row">
            <span>SPINACH</span>
            <span>
              03 <s>▲</s> OK
            </span>
          </div>
          <div className="bigread">
            <span>{typedText}</span>
            <span className="blink">_</span>
          </div>
          <div className="leds h" style={{ marginTop: "10px" }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <i
                key={i}
                className={i < litLedCount ? "r" : ""}
                style={{ "--i": i }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="dials">
        <div className="mod dialmod">
          <div className="dial" style={{ "--p": 99, "--c": "var(--g)" }}>
            <i />
          </div>
          <div>
            <strong>99%</strong>
            <span className="lab">Gemini Vision accuracy</span>
          </div>
        </div>

        <div className="mod dialmod">
          <div className="dial" style={{ "--p": 17 }}>
            <i />
          </div>
          <div>
            <strong>10s</strong>
            <span className="lab">Scan to results</span>
          </div>
        </div>

        <div className="mod dialmod">
          <div className="dial" style={{ "--p": 0, "--c": "var(--r)" }}>
            <i />
          </div>
          <div>
            <strong>0%</strong>
            <span className="lab">Wasted grocery cost</span>
          </div>
        </div>
      </div>

      <div className="steps">
        <div className="mod">
          <h2 className="sp-h2">1. Scan</h2>
          <p>Upload a photo of your shelves. Gemini Vision names every item it can see.</p>
        </div>
        <div className="mod">
          <h2 className="sp-h2">2. Compare</h2>
          <p>Each scan is checked against the one before it to work out what your household used.</p>
        </div>
        <div className="mod">
          <h2 className="sp-h2">3. Restock</h2>
          <p>Items that will run out within a day move to your shopping list on their own.</p>
        </div>
      </div>
    </section>
  );
}
