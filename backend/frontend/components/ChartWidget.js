import React, { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts";
import { Pin, PinOff, Database, X } from "lucide-react";

const COLORS = ["#f97316", "#0ea5e9", "#10b981", "#8b5cf6", "#f43f5e", "#fbbf24"];

const tooltipStyle = {
  background: "#1a1a2e",
  border: "1px solid rgba(249,115,22,0.2)",
  borderRadius: 10,
  color: "#e2e8f0",
  fontSize: 11,
  boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
};

function formatValue(value) {
  if (typeof value !== "number") return value;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return value % 1 === 0 ? value.toString() : `$${value.toFixed(0)}`;
}

function RenderChart({ widget, compact }) {
  const { chart_type, data, chart_config } = widget;
  const config = chart_config || {};
  const xKey = config.x_key || (data && data[0] ? Object.keys(data[0])[0] : "");
  const yKeys = config.y_keys || (data && data[0] ? Object.keys(data[0]).slice(1) : []);
  const colors = config.colors && config.colors.length >= yKeys.length ? config.colors : COLORS;
  const chartHeight = compact ? 200 : 250;
  const axisStyle = { fill: "#94a3b8", fontSize: compact ? 10 : 11 };

  if (!data || data.length === 0) {
    return <div style={{ height: chartHeight, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>No data</div>;
  }

  switch (chart_type) {
    case "bar":
    case "grouped_bar":
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} interval={0} angle={data.length > 6 ? -30 : 0} textAnchor={data.length > 6 ? "end" : "middle"} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={formatValue} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatValue(v)]} />
            {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />}
            {yKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[5, 5, 0, 0]} barSize={yKeys.length > 1 ? 16 : 28} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case "horizontal_bar":
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={formatValue} />
            <YAxis type="category" dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} width={100} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatValue(v)]} />
            {yKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[0, 5, 5, 0]} barSize={20} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case "line":
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={formatValue} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatValue(v)]} />
            {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />}
            {yKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]}
                strokeWidth={2.5} dot={{ r: 3, fill: colors[i % colors.length], stroke: "#1a1a2e", strokeWidth: 2 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );

    case "area":
    case "stacked_area":
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={formatValue} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatValue(v)]} />
            {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />}
            {yKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key}
                stackId={chart_type === "stacked_area" ? "1" : undefined}
                stroke={colors[i % colors.length]} fill={colors[i % colors.length]}
                fillOpacity={0.2} strokeWidth={2} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );

    case "pie":
      const pieKey = yKeys[0] || "value";
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={compact ? 70 : 85}
              paddingAngle={3} dataKey={pieKey}
              label={compact ? false : ({ [xKey]: name, [pieKey]: value }) => `${name} (${formatValue(value)})`}
              labelLine={compact ? false : { stroke: "#64748b", strokeWidth: 1 }}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.3)" />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatValue(v)]} />
            {compact && <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />}
          </PieChart>
        </ResponsiveContainer>
      );

    case "donut":
      const donutKey = yKeys[0] || "value";
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={compact ? 40 : 55} outerRadius={compact ? 70 : 85}
              paddingAngle={4} dataKey={donutKey}
              label={compact ? false : ({ [xKey]: name, [donutKey]: value }) => `${name} (${formatValue(value)})`}
              labelLine={compact ? false : { stroke: "#64748b", strokeWidth: 1 }}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.3)" />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatValue(v)]} />
            {compact && <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />}
          </PieChart>
        </ResponsiveContainer>
      );

    case "funnel":
      const funnelKey = yKeys[0] || "count";
      const maxVal = data[0] ? data[0][funnelKey] : 1;
      return (
        <div style={{ padding: "12px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
          {data.map((item, i) => {
            const widthPct = Math.max(15, (item[funnelKey] / maxVal) * 100);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, color: "#94a3b8", width: 80, textAlign: "right", flexShrink: 0 }}>{item[xKey]}</span>
                <div style={{ flex: 1, height: 28 }}>
                  <div style={{
                    width: `${widthPct}%`, height: "100%", borderRadius: 5,
                    background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}88)`,
                    display: "flex", alignItems: "center", paddingLeft: 10, minWidth: 60,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#fff" }}>{formatValue(item[funnelKey])}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );

    case "kpi":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: compact ? 160 : 200 }}>
          <span style={{ fontSize: compact ? 36 : 48, fontWeight: 700, color: "#f97316" }}>
            {formatValue(config.value || 0)}
          </span>
          <span style={{ fontSize: 13, color: "#94a3b8", marginTop: 8 }}>
            {config.kpi_label || config.label || ""}
          </span>
        </div>
      );

    default:
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={formatValue} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatValue(v)]} />
            {yKeys.map((key, i) => <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[5, 5, 0, 0]} />)}
          </BarChart>
        </ResponsiveContainer>
      );
  }
}

export default function ChartWidget({ widget, onPin, isPinned, compact = false }) {
  const [showSQL, setShowSQL] = useState(false);

  return (
    <div style={{
      background: "linear-gradient(160deg, rgba(26,26,46,0.97), rgba(15,15,35,0.99))",
      border: isPinned ? "1px solid rgba(249,115,22,0.4)" : "1px solid rgba(255,255,255,0.06)",
      borderRadius: 16, padding: compact ? 16 : 20, position: "relative",
      transition: "all 0.3s ease",
      boxShadow: isPinned ? "0 0 25px rgba(249,115,22,0.1)" : "0 4px 20px rgba(0,0,0,0.3)",
    }}>
      {/* Chart Type Label */}
      {widget.label && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)",
          borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 600,
          color: "#fb923c", letterSpacing: "0.02em",
        }}>
          {widget.label}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 10, paddingRight: widget.label ? 100 : 0 }}>
        <h3 style={{ margin: 0, fontSize: compact ? 13 : 15, fontWeight: 700, color: "#e2e8f0" }}>
          {widget.title}
        </h3>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#94a3b8" }}>{widget.subtitle}</p>
      </div>

      {/* SQL Panel */}
      {showSQL && (
        <div style={{
          background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: "10px 14px", marginBottom: 10,
          border: "1px solid rgba(249,115,22,0.2)",
          fontFamily: "'Consolas', 'Courier New', monospace",
          fontSize: 10, color: "#fb923c", lineHeight: 1.6, overflowX: "auto", whiteSpace: "pre-wrap",
        }}>
          <span style={{ color: "#f97316", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Generated SQL</span>
          <div style={{ marginTop: 4 }}>{widget.sql}</div>
        </div>
      )}

      {/* Chart */}
      <RenderChart widget={widget} compact={compact} />

      {/* Action Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <button onClick={() => setShowSQL(!showSQL)}
          style={{
            background: showSQL ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7,
            padding: "5px 12px", cursor: "pointer",
            color: showSQL ? "#fb923c" : "#64748b",
            display: "flex", alignItems: "center", gap: 5, fontSize: 11,
          }}>
          <Database size={12} /> SQL
        </button>

        <button onClick={() => onPin(widget)}
          style={{
            background: isPinned ? "rgba(249,115,22,0.2)" : "linear-gradient(135deg, #f97316, #ea580c)",
            border: isPinned ? "1px solid rgba(249,115,22,0.4)" : "none",
            borderRadius: 8, padding: "6px 16px", cursor: "pointer",
            color: "white", display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 600,
            boxShadow: isPinned ? "none" : "0 2px 10px rgba(249,115,22,0.3)",
          }}>
          {isPinned ? <><PinOff size={12} /> Unpin</> : <><Pin size={12} /> Pin to Dashboard</>}
        </button>
      </div>
    </div>
  );
}
