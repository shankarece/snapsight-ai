# SnapSight AI - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                           │
│                  Asks: "Show revenue by month"                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              AZURE APP SERVICE (Frontend)                       │
│         React + Recharts (12+ Chart Types)                      │
│         Built with GitHub Copilot Agent Mode                    │
│         snapsight-ai-frontend.azurewebsites.net                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ POST /api/ask
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              AZURE APP SERVICE (Backend)                         │
│              FastAPI + Python 3.11                               │
│              snapsight-ai-backend.azurewebsites.net              │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │              4-AGENT AI PIPELINE                          │   │
│  │                                                           │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌──────────────┐  │   │
│  │  │   Agent 1   │    │   Agent 2   │    │   Agent 3    │  │   │
│  │  │   Query     │───▶│    SQL      │───▶│    Viz       │  │   │
│  │  │ Understanding│   │ Generation  │    │ Suggestions  │  │   │
│  │  │  (GPT-4o)   │    │  (GPT-4o)   │    │ (Rule-based) │  │   │
│  │  └─────────────┘    └──────┬──────┘    └──────────────┘  │   │
│  │                            │                              │   │
│  │                            │ SQL Query    ┌──────────────┐│   │
│  │                            │              │   Agent 4    ││   │
│  │                            │              │   Insight    ││   │
│  │                            │              │ Generation   ││   │
│  │                            │              │  (GPT-4o)    ││   │
│  │                            │              └──────────────┘│   │
│  └────────────────────────────┼──────────────────────────────┘   │
└───────────────────────────────┼──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AZURE SQL DATABASE                            │
│              Tables: sales, customers, products, pipeline       │
│              snapsight-server1.database.windows.net              │
└─────────────────────────────────────────────────────────────────┘

                    OTHER AZURE SERVICES:
┌──────────────────────┐    ┌──────────────────────┐
│  AZURE OPENAI        │    │  AZURE CONTAINER     │
│  GPT-4o Model        │    │  REGISTRY (ACR)      │
│  Powers Agents 1,2,4 │    │  Docker Images       │
└──────────────────────┘    └──────────────────────┘

┌──────────────────────┐    ┌──────────────────────┐
│  GITHUB COPILOT      │    │  GITHUB ACTIONS      │
│  Agent Mode          │    │  CI/CD Pipeline      │
│  Dev Assistance      │    │  Auto Deploy         │
└──────────────────────┘    └──────────────────────┘
```

## Azure Services Used
| Service | Purpose |
|---------|---------|
| Azure OpenAI (GPT-4o) | Powers 3 of 4 AI agents (Query, SQL, Insight) |
| Azure SQL Database | Stores business data across 4 tables |
| Azure App Service | Hosts backend API and frontend app |
| Azure Container Registry | Stores Docker images for deployment |
| GitHub Copilot Agent Mode | AI-assisted development |
| GitHub Actions | CI/CD pipeline for automated deployment |

## Data Flow
1. User types natural language question
2. Frontend sends request to Backend API
3. Agent 1 (Query Understanding) parses intent using Azure OpenAI GPT-4o
4. Agent 2 (SQL Generation) creates T-SQL query using Azure OpenAI GPT-4o
5. SQL executes against Azure SQL Database
6. Agent 3 (Visualization) recommends chart types (rule-based)
7. Agent 4 (Insight Generation) creates business insight using Azure OpenAI GPT-4o
8. Backend returns data + charts + insight to Frontend
9. Frontend renders interactive Recharts visualizations
