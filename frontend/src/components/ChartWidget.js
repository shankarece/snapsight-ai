import React, { useState, useId } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Brush, Label, LabelList,
  ScatterChart, Scatter, ZAxis,
  ComposedChart,
  Sankey, Treemap,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";
import { Pin, PinOff, Table2, Mail, Code2 } from "lucide-react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO 3166-1 numeric → region name (matches DB region values)
const COUNTRY_TO_REGION = {
  840: "North America", 124: "North America", 304: "North America",
  8: "Europe", 20: "Europe", 40: "Europe", 56: "Europe", 70: "Europe",
  100: "Europe", 112: "Europe", 191: "Europe", 196: "Europe", 203: "Europe",
  208: "Europe", 233: "Europe", 246: "Europe", 276: "Europe", 300: "Europe",
  336: "Europe", 348: "Europe", 352: "Europe", 372: "Europe", 380: "Europe",
  428: "Europe", 438: "Europe", 440: "Europe", 442: "Europe", 470: "Europe",
  492: "Europe", 498: "Europe", 499: "Europe", 528: "Europe", 578: "Europe",
  616: "Europe", 620: "Europe", 642: "Europe", 643: "Europe", 674: "Europe",
  688: "Europe", 703: "Europe", 705: "Europe", 724: "Europe", 752: "Europe",
  756: "Europe", 804: "Europe", 807: "Europe", 826: "Europe",
  4: "Asia Pacific", 36: "Asia Pacific", 50: "Asia Pacific", 64: "Asia Pacific",
  96: "Asia Pacific", 104: "Asia Pacific", 116: "Asia Pacific", 144: "Asia Pacific",
  156: "Asia Pacific", 360: "Asia Pacific", 392: "Asia Pacific", 398: "Asia Pacific",
  408: "Asia Pacific", 410: "Asia Pacific", 417: "Asia Pacific", 418: "Asia Pacific",
  458: "Asia Pacific", 462: "Asia Pacific", 496: "Asia Pacific", 524: "Asia Pacific",
  554: "Asia Pacific", 586: "Asia Pacific", 598: "Asia Pacific", 608: "Asia Pacific",
  626: "Asia Pacific", 702: "Asia Pacific", 704: "Asia Pacific", 762: "Asia Pacific",
  764: "Asia Pacific", 795: "Asia Pacific", 860: "Asia Pacific",
  32: "Latin America", 44: "Latin America", 68: "Latin America", 76: "Latin America",
  84: "Latin America", 152: "Latin America", 170: "Latin America", 188: "Latin America",
  192: "Latin America", 214: "Latin America", 218: "Latin America", 222: "Latin America",
  320: "Latin America", 328: "Latin America", 332: "Latin America", 340: "Latin America",
  388: "Latin America", 484: "Latin America", 558: "Latin America", 591: "Latin America",
  600: "Latin America", 604: "Latin America", 740: "Latin America", 780: "Latin America",
  858: "Latin America", 862: "Latin America",
};

// ── Color palettes ────────────────────────────────────────────────
// Categorical: distinct, high-contrast hues for unordered categories
const CATEGORICAL_PALETTE = [
  "#00D2FF", // cyan
  "#A78BFA", // purple
  "#10B981", // emerald
  "#F59E0B", // amber
  "#F43F5E", // rose
  "#60A5FA", // blue
  "#EC4899", // pink
  "#14B8A6", // teal
  "#FB923C", // orange
  "#818CF8", // indigo
];

// Sequential: single-hue ramps for ordered/time data (light → dark)
const SEQUENTIAL_RAMPS = {
  cyan:   ["#B2F5FF", "#67E8F9", "#22D3EE", "#06B6D4", "#0891B2", "#0E7490", "#155E75"],
  purple: ["#DDD6FE", "#C4B5FD", "#A78BFA", "#8B5CF6", "#7C3AED", "#6D28D9", "#5B21B6"],
  green:  ["#A7F3D0", "#6EE7B7", "#34D399", "#10B981", "#059669", "#047857", "#065F46"],
  blue:   ["#BFDBFE", "#93C5FD", "#60A5FA", "#3B82F6", "#2563EB", "#1D4ED8", "#1E40AF"],
};

// Detect if x-axis represents time/sequential data
function isSequentialDimension(xKey, data) {
  const timeCols = ["month", "quarter", "year", "date", "week", "day", "period"];
  const xLower = (xKey || "").toLowerCase();
  if (timeCols.some(t => xLower.includes(t))) return true;
  // Check if values look like dates or ordered sequences (Q1, Q2, Jan, Feb, 2023-01, etc.)
  if (data && data.length > 1) {
    const first = String(data[0]?.[xKey] || "");
    if (/^\d{4}[-/]/.test(first) || /^Q[1-4]$/i.test(first)) return true;
    if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(first)) return true;
  }
  return false;
}

// Build sequential colors for N data points from a ramp
function getSequentialColors(n, rampName = "cyan") {
  const ramp = SEQUENTIAL_RAMPS[rampName] || SEQUENTIAL_RAMPS.cyan;
  if (n <= ramp.length) {
    // Pick evenly spaced colors from the ramp
    const step = (ramp.length - 1) / Math.max(n - 1, 1);
    return Array.from({ length: n }, (_, i) => ramp[Math.round(i * step)]);
  }
  // More points than ramp — interpolate by repeating the darkest end
  return Array.from({ length: n }, (_, i) => ramp[Math.min(i, ramp.length - 1)]);
}

// Legacy alias for simple access
const COLORS = CATEGORICAL_PALETTE;

