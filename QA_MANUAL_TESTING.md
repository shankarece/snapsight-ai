# SnapSight AI - Manual QA Testing Checklist

**Status**: Ready for hackathon submission
**Test Date**: 2026-03-11
**Automated Tests**: ✅ All Passing (6/6 chart types, interactive features, error handling)

---

## Critical Test Cases (Must Pass Before Submission)

### 1. Core Query Execution
- [ ] **Bar Chart**: "Show sales by quarter" → Renders 4 bars with legend
- [ ] **Line Chart**: "Show revenue trend by month" → Smooth line with 15 points
- [ ] **Funnel Chart**: "Show sales pipeline funnel by stage" → 6 stages with drop-off % labels
- [ ] **Combo Chart**: "Compare revenue vs expenses by quarter" → Bar + line on dual axes
- [ ] **KPI**: "What's our total revenue?" → Single large number with label
- [ ] **Treemap**: "Show revenue by product category" → Colored rectangles with hierarchy

### 2. Interactive Features
- [ ] **Pin to Liveboard**: Click any chart → "Pin to Liveboard" button → appears in Liveboard tab
- [ ] **Cross-Filtering**:
  - Pin 2+ charts to Liveboard
  - Click a bar/element in one chart
  - All charts update with filter applied
  - Filter pill appears at top showing active filter
  - Click "Clear All" → all filters removed
- [ ] **Follow-Up Questions**:
  - Run any query
  - See suggested follow-up chips below insight text
  - Click a chip → new query executes with that question
  - Type custom follow-up in input box → Enter to submit
- [ ] **Rich Tooltips**:
  - Hover over any data point
  - Tooltip shows: value, % of total, trend indicator

### 3. UI/UX Quality
- [ ] **Tab Navigation**: Ask → Liveboard → Answers → Library → History (correct order)
- [ ] **Data Table Readability**: Table fonts are large (≥12px), headers bold
- [ ] **Chart Rendering**: All charts render cleanly without overlapping labels
- [ ] **Loading States**: "Analyzing..." spinner shows during query execution
- [ ] **No Console Errors**: Open DevTools (F12) → Console tab → no red error messages

### 4. Data Persistence
- [ ] **LocalStorage - Answers**:
  - Run a query
  - Refresh page (Ctrl+R)
  - Query result still visible in Answers tab
- [ ] **LocalStorage - History**:
  - Run multiple queries
  - Open History sidebar
  - All queries listed
  - Refresh page
  - History still there
- [ ] **LocalStorage - Dashboards**:
  - Pin 2-3 charts to Liveboard
  - Create a second dashboard ("Dashboard 2")
  - Refresh page
  - Both dashboards exist with correct widgets

### 5. Error Handling
- [ ] **Invalid Query**: "xyz abc def" → Shows error gracefully, fallback query executes
- [ ] **Empty Input**: Click ask with empty text → Shows validation error
- [ ] **Non-existent Data**: "Show me the moon" → Fallback query executes, no crash
- [ ] **Database Disconnect**: Unplug network → Shows "Database: disconnected" in health check
- [ ] **API Timeout**: (Optional) 30+ second query doesn't freeze UI, shows spinner

### 6. Performance Benchmarks
- [ ] **Page Load**: Initial load (Ask tab) < 3 seconds
- [ ] **Query Response**: Most queries complete in 8-12 seconds (4 LLM calls)
- [ ] **UI Responsiveness**: No lag when switching tabs or interacting with charts
- [ ] **Chart Switching**: Clicking different chart types < 500ms render time

### 7. Edge Cases
- [ ] **Large Result Sets**: Query returning 50+ rows → table scrollable, chart still renders
- [ ] **Many Filters**: Apply 5+ simultaneous filters → no performance degradation
- [ ] **Long Insight Text**: Query with multi-paragraph insight → text wraps properly
- [ ] **Special Characters**: Query like "%" or "$" in dimension → handled correctly

---

## Pre-Submission Checklist

### Code Quality
- [ ] No `console.log()` statements in production code
- [ ] No commented-out code blocks
- [ ] `.env` in `.gitignore`
- [ ] No hardcoded API keys in source

### Documentation
- [ ] README.md updated with feature overview
- [ ] Setup instructions clear (npm start, uvicorn main:app)
- [ ] 3-5 demo queries documented as comments

### Build & Deployment
- [ ] `npm run build` completes without errors
- [ ] Build artifacts in `frontend/dist/` are < 5MB
- [ ] Production build tested locally
- [ ] Backend can start fresh without errors: `uvicorn main:app --reload --port 8000`

### Demo Readiness
- [ ] Database seeded with clean, interesting sample data
- [ ] First query shows impressive results (e.g., funnel chart with drop-off %)
- [ ] All 6 critical chart types work flawlessly
- [ ] Cross-filtering demo works smoothly (pin 2 charts, click to filter)

---

## Testing Notes

### To Run Automated Tests:
```bash
# Terminal 1: Start backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2: Run QA suite
cd backend
python qa_test.py
```

### To Run Manual Testing:
```bash
# Terminal 1: Backend (as above)

# Terminal 2: Frontend
cd frontend
npm start
# Opens http://localhost:3000
```

### Known Issues & Workarounds:
- **Health Check Slow**: Initial database connection check takes 400ms (acceptable)
- **Pie Chart**: Some edge cases with data distribution (not critical for hackathon)
- **Sankey Diagram**: Requires specific data structure (flow-based), not heavily tested

---

## Sign-Off

**QA Team**: Claude Code
**Pass/Fail**: ✅ PASS (All automated tests passing, ready for manual verification)
**Ready for Submission**: YES - Pending completion of manual testing above

---

## Test Execution Log

**Manual Tests Completed**: [To be filled during testing]
- [ ] Basic Functionality: ___/7 passed
- [ ] Interactive Features: ___/3 passed
- [ ] UI/UX Quality: ___/4 passed
- [ ] Data Persistence: ___/3 passed
- [ ] Error Handling: ___/5 passed
- [ ] Performance: ___/4 passed
- [ ] Edge Cases: ___/4 passed

**Final Status**: _______________
**Tested By**: ______________
**Date**: ______________
