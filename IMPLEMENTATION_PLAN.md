# SnapSight AI — ThoughtSpot-Inspired Feature Implementation Plan

Reference: [What is ThoughtSpot? Everything You Need to Know](https://www.phdata.io/blog/what-is-thoughtspot-everything-you-need-to-know/)

---

## Current State

SnapSight AI already has:
- Natural language search bar that generates charts (core ThoughtSpot pattern)
- 4-agent AI pipeline: Query Understanding → SQL Generation → Visualization → Insight
- Multiple chart suggestions per question (bar, line, area, pie, donut, funnel, KPI, geo map)
- Pinboard (Liveboard) with drag-and-drop + resize via react-grid-layout
- Zoomable/pannable geo map with choropleth coloring
- Brush-based zoom on time-series charts
- AI-generated business insights per query
- SQL transparency panel on each widget

---

## 5 New Features to Build

### Feature 1: Drill-Down on Click

**ThoughtSpot equivalent:** "Drill Anywhere" — click any data point to explore deeper.

**What it does:**
Click any bar, pie slice, donut segment, or map region and SnapSight auto-generates a scoped follow-up question. For example, clicking the "North America" bar on a revenue-by-region chart fires: *"Break down North America revenue by product category"*.

**Files changed:**

| File | Change |
|------|--------|
| `frontend/src/components/ChartWidget.js` | Add `onDrillDown` prop. Attach `onClick` handlers to Bar, Pie Cell, Donut Cell, and Geo Geography elements. On click, call `onDrillDown({ dimension: xKey, value: clickedValue, metric: yKeys[0], originalQuestion: widget.question })` |
| `frontend/src/App.js` | Add `handleDrillDown(context)` function. It builds a follow-up question string from the context (e.g. `"Break down {value} {metric} by product category"`) using a simple template mapping. Then calls `handleSearch(followUpQuestion)`. Pass `onDrillDown` to every `<ChartWidget>` in both Ask and Pinboard tabs. |

**Backend changes:** None — the existing pipeline handles any natural language question.

**Drill-down question templates:**
- If dimension is `region` → "Break down {value} revenue by product category"
- If dimension is `product_category` → "Show {value} revenue by region and quarter"
- If dimension is `quarter` → "Break down {value} revenue by product category"
- If dimension is `salesperson` → "Show {value} deals by stage"
- If dimension is `stage` → "Show {value} deals by salesperson"
- Default → "Show more details about {value}"

---

### Feature 2: SpotIQ-Style Auto-Discover

**ThoughtSpot equivalent:** SpotIQ — AI analyzes millions of data points to surface hidden insights, trends, and anomalies automatically.

**What it does:**
A "Discover Insights" button on the Ask tab fires 4 diverse analytical questions in parallel. Returns a mosaic of mini-chart cards, each with its own AI insight. One click builds a quick overview dashboard.

**Files changed:**

| File | Change |
|------|--------|
| `backend/main.py` | Add `POST /api/discover` endpoint. It picks 4 diverse questions from a curated analytical pool (covering revenue trends, customer segments, pipeline health, regional comparison). Runs `process_question()` on each via `asyncio.gather()` for parallel execution. Returns `{ results: [...] }`. |
| `frontend/src/api.js` | Add `discoverInsights()` function that calls `POST /api/discover`. |
| `frontend/src/App.js` | Add "Discover Insights" button below the SearchBar (styled with Sparkles icon). On click: set a special loading state ("SpotIQ is analyzing your data..."), call `discoverInsights()`, map each result into a `queryGroup`, and push all 4 into `queryResults` at once. |

**Curated discovery questions pool (backend picks 4):**
```
- "Show revenue trend by month for the latest year"
- "Which product category has the highest profit margin?"
- "Compare customer acquisition: new vs returning vs churned"
- "Show the sales pipeline funnel by stage"
- "Who are the top 5 salespeople by total revenue?"
- "Which region is growing fastest in revenue?"
- "What is the average deal value by pipeline stage?"
- "Show customer lifetime value by industry"
```

---

### Feature 3: Data Table Toggle

**ThoughtSpot equivalent:** Table/Chart toggle — every answer can be viewed as a chart or a raw data table.

**What it does:**
Each widget gets a "Table" button in its footer (next to the existing "SQL" button). Clicking it flips the widget from chart view to a styled data table showing the raw query results. Click again to flip back.

**Files changed:**

| File | Change |
|------|--------|
| `frontend/src/components/ChartWidget.js` | Add `showTable` boolean state. Add a "Table" toggle button (with `TableIcon` from lucide-react) next to the "SQL" button in the action bar. When `showTable` is true, render a `<DataTable>` component instead of `<RenderChart>`. |

**DataTable component (inline in ChartWidget.js):**
- Styled `<table>` with dark theme matching the app
- `widget.columns` as `<th>` headers
- `widget.data` rows (cap display at 50 rows, show "{n} more rows" indicator)
- Scrollable container (max-height based on `chartHeight`)
- Numbers formatted with `formatValue()`
- Sticky header row
- Alternating row backgrounds for readability
- Highlight on hover

**Backend changes:** None — `data` and `columns` are already in the widget payload.

---

### Feature 4: Liveboard Global Filters

**ThoughtSpot equivalent:** Global filters on Liveboards — filter dropdowns that apply to ALL widgets simultaneously.

**What it does:**
The Pinboard tab gets a filter bar with 3 dropdown selects: Region, Quarter, and Product Category. Selecting a filter value re-filters ALL pinned widgets' data client-side, so every chart updates simultaneously.

**Files changed:**

| File | Change |
|------|--------|
| `frontend/src/App.js` | 1. Add `pinboardFilters` state: `{ region: null, quarter: null, product_category: null }`. 2. Add a filter bar component rendered above the grid in the Pinboard tab — 3 styled `<select>` dropdowns + a "Clear Filters" button. 3. Extract unique filter options by scanning ALL pinned widgets' data arrays for unique values of `region`, `quarter`, `product_category`. 4. Compute `filteredPinnedWidgets` — for each pinned widget, clone it and filter its `data` array to only include rows matching active filters (skip columns that don't exist in that widget's data). 5. Pass `filteredPinnedWidgets` to the `ResponsiveGridLayout` instead of raw `pinnedWidgets`. |

**Filter logic (client-side):**
```javascript
const applyFilters = (data) => {
  return data.filter(row => {
    if (pinboardFilters.region && row.region && row.region !== pinboardFilters.region) return false;
    if (pinboardFilters.quarter && row.quarter && row.quarter !== pinboardFilters.quarter) return false;
    if (pinboardFilters.product_category && row.product_category && row.product_category !== pinboardFilters.product_category) return false;
    return true;
  });
};
```

**Backend changes:** None — filtering is client-side on data already in memory.

---

### Feature 5: Query History Sidebar

**ThoughtSpot equivalent:** Saved Answers — recall and re-run past analyses.

**What it does:**
A collapsible sidebar on the left showing all past questions with timestamps. Click any history item to re-run the query. History persists across browser sessions via localStorage.

**Files changed:**

| File | Change |
|------|--------|
| `frontend/src/App.js` | 1. Add `queryHistory` state — array of `{ id, question, timestamp }`. Initialize from `localStorage.getItem("snapsight_history")`. 2. Add `showHistory` boolean state for sidebar toggle. 3. In `handleSearch`, on success push `{ id: Date.now(), question, timestamp: new Date().toLocaleString() }` to history and persist to localStorage. 4. Add a "History" toggle button/icon in the header nav (Clock icon from lucide-react, next to Ask/Pinboard tabs). 5. Render a collapsible sidebar panel (left side, 300px wide, slides in/out) showing history items newest-first as clickable rows. Each row shows the question text + timestamp. 6. On click, call `handleSearch(item.question)`. 7. Add "Clear History" button at the bottom of sidebar. |

**localStorage key:** `snapsight_history`

**Backend changes:** None.

---

## Execution Order

| Order | Feature | Reason |
|-------|---------|--------|
| 1st | **Phase 3: Data Table Toggle** | Self-contained in ChartWidget.js only, no dependencies, quick win |
| 2nd | **Phase 1: Drill-Down on Click** | Also touches ChartWidget.js — batch chart component changes together |
| 3rd | **Phase 4: Liveboard Global Filters** | App.js state work — do all App.js changes together |
| 4th | **Phase 5: Query History Sidebar** | App.js state + localStorage — pairs naturally with Phase 4 |
| 5th | **Phase 2: SpotIQ Auto-Discover** | Only feature needing a backend endpoint — do last since it's the most independent |

---

## Summary of All File Changes

| File | Phases | Estimated size |
|------|--------|---------------|
| `frontend/src/components/ChartWidget.js` | 1, 3 | ~120 new lines (table component + click handlers) |
| `frontend/src/App.js` | 1, 2, 4, 5 | ~200 new lines (drill-down handler, discover button, filter bar, history sidebar) |
| `frontend/src/api.js` | 2 | ~15 new lines (discoverInsights function) |
| `backend/main.py` | 2 | ~30 new lines (/api/discover endpoint) |

**Total estimated new code:** ~365 lines across 4 files.
**No new files created** — all features integrate into existing components.
**No new npm packages needed** — uses lucide-react icons already installed.
