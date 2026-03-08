import React, { useState, useEffect } from "react";
import { Search, Zap } from "lucide-react";
import { getSuggestions } from "../api";

export default function SearchBar({ onSearch, isLoading, externalQuery }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    getSuggestions().then(setSuggestions);
  }, []);

  // Allow parent to inject text into the search bar
  useEffect(() => {
    if (externalQuery) setQuery(externalQuery);
  }, [externalQuery]);

  const handleSubmit = (q) => {
    const question = q || query;
    if (!question.trim() || isLoading) return;
    onSearch(question);
    setQuery("");
  };

  return (
    <div style={{
      background: "rgba(13,11,46,0.7)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: focused
        ? "1px solid rgba(0,210,255,0.45)"
        : "1px solid rgba(255,255,255,0.07)",
      borderRadius: 18,
      padding: "20px 24px",
      marginBottom: 24,
      boxShadow: focused
        ? "0 0 0 3px rgba(0,210,255,0.08), 0 8px 40px rgba(0,0,0,0.3)"
        : "0 8px 40px rgba(0,0,0,0.25)",
      transition: "border 0.25s ease, box-shadow 0.25s ease",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Search size={20} style={{ color: focused ? "#00D2FF" : "#475569", flexShrink: 0, transition: "color 0.25s" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask a question about your data…  e.g. 'Show me revenue by region'"
          disabled={isLoading}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "#F0F4FF", fontSize: 15, fontFamily: "Inter, 'Segoe UI', sans-serif",
            letterSpacing: "-0.01em",
          }}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={isLoading || !query.trim()}
          style={{
            background: isLoading || !query.trim()
              ? "rgba(0,210,255,0.12)"
              : "linear-gradient(135deg, #00D2FF, #0088CC)",
            border: "none", borderRadius: 12, padding: "10px 22px",
            color: isLoading || !query.trim() ? "#475569" : "#08062B",
            cursor: isLoading || !query.trim() ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 700,
            fontFamily: "Inter, sans-serif",
            boxShadow: isLoading || !query.trim() ? "none" : "0 4px 16px rgba(0,210,255,0.35)",
            display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.2s ease",
          }}
        >
          <Zap size={14} />
          {isLoading ? "Analyzing…" : "Ask"}
        </button>
      </div>

      {/* Suggestion chips */}
      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#475569", lineHeight: "28px", fontFamily: "Inter, sans-serif" }}>Try:</span>
        {suggestions.slice(0, 5).map((s, i) => (
          <button
            key={i}
            onClick={() => { setQuery(s); handleSubmit(s); }}
            disabled={isLoading}
            style={{
              background: "rgba(0,210,255,0.07)",
              border: "1px solid rgba(0,210,255,0.15)",
              borderRadius: 20, padding: "5px 14px", cursor: "pointer",
              color: "#67E8F9", fontSize: 12,
              fontFamily: "Inter, sans-serif",
              transition: "all 0.2s", whiteSpace: "nowrap",
              opacity: isLoading ? 0.4 : 1,
            }}
            onMouseEnter={(e) => { if (!isLoading) { e.target.style.background = "rgba(0,210,255,0.14)"; e.target.style.borderColor = "rgba(0,210,255,0.3)"; } }}
            onMouseLeave={(e) => { e.target.style.background = "rgba(0,210,255,0.07)"; e.target.style.borderColor = "rgba(0,210,255,0.15)"; }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
