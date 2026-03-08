# SnapSight AI - Testing Strategy

## Test Environment Setup
1. Backend running: `uvicorn main:app --reload --port 8000`
2. Frontend running: `npm start` (port 3000)
3. Database: Azure SQL connected
4. Browser: DevTools open, Console tab ready

---

## Phase 1: Chart Type Rendering Tests
**Objective:** Verify all 16 chart types render data correctly without errors

| Query | Expected Chart | Status | Notes |
|-------|---|--------|-------|
| "Show sales by quarter" | Bar Chart | ? | Baseline - should always work |
| "Show revenue trend by month" | Line Chart | ? | Time-series |
| "Show revenue by region" | Horizontal Bar | ? | Ranking visualization |
| "Show profit share" | Pie Chart | ? | Composition |
| "Show revenue distribution" | Donut Chart | ? | Alternative composition |
| "Show sales pipeline by stage" | Funnel Chart | ? | Trapezoid pyramid shape |
| "Show revenue breakdown by product" | Waterfall Chart | ? | Contribution analysis |
| "Compare revenue vs expenses by quarter" | Scatter Chart | ? | Two numeric columns |
| "Show customer comparison" | Bubble Chart | ? | Three numeric dimensions |
| "Show sales matrix by region and product" | Heatmap | ? | Cross-tab data |
| "What's our total revenue?" | Gauge Chart | ? | Single KPI value |
| "Show revenue vs expenses combo" | Combo Chart | ? | Dual-axis bar+line |
| "Show market share by category" | Treemap | ? | Hierarchical composition |
| "Show customer flow by stage" | Sankey | ? | Flow/journey visualization |
| "Show data table" | Table | ? | Raw data display |

**Pass Criteria:**
- Chart renders without blank/empty state
- Data points visible
- No console errors
- Proper axis labels

---

## Phase 2: Intelligent Chart Selection Tests
**Objective:** Verify backend correctly detects query intent and suggests right chart type

| Query | Should Suggest | Detection Method |
|-------|---|---|
| "pipeline funnel by stage" | Funnel | Keyword: pipeline, stage |
| "revenue breakdown by product" | Waterfall | Keyword: breakdown, contribution |
| "correlation between X and Y" | Scatter | Keyword: correlation, vs |
| "revenue vs expenses" | Combo | Keyword: vs (multiple metrics) |
| "show market by category" | Treemap | Keyword: hierarchy, composition |
| "total revenue this year" | Gauge/KPI | Single numeric result |
| "monthly trend" | Line | Keyword: trend + time dimension |

**Pass Criteria:**
- First suggestion matches expected chart type
- No "USING LLM" in backend console (should use rule-based)

---

## Phase 3: Interactive Features Tests
**Objective:** Verify cross-filtering, tooltips, follow-ups work

### 3A: Cross-Filtering Dashboard
1. Pin 3 charts to Liveboard tab
2. Click a bar in Chart 1 → All charts should filter
3. Click another bar in Chart 2 → Multiple filters stack
4. Verify filter pills show with [×] button
5. Click × to remove individual filter
6. Click "Clear All" → All filters reset

**Pass Criteria:** Instant visual updates, no lag, all widgets sync

### 3B: Rich Tooltips
1. Hover over any chart element
2. Tooltip should show:
   - Value
   - % of total
   - Trend indicator (📈 or 📉)
   - No warnings for good data

**Pass Criteria:** Tooltip appears, contains % calculation

### 3C: Follow-Up Questions
1. Ask a question, get results
2. See suggested follow-up chips below insight
3. Click a chip → Ask that follow-up
4. Check conversation history per insight

**Pass Criteria:** Follow-ups generate new queries, conversation history shown

---

## Phase 4: Data Validation Tests
**Objective:** Ensure data accuracy across all queries

| Validation | Method |
|---|---|
| Data consistency | Compare API response data with direct DB query |
| Metric calculations | Verify % of total matches data sum |
| Filter accuracy | Pin chart, filter, verify displayed data matches filter |
| KPI values | Single-row queries show correct aggregates |

---

## Execution Plan

### Day 1 - Chart Rendering (1-2 hours)
- [ ] Test each chart type with sample query
- [ ] Note which ones show data vs blank
- [ ] Log any console errors
- [ ] Fix rendering bugs in batch

### Day 2 - Chart Selection Intelligence (30 min)
- [ ] Test each pattern-match query
- [ ] Verify rule-based routing (check backend logs)
- [ ] Confirm first suggestion is correct chart type

### Day 3 - Interactive Features (1 hour)
- [ ] Cross-filtering: pin 3 charts, test filtering
- [ ] Tooltips: hover on 5 different chart types
- [ ] Follow-ups: ask question, click 2 follow-ups

### Day 4 - Data Validation (30 min)
- [ ] Sample 3 queries, compare data with direct DB
- [ ] Verify % calculations in tooltips
- [ ] Check KPI single-value results

### Day 5 - Bug Fixes & Polish (2-3 hours)
- [ ] Fix all identified bugs in batch
- [ ] Re-test all failures from Phase 1
- [ ] Commit working state

---

## Known Issues to Fix
- [ ] Scatter chart: Empty axes (fixed in code, needs test)
- [ ] Bubble chart: Empty axes (fixed in code, needs test)
- [ ] Funnel trapezoid: Rendering logic (fixed in code, needs test)

---

## Success Criteria
- ✅ All 16 chart types render with data
- ✅ Intelligent chart selection working for all patterns
- ✅ Cross-filtering functional (instant updates)
- ✅ Tooltips show % of total
- ✅ Follow-ups generate new queries
- ✅ No console errors during demo

