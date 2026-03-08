"""
SnapSight AI - Agent 3: Visualization Recommender (v3 - LLM-Powered)
Uses Azure OpenAI to intelligently recommend chart types with correct axis mappings.
Falls back to improved rule-based logic if LLM fails.
"""

import os
import json
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version="2024-10-21"
)

DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")

SYSTEM_PROMPT = """You are a senior data visualization expert at a top BI company.
Given a user's question, SQL result columns, column data types, and a small data sample,
recommend 3-4 chart visualizations with CORRECT axis assignments.

═══ CRITICAL AXIS RULES (violating these makes charts unreadable) ═══
1. x_key MUST be the DIMENSION column — categories, dates, names, labels, stages, types.
   These are grouping/bucketing values that appear on the horizontal axis.
2. y_keys MUST be METRIC columns — numeric aggregated values (revenue, count, sum, avg).
   These are the measured values shown as bar heights, line values, slice sizes.
3. NEVER put a numeric metric as x_key (e.g., x_key:"total_revenue" is WRONG).
4. NEVER put a category/label as y_keys (e.g., y_keys:["region"] is WRONG).
5. If there's one string column and one numeric column, string is ALWAYS x_key.
6. If ALL columns are numeric (e.g., single-row aggregation), use KPI chart.

═══ CHART TYPE SELECTION ═══
- Time-series (months, quarters, years, dates) → "line" primary, also "area", "bar"
- Categorical comparison (region, category, type) → "bar" primary, also "horizontal_bar", "donut"
- Ranking / Top N → "horizontal_bar" primary (sorted by metric), also "bar"
- Distribution / share / breakdown → "donut" primary, also "pie", "bar"
- Pipeline / funnel stages → "funnel" primary, also "horizontal_bar"
- Single aggregate (1 row, 1-2 metrics) → "kpi" primary, also "bar"
- Multiple metrics over categories → "grouped_bar" or "line" with multiple y_keys

═══ VALUE FORMAT ═══
Assign value_format based on what the metric represents:
- "currency" → revenue, expenses, profit, deal_value, lifetime_value, price, cost, amount, value, monthly_revenue
- "number" → count, units_sold, num, total_customers, deals, rows
- "percent" → rate, percentage, pct, ratio, share
- Default to "number" if unsure. NEVER default to "currency" for counts.

═══ OUTPUT FORMAT ═══
Return ONLY a valid JSON array. No markdown, no explanation, no ```json blocks.
Each element:
{
  "chart_type": "bar|line|area|pie|donut|horizontal_bar|funnel|kpi|stacked_area|grouped_bar",
  "title": "Clear, concise chart title (not the raw question)",
  "subtitle": "1-line description of what the chart shows",
  "label": "Human-readable chart type name",
  "config": {
    "x_key": "dimension_column",
    "y_keys": ["metric_col_1", "metric_col_2"],
    "colors": ["#00D2FF", "#A78BFA", "#10B981", "#F59E0B"],
    "value_format": "currency|number|percent",
    "columns": ["all", "column", "names"]
  }
}

For KPI charts, also include inside config:
  "value": <the actual number from the data>,
  "kpi_label": "Human-Readable Label"

QUALITY RULES:
- Titles should be professional: "Revenue by Region" not "show me revenue by region"
- Subtitles should add context: "Total sales across 4 regions" not "by region"
- Always provide at least 3 suggestions with DIFFERENT chart types
- First suggestion should be the BEST fit for the question
- Never suggest pie/donut for more than 8 categories
- Never suggest line chart for non-sequential data (e.g., regions)"""


async def recommend_charts(question: str, intent: dict, columns: list, data: list) -> list:
    """
    LLM-powered chart recommendation with rule-based fallback.
    Returns 3-4 chart suggestions with correct axis mappings.
    """
    if not data or not columns:
        return [{
            "chart_type": "error",
            "title": "No data found",
            "subtitle": "Try rephrasing your question",
            "config": {},
            "label": "No Data"
        }]

    # Try LLM-powered recommendation first
    try:
        suggestions = await _llm_recommend(question, intent, columns, data)
        if suggestions:
            return suggestions
    except Exception as e:
        print(f"LLM viz agent error: {e}, falling back to rules")

    # Fallback to improved rule-based logic
    return _rule_based_recommend(question, intent, columns, data)


