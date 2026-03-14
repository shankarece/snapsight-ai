import React, { useState, useEffect } from "react";

const STEPS = [
  "Understanding your question",
  "Analyzing database schema",
  "Generating SQL query",
  "Fetching data from Azure SQL",
  "Selecting best visualization",
  "Generating AI insight",
];

export default function AgentThinking() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(prev => (prev + 1) % STEPS.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div style={{
      padding: "20px 24px", marginBottom: 20, borderRadius: 16,
      background: "rgba(0,210,255,0.04)",
      border: "1px solid rgba(0,210,255,0.12)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}>
      <style>{`
        @keyframes agentPulse {
          0%, 100% { opacity: 0.5; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); box-shadow: 0 0 10px rgba(0,210,255,0.6); }
        }
      `}</style>

      {/* Step dots */}
      <div style={{ display: "flex", gap: 5, marginBottom: 14, alignItems: "center" }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              height: 6,
              width: i === stepIndex ? 24 : 6,
              borderRadius: 4,
              background: i < stepIndex
                ? "rgba(0,210,255,0.55)"
                : i === stepIndex
                  ? "#00D2FF"
                  : "rgba(255,255,255,0.08)",
              transition: "all 0.45s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: i === stepIndex ? "0 0 8px rgba(0,210,255,0.5)" : "none",
            }}
          />
        ))}
      </div>

      <div style={{ marginBottom: 10, fontSize: 13, color: "#a5b4fc", fontWeight: 600, textAlign: "center" }}>
        AI agents analyzing your question...
      </div>

      {/* Current step label */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: "#00D2FF", flexShrink: 0,
          animation: "agentPulse 1.1s ease-in-out infinite",
        }} />
        <span style={{ fontSize: 12, color: "#67E8F9", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
          {STEPS[stepIndex]}...
        </span>
        <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto", fontFamily: "Inter, sans-serif" }}>
          Step {stepIndex + 1} of {STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: "linear-gradient(90deg, #00D2FF, #A78BFA)",
          width: `${progress}%`,
          transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "0 0 10px rgba(0,210,255,0.5)",
        }} />
      </div>
    </div>
  );
}
