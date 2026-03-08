# ThoughtSpot-Inspired Features Roadmap for SnapSight AI

**Date**: 2026-03-08
**Based on**: https://www.thoughtspot.com/product/visualize

---

## Executive Summary

ThoughtSpot is the market leader in AI-powered analytics with 25+ native visualizations and interactive Liveboards. This document identifies the most impactful features we should incorporate into SnapSight AI to match enterprise expectations.

---

## 🎯 Key ThoughtSpot Capabilities & SnapSight Implementation Plan

### 1. **Drill-Down & Drill-Anywhere Navigation** ⭐ HIGH PRIORITY
**What ThoughtSpot Does:**
- "Drill Anywhere" feature allows users to navigate from high-level aggregations to granular details
- No pre-defined drill paths needed
- Dynamic drill paths based on data structure

**Current SnapSight Status:**
- ✅ Basic drill-down exists (`handleDrillDown` in App.js)
- ❌ Limited to predefined DRILL_TEMPLATES
- ❌ No "drill up" or "drill across" capabilities

**Implementation Plan:**
```
Phase 1 (Week 1):
- Add "Drill Up" button to return to parent aggregation
- Implement "Drill Across" (pivot to different dimension)
- Display breadcrumb trail showing drill path
- Allow user to jump to any level in hierarchy

Phase 2 (Week 2):
- Remove dependency on DRILL_TEMPLATES
- Use LLM to generate contextual drill questions
- Cache drill paths for performance
```

**Code Location**: `frontend/src/App.js` → `handleDrillDown` function (line 343)

---

### 2. **Cross-Filtering Dashboard Widgets** ⭐ HIGH PRIORITY
**What ThoughtSpot Does:**
- Click a bar in one chart → automatically filters ALL other charts on the dashboard
- Filters propagate in real-time
- Users see filtered data counts

**Current SnapSight Status:**
- ✅ Filter state exists in `pinboardFilters` (line 96)
- ✅ Basic cross-filter logic in `applyFilters` (line 392)
- ❌ Limited to 3 hardcoded filters (region, quarter, product_category)
- ❌ No dynamic filter detection from data

**Implementation Plan:**
```
Phase 1 (Week 1):
- Auto-detect filterable columns from chart data
- Add filter pills/badges to each widget
- Show filter count on dashboard
- Add "Clear All Filters" button

Phase 2 (Week 2):
- Support multi-value filters (AND/OR logic)
- Add date range picker for temporal filters
- Save filter combinations as presets
- Add filter history
```

**Code Location**: `frontend/src/App.js` → `pinboardFilters` state and `applyFilters` function

---

### 3. **Anomaly Detection & Alerts** ⭐ MEDIUM PRIORITY
**What ThoughtSpot Does:**
- Automatically flags unexpected spikes/drops in data
- Set thresholds and alert conditions
- Notifications when anomalies detected

**Current SnapSight Status:**
- ❌ No anomaly detection
- ❌ No alerting system

**Implementation Plan:**
```
Phase 1 (Week 2):
- Add statistical anomaly detection to insight agent
- Detect: outliers, sudden changes, trend reversals
- Mark anomalies in chart with visual indicators (red dot/flag)
- Add anomaly explanation to insights

Phase 2 (Week 3):
- Backend anomaly scoring (Z-score, IQR method)
- User-configurable sensitivity levels
- Email/Slack alerts for critical anomalies
- Historical anomaly tracking
```

**Code Location**: `backend/agents/insight_agent.py` (new anomaly detection module)

---

### 4. **Forecasting & Trend Prediction** ⭐ MEDIUM PRIORITY
**What ThoughtSpot Does:**
- Automatically forecast future values based on historical trends
- Show confidence intervals
- Compare forecasts vs actual

**Current SnapSight Status:**
- ❌ No forecasting capability

**Implementation Plan:**
```
Phase 1 (Week 3):
- Detect time-series data automatically
- Call Azure OpenAI or Python statsmodels for forecasting
- Add "Forecast" button to time-series charts
- Show forecast as dashed line with shaded confidence interval

Phase 2 (Week 4):
- Support multiple forecast methods (linear, exponential, ARIMA)
- Let users select forecast horizon (next month/quarter/year)
- Export forecast data
```