async def _llm_recommend(question: str, intent: dict, columns: list, data: list) -> list:
    """Call Azure OpenAI for smart chart suggestions."""
    # Detect column types from actual data
    col_types = {}
    if data:
        for col in columns:
            val = data[0].get(col)
            if isinstance(val, (int, float)):
                col_types[col] = "numeric"
            else:
                col_types[col] = "string/date"

    # Data sample (max 5 rows to save tokens)
    sample = data[:5]

    user_msg = f"""Question: "{question}"

Columns: {json.dumps(columns)}
Column types: {json.dumps(col_types)}
Total rows: {len(data)}
Data sample: {json.dumps(sample, default=str)}"""

    if intent:
        user_msg += f"\nParsed intent: {json.dumps(intent)}"

    response = client.chat.completions.create(
        model=DEPLOYMENT,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg}
        ],
        temperature=0.15,
        max_tokens=1200
    )

    result_text = response.choices[0].message.content.strip()

    # Clean markdown wrapping
    if result_text.startswith("```"):
        result_text = result_text.split("\n", 1)[1]
        result_text = result_text.rsplit("```", 1)[0].strip()
    if result_text.lower().startswith("json"):
        result_text = result_text[4:].strip()

    suggestions = json.loads(result_text)

    # Validate and sanitize
    valid = []
    for s in suggestions:
        if not isinstance(s, dict) or "chart_type" not in s:
            continue
        if "config" not in s:
            s["config"] = {}
        cfg = s["config"]

        # Ensure required config fields
        if "x_key" not in cfg or cfg["x_key"] not in columns:
            cfg["x_key"] = _pick_dimension(columns, col_types)
        if "y_keys" not in cfg:
            cfg["y_keys"] = _pick_metrics(columns, col_types)
        else:
            # Verify y_keys exist in columns
            cfg["y_keys"] = [k for k in cfg["y_keys"] if k in columns]
            if not cfg["y_keys"]:
                cfg["y_keys"] = _pick_metrics(columns, col_types)
        if "columns" not in cfg:
            cfg["columns"] = columns
        if "colors" not in cfg:
            cfg["colors"] = ["#00D2FF", "#A78BFA", "#10B981", "#F59E0B"]
        if "value_format" not in cfg:
            cfg["value_format"] = _infer_format(cfg["y_keys"])
        if not s.get("title"):
            s["title"] = _generate_title(question)
        if not s.get("subtitle"):
            s["subtitle"] = ""
        if not s.get("label"):
            s["label"] = s["chart_type"].replace("_", " ").title()

        valid.append(s)

    return valid[:4] if valid else None


# ── Improved rule-based fallback ──────────────────────────────────

def _rule_based_recommend(question: str, intent: dict, columns: list, data: list) -> list:
    """Improved rule-based fallback with proper data type detection."""
    col_types = {}
    if data:
        for col in columns:
            val = data[0].get(col)
            col_types[col] = "numeric" if isinstance(val, (int, float)) else "string"

    dim = _pick_dimension(columns, col_types)
    metrics = _pick_metrics(columns, col_types)
    num_rows = len(data)
    title = _generate_title(question)
    q = question.lower()
    fmt = _infer_format(metrics)
    suggestions = []

    # Detect data characteristics
    time_cols = {"month", "quarter", "year", "sale_date", "signup_date", "created_date", "launch_date"}
    is_time = dim in time_cols or any(t in dim for t in ["date", "month", "quarter", "year"])
    is_funnel = "stage" in columns or "funnel" in q or "pipeline" in q
    is_single = num_rows == 1 and len(metrics) <= 2

    if is_single:
        # KPI card for single-row results
        for mc in metrics:
            val = data[0].get(mc, 0)
            suggestions.append({
                "chart_type": "kpi",
                "title": title,
                "subtitle": mc.replace("_", " ").title(),
                "label": "KPI Card",
                "config": {
                    "x_key": dim, "y_keys": [mc], "colors": ["#00D2FF"],
                    "columns": columns, "value": val, "value_format": fmt,
                    "kpi_label": mc.replace("_", " ").title()
                }
            })
        suggestions.append(_build("bar", title, f"{_names(metrics)} comparison", dim, metrics, "Bar Chart", columns, fmt))

    elif is_funnel:
        suggestions.append(_build("funnel", title, f"{_names(metrics)} by stage", dim, metrics, "Funnel", columns, fmt))
        suggestions.append(_build("horizontal_bar", title, f"{_names(metrics)} ranking", dim, metrics, "Horizontal Bar", columns, fmt))
        suggestions.append(_build("bar", title, f"{_names(metrics)} by stage", dim, metrics, "Bar Chart", columns, fmt))

    elif is_time:
        suggestions.append(_build("line", title, f"{_names(metrics)} trend", dim, metrics, "Line Chart", columns, fmt))
        suggestions.append(_build("area", title, f"{_names(metrics)} area trend", dim, metrics, "Area Chart", columns, fmt))
        suggestions.append(_build("bar", title, f"{_names(metrics)} by {dim}", dim, metrics, "Bar Chart", columns, fmt))
        if len(metrics) >= 2:
            suggestions.append(_build("stacked_area", title, f"{_names(metrics)} stacked", dim, metrics, "Stacked Area", columns, fmt))

    elif num_rows <= 8:
        suggestions.append(_build("bar", title, f"{_names(metrics)} by {dim}", dim, metrics, "Bar Chart", columns, fmt))
        suggestions.append(_build("donut", title, f"{_names(metrics)} distribution", dim, metrics, "Donut", columns, fmt))
        suggestions.append(_build("horizontal_bar", title, f"{_names(metrics)} ranking", dim, metrics, "Horizontal Bar", columns, fmt))

    else:
        suggestions.append(_build("bar", title, f"{_names(metrics)} by {dim}", dim, metrics, "Bar Chart", columns, fmt))
        suggestions.append(_build("horizontal_bar", title, f"{_names(metrics)} ranking", dim, metrics, "Horizontal Bar", columns, fmt))
        suggestions.append(_build("line", title, f"{_names(metrics)} trend", dim, metrics, "Line Chart", columns, fmt))

    # Always add a KPI summary if we have metrics and no KPI yet
    if metrics and data and not any(s["chart_type"] == "kpi" for s in suggestions):
        total = sum(row.get(metrics[0], 0) for row in data if isinstance(row.get(metrics[0], 0), (int, float)))
        suggestions.append({
            "chart_type": "kpi",
            "title": title,
            "subtitle": f"Total {metrics[0].replace('_', ' ').title()}",
            "label": "KPI Summary",
            "config": {
                "x_key": dim, "y_keys": metrics[:1], "colors": ["#00D2FF"],
                "columns": columns, "value": total, "value_format": fmt,
                "kpi_label": f"Total {metrics[0].replace('_', ' ').title()}"
            }
        })

    return suggestions[:4]


