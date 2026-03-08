import React, { useState, useEffect, useRef } from "react";
import { LayoutDashboard, MessageSquare, Database, Sparkles, Plus, Clock, Filter, TrendingUp, X, BookOpen, Pencil, Trash2, Check, Upload, Moon, Sun } from "lucide-react";
import SearchBar from "./components/SearchBar";
import ChartWidget from "./components/ChartWidget";
import AgentThinking from "./components/AgentThinking";
import { askQuestion, discoverInsights, askCsv, checkHealth, getInsightsCatalog } from "./api";
import "./App.css";

// Drill-down question templates per dimension
const DRILL_TEMPLATES = {
  region:           (val, metric) => `Break down ${val} ${metric.replace(/_/g, " ")} by product category`,
  product_category: (val, metric) => `Show ${val} revenue by region and quarter`,
  quarter:          (val, metric) => `Break down ${val} revenue by product category and region`,
  salesperson:      (val, metric) => `Show ${val} deals by pipeline stage`,
  stage:            (val, metric) => `Show ${val} deals by salesperson`,
  industry:         (val, metric) => `Compare ${val} customers by region`,
  customer_type:    (val, metric) => `Show ${val} customer breakdown by industry`,
};

const TRENDING_QUESTIONS = [
  "Show revenue by product category",
  "Top 5 salespeople by revenue",
  "Revenue trend by quarter",
  "Customer breakdown by industry",
  "Pipeline deals by stage",
  "Revenue vs expenses by region",
  "Monthly revenue trend",
  "Average deal value by salesperson",
];

// ── Database schema for column browser ──
const DB_SCHEMA = [
  { table: "sales", columns: [
    { name: "sale_date", type: "date", kind: "dimension" },
    { name: "product_category", type: "text", kind: "dimension" },
    { name: "region", type: "text", kind: "dimension" },
    { name: "salesperson", type: "text", kind: "dimension" },
    { name: "quarter", type: "text", kind: "dimension" },
    { name: "revenue", type: "number", kind: "measure" },
    { name: "expenses", type: "number", kind: "measure" },
    { name: "units_sold", type: "number", kind: "measure" },
  ]},
  { table: "customers", columns: [
    { name: "customer_name", type: "text", kind: "dimension" },
    { name: "signup_date", type: "date", kind: "dimension" },
    { name: "customer_type", type: "text", kind: "dimension" },
    { name: "region", type: "text", kind: "dimension" },
    { name: "industry", type: "text", kind: "dimension" },
    { name: "lifetime_value", type: "number", kind: "measure" },
  ]},
  { table: "products", columns: [
    { name: "product_name", type: "text", kind: "dimension" },
    { name: "category", type: "text", kind: "dimension" },
    { name: "launch_date", type: "date", kind: "dimension" },
    { name: "price", type: "number", kind: "measure" },
    { name: "monthly_revenue", type: "number", kind: "measure" },
  ]},
  { table: "pipeline", columns: [
    { name: "deal_name", type: "text", kind: "dimension" },
    { name: "stage", type: "text", kind: "dimension" },
    { name: "salesperson", type: "text", kind: "dimension" },
    { name: "created_date", type: "date", kind: "dimension" },
    { name: "expected_close", type: "date", kind: "dimension" },
    { name: "deal_value", type: "number", kind: "measure" },
  ]},
];