**Code Location**: New file `backend/agents/forecast_agent.py`

---

### 5. **Conversational Follow-Up Questions** ⭐ HIGH PRIORITY
**What ThoughtSpot Does:**
- "Ask follow-up questions about this insight"
- Multi-turn conversation within the insight
- Context-aware suggestions

**Current SnapSight Status:**
- ✅ Main conversation works
- ❌ No follow-up mechanism
- ❌ No suggestion chips for follow-ups

**Implementation Plan:**
```
Phase 1 (Week 1):
- Add "Ask Follow-Up" input box in each insight card
- Prepend context (original question + data summary)
- Generate 2-3 suggested follow-up questions
- Track conversation history per insight

Phase 2 (Week 2):
- Show conversation thread/transcript
- Allow user to branch conversations
- Export insight + conversation as report
```

**Code Location**: `frontend/src/App.js` → Add `conversationHistory` state per insight

---

### 6. **Rich Interactive Tooltips** ⭐ MEDIUM PRIORITY
**What ThoughtSpot Does:**
- Hover over chart element → show rich tooltip with context
- Tooltip includes: value, rank, % of total, trend indicator
- Click tooltip to drill-down

**Current SnapSight Status:**
- ✅ Basic Recharts tooltip exists
- ❌ No custom enriched data in tooltips
- ❌ Can't click tooltip to drill

**Implementation Plan:**
```
Phase 1 (Week 1):
- Enhance CustomTooltip to calculate:
  - Percentage of total
  - Rank in dataset
  - Trend vs previous period
  - Data quality flags
- Make tooltips clickable (trigger drill-down)

Phase 2 (Week 2):
- Add mini sparkline to tooltip (trend preview)
- Show similar values in dataset
- Display data source & last update time
```

**Code Location**: `frontend/src/components/ChartWidget.js` → `makeCustomTooltip` function (line 94)

---

### 7. **Smart Question Suggestions Based on Data** ⭐ MEDIUM PRIORITY
**What ThoughtSpot Does:**
- Automatically suggests relevant questions users might ask
- Suggestions based on data structure and common patterns
- Personalized to user behavior

**Current SnapSight Status:**
- ✅ TRENDING_QUESTIONS exist (hardcoded)
- ✅ `getInsightsCatalog()` API call exists
- ❌ Suggestions are static, not data-driven
- ❌ No ML-based personalization

**Implementation Plan:**
```
Phase 1 (Week 1):
- Analyze query results structure
- Generate contextual suggestions:
  - "Break down by [next dimension]"
  - "Compare [metric] across [dimension]"
  - "Rank by [metric]"
- Show top 5 suggestions in sidebar

Phase 2 (Week 2):
- Track user question patterns
- Boost suggestions matching past queries
- A/B test suggestion wording
```

**Code Location**: `frontend/src/App.js` → `getInsightsCatalog()` call (line 176)

---

### 8. **Chart Type Auto-Selection** ✅ DONE
**What ThoughtSpot Does:**
- Automatically recommends best chart type for the data

**Current SnapSight Status:**
- ✅ Implemented in commit 481fd7a
- ✅ Intent-based chart selection
- ✅ 8 new specialized chart types added

**No further action needed** - this is production-ready.

---

### 9. **Dashboard Layouts & Responsive Design** ⭐ LOW PRIORITY
**What ThoughtSpot Does:**
- Pre-built responsive dashboard templates
- Drag-drop widget positioning
- Save custom layouts

**Current SnapSight Status:**
- ✅ Liveboard/Dashboard exists
- ❌ No layout templates
- ❌ No drag-drop (widgets added in fixed positions)
- ❌ Limited responsive design on mobile

**Implementation Plan:**
```
Phase 1 (Week 4):
- Create 3 dashboard templates: Executive, Analyst, Operational
- Add responsive grid system (CSS Grid)
- Mobile-optimized layout
- Adjust chart sizes for small screens

Phase 2 (Future):
- Drag-drop widget reordering
- Save custom layouts per user
```

