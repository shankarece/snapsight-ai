# SnapSight AI - From Prompt to Pinboard in Seconds

An AI-powered natural language Business Intelligence tool that transforms plain English questions into interactive data visualizations and insights, powered by Azure OpenAI and built with React + FastAPI.

## 🚀 Quick Overview

**SnapSight AI** is a modern BI platform inspired by ThoughtSpot that uses Claude/GPT-4 to understand natural language business questions, generates SQL queries, executes them, and creates beautiful interactive charts—all in seconds.

### Key Features

- **Natural Language Queries** - Ask questions in plain English, get instant answers
- **Multi-Chart Recommendations** - Automatically suggests 3-4 visualization options
- **AI-Powered Insights** - Get business insights alongside your data
- **Interactive Pinboard** - Pin favorite charts and create dashboards
- **Cross-Filtering** - Click-to-filter across multiple charts
- **CSV Upload Support** - Analyze your own data without setup
- **Dark/Light Theme** - Professional UI matching ThoughtSpot design
- **Query History & Answers Tab** - Keep track of all your analyses

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  - 3-Panel ThoughtSpot-style layout                         │
│  - Interactive Recharts visualizations                      │
│  - Real-time cross-filtering & drill-down                   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (FastAPI)                      │
│  - CORS-enabled                                             │
│  - CSV upload endpoint                                      │
│  - Health checks & metrics                                  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              3-Agent AI Pipeline (Async)                     │
│  1. SQL Agent     - NLP → T-SQL generation                  │
│  2. Viz Agent     - Chart type recommendation               │
│  3. Insight Agent - Business intelligence extraction        │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              Azure Services                                 │
│  - Azure OpenAI (gpt-4o) - LLM backbone                     │
│  - Azure SQL Database    - Data layer                       │
│  - (Optional) Azure Container Registry - Docker images      │
│  - (Optional) Azure App Service - Deployment                │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite
- **Recharts 3** for interactive visualizations
- **Lucide Icons** for UI icons
- **React Grid Layout** for dashboard drag-drop
- **LocalStorage** for persistence

### Backend
- **FastAPI** (Python 3.9+)
- **Azure OpenAI SDK** for Claude/GPT-4 integration
- **pymssql** for Azure SQL connectivity
- **Pydantic** for data validation
- **Asyncio** for parallel agent execution

### Infrastructure
- **Azure SQL Database** (T-SQL)
- **Azure OpenAI API** (gpt-4o deployment)
- **(Coming) Azure App Service / Container Apps**
- **(Coming) Azure Container Registry**

## 📋 Prerequisites

- Python 3.9+
- Node.js 18+
- Azure subscription with:
  - Azure SQL Database (configured)
  - Azure OpenAI deployment (gpt-4o)
- Environment variables configured

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/snapsight-ai.git
cd snapsight-ai
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your Azure credentials

# Test database connection
python database/connection.py

# Start the server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm start
```

The frontend will open at `http://localhost:3000` and connect to the backend API at `http://localhost:8000`.

## 🔧 Configuration

### Environment Variables (.env)

Create a `.env` file in the `backend/` directory:

```env
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://<your-instance>.openai.azure.com/
AZURE_OPENAI_KEY=<your-api-key>
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Azure SQL Database
AZURE_SQL_SERVER=<your-server>.database.windows.net
AZURE_SQL_DATABASE=<your-database>
AZURE_SQL_USERNAME=<username>
AZURE_SQL_PASSWORD=<password>
```

### Database Schema

The app expects 4 tables: `sales`, `customers`, `products`, `pipeline`. See `backend/database/schema.py` for full schema definition.

## 🎯 Usage

### Ask Tab
1. Type a natural language question: *"Show revenue by product category"*
2. The 3-agent pipeline processes your question:
   - **SQL Agent** generates T-SQL query
   - **Viz Agent** recommends 3-4 chart types
   - **Insight Agent** extracts business insights
3. Results appear as interactive charts
4. Click chart type rail on right to switch visualizations

### Liveboard (Pinboard)
1. Click "Pin" on any chart to save it
2. Charts are stored in the current dashboard
3. Click elements to cross-filter across all pinned charts
4. Toggle "Enable/Disable" to turn filtering on/off

