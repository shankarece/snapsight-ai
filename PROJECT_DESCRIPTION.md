# SnapSight AI - From Prompt to Pinboard in Seconds

## Problem Solved
Business users struggle to extract insights from databases — they depend on analysts, wait for reports, and rarely get real-time answers. SnapSight AI eliminates this bottleneck by letting anyone ask plain-English questions and instantly receive interactive charts, SQL queries, and AI-generated insights.

## Features & Functionality
- **Natural Language BI**: Type any business question ("Show me revenue by month", "Sales pipeline funnel by stage") and get instant visual answers
- **4-Agent AI Pipeline**: Each query runs through 4 specialized AI agents:
  1. **Query Understanding Agent** — Parses natural language into structured intent
  2. **SQL Generation Agent** — Converts intent into safe T-SQL queries
  3. **Visualization Agent** — Recommends 3-4 optimal chart types (bar, line, funnel, pie, scatter, etc.)
  4. **Insight Agent** — Generates a business insight explaining the data
- **12+ Chart Types**: Bar, Line, Area, Pie, Donut, Funnel, Horizontal Bar, KPI, Scatter, Waterfall, Combo, Heatmap
- **Interactive Pinboard**: Pin favorite charts to build custom dashboards
- **Cross-Filter Dashboards**: Click any chart element to filter all other widgets
- **Follow-Up Questions**: Conversational interface for drilling deeper into data
- **Multi-Tab Interface**: Ask, Liveboard, Answers, Library, History tabs
- **SpotIQ-Style Discovery**: Auto-generate 4 diverse analytical insights in parallel
- **Copilot Integration**: AI-powered explain, suggest, and chat features for deeper analysis

## Technologies Used
- **Azure OpenAI (GPT-4o)** — Powers all 4 AI agents for NLP, SQL generation, and insight generation
- **Azure SQL Database** — Stores business data (sales, customers, products, pipeline)
- **Azure App Service** — Hosts both backend API and frontend application
- **Azure Container Registry** — Stores Docker images for deployment
- **GitHub Copilot Agent Mode** — Used during development for code generation and feature implementation
- **GitHub Actions** — CI/CD pipeline for automated deployment
- **FastAPI (Python)** — Backend REST API with async support
- **React + Recharts** — Frontend with 12+ interactive chart types
- **Docker** — Containerized deployment for both services

## Architecture
1. User types a question in the React frontend
2. Frontend sends POST request to FastAPI backend on Azure App Service
3. Backend orchestrator runs 4 AI agents sequentially via Azure OpenAI GPT-4o
4. SQL agent queries Azure SQL Database for real data
5. Visualization agent recommends optimal chart types
6. Insight agent generates business explanation
7. Frontend renders interactive charts with pin/filter/drill-down capabilities

## Live URLs
- Frontend: https://snapsight-ai-frontend.azurewebsites.net
- Backend API: https://snapsight-ai-backend.azurewebsites.net
- GitHub: https://github.com/shankarece/snapsight-ai