**Code Location**: `frontend/src/App.js` → Dashboard rendering (line 1104)

---

### 10. **Data Quality & Source Tracking** ⭐ LOW PRIORITY
**What ThoughtSpot Does:**
- Shows data source, refresh time, quality indicators
- Flags stale or unreliable data

**Current SnapSight Status:**
- ❌ No data quality indicators
- ❌ No source tracking

**Implementation Plan:**
```
Phase 1 (Week 5):
- Add data source badge to charts (e.g., "From Sales DB")
- Show last update timestamp
- Flag if data is >1 day old (stale)
- Add data lineage tooltip

Phase 2 (Future):
- Quality score (data completeness %)
- Data freshness indicator (green/yellow/red)
- Update frequency display
```

**Code Location**: `frontend/src/components/ChartWidget.js` → Add data metadata display

---

## 📊 Implementation Priority Matrix

| Feature | Impact | Effort | Priority | Timeline |
|---------|--------|--------|----------|----------|
| Conversational Follow-Ups | 9/10 | 3/10 | 🔴 Critical | Week 1 |
| Cross-Filter Dashboard | 9/10 | 4/10 | 🔴 Critical | Week 1-2 |
| Drill-Down Enhancement | 8/10 | 4/10 | 🔴 Critical | Week 1-2 |
| Anomaly Detection | 7/10 | 5/10 | 🟠 High | Week 2-3 |
| Rich Tooltips | 6/10 | 2/10 | 🟠 High | Week 1 |
| Forecasting | 7/10 | 6/10 | 🟠 High | Week 3-4 |
| Smart Suggestions | 5/10 | 3/10 | 🟡 Medium | Week 2 |
| Dashboard Templates | 4/10 | 4/10 | 🟡 Medium | Week 4 |
| Data Quality Tracking | 3/10 | 3/10 | 🟢 Low | Week 5 |

---

## 🚀 Quick Wins (Start Here - Week 1)

These features can be implemented in 1-2 days each:

1. **Follow-Up Questions Input** (2 hours)
   - Add text input box below each insight
   - Store conversation history
   - Files: `App.js`

2. **Enhanced Tooltips** (3 hours)
   - Calculate % of total in tooltip
   - Show rank/position
   - Files: `ChartWidget.js`

3. **Smart Question Chips** (2 hours)
   - Generate 3 follow-up suggestions per insight
   - Make them clickable to trigger new queries
   - Files: `App.js`

4. **Filter Pills on Dashboard** (2 hours)
   - Show active filters as removable chips
   - "Clear All Filters" button
   - Files: `App.js`

---

## 🔧 Technical Debt to Address First

Before implementing these features, address:

1. **State Management** - Consider Redux/Context for complex state
   - Current: 30+ useState hooks in App.js
   - Problem: Hard to track data flow, difficult to debug

2. **API Design** - Create dedicated endpoints for:
   - `/api/suggestions/follow-ups` - for contextual suggestions
   - `/api/data/anomalies` - for anomaly detection
   - `/api/forecast` - for predictions

3. **Performance** - Current issues:
   - Dashboard with 10+ widgets is slow
   - Implement: data caching, lazy loading, virtualization

---

## 📝 Success Metrics

After implementing Phase 1 (Weeks 1-2):

- **Engagement**: Avg session duration increases by 40%
- **Retention**: Users return for follow-up questions (new behavior)
- **Accuracy**: Drill-downs show deeper insights (4+ levels)
- **Satisfaction**: "Dashboard is more interactive" feedback

---

## 📚 Resources & References

- [ThoughtSpot Visualize](https://www.thoughtspot.com/product/visualize)
- [Interactive Dashboards Best Practices](https://www.thoughtspot.com/data-trends/dashboard/interactive-dashboard)
- [Real-time Dashboards](https://www.thoughtspot.com/data-trends/dashboard/real-time-dashboard)

---

## Next Steps

1. **Week 1**: Implement Quick Wins (follow-ups, tooltips, suggestions, filters)
2. **Week 2**: Full drill-down/drill-across system
3. **Week 3**: Anomaly detection backend
4. **Week 4+**: Forecasting, templates, advanced features