// ── Chart type icons (SVG mini previews) ──
const CHART_TYPE_OPTIONS = [
  { type: "bar",            label: "Bar",        icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><rect x="1" y="8" width="4" height="8" rx="1" fill={a ? "#00D2FF" : "#475569"}/><rect x="8" y="3" width="4" height="13" rx="1" fill={a ? "#00D2FF" : "#475569"}/><rect x="15" y="6" width="4" height="10" rx="1" fill={a ? "#00D2FF" : "#475569"}/></svg> },
  { type: "horizontal_bar", label: "H-Bar",      icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><rect x="0" y="1" width="14" height="3.5" rx="1" fill={a ? "#A78BFA" : "#475569"}/><rect x="0" y="6.5" width="18" height="3.5" rx="1" fill={a ? "#A78BFA" : "#475569"}/><rect x="0" y="12" width="10" height="3.5" rx="1" fill={a ? "#A78BFA" : "#475569"}/></svg> },
  { type: "line",           label: "Line",       icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><polyline points="1,14 6,6 12,9 19,2" fill="none" stroke={a ? "#10B981" : "#475569"} strokeWidth="2" strokeLinecap="round"/></svg> },
  { type: "area",           label: "Area",       icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><polygon points="1,14 6,6 12,9 19,2 19,14" fill={a ? "#10B98133" : "#47556933"} stroke={a ? "#10B981" : "#475569"} strokeWidth="1.5"/></svg> },
  { type: "donut",          label: "Donut",      icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><circle cx="10" cy="8" r="6" fill="none" stroke={a ? "#F59E0B" : "#475569"} strokeWidth="3" strokeDasharray="15 23"/></svg> },
  { type: "pie",            label: "Pie",        icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><circle cx="10" cy="8" r="6" fill={a ? "#F43F5E33" : "#47556933"} stroke={a ? "#F43F5E" : "#475569"} strokeWidth="1.5"/><line x1="10" y1="8" x2="10" y2="2" stroke={a ? "#F43F5E" : "#475569"} strokeWidth="1.5"/><line x1="10" y1="8" x2="15" y2="11" stroke={a ? "#F43F5E" : "#475569"} strokeWidth="1.5"/></svg> },
  { type: "funnel",         label: "Funnel",     icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><polygon points="1,1 19,1 14,8 6,8" fill={a ? "#60A5FA33" : "#47556933"} stroke={a ? "#60A5FA" : "#475569"} strokeWidth="1.2"/><polygon points="6,9 14,9 12,15 8,15" fill={a ? "#60A5FA55" : "#47556944"} stroke={a ? "#60A5FA" : "#475569"} strokeWidth="1.2"/></svg> },
  { type: "kpi",            label: "KPI",        icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><text x="10" y="12" textAnchor="middle" fontSize="11" fontWeight="800" fill={a ? "#00D2FF" : "#475569"} fontFamily="Inter">#</text></svg> },
  { type: "table",          label: "Table",      icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><rect x="1" y="1" width="18" height="14" rx="1" fill="none" stroke={a ? "#00D2FF" : "#475569"} strokeWidth="1"/><line x1="1" y1="5" x2="19" y2="5" stroke={a ? "#00D2FF" : "#475569"} strokeWidth="1"/><line x1="6.5" y1="1" x2="6.5" y2="15" stroke={a ? "#00D2FF" : "#475569"} strokeWidth="1"/><line x1="12" y1="1" x2="12" y2="15" stroke={a ? "#00D2FF" : "#475569"} strokeWidth="1"/></svg> },
  { type: "scatter",        label: "Scatter",    icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><circle cx="3" cy="12" r="1.5" fill={a ? "#00D2FF" : "#475569"}/><circle cx="6" cy="8" r="1.5" fill={a ? "#00D2FF" : "#475569"}/><circle cx="9" cy="11" r="1.5" fill={a ? "#00D2FF" : "#475569"}/><circle cx="12" cy="5" r="1.5" fill={a ? "#00D2FF" : "#475569"}/><circle cx="15" cy="9" r="1.5" fill={a ? "#00D2FF" : "#475569"}/><circle cx="18" cy="3" r="1.5" fill={a ? "#00D2FF" : "#475569"}/></svg> },
  { type: "bubble",         label: "Bubble",     icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><circle cx="4" cy="11" r="2.5" fill={a ? "#A78BFA" : "#475569"} opacity="0.6"/><circle cx="10" cy="6" r="3.5" fill={a ? "#A78BFA" : "#475569"} opacity="0.6"/><circle cx="16" cy="10" r="2" fill={a ? "#A78BFA" : "#475569"} opacity="0.6"/></svg> },
  { type: "heatmap",        label: "Heatmap",    icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><rect x="1" y="2" width="3.5" height="3.5" fill={a ? "#006E9A" : "#475569"}/><rect x="5" y="2" width="3.5" height="3.5" fill={a ? "#00A8D8" : "#475569"}/><rect x="9" y="2" width="3.5" height="3.5" fill={a ? "#00D2FF" : "#475569"}/><rect x="13" y="2" width="3.5" height="3.5" fill={a ? "#00D2FF" : "#475569"}/><rect x="1" y="7" width="3.5" height="3.5" fill={a ? "#00A8D8" : "#475569"}/><rect x="5" y="7" width="3.5" height="3.5" fill={a ? "#00D2FF" : "#475569"}/><rect x="9" y="7" width="3.5" height="3.5" fill={a ? "#00D2FF" : "#475569"}/><rect x="13" y="7" width="3.5" height="3.5" fill={a ? "#00D2FF" : "#475569"}/></svg> },
  { type: "gauge",          label: "Gauge",      icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><path d="M 3 12 A 8 8 0 0 1 17 12" fill="none" stroke={a ? "rgba(0,210,255,0.3)" : "#475569"} strokeWidth="2"/><path d="M 3 12 A 8 8 0 0 1 12 12" fill="none" stroke={a ? "#00D2FF" : "#475569"} strokeWidth="2" strokeLinecap="round"/><circle cx="10" cy="12" r="1" fill={a ? "#00D2FF" : "#475569"}/></svg> },
  { type: "waterfall",      label: "Waterfall",  icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><rect x="1" y="9" width="3" height="5" fill={a ? "#10B981" : "#475569"}/><line x1="4" y1="9" x2="7" y2="6" stroke={a ? "#94a3b8" : "#475569"} strokeWidth="1" strokeDasharray="1,1"/><rect x="7" y="6" width="3" height="8" fill={a ? "#F43F5E" : "#475569"}/><line x1="10" y1="6" x2="13" y2="8" stroke={a ? "#94a3b8" : "#475569"} strokeWidth="1" strokeDasharray="1,1"/><rect x="13" y="8" width="3" height="6" fill={a ? "#10B981" : "#475569"}/></svg> },
  { type: "combo",          label: "Combo",      icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><rect x="2" y="8" width="2.5" height="6" rx="0.5" fill={a ? "#00D2FF" : "#475569"}/><rect x="5.5" y="5" width="2.5" height="9" rx="0.5" fill={a ? "#00D2FF" : "#475569"}/><rect x="9" y="6" width="2.5" height="8" rx="0.5" fill={a ? "#00D2FF" : "#475569"}/><polyline points="3.25,8 6.75,4 10.25,5 13.75,2" fill="none" stroke={a ? "#F59E0B" : "#475569"} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { type: "sankey",         label: "Sankey",     icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><rect x="1" y="2" width="4" height="4" fill={a ? "#00D2FF" : "#475569"}/><rect x="7" y="5" width="4" height="4" fill={a ? "#00D2FF" : "#475569"}/><rect x="13" y="1" width="4" height="4" fill={a ? "#00D2FF" : "#475569"}/><path d="M 5 4 Q 8 5 7 7" fill="none" stroke={a ? "rgba(0,210,255,0.5)" : "#475569"} strokeWidth="1"/><path d="M 5 5 Q 10 6 13 3" fill="none" stroke={a ? "rgba(0,210,255,0.5)" : "#475569"} strokeWidth="1"/></svg> },
  { type: "treemap",        label: "Treemap",    icon: (a) => <svg width="20" height="16" viewBox="0 0 20 16"><rect x="1" y="1" width="6" height="7" fill={a ? "#00D2FF" : "#475569"} opacity="0.8"/><rect x="8" y="1" width="5" height="7" fill={a ? "#A78BFA" : "#475569"} opacity="0.8"/><rect x="14" y="1" width="5" height="7" fill={a ? "#10B981" : "#475569"} opacity="0.8"/><rect x="1" y="9" width="7" height="6" fill={a ? "#F59E0B" : "#475569"} opacity="0.8"/><rect x="9" y="9" width="10" height="6" fill={a ? "#F43F5E" : "#475569"} opacity="0.8"/></svg> },
];

function App() {
  const [queryResults, setQueryResults]   = useState([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [activeTab, setActiveTab]         = useState("search");
  const [error, setError]                 = useState(null);
  const [showHistory, setShowHistory]     = useState(false);
  const [pinboardFilters, setPinboardFilters] = useState({ region: null, quarter: null, product_category: null });
  const [liveboardFilter, setLiveboardFilter] = useState(null);
  const [liveboardFilterEnabled, setLiveboardFilterEnabled] = useState(true); // toggle drill-down on/off
  const [librarySearch, setLibrarySearch] = useState("");
  const [csvData, setCsvData]             = useState(null); // { name, columns, data }
  const [isDragOver, setIsDragOver]       = useState(false);
  const fileInputRef                      = useRef(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0); // which suggestion to display (0-based)
  const [searchInjection, setSearchInjection] = useState(""); // column click → search bar
  const [expandedTables, setExpandedTables]   = useState({ sales: true, customers: false, products: false, pipeline: false });
  const [theme, setTheme] = useState(() => localStorage.getItem("ss_theme") || "dark");
  const [autoInsights, setAutoInsights] = useState([]); // auto-discovered insights on mount
  const [catalogInsights, setCatalogInsights] = useState([]); // possible questions catalog
  const [dbConnected, setDbConnected] = useState(false); // DB connection status
  const [clearConfirm, setClearConfirm] = useState(null); // null | "answers" | "history" | "pinboard"
  const [followUpInputs, setFollowUpInputs] = useState({}); // { groupId: input value }
  const [conversationHistory, setConversationHistory] = useState({}); // { groupId: [{ Q, A }, ...] }
  const [suggestedFollowUps, setSuggestedFollowUps] = useState({}); // { groupId: [suggestions] }
  const [answers, setAnswers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ss_answers") || "[]");
    } catch {
      return [];
    }
  });

  // ── Multi-dashboard state ─────────────────────────────────────
  const [dashboards, setDashboards] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("snapsight_dashboards") || "[]");
      return saved.length > 0 ? saved : [{ id: Date.now(), name: "My Dashboard", widgets: [] }];
    } catch { return [{ id: Date.now(), name: "My Dashboard", widgets: [] }]; }
  });
  const [activeDashboardId, setActiveDashboardId] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("snapsight_dashboards") || "[]");
      return saved.length > 0 ? saved[0].id : null;
    } catch { return null; }
  });
  const [editingDashId, setEditingDashId]   = useState(null);
  const [editingDashName, setEditingDashName] = useState("");

  const activeDashboard = dashboards.find(d => d.id === activeDashboardId) || dashboards[0] || null;
  const pinnedWidgets   = activeDashboard?.widgets || [];

  useEffect(() => {
    localStorage.setItem("snapsight_dashboards", JSON.stringify(dashboards));
  }, [dashboards]);

  // Set activeDashboardId to first dashboard if not set
  useEffect(() => {
    if (!activeDashboardId && dashboards.length > 0) {
      setActiveDashboardId(dashboards[0].id);
    }
  }, [dashboards, activeDashboardId]);

  // ── Theme persistence ──
  useEffect(() => {
    localStorage.setItem("ss_theme", theme);
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [theme]);

  // ── Answers persistence ──
  useEffect(() => {
    localStorage.setItem("ss_answers", JSON.stringify(answers));
  }, [answers]);

  // ── On mount: Check DB connection and auto-discover insights ──
  useEffect(() => {
    const initializeApp = async () => {
      const health = await checkHealth();
      const isConnected = health.database === "connected";
      setDbConnected(isConnected);

      if (isConnected) {
        // Auto-discover insights
        try {
          setIsDiscovering(true);
          const results = await discoverInsights();
          const groups = results.map((response, idx) =>
            buildQueryGroup(response, Date.now() + idx * 1000, { isDiscovered: true })
          );
          setAutoInsights(groups);
        } catch (err) {
          console.error("Auto-discovery failed:", err);
        } finally {
          setIsDiscovering(false);
        }

        // Load possible questions catalog
        try {
          const catalog = await getInsightsCatalog();
          setCatalogInsights(catalog);
        } catch (err) {
          console.error("Failed to load catalog:", err);
        }
      }
    };
    initializeApp();
  }, []);

  const createDashboard = () => {
    const id = Date.now();
    const name = `Dashboard ${dashboards.length + 1}`;
    setDashboards(prev => [...prev, { id, name, widgets: [] }]);
    setActiveDashboardId(id);
  };

  const renameDashboard = (id, name) => {
    setDashboards(prev => prev.map(d => d.id === id ? { ...d, name } : d));
    setEditingDashId(null);
  };

  const deleteDashboard = (id) => {
    if (dashboards.length <= 1) return; // keep at least one
    setDashboards(prev => {
      const remaining = prev.filter(d => d.id !== id);
      if (activeDashboardId === id) setActiveDashboardId(remaining[0]?.id || null);
      return remaining;
    });
  };

  // ── Query history ─────────────────────────────────────────────
  const [queryHistory, setQueryHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("snapsight_history") || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("snapsight_history", JSON.stringify(queryHistory.slice(0, 50)));
  }, [queryHistory]);

  const addToHistory = (question) => {
    setQueryHistory(prev => {
      const deduped = prev.filter(h => h.question !== question);
      return [{ id: Date.now(), question, timestamp: new Date().toLocaleTimeString() }, ...deduped].slice(0, 50);
    });
  };

  const buildQueryGroup = (response, baseId, extra = {}) => {
    const group = {
      id: baseId,
      question: response.question,
      sql: response.sql,
      data: response.data,
      columns: response.columns,
      insight: response.insight,
      ...extra,
      suggestions: (response.suggestions || []).map((sug, idx) => ({
        ...sug,
        id: baseId + idx + 1,
        sql: response.sql,
        data: response.data,
        columns: response.columns,
        insight: response.insight,
        question: response.question,
        chart_config: sug.config,
      })),
    };
    if (group.suggestions.length === 0) {
      group.suggestions = [{
        id: baseId + 1,
        chart_type: response.chart_type || "bar",
        title: response.title || "Chart",
        subtitle: response.subtitle || "",
        label: "Chart",
        sql: response.sql, data: response.data,
        columns: response.columns, insight: response.insight,
        question: response.question, chart_config: response.chart_config || {},
      }];
    }
    return group;
  };

  // ── CSV upload helpers ────────────────────────────────────────
  const parseCsv = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return null;
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const data = lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const row = {};
      headers.forEach((h, i) => {
        const n = parseFloat(vals[i]);
        row[h] = isNaN(n) ? (vals[i] || "") : n;
      });
      return row;
    }).filter(row => Object.values(row).some(v => v !== ""));
    return { columns: headers, data };
  };

  const handleCsvFile = (file) => {
    if (!file || !file.name.endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCsv(e.target.result);
      if (!parsed) { setError("Could not parse CSV. Check the file format."); return; }
      setCsvData({ name: file.name, ...parsed });
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleSearch = async (question) => {
    setIsLoading(true);
    setError(null);
    setShowHistory(false);
    setActiveSuggestionIndex(0); // reset to first suggestion on new query
    try {
      // Move current queryResults to answers before firing new query
      if (queryResults.length > 0) {
        setAnswers(prev => [...queryResults, ...prev].slice(0, 100));
      }
      const response = csvData
        ? await askCsv(question, csvData.data, csvData.columns)
        : await askQuestion(question);
      addToHistory(question);
      // Only show latest result in Ask tab
      const newGroup = buildQueryGroup(response, Date.now());
      setQueryResults([newGroup]);
      // Generate follow-up suggestions based on the insight
      if (response.insight) {
        generateFollowUpSuggestions(newGroup.id, question, response.insight);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscover = async () => {
    setIsDiscovering(true);
    setError(null);
    try {
      const results = await discoverInsights();
      const groups = results.map((response, idx) =>
        buildQueryGroup(response, Date.now() + idx * 1000, { isDiscovered: true })
      );
      setQueryResults(prev => [...groups, ...prev]);
    } catch (err) {
      setError("SpotIQ discovery failed. Please try again.");
    } finally {
      setIsDiscovering(false);
    }
  };

  // Drill-down from Ask tab results → navigate to Ask and search
  const handleDrillDown = ({ dimension, value, metric }) => {
    if (!value) return;
    const template = DRILL_TEMPLATES[dimension];
    const question = template
      ? template(String(value), metric || "revenue")
      : `Show more details about ${value}`;
    setActiveTab("search");
    handleSearch(question);
  };

  // Drill-down from Liveboard → cross-filter all widgets
  const handleLiveboardDrillDown = ({ dimension, value, sourceWidgetId }) => {
    if (!value || !liveboardFilterEnabled) return;

    // Toggle: click same filter again to remove it
    setPinboardFilters(prev => {
      const current = prev[dimension];
      const newValue = String(current) === String(value) ? null : String(value);
      return { ...prev, [dimension]: newValue };
    });
  };

  // Remove a specific filter
  const removeFilter = (filterKey) => {
    setPinboardFilters(prev => ({ ...prev, [filterKey]: null }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setPinboardFilters(Object.keys(pinboardFilters).reduce((acc, key) => ({ ...acc, [key]: null }), {}));
  };

  const updateDashWidgets = (fn) => {
    setDashboards(prev => prev.map(d =>
      d.id === (activeDashboard?.id) ? { ...d, widgets: fn(d.widgets) } : d
    ));
  };

  const pinWidget = (widget) => {
    const exists = pinnedWidgets.find(w => w.id === widget.id);
    if (exists) {
      updateDashWidgets(ws => ws.filter(w => w.id !== widget.id));
    } else {
      updateDashWidgets(ws => [...ws, { ...widget }]);
    }
  };

  const unpinWidget = (widget) => {
    updateDashWidgets(ws => ws.filter(w => w.id !== widget.id));
  };

  const handleClearConfirmed = () => {
    if (clearConfirm === "answers") {
      setAnswers([]);
      localStorage.removeItem("ss_answers");
    } else if (clearConfirm === "history") {
      setQueryHistory([]);
      localStorage.removeItem("snapsight_history");
    } else if (clearConfirm === "pinboard") {
      setDashboards(prev => prev.map(d =>
        d.id === activeDashboardId ? { ...d, widgets: [] } : d
      ));
    }
    setClearConfirm(null);
  };

  const removeQueryGroup = (groupId) => setQueryResults(prev => prev.filter(g => g.id !== groupId));
  const isPinned = (widgetId) => pinnedWidgets.some(w => w.id === widgetId);

  const handleFollowUpQuestion = async (groupId, question) => {
    if (!question.trim()) return;
    setFollowUpInputs(prev => ({ ...prev, [groupId]: "" }));
    setIsLoading(true);
    try {
      const response = await askQuestion(question);
      const newQueryGroup = buildQueryGroup(response, Date.now());
      // Add to conversation history
      setConversationHistory(prev => ({
        ...prev,
        [groupId]: [...(prev[groupId] || []), { q: question, a: response.insight }]
      }));
      // Show new results
      setQueryResults([newQueryGroup]);
      setActiveTab("search");
    } catch (err) {
      setError(`Follow-up failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFollowUpSuggestions = (groupId, question, insight) => {
    // Generate 3 follow-up suggestions based on the insight
    const suggestions = [
      `Break down by the next dimension`,
      `Show how this compares to last period`,
      `What are the top drivers of this result?`,
    ];
    setSuggestedFollowUps(prev => ({ ...prev, [groupId]: suggestions }));
  };

  const filterOptions = {
    region:           [...new Set(pinnedWidgets.flatMap(w => (w.data || []).map(r => r.region).filter(Boolean)))],
    quarter:          [...new Set(pinnedWidgets.flatMap(w => (w.data || []).map(r => r.quarter).filter(Boolean)))],
    product_category: [...new Set(pinnedWidgets.flatMap(w => (w.data || []).map(r => r.product_category).filter(Boolean)))],
  };

  const applyFilters = (data) => {
    if (!data) return [];
    return data.filter(row => {
      if (pinboardFilters.region           && row.region           && row.region           !== pinboardFilters.region)           return false;
      if (pinboardFilters.quarter          && row.quarter          && row.quarter          !== pinboardFilters.quarter)          return false;
      if (pinboardFilters.product_category && row.product_category && row.product_category !== pinboardFilters.product_category) return false;
      return true;
    });
  };

  const filteredPinnedWidgets = pinnedWidgets.map(w => ({
    ...w,
    data: applyFilters(w.data)
  }));
  const activeFiltersCount = Object.values(pinboardFilters).filter(Boolean).length;

  // ── Theme color palette ────────────────────────────────────────────────
  const colors = {
    light: {
      bg: "#FFFFFF",
      text1: "#111827",
      text2: "#374151",
      text3: "#6B7280",
      headerBg: "#FFFFFF",
      headerBorder: "#E5E7EB",
      sidebarBg: "#F9FAFB",
      sidebarBorder: "#E5E7EB",
      columnBrowserBg: "#F9FAFB",
      columnBrowserBorder: "#E5E7EB",
      primaryColor: "#0052CC",
      primaryAccent: "#0052CC",
      primaryBg: "#EEF2FF",
      primaryBorder: "#C7D2FE",
      primary06: "#E5E7EB",
      primary05: "#F3F4F6",
    },
    dark: {
      bg: "#0F1419",
      text1: "#E5E7EB",
      text2: "#D1D5DB",
      text3: "#9CA3AF",
      headerBg: "#0F1419",
      headerBorder: "#2D3748",
      sidebarBg: "#060812",
      sidebarBorder: "#2D3748",
      columnBrowserBg: "#060812",
      columnBrowserBorder: "#2D3748",
      primaryColor: "#00D2FF",
      primaryAccent: "#00D2FF",
      primaryBg: "rgba(0, 210, 255, 0.12)",
      primaryBorder: "rgba(0, 210, 255, 0.3)",
      primary06: "#2D3748",
      primary05: "#1A202C",
    }
  };

  const c = colors[theme];

  // ── Shared styles ──────────────────────────────────────────────
  const tabBtn = (active) => ({
    background: active ? c.primaryBg : "transparent",
    border: "none",
    borderBottom: active ? `3px solid ${c.primaryColor}` : "3px solid transparent",
    borderRadius: 0,
    padding: "10px 18px", cursor: "pointer",
    color: active ? c.primaryColor : c.text3,
    display: "flex", alignItems: "center", gap: 7,
    fontSize: 13, fontWeight: 600,
    transition: "all 0.2s",
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
  });

  const selectStyle = {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, padding: "6px 10px", color: "#e2e8f0", fontSize: 12,
    cursor: "pointer", outline: "none", minWidth: 140,
    fontFamily: "Inter, sans-serif",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: c.bg,
      color: c.text1,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif",
      fontSize: 14,
      display: "flex", flexDirection: "column",
    }}>
      {/* ── Header ───────────────────────────────────────────── */}
      <header style={{
        borderBottom: `1px solid ${c.headerBorder}`,
        padding: "12px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: c.headerBg,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Logo + Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: "fit-content" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `linear-gradient(135deg, ${c.primaryColor}, #A78BFA)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 12px ${c.primaryColor}44`,
          }}>
            <Sparkles size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: c.text1, letterSpacing: "-0.02em" }}>
              SnapSight AI
            </h1>
            <p style={{ margin: 0, fontSize: 10, color: c.text3, fontWeight: 500, fontFamily: "Inter, sans-serif" }}>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Nav tabs - Centered */}
        <div style={{ display: "flex", gap: 0, alignItems: "center", flex: 1, justifyContent: "center", marginLeft: 40 }}>
          <button style={tabBtn(activeTab === "search")} onClick={() => setActiveTab("search")}>
            <MessageSquare size={15} /> Ask
          </button>
          <button style={tabBtn(activeTab === "dashboard")} onClick={() => setActiveTab("dashboard")}>
            <LayoutDashboard size={15} /> Liveboard <span style={{ background: c.primaryBg, borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 700 }}>({pinnedWidgets.length})</span>
          </button>
          <button style={tabBtn(activeTab === "answers")} onClick={() => setActiveTab("answers")}>
            <TrendingUp size={15} /> Answers <span style={{ background: c.primaryBg, borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 700 }}>({answers.length})</span>
          </button>
          <button style={tabBtn(activeTab === "library")} onClick={() => setActiveTab("library")}>
            <BookOpen size={15} /> Library
          </button>
          <button style={tabBtn(showHistory)} onClick={() => setShowHistory(h => !h)}>
            <Clock size={15} /> History {queryHistory.length > 0 && <span style={{ background: c.primaryBg, borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 700 }}>({queryHistory.length})</span>}
          </button>
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
          <div style={{ fontSize: 11, color: c.text3, display: "flex", alignItems: "center", gap: 6, fontFamily: "Inter, sans-serif", padding: "6px 10px", background: c.primary05, borderRadius: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
            Connected
          </div>
          <button style={{ background: c.primaryBg, border: `1.5px solid ${c.primaryBorder}`, borderRadius: 9, padding: "8px 14px", cursor: "pointer", color: c.primaryColor, display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif", transition: "all 0.2s" }} onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* History Sidebar */}
        {showHistory && (
          <aside style={{
            width: 300, flexShrink: 0,
            background: c.sidebarBg, borderRight: `1px solid ${c.sidebarBorder}`,
            display: "flex", flexDirection: "column",
            position: "sticky", top: 57, height: "calc(100vh - 57px)", overflowY: "auto",
          }}>
            <div style={{
              padding: "16px 16px 10px", borderBottom: `1px solid ${c.sidebarBorder}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: c.text1, fontFamily: "Inter, sans-serif" }}>Query History</span>
              <button
                onClick={() => setClearConfirm("history")}
                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, fontFamily: "Inter, sans-serif" }}
              >Clear all</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {queryHistory.length === 0 ? (
                <p style={{ color: c.text3, fontSize: 12, padding: 16, textAlign: "center", fontFamily: "Inter, sans-serif" }}>No history yet</p>
              ) : queryHistory.map(item => (
                <button key={item.id}
                  onClick={() => { setActiveTab("search"); handleSearch(item.question); }}
                  style={{
                    width: "100%", background: "none", border: "none",
                    padding: "10px 16px", cursor: "pointer", textAlign: "left",
                    borderBottom: `1px solid ${c.primary06}`, transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = c.primary05}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <div style={{ fontSize: 12, color: c.text2, lineHeight: 1.4, marginBottom: 3, fontFamily: "Inter, sans-serif" }}>{item.question}</div>
                  <div style={{ fontSize: 10, color: c.text3, fontFamily: "Inter, sans-serif" }}>{item.timestamp}</div>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0, padding: "20px 28px", overflowY: "auto" }}>

          {/* ═══ ASK TAB — 3-Panel ThoughtSpot Layout ════ */}
          {activeTab === "search" && (() => {
            const latestGroup = queryResults[0] || null;
            // Use activeSuggestionIndex to pick which suggestion to display
            const displayedWidget = latestGroup && latestGroup.suggestions[activeSuggestionIndex]
              ? latestGroup.suggestions[activeSuggestionIndex]
              : null;

            return (
              <div style={{ display: "flex", gap: 0, minHeight: "calc(100vh - 100px)" }}>

                {/* ── LEFT: Column Browser ── */}
                <div style={{
                  width: 260, flexShrink: 0,
                  borderRight: `1px solid ${c.columnBrowserBorder}`,
                  background: c.columnBrowserBg,
                  display: "flex", flexDirection: "column",
                  overflowY: "auto", padding: "14px 0",
                }}>
                  <div style={{ padding: "0 14px 12px", borderBottom: `1px solid ${c.primary06}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.text3, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "Inter, sans-serif", marginBottom: 4 }}>
                      Data Columns
                    </div>
                    <div style={{ fontSize: 10, color: c.text3, fontFamily: "Inter, sans-serif" }}>
                      Click to add to query
                    </div>
                  </div>

                  {/* CSV columns if active */}
                  {csvData && (
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,210,255,0.06)" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#10B981", marginBottom: 6, fontFamily: "Inter, sans-serif" }}>
                        📄 {csvData.name}
                      </div>
                      {csvData.columns.map(col => (
                        <button key={col}
                          onClick={() => setSearchInjection(prev => prev ? `${prev} ${col}` : `Show ${col}`)}
                          style={{
                            display: "flex", alignItems: "center", gap: 6, width: "100%",
                            background: "none", border: "none", padding: "4px 6px", cursor: "pointer",
                            color: "#94a3b8", fontSize: 11, fontFamily: "Inter, sans-serif",
                            borderRadius: 4, textAlign: "left",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,210,255,0.06)"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                          <span style={{ fontSize: 10, width: 16, textAlign: "center", color: "#475569" }}>
                            {typeof csvData.data[0]?.[col] === "number" ? "#" : "Aa"}
                          </span>
                          {col.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* DB Schema tables */}
                  {!csvData && DB_SCHEMA.map(table => (
                    <div key={table.table} style={{ borderBottom: "1px solid rgba(0,210,255,0.04)" }}>
                      <button
                        onClick={() => setExpandedTables(prev => ({ ...prev, [table.table]: !prev[table.table] }))}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 6,
                          background: "none", border: "none", padding: "8px 14px", cursor: "pointer",
                          color: "#94a3b8", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
                          textAlign: "left",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(0,210,255,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >
                        <span style={{ fontSize: 10, color: "#475569", transition: "transform 0.15s",
                          transform: expandedTables[table.table] ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                        <Database size={11} style={{ color: "#00D2FF", opacity: 0.6 }} />
                        {table.table}
                      </button>
                      {expandedTables[table.table] && (
                        <div style={{ padding: "0 8px 6px 18px" }}>
                          {table.columns.filter(c => c.kind === "dimension").length > 0 && (
                            <div style={{ fontSize: 9, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 6px", fontFamily: "Inter, sans-serif" }}>
                              Dimensions
                            </div>
                          )}
                          {table.columns.filter(c => c.kind === "dimension").map(col => (
                            <button key={col.name}
                              onClick={() => setSearchInjection(`Show ${table.table} by ${col.name.replace(/_/g, " ")}`)}
                              style={{
                                display: "flex", alignItems: "center", gap: 6, width: "100%",
                                background: "none", border: "none", padding: "3px 6px", cursor: "pointer",
                                color: "#94a3b8", fontSize: 11, fontFamily: "Inter, sans-serif",
                                borderRadius: 4, textAlign: "left",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,210,255,0.06)"}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}
                            >
                              <span style={{ fontSize: 9, width: 16, textAlign: "center",
                                color: col.type === "date" ? "#F59E0B" : "#60A5FA" }}>
                                {col.type === "date" ? "📅" : "Aa"}
                              </span>
                              {col.name.replace(/_/g, " ")}
                            </button>
                          ))}
                          {table.columns.filter(c => c.kind === "measure").length > 0 && (
                            <div style={{ fontSize: 9, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 6px", marginTop: 4, fontFamily: "Inter, sans-serif" }}>
                              Measures
                            </div>
                          )}
                          {table.columns.filter(c => c.kind === "measure").map(col => (
                            <button key={col.name}
                              onClick={() => setSearchInjection(`Show total ${col.name.replace(/_/g, " ")} by ${table.columns.find(c => c.kind === "dimension")?.name.replace(/_/g, " ") || "category"}`)}
                              style={{
                                display: "flex", alignItems: "center", gap: 6, width: "100%",
                                background: "none", border: "none", padding: "3px 6px", cursor: "pointer",
                                color: "#67E8F9", fontSize: 11, fontFamily: "Inter, sans-serif", fontWeight: 500,
                                borderRadius: 4, textAlign: "left",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,210,255,0.06)"}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}
                            >
                              <span style={{ fontSize: 10, width: 16, textAlign: "center", color: "#10B981" }}>#</span>
                              {col.name.replace(/_/g, " ")}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* CSV Drop zone at bottom */}
                  <div style={{ padding: "12px 14px", marginTop: "auto" }}>
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={e => { e.preventDefault(); setIsDragOver(false); handleCsvFile(e.dataTransfer.files[0]); }}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `1.5px dashed ${isDragOver ? "rgba(0,210,255,0.55)" : "rgba(0,210,255,0.15)"}`,
                        borderRadius: 8, padding: "10px", cursor: "pointer", textAlign: "center",
                        background: isDragOver ? "rgba(0,210,255,0.05)" : "transparent",
                        transition: "all 0.2s",
                      }}>
                      <Upload size={13} style={{ color: "#475569", marginBottom: 2 }} />
                      <div style={{ fontSize: 10, color: "#475569", fontFamily: "Inter, sans-serif" }}>
                        {csvData ? csvData.name : "Drop .csv file"}
                      </div>
                      <input ref={fileInputRef} type="file" accept=".csv"
                        style={{ display: "none" }}
                        onChange={e => handleCsvFile(e.target.files[0])} />
                    </div>
                    {csvData && (
                      <button onClick={() => setCsvData(null)} style={{
                        width: "100%", background: "none", border: "none", color: "#F43F5E",
                        fontSize: 10, cursor: "pointer", marginTop: 4, fontFamily: "Inter, sans-serif",
                      }}>Remove CSV</button>
                    )}
                  </div>
                </div>

                {/* ── CENTER: Search + Results ── */}
                <div style={{ flex: 1, minWidth: 0, padding: "16px 24px", overflowY: "auto" }}>
                  <SearchBar onSearch={handleSearch} isLoading={isLoading || isDiscovering} externalQuery={searchInjection} />

                  {/* Action buttons row */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20, marginTop: -4 }}>
                    <button onClick={handleDiscover} disabled={isLoading || isDiscovering}
                      style={{
                        background: isDiscovering ? "rgba(167,139,250,0.15)" : "rgba(167,139,250,0.08)",
                        border: `1.5px solid rgba(167,139,250,${isDiscovering ? "0.4" : "0.25"})`,
                        borderRadius: 10,
                        padding: "9px 16px", cursor: isDiscovering ? "not-allowed" : "pointer",
                        color: "#C4B5FD", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
                        display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
                        opacity: isLoading ? 0.6 : 1,
                      }}>
                      <TrendingUp size={14} />
                      {isDiscovering ? "Analyzing…" : "Discover Insights"}
                    </button>

                    {(isLoading || isDiscovering) && (
                      <button onClick={() => setIsLoading(false)}
                        style={{
                          background: "rgba(239,68,68,0.12)",
                          border: "1.5px solid rgba(239,68,68,0.35)",
                          borderRadius: 10,
                          padding: "9px 16px", cursor: "pointer",
                          color: "#fca5a5", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
                          display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }}>
                        <X size={14} />
                        Stop
                      </button>
                    )}

                    {queryResults.length > 0 && !isLoading && !isDiscovering && (
                      <button onClick={() => { setQueryResults([]); setActiveSuggestionIndex(0); }}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1.5px solid rgba(255,255,255,0.12)",
                          borderRadius: 10,
                          padding: "9px 16px", cursor: "pointer",
                          color: c.text2, fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
                          display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
                        <X size={14} />
                        Clear
                      </button>
                    )}
                  </div>

                  {(isLoading || isDiscovering) && <AgentThinking />}

                  {error && (
                    <div style={{
                      padding: "12px 16px", marginBottom: 16, borderRadius: 12,
                      background: "rgba(239,68,68,0.12)", border: "1.5px solid rgba(239,68,68,0.25)",
                      color: "#FCA5A5", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 500,
                      display: "flex", alignItems: "flex-start", gap: 10,
                    }}>
                      <X size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Empty state */}
                  {queryResults.length === 0 && !isLoading && !isDiscovering && (
                    <div>
                      {/* Auto-Generated Insights (if DB connected) */}
                      {dbConnected && autoInsights.length > 0 && (
                        <div style={{ marginBottom: 40 }}>
                          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 16px", color: c.text1, display: "flex", alignItems: "center", gap: 10, letterSpacing: "-0.01em" }}>
                            <Sparkles size={18} style={{ color: c.primaryColor }} />
                            Auto-Generated Insights
                          </h2>
                          <div style={{
                            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16,
                          }}>
                            {autoInsights.slice(0, 4).map(group => (
                              <div key={group.id} style={{
                                background: c.primary05,
                                border: `1.5px solid ${c.primary06}`,
                                borderRadius: 12, padding: 16, cursor: "pointer",
                                transition: "all 0.2s", height: "100%", display: "flex", flexDirection: "column",
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.borderColor = c.primaryBorder;
                                e.currentTarget.style.background = c.columnBrowserBg;
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.borderColor = c.primary06;
                                e.currentTarget.style.background = c.primary05;
                              }}
                              onClick={() => { setQueryResults([group]); setActiveSuggestionIndex(0); }}
                              >
                                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: c.text1, marginBottom: 6, lineHeight: 1.4 }}>
                                  {group.question}
                                </h3>
                                <p style={{ margin: 0, fontSize: 12, color: c.text2, marginBottom: 12, flex: 1, fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>
                                  {group.insight?.substring(0, 65)}...
                                </p>
                                <div style={{
                                  width: "100%", height: 80, borderRadius: 8,
                                  background: c.primary06, border: `1.5px solid ${c.primary06}`,
                                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: c.text3,
                                  fontFamily: "Inter, sans-serif", overflow: "hidden", fontWeight: 600,
                                }}>
                                  {group.suggestions[0]?.chart_type === "table" ? "📊 Data Table" : `📈 ${group.suggestions[0]?.title || "Chart"}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Possible Questions by Category */}
                      {dbConnected && catalogInsights.length > 0 && (
                        <div style={{ marginBottom: 40 }}>
                          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 16px", color: c.text1, display: "flex", alignItems: "center", gap: 10, letterSpacing: "-0.01em" }}>
                            <BookOpen size={18} style={{ color: "#A78BFA" }} />
                            Possible Questions
                          </h2>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                            {catalogInsights.map((category, idx) => (
                              <div key={idx} style={{
                                background: c.primary05,
                                border: `1.5px solid ${c.primary06}`,
                                borderRadius: 12, padding: 16,
                              }}>
                                <h3 style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 800, color: c.primaryColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                  {category.name}
                                </h3>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                                  {category.questions.map((q, qIdx) => (
                                    <button key={qIdx}
                                      onClick={() => handleSearch(q)}
                                      style={{
                                        background: c.primaryBg,
                                        border: `1.5px solid ${c.primaryBorder}`,
                                        borderRadius: 20, padding: "7px 13px",
                                        fontSize: 12, color: c.primaryColor, cursor: "pointer",
                                        fontFamily: "Inter, sans-serif", fontWeight: 600,
                                        transition: "all 0.2s",
                                      }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.background = c.primary06;
                                        e.currentTarget.style.borderColor = c.primaryColor;
                                        e.currentTarget.style.color = c.primaryColor;
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.background = c.primaryBg;
                                        e.currentTarget.style.borderColor = c.primaryBorder;
                                        e.currentTarget.style.color = c.primaryColor;
                                      }}
                                    >
                                      {q}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fallback empty state if not connected */}
                      {!dbConnected && (
                        <div style={{ textAlign: "center", padding: "60px 20px" }}>
                          <div style={{
                            width: 80, height: 80, borderRadius: 20, margin: "0 auto 22px",
                            background: `linear-gradient(135deg, ${c.primaryBg}, rgba(167,139,250,0.12))`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: `2px solid ${c.primaryBorder}`,
                            boxShadow: `0 8px 24px ${c.primaryColor}22`,
                          }}>
                            <Database size={36} style={{ color: c.primaryColor }} />
                          </div>
                          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px", color: c.text1, letterSpacing: "-0.02em" }}>
                            Connect a data source
                          </h2>
                          <p style={{ fontSize: 14, color: c.text2, maxWidth: 420, margin: "0 auto", lineHeight: 1.7, fontFamily: "Inter, sans-serif" }}>
                            Connect to your database to see auto-generated insights and discover recommended questions for your data.
                          </p>
                        </div>
                      )}

                      {/* If no auto-insights but DB is connected */}
                      {dbConnected && autoInsights.length === 0 && (
                        <div style={{ textAlign: "center", padding: "60px 20px" }}>
                          <div style={{
                            width: 80, height: 80, borderRadius: 20, margin: "0 auto 22px",
                            background: `linear-gradient(135deg, ${c.primaryBg}, rgba(167,139,250,0.12))`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: `2px solid ${c.primaryBorder}`,
                            boxShadow: `0 8px 24px ${c.primaryColor}22`,
                          }}>
                            <MessageSquare size={36} style={{ color: c.primaryColor }} />
                          </div>
                          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px", color: c.text1, letterSpacing: "-0.02em" }}>
                            Ask anything about your data
                          </h2>
                          <p style={{ fontSize: 14, color: c.text2, maxWidth: 420, margin: "0 auto", lineHeight: 1.7, fontFamily: "Inter, sans-serif" }}>
                            Type a question above, click columns on the left, or try <strong style={{ color: c.primaryColor, fontWeight: 700 }}>Discover Insights</strong> to explore your data.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Latest query result: LARGE single chart ── */}
                  {latestGroup && (
                    <div style={{ marginBottom: 28, animation: "fadeIn 0.4s ease-out" }}>
                      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }`}</style>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            {latestGroup.isDiscovered && (
                              <span style={{ fontSize: 10, fontWeight: 800, color: "#E9D5FF", background: "rgba(192, 132, 250, 0.18)", border: "1.5px solid rgba(192, 132, 250, 0.35)", borderRadius: 5, padding: "3px 8px", letterSpacing: "0.07em", fontFamily: "Inter, sans-serif" }}>✨ SPOTIQ</span>
                            )}
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: c.text1, letterSpacing: "-0.02em" }}>
                              "{latestGroup.question}"
                            </h3>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: c.text3, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
                            Select a visualization from the right panel to explore the data
                          </p>
                        </div>
                        <button onClick={() => removeQueryGroup(latestGroup.id)} style={{
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                          borderRadius: 8, padding: "5px 12px", cursor: "pointer", color: "#475569", fontSize: 11,
                          fontFamily: "Inter, sans-serif",
                        }}>Dismiss</button>
                      </div>

                      {latestGroup.insight && (
                        <div style={{
                          padding: "12px 16px", marginBottom: 16,
                          background: "rgba(0,210,255,0.08)", borderRadius: 10,
                          border: "1.5px solid rgba(0,210,255,0.2)", borderLeft: "4px solid #00D2FF",
                          display: "flex", alignItems: "flex-start", gap: 10,
                        }}>
                          <Sparkles size={16} style={{ color: "#00D2FF", flexShrink: 0, marginTop: 1 }} />
                          <p style={{ margin: 0, fontSize: 13, color: "#C7F0FF", lineHeight: 1.6, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
                            {latestGroup.insight}
                          </p>
                        </div>
                      )}

                      {/* Follow-up Questions Section */}
                      {latestGroup && (
                        <div style={{ padding: "12px 0", borderTop: `1px solid ${c.primary06}`, marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: c.text2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Inter, sans-serif" }}>
                            💬 Follow-up Questions
                          </div>

                          {/* Suggested follow-ups */}
                          {(suggestedFollowUps[latestGroup.id] || []).length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                              {(suggestedFollowUps[latestGroup.id] || []).map((sugg, i) => (
                                <button key={i}
                                  onClick={() => {
                                    const fullQuestion = sugg;
                                    handleFollowUpQuestion(latestGroup.id, fullQuestion);
                                  }}
                                  style={{
                                    background: "rgba(0,210,255,0.12)", border: "1px solid rgba(0,210,255,0.25)",
                                    borderRadius: 8, padding: "8px 10px", cursor: "pointer",
                                    color: "#67E8F9", fontSize: 11, fontWeight: 500, fontFamily: "Inter, sans-serif",
                                    textAlign: "left", transition: "all 0.15s",
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,210,255,0.18)"; e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)"; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,210,255,0.12)"; e.currentTarget.style.borderColor = "rgba(0,210,255,0.25)"; }}>
                                  ✨ {sugg}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Custom follow-up input */}
                          <div style={{ display: "flex", gap: 6 }}>
                            <input
                              value={followUpInputs[latestGroup.id] || ""}
                              onChange={e => setFollowUpInputs(prev => ({ ...prev, [latestGroup.id]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  handleFollowUpQuestion(latestGroup.id, followUpInputs[latestGroup.id] || "");
                                }
                              }}
                              placeholder="Ask a follow-up question..."
                              style={{
                                flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,210,255,0.2)",
                                borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#F0F4FF",
                                fontFamily: "Inter, sans-serif", outline: "none",
                              }}
                              onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                              onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,210,255,0.2)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                            />
                            <button
                              onClick={() => handleFollowUpQuestion(latestGroup.id, followUpInputs[latestGroup.id] || "")}
                              disabled={!followUpInputs[latestGroup.id]?.trim() || isLoading}
                              style={{
                                background: "rgba(0,210,255,0.2)", border: "1px solid rgba(0,210,255,0.3)",
                                borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: "#67E8F9",
                                fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
                                transition: "all 0.15s", opacity: !followUpInputs[latestGroup.id]?.trim() ? 0.5 : 1,
                              }}
                              onMouseEnter={e => followUpInputs[latestGroup.id]?.trim() && (e.currentTarget.style.background = "rgba(0,210,255,0.3)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,210,255,0.2)")}
                            >
                              →
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Single LARGE chart */}
                      {displayedWidget && (
                        <ChartWidget
                          widget={displayedWidget}
                          onPin={pinWidget}
                          isPinned={isPinned(displayedWidget.id)}
                          compact={false}
                          onDrillDown={handleDrillDown}
                          theme={theme}
                        />
                      )}
                    </div>
                  )}

                  {/* No previous results — they move to Answers tab when new query fires */}
                </div>

                {/* ── RIGHT: Suggestion Switcher ── */}
                {latestGroup && latestGroup.suggestions.length > 0 && (
                  <div style={{
                    width: 140, flexShrink: 0,
                    borderLeft: `1.5px solid ${c.primaryBorder}`,
                    background: c.columnBrowserBg,
                    display: "flex", flexDirection: "column",
                    padding: "14px 10px", gap: 8, overflowY: "auto",
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 800, color: c.primaryColor,
                      textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4,
                      fontFamily: "Inter, sans-serif", textAlign: "center", paddingBottom: 8,
                      borderBottom: `1px solid ${c.primary06}`,
                    }}>
                      🎨 Visualize
                    </div>
                    {latestGroup.suggestions.map((sug, idx) => {
                      const isActive = activeSuggestionIndex === idx;
                      // Find icon for this chart type
                      const chartTypeOpt = CHART_TYPE_OPTIONS.find(opt => opt.type === sug.chart_type);
                      const icon = chartTypeOpt ? chartTypeOpt.icon(isActive) : null;
                      const label = sug.label || (chartTypeOpt?.label || sug.chart_type).replace("_", " ");
                      return (
                        <button key={idx}
                          onClick={() => setActiveSuggestionIndex(idx)}
                          title={sug.title || label}
                          style={{
                            width: "100%", minHeight: 56,
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                            background: isActive ? c.primaryBg : "transparent",
                            border: isActive ? `1.5px solid ${c.primaryColor}` : `1px solid ${c.primary06}`,
                            borderRadius: 10, cursor: "pointer",
                            transition: "all 0.2s", padding: "8px 6px",
                          }}
                          onMouseEnter={e => {
                            if (!isActive) {
                              e.currentTarget.style.background = c.primary05;
                              e.currentTarget.style.borderColor = c.primaryBorder;
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isActive) {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.borderColor = c.primary06;
                            }
                          }}
                        >
                          <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {icon}
                          </div>
                          <span style={{
                            fontSize: 12, color: isActive ? c.primaryColor : c.text3, fontFamily: "Inter, sans-serif",
                            fontWeight: isActive ? 700 : 600, textAlign: "center", lineHeight: 1.2, wordBreak: "break-word"
                          }}>
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ═══ LIVEBOARD TAB ══════════════════════════════ */}
          {activeTab === "dashboard" && (
            <>
              {/* Dashboard tabs row */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {dashboards.map(dash => (
                  <div key={dash.id} style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: dash.id === activeDashboard?.id ? "rgba(0,210,255,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${dash.id === activeDashboard?.id ? "rgba(0,210,255,0.35)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 8, padding: "6px 10px",
                    cursor: "pointer", transition: "all 0.18s",
                  }}
                    onClick={() => { setActiveDashboardId(dash.id); setLiveboardFilter(null); }}>
                    {editingDashId === dash.id ? (
                      <>
                        <input
                          autoFocus
                          value={editingDashName}
                          onChange={e => setEditingDashName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") renameDashboard(dash.id, editingDashName); if (e.key === "Escape") setEditingDashId(null); }}
                          onClick={e => e.stopPropagation()}
                          style={{ background: "transparent", border: "none", outline: "none", color: "#F0F4FF", fontSize: 12, fontFamily: "Inter, sans-serif", width: 110 }}
                        />
                        <button onClick={e => { e.stopPropagation(); renameDashboard(dash.id, editingDashName); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#10B981", padding: 0, display: "flex" }}>
                          <Check size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: 12, color: dash.id === activeDashboard?.id ? "#67E8F9" : "#64748b", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
                          {dash.name}
                        </span>
                        <span style={{ fontSize: 10, color: "#334155", marginLeft: 2 }}>({dash.widgets.length})</span>
                        <button onClick={e => { e.stopPropagation(); setEditingDashId(dash.id); setEditingDashName(dash.name); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#334155", padding: 0, display: "flex", marginLeft: 2 }}>
                          <Pencil size={10} />
                        </button>
                        {dashboards.length > 1 && (
                          <button onClick={e => { e.stopPropagation(); deleteDashboard(dash.id); }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#334155", padding: 0, display: "flex" }}>
                            <Trash2 size={10} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
                <button onClick={createDashboard} style={{
                  background: "none", border: "1px dashed rgba(0,210,255,0.25)", borderRadius: 8,
                  padding: "6px 12px", cursor: "pointer", color: "#334155", fontSize: 12,
                  fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Plus size={12} /> New
                </button>
                <button onClick={() => setActiveTab("search")} style={{
                  marginLeft: "auto",
                  background: "linear-gradient(135deg, #00D2FF, #0088CC)",
                  border: "none", borderRadius: 10, padding: "8px 16px",
                  color: "#08062B", cursor: "pointer", fontSize: 12, fontWeight: 700,
                  fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6,
                  boxShadow: "0 4px 16px rgba(0,210,255,0.3)",
                }}>
                  <Plus size={13} /> Add Widgets
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#F0F4FF" }}>
                    {activeDashboard?.name || "Liveboard"}
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#475569", fontFamily: "Inter, sans-serif" }}>
                    {pinnedWidgets.length === 0
                      ? "Pin chart widgets from the Ask tab to build this dashboard"
                      : `${pinnedWidgets.length} widget${pinnedWidgets.length !== 1 ? "s" : ""} · Click elements to cross-filter`}
                  </p>
                </div>
                {pinnedWidgets.length > 0 && (
                  <button onClick={() => setClearConfirm("pinboard")} style={{
                    background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)",
                    borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                    color: "#F43F5E", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}>Clear All</button>
                )}
              </div>

              {/* Filter Pills - Show active filters */}
              {activeFiltersCount > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 0", marginBottom: 12,
                  flexWrap: "wrap",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", fontFamily: "Inter, sans-serif" }}>
                    🔍 Active Filters:
                  </span>
                  {Object.entries(pinboardFilters).filter(([_, val]) => val).map(([key, value]) => {
                    const labels = { region: "Region", quarter: "Quarter", product_category: "Category" };
                    return (
                      <div key={key} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "rgba(0,210,255,0.15)", border: "1px solid rgba(0,210,255,0.3)",
                        borderRadius: 16, padding: "6px 10px",
                        fontFamily: "Inter, sans-serif",
                      }}>
                        <span style={{ fontSize: 12, color: "#67E8F9", fontWeight: 500 }}>
                          <strong style={{ color: "#00D2FF" }}>{labels[key]}:</strong> {value}
                        </span>
                        <button onClick={() => removeFilter(key)} style={{
                          background: "none", border: "none", color: "#00D2FF", cursor: "pointer",
                          fontSize: 14, padding: "0 4px", display: "flex", alignItems: "center",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = "#00FFFF"}
                        onMouseLeave={e => e.currentTarget.style.color = "#00D2FF"}>
                          ✕
                        </button>
                      </div>
                    );
                  })}
                  <button onClick={clearAllFilters} style={{
                    background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 16, padding: "6px 12px", cursor: "pointer",
                    color: "#fca5a5", fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif",
                    display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }}>
                    <X size={12} /> Clear All
                  </button>
                </div>
              )}

              {/* Global filter dropdown bar */}
              {pinnedWidgets.length > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,210,255,0.07)",
                  borderRadius: 12, marginBottom: 18, flexWrap: "wrap",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569", fontSize: 12, fontFamily: "Inter, sans-serif" }}>
                    <Filter size={13} /> <span>Filter by:</span>
                  </div>
                  {[
                    { key: "region",           label: "Region",   opts: filterOptions.region },
                    { key: "quarter",          label: "Quarter",  opts: filterOptions.quarter },
                    { key: "product_category", label: "Category", opts: filterOptions.product_category },
                  ].map(({ key, label, opts }) => opts.length > 0 && (
                    <select key={key} value={pinboardFilters[key] || ""} style={selectStyle}
                      onChange={e => setPinboardFilters(p => ({ ...p, [key]: e.target.value || null }))}>
                      <option value="">All {label}s</option>
                      {opts.sort().map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ))}
                </div>
              )}

              {/* Cross-filter active banner + toggle */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", marginBottom: 14,
                background: liveboardFilter || !liveboardFilterEnabled ? "rgba(0,210,255,0.07)" : "rgba(255,255,255,0.02)",
                border: liveboardFilter || !liveboardFilterEnabled ? "1px solid rgba(0,210,255,0.25)" : "1px solid rgba(255,255,255,0.08)",
                borderLeft: liveboardFilter ? "3px solid #00D2FF" : "3px solid rgba(255,255,255,0.15)",
                borderRadius: 10,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: liveboardFilterEnabled ? "#00D2FF" : "#475569", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: liveboardFilterEnabled ? "#67E8F9" : "#94a3b8", fontFamily: "Inter, sans-serif", flex: 1 }}>
                  {liveboardFilter ? (
                    <>
                      Cross-filtering by <strong>{liveboardFilter.dimension.replace(/_/g, " ")}</strong>
                      {" = "}<strong>{liveboardFilter.value}</strong>
                      {" · Other widgets are filtered · Click the same element again to clear"}
                    </>
                  ) : (
                    <>
                      Drill-down filtering is <strong>{liveboardFilterEnabled ? "ENABLED" : "DISABLED"}</strong> — Click any chart element to filter
                    </>
                  )}
                </span>
                {liveboardFilter && (
                  <button
                    onClick={() => setLiveboardFilter(null)}
                    style={{
                      background: "none", border: "1px solid rgba(0,210,255,0.25)",
                      borderRadius: 6, padding: "3px 10px", cursor: "pointer",
                      color: "#67E8F9", fontSize: 11, fontFamily: "Inter, sans-serif",
                    }}>
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setLiveboardFilterEnabled(!liveboardFilterEnabled)}
                  style={{
                    background: liveboardFilterEnabled ? "rgba(0,210,255,0.12)" : "rgba(255,255,255,0.04)",
                    border: liveboardFilterEnabled ? "1px solid rgba(0,210,255,0.25)" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6, padding: "3px 12px", cursor: "pointer",
                    color: liveboardFilterEnabled ? "#67E8F9" : "#94a3b8", fontSize: 11, fontFamily: "Inter, sans-serif",
                    fontWeight: 600, transition: "all 0.2s",
                  }}>
                  {liveboardFilterEnabled ? "Disable" : "Enable"}
                </button>
              </div>

              {pinnedWidgets.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "80px 20px",
                  border: "1px dashed rgba(0,210,255,0.15)", borderRadius: 24,
                  background: "rgba(0,210,255,0.02)",
                }}>
                  <LayoutDashboard size={48} style={{ color: "#00D2FF", marginBottom: 16, opacity: 0.4 }} />
                  <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "#475569", fontFamily: "Inter, sans-serif" }}>
                    Your Liveboard is empty
                  </h3>
                  <p style={{ margin: "0 0 20px", fontSize: 13, color: "#334155", maxWidth: 350, marginLeft: "auto", marginRight: "auto", fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}>
                    Ask questions, explore chart options, and pin your favorites here.
                  </p>
                  <button onClick={() => setActiveTab("search")} style={{
                    background: "rgba(0,210,255,0.1)", border: "1px solid rgba(0,210,255,0.25)",
                    borderRadius: 10, padding: "10px 20px", cursor: "pointer",
                    color: "#67E8F9", fontSize: 13, fontWeight: 500, fontFamily: "Inter, sans-serif",
                  }}>Start Asking Questions</button>
                </div>
              ) : (
                <>
                  <p style={{ margin: "0 0 10px", fontSize: 11, color: "#334155", fontFamily: "Inter, sans-serif" }}>
                    Click chart elements to cross-filter other widgets
                  </p>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 20,
                  }}>
                    {filteredPinnedWidgets.map(widget => {
                      const isSource  = liveboardFilter?.sourceWidgetId === widget.id;
                      const isDimmed  = !!liveboardFilter && !isSource;
                      return (
                        <div key={String(widget.id)} style={{
                          position: "relative",
                          opacity: isDimmed ? 0.55 : 1,
                          transition: "opacity 0.25s ease",
                        }}>
                          <ChartWidget
                            widget={widget}
                            onPin={unpinWidget}
                            isPinned={true}
                            compact={false}
                            isSelected={isSource}
                            onDrillDown={(info) => handleLiveboardDrillDown({ ...info, sourceWidgetId: widget.id })}
                            theme={theme}
                          />
                          {isDimmed && (
                            <div style={{
                              position: "absolute", top: 12, right: 12,
                              background: "rgba(0,210,255,0.1)",
                              border: "1px solid rgba(0,210,255,0.28)",
                              borderRadius: 10, padding: "2px 9px",
                              fontSize: 10, color: "#67E8F9",
                              fontFamily: "Inter, sans-serif", fontWeight: 600,
                              letterSpacing: "0.04em", pointerEvents: "none",
                            }}>
                              FILTERED
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* ═══ ANSWERS TAB ════════════════════════════════ */}
          {activeTab === "answers" && (
            <>
              <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#F0F4FF" }}>
                    Answers
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: "#475569", fontFamily: "Inter, sans-serif" }}>
                    All your past queries and insights
                  </p>
                </div>
                {answers.length > 0 && (
                  <button onClick={() => setClearConfirm("answers")} style={{
                    background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)",
                    borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                    color: "#F43F5E", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
                    whiteSpace: "nowrap", marginLeft: 16,
                  }}>Clear All</button>
                )}
              </div>

              {answers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#475569", fontFamily: "Inter, sans-serif" }}>
                  <p>No saved answers yet. Fire queries in the Ask tab to build your library.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                  {answers.map(group => (
                    <div key={group.id} style={{
                      background: "rgba(13,11,46,0.82)", border: "1px solid rgba(0,210,255,0.15)",
                      borderRadius: 14, padding: "16px", cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(0,210,255,0.3)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(0,210,255,0.15)"}>
                      <div style={{ marginBottom: 10 }}>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#F0F4FF", fontFamily: "Inter, sans-serif", marginBottom: 4 }}>
                          "{group.question}"
                        </h3>
                        <p style={{ margin: 0, fontSize: 11, color: "#64748B", fontFamily: "Inter, sans-serif" }}>
                          {group.suggestions?.length || 0} chart{group.suggestions?.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {group.insight && (
                        <p style={{ margin: "8px 0", fontSize: 12, color: "#94a3b8", fontFamily: "Inter, sans-serif", lineHeight: 1.4 }}>
                          {group.insight}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                        <button onClick={() => { setQueryResults([group]); setActiveTab("search"); }} style={{
                          flex: 1, background: "rgba(0,210,255,0.12)", border: "1px solid rgba(0,210,255,0.25)",
                          borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                          color: "#67E8F9", fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif",
                        }}>View</button>
                        <button onClick={() => setAnswers(prev => prev.filter(g => g.id !== group.id))} style={{
                          background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)",
                          borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                          color: "#F43F5E", fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif",
                        }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ LIBRARY TAB ════════════════════════════════ */}
          {activeTab === "library" && (
            <>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#F0F4FF" }}>
                  Library
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "#475569", fontFamily: "Inter, sans-serif" }}>
                  Search your dashboards, queries, and analytics
                </p>
              </div>

              {/* Search bar */}
              <div style={{ position: "relative", marginBottom: 24 }}>
                <input
                  value={librarySearch}
                  onChange={e => setLibrarySearch(e.target.value)}
                  placeholder="Search dashboards, queries..."
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,210,255,0.2)",
                    borderRadius: 12, padding: "12px 16px 12px 42px",
                    color: "#F0F4FF", fontSize: 14, outline: "none",
                    fontFamily: "Inter, sans-serif",
                  }}
                />
                <BookOpen size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
              </div>

              {/* Saved Dashboards */}
              <section style={{ marginBottom: 32 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "Inter, sans-serif" }}>
                  Saved Dashboards ({dashboards.length})
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {dashboards
                    .filter(d => !librarySearch || d.name.toLowerCase().includes(librarySearch.toLowerCase()))
                    .map(dash => (
                      <div key={dash.id}
                        onClick={() => { setActiveDashboardId(dash.id); setActiveTab("dashboard"); }}
                        style={{
                          background: "rgba(13,11,46,0.82)", border: "1px solid rgba(0,210,255,0.11)",
                          borderRadius: 14, padding: "16px 18px", cursor: "pointer",
                          transition: "all 0.18s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,210,255,0.35)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(0,210,255,0.11)"}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <LayoutDashboard size={14} style={{ color: "#00D2FF" }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#F0F4FF", fontFamily: "Inter, sans-serif" }}>{dash.name}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: "#475569", fontFamily: "Inter, sans-serif" }}>
                          {dash.widgets.length} widget{dash.widgets.length !== 1 ? "s" : ""}
                        </p>
                        {dash.widgets.slice(0, 2).map((w, i) => (
                          <div key={i} style={{ fontSize: 10, color: "#334155", fontFamily: "Inter, sans-serif", marginTop: 4, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                            · {w.title}
                          </div>
                        ))}
                      </div>
                    ))}
                  <div
                    onClick={createDashboard}
                    style={{
                      background: "transparent", border: "1.5px dashed rgba(0,210,255,0.18)",
                      borderRadius: 14, padding: "16px 18px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "all 0.18s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(0,210,255,0.18)"}
                  >
                    <Plus size={14} style={{ color: "#475569" }} />
                    <span style={{ fontSize: 12, color: "#475569", fontFamily: "Inter, sans-serif" }}>New Dashboard</span>
                  </div>
                </div>
              </section>

              {/* Trending Questions */}
              <section style={{ marginBottom: 32 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "Inter, sans-serif" }}>
                  Trending Questions
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {TRENDING_QUESTIONS
                    .filter(q => !librarySearch || q.toLowerCase().includes(librarySearch.toLowerCase()))
                    .map((q, i) => (
                      <button key={i}
                        onClick={() => { setActiveTab("search"); handleSearch(q); }}
                        style={{
                          background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.2)",
                          borderRadius: 20, padding: "6px 14px", cursor: "pointer",
                          color: "#C4B5FD", fontSize: 12, fontFamily: "Inter, sans-serif",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(167,139,250,0.15)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(167,139,250,0.07)"}
                      >
                        <TrendingUp size={11} style={{ marginRight: 5, verticalAlign: "middle" }} />
                        {q}
                      </button>
                    ))}
                </div>
              </section>

              {/* Recent Queries */}
              {queryHistory.length > 0 && (
                <section>
                  <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "Inter, sans-serif" }}>
                    Recent Queries ({queryHistory.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {queryHistory
                      .filter(h => !librarySearch || h.question.toLowerCase().includes(librarySearch.toLowerCase()))
                      .slice(0, 15)
                      .map(item => (
                        <button key={item.id}
                          onClick={() => { setActiveTab("search"); handleSearch(item.question); }}
                          style={{
                            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 10, padding: "10px 16px", cursor: "pointer",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            transition: "all 0.15s", textAlign: "left",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,210,255,0.05)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                        >
                          <span style={{ fontSize: 13, color: "#cbd5e1", fontFamily: "Inter, sans-serif" }}>{item.question}</span>
                          <span style={{ fontSize: 10, color: "#334155", fontFamily: "Inter, sans-serif", flexShrink: 0, marginLeft: 12 }}>{item.timestamp}</span>
                        </button>
                      ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>

        {/* Clear Confirmation Modal */}
        {clearConfirm && (
          <div style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999,
          }}>
            <div style={{
              background: "#0F1419",
              border: "1px solid rgba(0,210,255,0.3)",
              borderRadius: 16, padding: 32, maxWidth: 380, width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              fontFamily: "Inter, sans-serif",
            }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#F0F4FF" }}>
                Clear {clearConfirm === "pinboard" ? "Pinboard" : clearConfirm === "answers" ? "Answers" : "History"}?
              </h3>
              <p style={{ margin: "0 0 24px", fontSize: 13, color: "#94a3b8" }}>
                This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setClearConfirm(null)} style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8, padding: "8px 16px", cursor: "pointer",
                  color: "#cbd5e1", fontSize: 13, fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}>
                  Cancel
                </button>
                <button onClick={handleClearConfirmed} style={{
                  background: "rgba(244,63,94,0.88)",
                  border: "1px solid rgba(244,63,94,0.5)",
                  borderRadius: 8, padding: "8px 16px", cursor: "pointer",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(244,63,94,1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(244,63,94,0.88)"; }}>
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
