# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (Python/FastAPI)
```bash
# From the backend/ directory
cd backend

# Start the API server (required before using the frontend)
uvicorn main:app --reload --port 8000

# Seed the database (run once after setting up Azure SQL)
py database/seed_data.py

# Test database connection
py database/connection.py
```

### Frontend (React)
```bash
# From the frontend/ directory
cd frontend

npm start        # Start dev server at http://localhost:3000
npm run build    # Production build
npm test         # Run tests (Jest / React Testing Library)
npm test -- --testPathPattern="App"  # Run a specific test file
```

## Architecture

SnapSight AI is a natural language BI tool. Users type a plain-English question; the backend runs a 4-agent pipeline that returns SQL, data, chart suggestions, and an AI insight; the frontend renders interactive charts and lets users pin favorites to a pinboard.

### Backend: 4-Agent Pipeline

All agents live in `backend/agents/`. The orchestrator (`orchestrator.py`) runs them sequentially:

1. **`query_agent.py`** — Calls Azure OpenAI to parse the question into structured intent JSON (intent type, metrics, dimensions, filters, time range).
2. **`sql_agent.py`** — Calls Azure OpenAI with the schema + structured intent to generate a T-SQL SELECT query. Only SELECT statements are allowed; non-SELECT output falls back to a safe default query.
3. **`viz_agent.py`** — Pure Python (no LLM). Analyzes column names and data shape to produce 3–4 chart suggestions (bar, line, area, pie, donut, horizontal bar, funnel, KPI). Always caps at 4 suggestions.
4. **`insight_agent.py`** — Calls Azure OpenAI with the data to produce a 1–2 sentence business insight.

The orchestrator retries SQL generation once (without intent) if the first database execution fails.

### API Response Shape (`POST /api/ask`)

```json
{
  "question": "...",
  "sql": "SELECT ...",
  "data": [...],
  "columns": [...],
  "suggestions": [{ "chart_type", "title", "subtitle", "label", "config": { "x_key", "y_keys", "colors", "columns" } }],
  "insight": "...",
  "success": true,
  "agent_steps": [...]
}
```

### Frontend

React (Create React App) + Recharts. All state lives in `App.js` — no Redux or context.

- `App.js` — Two tabs: **Ask** (search + results) and **Pinboard** (pinned widgets). Each query creates a `queryGroup` with multiple `suggestions`; users pin individual suggestions.
- `components/ChartWidget.js` — Renders any chart type from a suggestion object using Recharts.
- `components/SearchBar.js` — Input with suggestion chips fetched from `/api/suggestions`.
- `components/AgentThinking.js` — Loading animation shown while the pipeline runs.
- `src/api.js` — Thin fetch wrapper; `API_BASE` is hardcoded to `http://localhost:8000`.

### Database

Azure SQL Database (T-SQL) accessed via `pymssql`. Four tables: `sales`, `customers`, `products`, `pipeline`. Schema details are duplicated in both `database/schema.py` (string constant) and hardcoded in each agent's system prompt.

### Environment Variables

Required in `backend/.env`:

```
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_KEY=
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_SQL_SERVER=
AZURE_SQL_DATABASE=
AZURE_SQL_USERNAME=
AZURE_SQL_PASSWORD=
```
