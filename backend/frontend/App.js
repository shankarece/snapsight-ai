import React, { useState } from "react";
import { LayoutDashboard, MessageSquare, Database, Sparkles, Plus, Pin } from "lucide-react";
import SearchBar from "./components/SearchBar";
import ChartWidget from "./components/ChartWidget";
import AgentThinking from "./components/AgentThinking";
import { askQuestion } from "./api";

function App() {
  const [queryResults, setQueryResults] = useState([]); // Each has multiple suggestions
  const [pinnedWidgets, setPinnedWidgets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [error, setError] = useState(null);

  const handleSearch = async (question) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await askQuestion(question);

      // Create a query result group with multiple chart suggestions
      const queryGroup = {
        id: Date.now(),
        question: response.question,
        sql: response.sql,
        data: response.data,
        columns: response.columns,
        insight: response.insight,
        suggestions: (response.suggestions || []).map((sug, idx) => ({
          ...sug,
          id: Date.now() + idx + 1,
          sql: response.sql,
          data: response.data,
          columns: response.columns,
          insight: response.insight,
          question: response.question,
          chart_config: sug.config,
        })),
      };

      // Fallback if no suggestions (backward compatibility)
      if (queryGroup.suggestions.length === 0) {
        queryGroup.suggestions = [{
          id: Date.now() + 1,
          chart_type: response.chart_type || "bar",
          title: response.title || "Chart",
          subtitle: response.subtitle || "",
          label: "Chart",
          sql: response.sql,
          data: response.data,
          columns: response.columns,
          insight: response.insight,
          question: response.question,
          chart_config: response.chart_config || {},
        }];
      }

      setQueryResults((prev) => [queryGroup, ...prev]);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const pinWidget = (widget) => {
    setPinnedWidgets((prev) => {
      const exists = prev.find((w) => w.id === widget.id);
      if (exists) return prev.filter((w) => w.id !== widget.id);
      return [...prev, { ...widget }];
    });
  };

  const unpinWidget = (widget) => {
    setPinnedWidgets((prev) => prev.filter((w) => w.id !== widget.id));
  };

  const removeQueryGroup = (groupId) => {
    setQueryResults((prev) => prev.filter((g) => g.id !== groupId));
  };

  const isPinned = (widgetId) => pinnedWidgets.some((w) => w.id === widgetId);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a1a 0%, #0f0c32 40%, #130d3a 100%)",
      color: "#e2e8f0",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "14px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backdropFilter: "blur(20px)", background: "rgba(10,10,26,0.8)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(249,115,22,0.4)",
          }}>
            <Sparkles size={18} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>SnapSight AI</h1>
            <p style={{ margin: 0, fontSize: 10, color: "#64748b", letterSpacing: "0.05em" }}>FROM PROMPT TO PINBOARD IN SECONDS</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4 }}>
          {[
            { id: "search", icon: <MessageSquare size={14} />, label: "Ask" },
            { id: "dashboard", icon: <LayoutDashboard size={14} />, label: `Pinboard (${pinnedWidgets.length})` },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? "rgba(249,115,22,0.15)" : "transparent",
                border: activeTab === tab.id ? "1px solid rgba(249,115,22,0.3)" : "1px solid transparent",
                borderRadius: 8, padding: "8px 16px", cursor: "pointer",
                color: activeTab === tab.id ? "#fb923c" : "#64748b",
                display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
          <Database size={12} /> Azure SQL Connected
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px" }}>

        {/* ===== ASK TAB ===== */}
        {activeTab === "search" && (
          <>
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            {isLoading && <AgentThinking />}

            {error && (
              <div style={{
                padding: "14px 20px", marginBottom: 20, borderRadius: 12,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                color: "#fca5a5", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            {queryResults.length === 0 && !isLoading && (
              <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 24, margin: "0 auto 20px",
                  background: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.15))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid rgba(249,115,22,0.2)",
                }}>
                  <MessageSquare size={32} style={{ color: "#f97316" }} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Ask anything about your data</h2>
                <p style={{ fontSize: 14, color: "#64748b", maxWidth: 440, margin: "0 auto" }}>
                  Type a natural language question and SnapSight AI will generate multiple visualization
                  options. Pick the one you like and pin it to your dashboard.
                </p>
              </div>
            )}

            {/* Query Result Groups */}
            {queryResults.map((group) => (
              <div key={group.id} style={{
                marginBottom: 32,
                animation: "fadeIn 0.4s ease-out",
              }}>
                <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                {/* Question Header */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: 12, padding: "0 4px",
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>
                      "{group.question}"
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
                      {group.suggestions.length} visualization options • Pick one and pin it
                    </p>
                  </div>
                  <button onClick={() => removeQueryGroup(group.id)}
                    style={{
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                      color: "#64748b", fontSize: 11,
                    }}>
                    Dismiss
                  </button>
                </div>

                {/* AI Insight (shared across all suggestions) */}
                {group.insight && (
                  <div style={{
                    padding: "12px 16px", marginBottom: 16,
                    background: "rgba(249,115,22,0.06)", borderRadius: 10,
                    border: "1px solid rgba(249,115,22,0.12)",
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <Sparkles size={15} style={{ color: "#fb923c", flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0, fontSize: 13, color: "#fdba74", lineHeight: 1.5 }}>{group.insight}</p>
                  </div>
                )}

                {/* Chart Suggestion Cards */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${Math.min(group.suggestions.length, 4)}, 1fr)`,
                  gap: 16,
                }}>
                  {group.suggestions.map((suggestion) => (
                    <ChartWidget
                      key={suggestion.id}
                      widget={suggestion}
                      onPin={pinWidget}
                      isPinned={isPinned(suggestion.id)}
                      compact={group.suggestions.length > 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ===== PINBOARD TAB ===== */}
        {activeTab === "dashboard" && (
          <>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24,
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>My Pinboard</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                  {pinnedWidgets.length === 0
                    ? "Pin chart widgets from the Ask tab to build your dashboard"
                    : `${pinnedWidgets.length} pinned widget${pinnedWidgets.length !== 1 ? "s" : ""} — your dashboard, built by questions`}
                </p>
              </div>
              {pinnedWidgets.length > 0 && (
                <button onClick={() => setActiveTab("search")}
                  style={{
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    border: "none", borderRadius: 10, padding: "10px 18px",
                    color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6,
                    boxShadow: "0 4px 15px rgba(249,115,22,0.3)",
                  }}>
                  <Plus size={14} /> Add More
                </button>
              )}
            </div>

            {pinnedWidgets.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "80px 20px",
                border: "2px dashed rgba(249,115,22,0.2)", borderRadius: 20,
                background: "rgba(249,115,22,0.03)",
              }}>
                <LayoutDashboard size={48} style={{ color: "#f97316", marginBottom: 16, opacity: 0.5 }} />
                <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "#94a3b8" }}>Your pinboard is empty</h3>
                <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b", maxWidth: 350, marginLeft: "auto", marginRight: "auto" }}>
                  Ask questions, explore chart options, and pin your favorites here.
                </p>
                <button onClick={() => setActiveTab("search")}
                  style={{
                    background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)",
                    borderRadius: 10, padding: "10px 20px", cursor: "pointer",
                    color: "#fb923c", fontSize: 13, fontWeight: 500,
                  }}>
                  Start Asking Questions
                </button>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))",
                gap: 20,
              }}>
                {pinnedWidgets.map((widget) => (
                  <ChartWidget
                    key={widget.id}
                    widget={widget}
                    onPin={unpinWidget}
                    isPinned={true}
                    compact={false}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