// Custom tooltip factory — creates theme-aware tooltip with rich analytics
function makeCustomTooltip(isDark, allData = []) {
  return function CustomTooltip({ active, payload, label, valueFormat }) {
    if (!active || !payload || payload.length === 0) return null;
    const bg = isDark ? "#08062B" : "#FFFFFF";
    const border = isDark ? "rgba(0,210,255,0.28)" : "#E5E7EB";
    const borderLeft = isDark ? "#00D2FF" : "#0052CC";
    const labelColor = isDark ? "#94a3b8" : "#6B7280";
    const valueColor = isDark ? "#F0F4FF" : "#111827";
    const shadowColor = isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.08)";
    const trendColor = isDark ? "#10B981" : "#059669";
    const warningColor = isDark ? "#F59E0B" : "#D97706";

    // Calculate % of total and rank
    const totals = {};
    payload.forEach(entry => {
      const key = entry.name || entry.dataKey;
      totals[key] = (totals[key] || 0) + (Number(entry.value) || 0);
    });

    return (
      <div style={{
        background: bg,
        border: `1px solid ${border}`,
        borderLeft: `3px solid ${borderLeft}`,
        borderRadius: 10,
        padding: "12px 14px",
        boxShadow: `0 8px 40px ${shadowColor}`,
        fontFamily: "Inter, sans-serif",
        minWidth: 160,
      }}>
        {/* Label with trend indicator */}
        {label !== undefined && label !== "" && (
          <div style={{ fontSize: 13, color: labelColor, marginBottom: 8, fontWeight: 700 }}>
            {String(label)}
            {label && label.match(/\d/) && <span style={{ color: trendColor, marginLeft: 4 }}>📈</span>}
          </div>
        )}

        {/* Metrics for each entry */}
        {payload.map((entry, i) => {
          const value = Number(entry.value) || 0;
          const key = entry.name || entry.dataKey;
          const total = totals[key] || value;
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

          return (
            <div key={i} style={{ marginBottom: i < payload.length - 1 ? 8 : 0 }}>
              {/* Main row: color, name, value */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: entry.color || entry.fill || (isDark ? "#00D2FF" : "#0088CC"), flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: labelColor, flex: 1 }}>
                  {entry.name ? String(entry.name).replace(/_/g, " ") : ""}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: valueColor }}>
                  {formatValue(value, valueFormat)}
                </span>
              </div>

              {/* Rich metrics row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 10, color: "#67E8F9", marginLeft: 15 }}>
                <span>📊 {percentage}%</span>
                {value > 1000 && <span style={{ color: warningColor }}>⚠ Large value</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
}

const TOOLTIP_WRAPPER = { zIndex: 9999, outline: "none" };

function formatValue(value, format) {
  if (typeof value !== "number") return value;
  if (format === "currency") {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }
  if (format === "percent") {
    return `${value.toFixed(1)}%`;
  }
  // "number" or default — no dollar sign
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

function RenderChart({ widget, compact, chartHeight: propChartHeight, onDrillDown, theme = "dark" }) {
  // Unique gradient ID prefix per chart instance (avoids SVG ID collisions across multiple charts)
  const uid = useId().replace(/:/g, "_");
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapCenter, setMapCenter] = useState([10, 15]);
  const isDark = theme === "dark";

  const { chart_type, data, chart_config } = widget;
  const config = chart_config || {};
  const xKey = config.x_key || (data && data[0] ? Object.keys(data[0])[0] : "");
  const yKeys = config.y_keys || (data && data[0] ? Object.keys(data[0]).slice(1) : []);
  const valueFormat = config.value_format || "currency";

  // ── Smart color assignment ──
  const isSequential = isSequentialDimension(xKey, data);
  // For multi-metric charts (multiple y_keys), always use categorical palette for the metrics
  // For single-metric charts: categorical x → categorical colors per bar; sequential x → sequential ramp
  const categoricalColors = CATEGORICAL_PALETTE;
  const seqColors = data ? getSequentialColors(data.length, "cyan") : [];
  // "colors" used for metric-level coloring (multi-series lines, grouped bars)
  const colors = categoricalColors;
  const chartHeight = propChartHeight !== undefined ? propChartHeight : (compact ? 200 : 260);
  const CustomTooltip = makeCustomTooltip(isDark, data);
  const axisColor = isDark ? "#475569" : "#4B5563";
  const axisStyle = { fill: axisColor, fontSize: compact ? 13 : 14, fontFamily: "Inter, sans-serif", fontWeight: 500 };

  if (!data || data.length === 0) {
    return (
      <div style={{ height: chartHeight, display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 12 }}>
        No data available
      </div>
    );
  }

  // Shared tooltip renderer — escapes stacking context via wrapperStyle zIndex
  const tip = (vf) => (
    <Tooltip
      wrapperStyle={TOOLTIP_WRAPPER}
      content={<CustomTooltip valueFormat={vf || valueFormat} />}
    />
  );

  const legendStyle = { fontSize: 13, paddingTop: 8, fontFamily: "Inter, sans-serif", color: isDark ? "#94a3b8" : "#6B7280", fontWeight: 500 };

  switch (chart_type) {
    case "bar":
    case "grouped_bar": {
      const useCellColors = yKeys.length === 1;
      const barColors = useCellColors
        ? (isSequential ? seqColors : data.map((_, i) => categoricalColors[i % categoricalColors.length]))
        : null;
      const barSize = data.length > 10 ? 14 : data.length > 6 ? 20 : 32;
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data} margin={{ top: 24, right: 16, left: -4, bottom: data.length > 6 ? 40 : 8 }}>
            <defs>
              {yKeys.length > 1 && colors.slice(0, yKeys.length).map((color, i) => (
                <linearGradient key={i} id={`${uid}bg${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"} vertical={false} />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false}
              interval={0} angle={data.length > 6 ? -35 : 0}
              textAnchor={data.length > 6 ? "end" : "middle"}
              height={data.length > 6 ? 50 : 24} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false}
              tickFormatter={(v) => formatValue(v, valueFormat)} width={52} />
            {tip()}
            {yKeys.length > 1 && <Legend wrapperStyle={legendStyle} />}
            {yKeys.map((key, i) => (
              <Bar key={key} dataKey={key}
                fill={useCellColors ? (barColors?.[0] || "#00D2FF") : `url(#${uid}bg${i})`}
                radius={[5, 5, 0, 0]} barSize={yKeys.length > 1 ? 14 : barSize}
                cursor={onDrillDown ? "pointer" : "default"}
                activeBar={{ fillOpacity: 1, stroke: "rgba(255,255,255,0.25)", strokeWidth: 1 }}
                onClick={(d, idx, e) => { if (!onDrillDown || !d) return; const row = d.payload || d; onDrillDown({ dimension: xKey, value: row[xKey], metric: key }); }}>
                {useCellColors && barColors && barColors.map((color, j) => (
                  <Cell key={j} fill={color} fillOpacity={0.88} />
                ))}
                {!compact && (
                  <LabelList dataKey={key} position="top"
                    formatter={(v) => formatValue(v, valueFormat)}
                    style={{ fontSize: data.length > 8 ? 10 : 12, fill: "#94a3b8", fontFamily: "Inter, sans-serif", fontWeight: 600, pointerEvents: "none" }} />
                )}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case "horizontal_bar": {
      const hBarColors = yKeys.length === 1
        ? data.map((_, i) => categoricalColors[i % categoricalColors.length])
        : null;
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 70, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"} horizontal={false} />
            <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false}
              tickFormatter={(v) => formatValue(v, valueFormat)} />
            <YAxis type="category" dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} width={110} />
            {tip()}
            {yKeys.map((key, i) => (
              <Bar key={key} dataKey={key}
                fill={hBarColors ? (hBarColors[0] || "#00D2FF") : colors[i % colors.length]}
                radius={[0, 5, 5, 0]} barSize={20}
                cursor={onDrillDown ? "pointer" : "default"}
                activeBar={{ fillOpacity: 1, stroke: "rgba(255,255,255,0.2)", strokeWidth: 1 }}
                onClick={(d, idx, e) => { if (!onDrillDown || !d) return; const row = d.payload || d; onDrillDown({ dimension: xKey, value: row[xKey], metric: key }); }}>
                {hBarColors && hBarColors.map((color, j) => (
                  <Cell key={j} fill={color} fillOpacity={0.88} />
                ))}
                <LabelList dataKey={key} position="right"
                  formatter={(v) => formatValue(v, valueFormat)}
                  style={{ fontSize: 12, fill: "#94a3b8", fontFamily: "Inter, sans-serif", fontWeight: 600, pointerEvents: "none" }} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case "line": {
      const lineColors = ["#00D2FF", "#A78BFA", "#10B981", "#F59E0B", "#F43F5E", "#60A5FA"];
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={data} margin={{ top: 16, right: 20, left: -4, bottom: compact ? 8 : 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"} vertical={false} />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} onClick={(e) => { if (e.isTooltipPayload) return; const d = e.payload; if (onDrillDown && d) { const row = d.payload || d; onDrillDown({ dimension: xKey, value: row[xKey], metric: yKeys[0] }); }}} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false}
              tickFormatter={(v) => formatValue(v, valueFormat)} width={52} />
            {tip()}
            {yKeys.length > 1 && <Legend wrapperStyle={legendStyle} />}
            {yKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key}
                stroke={lineColors[i % lineColors.length]} strokeWidth={2.5}
                dot={{ r: 4, fill: "#0D0B2E", stroke: lineColors[i % lineColors.length], strokeWidth: 2, cursor: onDrillDown ? "pointer" : "default" }}
                activeDot={{ r: 7, fill: lineColors[i % lineColors.length], stroke: "#fff", strokeWidth: 2 }}
                onClick={(d, idx, e) => { if (!onDrillDown || !d) return; const row = d.payload || d; onDrillDown({ dimension: xKey, value: row[xKey], metric: key }); }}>
                {!compact && data.length <= 12 && (
                  <LabelList dataKey={key} position="top"
                    formatter={(v) => formatValue(v, valueFormat)}
                    style={{ fontSize: 11, fill: "#94a3b8", fontFamily: "Inter, sans-serif", fontWeight: 600, pointerEvents: "none" }} />
                )}
              </Line>
            ))}
            {!compact && data.length > 6 && (
              <Brush dataKey={xKey} height={18} stroke="rgba(0,210,255,0.2)" fill="rgba(8,6,43,0.9)"
                travellerWidth={6} tickFormatter={() => ""} />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    case "area":
    case "stacked_area": {
      const areaColors = ["#00D2FF", "#A78BFA", "#10B981", "#F59E0B", "#F43F5E", "#60A5FA"];
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={data} margin={{ top: 16, right: 20, left: -4, bottom: compact ? 8 : 30 }}>
            <defs>
              {yKeys.map((key, i) => (
                <linearGradient key={i} id={`${uid}ag${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={areaColors[i % areaColors.length]} stopOpacity={0.4} />
                  <stop offset="90%" stopColor={areaColors[i % areaColors.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"} vertical={false} />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false}
              tickFormatter={(v) => formatValue(v, valueFormat)} width={52} />
            {tip()}
            {yKeys.length > 1 && <Legend wrapperStyle={legendStyle} />}
            {yKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key}
                stackId={chart_type === "stacked_area" ? "1" : undefined}
                stroke={areaColors[i % areaColors.length]}
                fill={`url(#${uid}ag${i})`}
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#0D0B2E", stroke: areaColors[i % areaColors.length], strokeWidth: 2, cursor: onDrillDown ? "pointer" : "default" }}
                activeDot={{ r: 6, fill: areaColors[i % areaColors.length], stroke: "#fff", strokeWidth: 2 }}
                onClick={(d, idx, e) => { if (!onDrillDown || !d) return; const row = d.payload || d; onDrillDown({ dimension: xKey, value: row[xKey], metric: key }); }} />
            ))}
            {!compact && data.length > 6 && (
              <Brush dataKey={xKey} height={18} stroke="rgba(0,210,255,0.2)" fill="rgba(8,6,43,0.9)"
                travellerWidth={6} tickFormatter={() => ""} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    case "pie": {
      const pieKey = yKeys[0] || "value";
      const RADIAN = Math.PI / 180;
      const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) => {
        const radius = outerRadius + 22;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
          <text x={x} y={y} fill="#94a3b8" textAnchor={x > cx ? "start" : "end"}
            dominantBaseline="central" fontSize={12} fontFamily="Inter, sans-serif" fontWeight={600}>
            {`${name}: ${formatValue(value, valueFormat)}`}
          </text>
        );
      };
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%"
              outerRadius={compact ? 68 : 82}
              paddingAngle={3} dataKey={pieKey} nameKey={xKey}
              label={compact ? false : renderLabel}
              labelLine={!compact}
              cursor={onDrillDown ? "pointer" : "default"}
              onClick={(d, idx, e) => { if (!onDrillDown || !d) return; const row = d.payload || d; onDrillDown({ dimension: xKey, value: row[xKey] || d.name, metric: pieKey }); }}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#08062B" strokeWidth={2} />
              ))}
            </Pie>
            {tip()}
            <Legend wrapperStyle={legendStyle} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    case "donut": {
      const donutKey = yKeys[0] || "value";
      const total = data.reduce((s, d) => s + (Number(d[donutKey]) || 0), 0);
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%"
              innerRadius={compact ? 46 : 60} outerRadius={compact ? 72 : 90}
              paddingAngle={3} dataKey={donutKey} nameKey={xKey}
              cursor={onDrillDown ? "pointer" : "default"}
              onClick={(d, idx, e) => { if (!onDrillDown || !d) return; const row = d.payload || d; onDrillDown({ dimension: xKey, value: row[xKey] || d.name, metric: donutKey }); }}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#08062B" strokeWidth={2} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (!viewBox) return null;
                  const { cx, cy } = viewBox;
                  return (
                    <g>
                      <text x={cx} y={cy - 8} textAnchor="middle"
                        fill="#00D2FF" fontSize={compact ? 20 : 26} fontWeight={800}
                        fontFamily="Inter, sans-serif">
                        {formatValue(total, valueFormat)}
                      </text>
                      <text x={cx} y={cy + 14} textAnchor="middle"
                        fill="#64748b" fontSize={12} fontWeight={600} fontFamily="Inter, sans-serif">
                        Total
                      </text>
                    </g>
                  );
                }}
                position="center"
              />
            </Pie>
            {tip()}
            <Legend wrapperStyle={legendStyle} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    case "funnel": {
      // Funnel as horizontal bar chart with drop-off percentage insights
      const funnelKey = yKeys[0] || "count";
      const firstValue = data[0] ? data[0][funnelKey] : 1;

      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data} layout="vertical" margin={{ top: 20, right: 200, left: 120, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"} />
            <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis dataKey={xKey} type="category" tick={axisStyle} axisLine={false} tickLine={false} width={100} />
            {tip()}
            <Bar dataKey={funnelKey} fill="#00D2FF" onClick={(d) => onDrillDown && onDrillDown({ dimension: xKey, value: d[xKey], metric: funnelKey })} cursor={onDrillDown ? "pointer" : "default"}>
              <LabelList
                dataKey={funnelKey}
                position="right"
                formatter={(val, props) => {
                  const pct = ((val / firstValue) * 100).toFixed(0);
                  const prev = data[props.index - 1];
                  const dropoff = prev ? (((prev[funnelKey] - val) / prev[funnelKey] * 100).toFixed(0)) : 0;
                  return dropoff > 0 ? `${formatValue(val, valueFormat)} (${pct}%, -${dropoff}%)` : `${formatValue(val, valueFormat)} (${pct}%)`;
                }}
                fontSize={12}
                fill={isDark ? "#94a3b8" : "#6B7280"}
              />
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case "kpi": {
      // Compute period-over-period trend from time-series data if available
      const kpiMetric = yKeys[0];
      let trendPct = null;
      if (data && data.length >= 2 && kpiMetric) {
        const last = Number(data[data.length - 1]?.[kpiMetric]) || 0;
        const prev = Number(data[data.length - 2]?.[kpiMetric]) || 0;
        if (prev !== 0) trendPct = ((last - prev) / Math.abs(prev)) * 100;
      }
      const sparkData = data && data.length > 2 && kpiMetric
        ? data.map(d => ({ v: Number(d[kpiMetric]) || 0 }))
        : null;
      const trendUp = trendPct !== null && trendPct >= 0;

      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", height: compact ? 160 : 210, gap: 8,
          cursor: onDrillDown ? "pointer" : "default",
          transition: "opacity 0.15s",
        }}
        onClick={() => onDrillDown && data.length > 0 && onDrillDown({ dimension: xKey, value: data[data.length - 1]?.[xKey], metric: yKeys[0] })}
        onMouseEnter={(e) => { if (onDrillDown) e.currentTarget.style.opacity = "0.75"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
          <div style={{
            fontSize: compact ? 40 : 54, fontWeight: 800,
            background: "linear-gradient(135deg, #00D2FF 0%, #A78BFA 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", letterSpacing: "-0.04em", lineHeight: 1,
            fontFamily: "Inter, sans-serif",
          }}>
            {formatValue(config.value || 0, valueFormat)}
          </div>
          <div style={{
            fontSize: 13, color: "#64748b", letterSpacing: "0.06em",
            textTransform: "uppercase", fontFamily: "Inter, sans-serif", fontWeight: 600,
          }}>
            {config.kpi_label || config.label || ""}
          </div>

          {/* Trend badge */}
          {trendPct !== null && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 14px", borderRadius: 20,
              background: trendUp ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
              border: `1px solid ${trendUp ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)"}`,
            }}>
              <span style={{ fontSize: 15, color: trendUp ? "#10B981" : "#F43F5E" }}>
                {trendUp ? "↑" : "↓"}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif",
                color: trendUp ? "#10B981" : "#F43F5E" }}>
                {Math.abs(trendPct).toFixed(1)}% vs prior
              </span>
            </div>
          )}

          {/* Sparkline */}
          {sparkData && (
            <div style={{ width: "75%", height: 34 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData} margin={{ top: 2, right: 4, left: 4, bottom: 2 }}>
                  <Line type="monotone" dataKey="v" stroke="#00D2FF"
                    strokeWidth={1.8} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{
            width: 52, height: 3, borderRadius: 2,
            background: "linear-gradient(90deg, #00D2FF, #A78BFA)",
            boxShadow: "0 0 10px rgba(0,210,255,0.4)",
          }} />
        </div>
      );
    }

    case "table": {
      return <DataTable widget={widget} chartHeight={chartHeight} />;
    }

    case "geo_map": {
      const metricKey = yKeys[0];
      const regionData = {};
      data.forEach(row => { if (row[xKey]) regionData[row[xKey]] = row; });
      const values = data.map(r => Number(r[metricKey]) || 0);
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);

      const getRegionColor = (region) => {
        if (!region || !regionData[region]) return "#0D0B2E";
        const val = Number(regionData[region][metricKey]) || 0;
        const t = maxVal > minVal ? (val - minVal) / (maxVal - minVal) : 1;
        // Interpolate dark navy → cyan
        const r = Math.round(13 + t * (0 - 13));
        const g = Math.round(11 + t * (210 - 11));
        const b = Math.round(46 + t * (255 - 46));
        return `rgb(${r},${g},${b})`;
      };

      return (
        <div style={{ position: "relative", width: "100%", height: chartHeight, display: "flex", flexDirection: "column" }}>
          <ComposableMap projectionConfig={{ scale: compact ? 90 : 110 }} style={{ width: "100%", flex: 1 }}>
            <ZoomableGroup zoom={mapZoom} center={mapCenter}
              onMoveEnd={({ coordinates, zoom }) => { setMapCenter(coordinates); setMapZoom(zoom); }}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const region = COUNTRY_TO_REGION[parseInt(geo.id)];
                    return (
                      <Geography key={geo.rsmKey} geography={geo}
                        fill={getRegionColor(region)} stroke="#08062B" strokeWidth={0.4}
                        onMouseEnter={() => region && setHoveredRegion(region)}
                        onMouseLeave={() => setHoveredRegion(null)}
                        onClick={() => region && onDrillDown && onDrillDown({ dimension: "region", value: region, metric: metricKey })}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: region ? "#A78BFA" : "#1a1a3e", outline: "none", cursor: region ? "pointer" : "default" },
                          pressed: { outline: "none" },
                        }} />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* Zoom controls */}
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", flexDirection: "column", gap: 4, zIndex: 10 }}>
            {[
              { label: "+", fn: () => setMapZoom(z => Math.min(z * 1.5, 10)) },
              { label: "−", fn: () => setMapZoom(z => Math.max(z / 1.5, 1)) },
              { label: "↺", fn: () => { setMapZoom(1); setMapCenter([10, 15]); } },
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn} style={{
                width: 28, height: 28, borderRadius: 6,
                border: "1px solid rgba(0,210,255,0.28)",
                background: "rgba(8,6,43,0.92)", color: "#00D2FF", cursor: "pointer",
                fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
              }}>{label}</button>
            ))}
          </div>

          {hoveredRegion && regionData[hoveredRegion] && (
            <div style={{
              position: "absolute", top: 8, left: 8, zIndex: 10,
              background: "rgba(8,6,43,0.97)", border: "1px solid rgba(0,210,255,0.22)",
              borderLeft: "3px solid #00D2FF",
              borderRadius: 8, padding: "8px 12px", pointerEvents: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#00D2FF", marginBottom: 4, fontFamily: "Inter, sans-serif" }}>
                {hoveredRegion}
              </div>
              {yKeys.map(k => (
                <div key={k} style={{ fontSize: 10, color: "#e2e8f0", fontFamily: "Inter, sans-serif" }}>
                  {k.replace(/_/g, " ")}: <strong>{formatValue(Number(regionData[hoveredRegion][k]), valueFormat)}</strong>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", gap: compact ? 8 : 14, flexWrap: "wrap", marginTop: 6 }}>
            {data.map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: 2,
                  background: getRegionColor(row[xKey]),
                  border: "1px solid rgba(255,255,255,0.12)",
                }} />
                <span style={{ fontSize: 9, color: hoveredRegion === row[xKey] ? "#00D2FF" : "#475569", fontFamily: "Inter, sans-serif" }}>
                  {row[xKey]}: <strong style={{ color: "#e2e8f0" }}>{formatValue(Number(row[metricKey]), valueFormat)}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "scatter": {
      const scatterData = data.slice(0, 100); // Limit to 100 points for performance
      const xMetric = yKeys[0] || "value";
      const yMetric = yKeys[1] || yKeys[0] || "value";
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ScatterChart margin={{ top: 20, right: 20, left: 60, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"} />
            <XAxis type="number" dataKey={xMetric} name={xMetric.replace(/_/g, " ")} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis type="number" dataKey={yMetric} name={yMetric.replace(/_/g, " ")} tick={axisStyle} axisLine={false} tickLine={false} />
            {tip()}
            <Scatter data={scatterData} fill="#00D2FF" fillOpacity={0.8} name={yMetric}>
              {scatterData.map((entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.7} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    case "bubble": {
      const bubbleData = data.slice(0, 50);
      const xMetric = yKeys[0] || "value";
      const yMetric = yKeys[1] || yKeys[0] || "value";
      const sizeMetric = yKeys[2] || yKeys[1] || yKeys[0];
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ScatterChart margin={{ top: 20, right: 20, left: 60, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"} />
            <XAxis type="number" dataKey={xMetric} name={xMetric.replace(/_/g, " ")} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis type="number" dataKey={yMetric} name={yMetric.replace(/_/g, " ")} tick={axisStyle} axisLine={false} tickLine={false} />
            <ZAxis type="number" dataKey={sizeMetric} range={[40, 400]} name={sizeMetric.replace(/_/g, " ")} />
            {tip()}
            <Scatter data={bubbleData} fill="#A78BFA" fillOpacity={0.6} name={yMetric}>
              {bubbleData.map((entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.6} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    case "heatmap": {
      if (!xKey || !yKeys || yKeys.length === 0) {
        return <div style={{ color: "#475569", padding: 20, textAlign: "center", fontSize: 12 }}>Invalid data format for heatmap</div>;
      }
      const uniqueX = [...new Set(data.map(d => String(d[xKey])))];
      const uniqueY = [...new Set(data.map(d => Object.keys(d).filter(k => k !== xKey && k !== "id")[0]).filter(Boolean))];
      const heatmapData = data;
      const values = heatmapData.map(d => Number(d[yKeys[0]]) || 0).filter(v => !isNaN(v));
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const interpolateColor = (val) => {
        const norm = (val - minVal) / (maxVal - minVal || 1);
        const dark = [13, 11, 46];
        const cyan = [0, 210, 255];
        return `rgb(${Math.round(dark[0] + (cyan[0] - dark[0]) * norm)},${Math.round(dark[1] + (cyan[1] - dark[1]) * norm)},${Math.round(dark[2] + (cyan[2] - dark[2]) * norm)})`;
      };
      return (
        <div style={{ padding: 16, overflowX: "auto", height: chartHeight }}>
          <table style={{ borderCollapse: "collapse", fontSize: 11, fontFamily: "Inter, sans-serif" }}>
            <tbody>
              {heatmapData.slice(0, 20).map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: 8, color: "#94a3b8", textAlign: "right", minWidth: 60, fontWeight: 600, fontSize: 10 }}>{row[xKey]}</td>
                  {yKeys.map((key, j) => {
                    const val = Number(row[key]) || 0;
                    return (
                      <td key={j} style={{ width: 50, height: 40, background: interpolateColor(val), padding: 4, textAlign: "center", color: "#fff", fontSize: 10, fontWeight: 600, border: `1px solid rgba(0,0,0,0.1)`, cursor: "default" }}>
                        {formatValue(val, valueFormat)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "gauge": {
      const value = Number(data?.[0]?.[yKeys[0]] || 0);
      const max = Number(config.max || 100);
      const kpiLabel = config.kpi_label || yKeys[0];
      const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
      const color = percentage < 33 ? "#EF4444" : percentage < 67 ? "#F59E0B" : "#10B981";
      return (
        <div style={{ height: chartHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="240" height="160" style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id={`${uid}gaugeGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
            {/* Background arc */}
            <path d="M 30 120 A 90 90 0 0 1 210 120" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
            {/* Filled arc */}
            <path d={`M 30 120 A 90 90 0 0 1 ${30 + Math.min(180 * (percentage / 100), 180)} ${120 - (Math.sin(Math.PI * (percentage / 100)) * 90)}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
            {/* Center label */}
            <text x="120" y="110" textAnchor="middle" fontSize="32" fontWeight="700" fill="#00D2FF" fontFamily="Inter, sans-serif">
              {formatValue(value, valueFormat)}
            </text>
            <text x="120" y="140" textAnchor="middle" fontSize="12" fill="#94a3b8" fontFamily="Inter, sans-serif">
              {kpiLabel}
            </text>
          </svg>
        </div>
      );
    }

    case "waterfall": {
      const waterfallData = data.map((d, i) => {
        const val = Number(d[yKeys[0]] || 0);
        return {
          ...d,
          value: val,
          delta: val,
        };
      });
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={waterfallData} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"} vertical={false} />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            {tip()}
            <Bar dataKey="value" fill="none" radius={[5, 5, 0, 0]}>
              {waterfallData.map((entry, i) => (
                <Cell key={i} fill={entry.value >= 0 ? "#10B981" : "#F43F5E"} />
              ))}
              <LabelList dataKey="delta" position="top" formatter={(v) => formatValue(v, valueFormat)} style={{ fontSize: 11, fill: "#94a3b8", fontFamily: "Inter, sans-serif", fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case "combo": {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={data} margin={{ top: 20, right: 80, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"} vertical={false} />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={axisStyle} axisLine={false} tickLine={false} />
            {yKeys.length > 1 && <YAxis yAxisId="right" orientation="right" tick={axisStyle} axisLine={false} tickLine={false} />}
            {tip()}
            <Legend wrapperStyle={legendStyle} />
            {yKeys.length > 0 && (
              <Bar yAxisId="left" dataKey={yKeys[0]} fill="#00D2FF" fillOpacity={0.88} radius={[5, 5, 0, 0]} />
            )}
            {yKeys.length > 1 && (
              <Line yAxisId="right" type="monotone" dataKey={yKeys[1]} stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4, fill: "#F59E0B" }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    case "sankey": {
      const uniqueNodes = [];
      const nodeMap = {};
      const links = [];
      data.slice(0, 20).forEach(row => {
        const source = String(row[xKey]);
        const target = String(row[yKeys[0]]);
        const value = Number(row[yKeys[1]] || 1);
        if (!nodeMap[source]) {
          nodeMap[source] = { name: source };
          uniqueNodes.push(nodeMap[source]);
        }
        if (!nodeMap[target]) {
          nodeMap[target] = { name: target };
          uniqueNodes.push(nodeMap[target]);
        }
        links.push({
          source: uniqueNodes.findIndex(n => n.name === source),
          target: uniqueNodes.findIndex(n => n.name === target),
          value,
        });
      });
      const sankeyData = { nodes: uniqueNodes, links };
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <Sankey data={sankeyData} node={{ fill: "#00D2FF", fillOpacity: 0.8 }} link={{ stroke: "rgba(0,210,255,0.15)", strokeOpacity: 0.5 }} margin={{ top: 20, right: 160, left: 20, bottom: 20 }}>
            <Tooltip content={<CustomTooltip valueFormat={valueFormat} />} wrapperStyle={TOOLTIP_WRAPPER} />
          </Sankey>
        </ResponsiveContainer>
      );
    }

    case "treemap": {
      const treemapData = data.slice(0, 50).map((d, i) => ({
        name: String(d[xKey]),
        size: Math.max(Number(d[yKeys[0]]) || 0, 1),
      }));
      const TreemapContent = (props) => {
        const { x, y, width, height, name, size } = props;
        if (width < 40 || height < 20) return null;
        return (
          <g>
            <rect x={x} y={y} width={width} height={height} fill={COLORS[Math.floor(Math.random() * COLORS.length)]} fillOpacity={0.8} stroke="rgba(0,0,0,0.1)" />
            <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={600} fill="#fff" fontFamily="Inter, sans-serif" overflow="hidden" style={{ pointerEvents: "none" }}>
              {name.length > 10 ? name.substring(0, 10) + "..." : name}
            </text>
          </g>
        );
      };
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <Treemap data={treemapData} dataKey="size" fill="#8884d8" content={<TreemapContent />} stroke="rgba(0,0,0,0.1)" />
        </ResponsiveContainer>
      );
    }

    default:
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data} margin={{ top: 24, right: 16, left: -4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"} vertical={false} />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false}
              tickFormatter={(v) => formatValue(v, valueFormat)} width={52} />
            {tip()}
            {yKeys.map((key, i) => (
              <Bar key={key} dataKey={key}
                fill={categoricalColors[i % categoricalColors.length]}
                fillOpacity={0.88} radius={[5, 5, 0, 0]}
                cursor={onDrillDown ? "pointer" : "default"}
                activeBar={{ fillOpacity: 1 }}
                onClick={(d, idx, e) => { if (!onDrillDown || !d) return; const row = d.payload || d; onDrillDown({ dimension: xKey, value: row[xKey], metric: key }); }}>
                <LabelList dataKey={key} position="top"
                  formatter={(v) => formatValue(v, valueFormat)}
                  style={{ fontSize: 12, fill: "#94a3b8", fontFamily: "Inter, sans-serif", fontWeight: 600, pointerEvents: "none" }} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
  }
}

// ── Data Table ────────────────────────────────────────────────────
function DataTable({ widget, chartHeight }) {
  const { data, columns, chart_config } = widget;
  const tableFormat = (chart_config || {}).value_format || "currency";
  if (!data || !columns || data.length === 0) {
    return <div style={{ color: "#334155", padding: 20, textAlign: "center", fontSize: 12 }}>No data</div>;
  }
  const displayData = data.slice(0, 50);
  const remaining = data.length - displayData.length;
  const h = typeof chartHeight === "number" ? chartHeight : 260;

  return (
    <div style={{ height: h, overflowY: "auto", borderRadius: 10 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ position: "sticky", top: 0, background: "rgba(8,6,43,0.99)", zIndex: 1 }}>
            {columns.map(col => (
              <th key={col} style={{
                padding: "11px 14px", textAlign: "left", color: "#64748B",
                fontWeight: 700, fontSize: 13, textTransform: "uppercase",
                letterSpacing: "0.08em", borderBottom: "1px solid rgba(0,210,255,0.15)",
                whiteSpace: "nowrap", fontFamily: "Inter, sans-serif",
              }}>{col.replace(/_/g, " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, i) => (
            <tr key={i}
              style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,210,255,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"}
            >
              {columns.map(col => (
                <td key={col} style={{
                  padding: "9px 14px", color: "#e2e8f0", fontSize: 13, fontWeight: 500,
                  borderBottom: "1px solid rgba(255,255,255,0.04)", whiteSpace: "nowrap",
                  fontFamily: "Inter, sans-serif",
                }}>
                  {typeof row[col] === "number" ? formatValue(row[col], tableFormat) : String(row[col] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {remaining > 0 && (
        <div style={{ padding: "8px 12px", fontSize: 10, color: "#334155", textAlign: "center", fontFamily: "Inter, sans-serif" }}>
          + {remaining} more rows
        </div>
      )}
    </div>
  );
}

// ── ChartWidget ───────────────────────────────────────────────────
export default function ChartWidget({ widget, onPin, isPinned, compact = false, fillHeight = false, onDrillDown, isSelected = false, theme = "dark" }) {
  const [showSQL, setShowSQL] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const isDark = theme === "dark";
  const cardBg = isDark ? "rgba(13,11,46,0.82)" : "#FFFFFF";
  const badgeBg = isDark ? "rgba(0,210,255,0.08)" : "#EEF2FF";
  const badgeColor = isDark ? "#67E8F9" : "#0052CC";
  const selectBorder = isDark ? "rgba(0,210,255,0.55)" : "#0052CC";
  const normalBorder = isDark ? "rgba(0,210,255,0.11)" : "#E5E7EB";

  return (
    <div
      className="chart-card"
      style={{
        background: cardBg,
        border: `1px solid ${normalBorder}`,
        borderRadius: 8, padding: compact ? 16 : 20,
        position: "relative",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        ...(fillHeight && { height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box", overflow: "hidden" }),
      }}
    >
      {/* Chart type badge */}
      {widget.label && (
        <div style={{
          position: "absolute", top: 14, right: 14,
          background: badgeBg, border: `1px solid ${isDark ? "rgba(0,210,255,0.18)" : "rgba(0,136,204,0.18)"}`,
          borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 600,
          color: badgeColor, letterSpacing: "0.04em", textTransform: "uppercase",
          fontFamily: "Inter, sans-serif",
        }}>
          {widget.label}
        </div>
      )}

      {/* Header / drag handle */}
      <div
        className={fillHeight ? "widget-drag-handle" : undefined}
        style={{
          marginBottom: 12, paddingRight: widget.label ? 100 : 0,
          cursor: fillHeight ? "grab" : "default",
          userSelect: fillHeight ? "none" : undefined,
        }}
      >
        {fillHeight && (
          <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(0,210,255,0.22)" }} />
                <div style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(0,210,255,0.22)" }} />
              </div>
            ))}
          </div>
        )}
        <h3 style={{
          margin: 0, fontSize: compact ? 16 : 18, fontWeight: 700,
          color: isDark ? "#F0F4FF" : "#111827", letterSpacing: "-0.02em", fontFamily: "Inter, sans-serif",
        }}>
          {widget.title}
        </h3>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: isDark ? "#334155" : "#6B7280", fontFamily: "Inter, sans-serif" }}>
          {widget.subtitle}
        </p>
      </div>

      {/* SQL panel */}
      {showSQL && (
        <div style={{
          background: "rgba(0,0,0,0.45)", borderRadius: 10, padding: "12px 16px", marginBottom: 12,
          border: "1px solid rgba(0,210,255,0.14)",
          fontFamily: "'Cascadia Code', 'Consolas', 'Courier New', monospace",
          fontSize: 11, color: "#67E8F9", lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre-wrap",
        }}>
          <div style={{ color: "#334155", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Generated SQL
          </div>
          {widget.sql}
        </div>
      )}

      {/* Chart or table */}
      <div style={fillHeight ? { flex: 1, minHeight: 0, overflow: "hidden" } : {}}>
        {showTable ? (
          <DataTable widget={widget} chartHeight={fillHeight ? 300 : (compact ? 200 : 260)} />
        ) : (
          <RenderChart
            widget={widget}
            compact={compact}
            chartHeight={fillHeight ? "100%" : undefined}
            onDrillDown={onDrillDown}
            theme={theme}
          />
        )}
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => { setShowSQL(!showSQL); setShowTable(false); }}
            style={{
              background: showSQL ? "rgba(0,210,255,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${showSQL ? "rgba(0,210,255,0.25)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 8, padding: "5px 12px", cursor: "pointer",
              color: showSQL ? "#67E8F9" : "#334155",
              display: "flex", alignItems: "center", gap: 5, fontSize: 11,
              fontFamily: "Inter, sans-serif", transition: "all 0.2s",
            }}>
            <Code2 size={12} /> Query
          </button>
          <button onClick={() => { setShowTable(!showTable); setShowSQL(false); }}
            style={{
              background: showTable ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${showTable ? "rgba(167,139,250,0.25)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 8, padding: "5px 12px", cursor: "pointer",
              color: showTable ? "#C4B5FD" : "#334155",
              display: "flex", alignItems: "center", gap: 5, fontSize: 11,
              fontFamily: "Inter, sans-serif", transition: "all 0.2s",
            }}>
            <Table2 size={12} /> Table
          </button>
        </div>

        {isPinned && (
          <button onClick={() => {
            const subject = encodeURIComponent(`SnapSight: ${widget.title}`);
            const dataStr = (widget.data || []).slice(0, 10).map(r => Object.values(r).join(", ")).join("\n");
            const body = encodeURIComponent(
              `Chart: ${widget.title}\n${widget.subtitle || ""}\n\nInsight:\n${widget.insight || ""}\n\nData (first 10 rows):\n${dataStr}`
            );
            window.open(`mailto:?subject=${subject}&body=${body}`);
          }}
          style={{
            background: "rgba(167,139,250,0.12)",
            border: "1px solid rgba(167,139,250,0.25)",
            borderRadius: 8, padding: "5px 12px", cursor: "pointer",
            color: "#C4B5FD",
            display: "flex", alignItems: "center", gap: 5, fontSize: 11,
            fontFamily: "Inter, sans-serif", transition: "all 0.2s",
          }}>
            <Mail size={12} /> Share
          </button>
        )}
        <button onClick={() => onPin(widget)}
          style={{
            background: isPinned
              ? "rgba(16,185,129,0.12)"
              : "linear-gradient(135deg, #00D2FF, #0088CC)",
            border: isPinned ? "1px solid rgba(16,185,129,0.3)" : "none",
            borderRadius: 10, padding: "6px 18px", cursor: "pointer",
            color: isPinned ? "#34D399" : "#08062B",
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 700, fontFamily: "Inter, sans-serif",
            boxShadow: isPinned ? "none" : "0 2px 14px rgba(0,210,255,0.4)",
            transition: "all 0.2s",
          }}>
          {isPinned ? <><PinOff size={12} /> Unpin</> : <><Pin size={12} /> Pin to Dashboard</>}
        </button>
      </div>
    </div>
  );
}