### Answers Tab
1. All past queries are saved here
2. Click "View" to re-open an analysis
3. Click "Delete" to remove from history

### CSV Upload
1. Drag-drop a CSV onto the left sidebar
2. Ask questions about your CSV data
3. Works with any tabular data

## 📊 Example Queries

- "Show me total sales by region"
- "Which products have the highest revenue?"
- "Break down Q1 revenue by salesperson and product"
- "Top 5 customers by lifetime value"
- "Pipeline deals by stage"

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 🐳 Docker (Coming Soon)

```bash
# Build images
docker-compose build

# Run locally
docker-compose up

# Access at http://localhost:3000
```

## ☁️ Azure Deployment (Coming Soon)

```bash
# Deploy to Azure App Service
az webapp deployment source config-zip --resource-group <rg> --name <app> --src dist.zip

# Deploy to Container Apps
az containerapp up --name snapsight-ai --resource-group <rg> --image <acr>.azurecr.io/snapsight-ai:latest
```

See `DEPLOYMENT.md` for detailed Azure deployment instructions.

## 🤝 API Endpoints

### Ask a Question
```
POST /api/ask
{
  "question": "Show revenue by region"
}
```

Response:
```json
{
  "question": "Show revenue by region",
  "sql": "SELECT region, SUM(revenue) FROM sales GROUP BY region",
  "data": [...],
  "columns": ["region", "revenue"],
  "suggestions": [
    {
      "chart_type": "bar",
      "title": "Revenue by Region",
      "config": {...}
    }
  ],
  "insight": "North region leads with $2.5M in revenue...",
  "agent_steps": [...]
}
```

### CSV Upload
```
POST /api/ask-csv
{
  "question": "Average value by category",
  "data": [...],
  "columns": ["category", "value"]
}
```

### Health Check
```
GET /api/health
```

## 📚 Documentation

- [Architecture & Design](./docs/architecture.md) - System design & agent pipeline
- [API Documentation](./docs/api.md) - Full endpoint reference
- [Deployment Guide](./DEPLOYMENT.md) - Azure setup & deployment
- [Agent System](./docs/agents.md) - How the AI agents work
- [Contributing](./CONTRIBUTING.md) - Development guidelines

## 🎨 UI/UX Design

The frontend is inspired by **ThoughtSpot**, featuring:
- **Light/Dark theme toggle** for professional appearance
- **3-Panel layout**: Column browser (left) + Results (center) + Chart type rail (right)
- **Clean typography** with proper contrast ratios
- **ThoughtSpot-style interactions**: Click-to-filter, drill-down, cross-filtering
- **Responsive design** that works on desktop and tablet

## 🔐 Security

⚠️ **Development-only notes:**
- CORS is set to `["*"]` - restrict to your frontend URL in production
- `.env` file contains sensitive credentials - add to `.gitignore` (already done)
- SQL queries are generated by LLM - validate in production environments
- Use Azure Key Vault for secrets management in production

## 📈 Performance Optimizations

- **Parallel agent execution** - Viz + Insight agents run simultaneously
- **Lazy loading** - Charts load progressively
- **Query caching** - Results cached in localStorage
- **Image optimization** - Recharts handles efficient SVG rendering
- **Code splitting** - React components lazy-loaded

## 🚧 Roadmap

- [ ] GitHub Copilot Agent Mode integration
- [ ] Azure MCP (Model Context Protocol) support
- [ ] Microsoft Agent Framework integration
- [ ] Advanced drill-down with hierarchical data
- [ ] Real-time data source streaming
- [ ] Custom SQL templates & saved queries
- [ ] User authentication & RBAC
- [ ] Advanced filtering UI
- [ ] Export to Excel/PDF
- [ ] Mobile app (React Native)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see `LICENSE` file for details

## 👥 Authors

- Built during Microsoft Hackathon 2026
- Inspired by ThoughtSpot & modern BI platforms

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: Open a GitHub issue
- **Questions**: Check existing discussions

## 🙏 Acknowledgments

- Azure OpenAI team for the powerful LLM API
- ThoughtSpot for UI/UX inspiration
- Recharts team for excellent visualization library
- FastAPI community for the stellar framework

---

**Made with ❤️ for data-driven decision making**