# ── Helper functions ──────────────────────────────────────────────

def _pick_dimension(columns, col_types):
    """Pick the best dimension (x-axis) column based on data types."""
    # Prefer string/date columns
    for col in columns:
        if col_types.get(col) == "string" or col_types.get(col) == "string/date":
            return col
    # If all numeric, pick the first column
    return columns[0] if columns else ""


def _pick_metrics(columns, col_types):
    """Pick metric (y-axis) columns — must be numeric."""
    metrics = [col for col in columns if col_types.get(col) == "numeric"]
    if not metrics and len(columns) > 1:
        metrics = columns[1:]  # fallback
    return metrics


def _infer_format(metric_names):
    """Infer value format from metric column names."""
    currency_words = {"revenue", "expense", "profit", "cost", "price", "value",
                      "amount", "salary", "budget", "income", "monthly_revenue",
                      "deal_value", "lifetime_value", "total_revenue", "total_expenses",
                      "total_profit", "avg_revenue", "avg_deal_value"}
    pct_words = {"rate", "percent", "pct", "ratio", "share", "conversion"}

    for m in metric_names:
        m_lower = m.lower()
        if any(w in m_lower for w in currency_words):
            return "currency"
        if any(w in m_lower for w in pct_words):
            return "percent"
    return "number"


def _build(chart_type, title, subtitle, dim, metrics, label, columns, fmt):
    """Build a chart suggestion dict."""
    return {
        "chart_type": chart_type,
        "title": title,
        "subtitle": subtitle,
        "label": label,
        "config": {
            "x_key": dim,
            "y_keys": metrics[:4],
            "colors": ["#00D2FF", "#A78BFA", "#10B981", "#F59E0B"][:max(len(metrics), 1)],
            "columns": columns,
            "value_format": fmt,
        }
    }


def _generate_title(question):
    """Generate a clean chart title from the question."""
    title = question.strip().rstrip("?").strip()
    for prefix in ["show me the ", "show me ", "show the ", "show ",
                   "what is the ", "what is ", "what are the ", "what are ",
                   "give me the ", "give me ", "display the ", "display ",
                   "get the ", "get ", "create ", "build ", "make ",
                   "can you show ", "can you ", "i want to see ", "i want "]:
        if title.lower().startswith(prefix):
            title = title[len(prefix):]
            break
    return title[0].upper() + title[1:] if title else "Chart"


def _names(metrics):
    """Format metric names for subtitles."""
    if not metrics:
        return ""
    return ", ".join(m.replace("_", " ").title() for m in metrics[:2])


# Legacy sync wrapper
def recommend_chart(question, intent, columns, data):
    """Legacy single-chart function."""
    charts = _rule_based_recommend(question, intent, columns, data)
    return charts[0] if charts else {
        "chart_type": "bar", "title": "Chart", "subtitle": "",
        "config": {}, "label": "Bar Chart"
    }
