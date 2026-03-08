# DataSpeak: AI-Powered Analytics Platform - MICROSOFT HACKATHON 2026

> Democratizing Data Access Through Conversational AI | Complete Documentation Package

**Status:** MVP Development | **Duration:** 48-72 Hours | **Location:** Singapore

---

## PROJECT OVERVIEW

DataSpeak is an intelligent business intelligence platform that combines NLP with interactive dashboards. It enables business users to ask questions about data in plain English and get instant AI-powered insights without requiring SQL knowledge.

**Inspired by:** ThoughtSpot

---

## KEY FEATURES

### 1. Spotter - AI Data Analyst
- Conversational natural language interface
- Auto SQL query generation
- Real-time query execution
- Example: "Show sales trends last quarter" -> Auto-generated chart

### 2. Interactive Dashboard
- KPI metric cards with trend indicators
- Period-over-period comparisons (up/down %)
- Multiple visualization types (line, bar, metric cards)
- Real-time data updates

### 3. Smart Search & Library
- Global cross-object search
- Filter by type, author, tags
- Favorites/Watchlist
- <100ms latency

### 4. Watchlist & Alerts
- Pin important metrics
- Custom thresholds
- Email notifications
- Real-time monitoring

### 5. Data Integration
- PostgreSQL/SQL Server support
- CSV file uploads
- REST API connectivity
- Live sync capability

---

## TECH STACK

**Frontend:** React 18 + TypeScript + Tailwind CSS + Recharts
**Backend:** Express.js + Node.js + TypeScript + Prisma ORM
**Database:** PostgreSQL + Redis Cache
**AI/LLM:** Azure OpenAI API + Langchain.js
**Authentication:** JWT + bcrypt
**Deployment:** Vercel (Frontend) + Railway (Backend) + Supabase (Database)

---

## QUICK START GUIDE

### Prerequisites
```
Node.js 18+
PostgreSQL 14+
npm 9+
Git
GitHub Account (optional)
```

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run db:migrate
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with API URL
npm start
```

### Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api-docs

---

## PROJECT STRUCTURE

```
dataspeak/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   ├── migrations/
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── redux/
│   │   └── types/
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── database/
│   ├── migrations/
│   └── seeds/
└── docs/
```

---

## CORE API ENDPOINTS

### Authentication
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
```

### Spotter AI
```
POST   /api/spotter/query
GET    /api/spotter/suggestions
```

### Dashboards
```
GET    /api/dashboards
POST   /api/dashboards
GET    /api/dashboards/:id
PUT    /api/dashboards/:id
```

### Metrics
```
GET    /api/metrics
POST   /api/metrics
GET    /api/metrics/:id
PUT    /api/metrics/:id
```

### Search
```
GET    /api/search?q=term
GET    /api/search/trending
```

### Watchlist
```
GET    /api/watchlist
POST   /api/watchlist/:metricId
DELETE /api/watchlist/:metricId
```

---

## SYSTEM ARCHITECTURE

```
Frontend (React)
    |
API Gateway (Express.js)
    |
    +-- Spotter Logic (NLP to SQL)
    +-- Dashboard Service
    +-- Search Service
    |
    +-- LLM (Azure OpenAI)
    +-- Database (PostgreSQL)
    +-- Cache (Redis)
```

---

## DATABASE SCHEMA (CORE TABLES)

### users
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- name (VARCHAR)
- created_at (TIMESTAMP)

### dashboards
- id (UUID, PK)
- user_id (UUID, FK)
- title (VARCHAR)
- description (TEXT)
- dashboard_json (JSONB)
- created_at (TIMESTAMP)

### metrics
- id (UUID, PK)
- dashboard_id (UUID, FK)
- title (VARCHAR)
- metric_type (ENUM)
- query (TEXT)
- refresh_interval (INT)

### watchlist
- id (UUID, PK)
- user_id (UUID, FK)
- metric_id (UUID, FK)
- alert_threshold (NUMERIC)
- alert_enabled (BOOLEAN)

---

## SECURITY FEATURES

checkmark JWT authentication
checkmark Password hashing (bcrypt)
checkmark SQL injection prevention
checkmark CORS configuration
checkmark Rate limiting (100 req/min)
checkmark Input validation
checkmark HTTPS production ready

---

## WHY DATASPEAK WINS HACKATHON

checkmark Innovation: NLP-powered analytics democratization
checkmark Speed: 48-hour MVP achievable
checkmark UX: Zero SQL knowledge required
checkmark Feasibility: Standard tech stack
checkmark Market Impact: Solves real enterprise problems
checkmark Technical Excellence: Clean, scalable architecture

---

## RESOURCES

- React Documentation: https://react.dev/
- Express.js Guide: https://expressjs.com/
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Azure OpenAI: https://learn.microsoft.com/azure/cognitive-services/openai/
- Langchain.js: https://js.langchain.com/
- Prisma ORM: https://www.prisma.io/

---

## TEAM

- Your Name - Full Stack Developer
- Team Member 2 - Frontend Specialist
- Team Member 3 - AI/ML Engineer

---

## FILE MANIFEST

This complete package includes:

1. **README.md** - Project overview and quick start (THIS FILE)
2. **ARCHITECTURE.md** - Detailed system architecture and design
3. **API_DOCUMENTATION.md** - Complete API endpoints with examples
4. **DATABASE_SCHEMA.md** - Database design and relationships
5. **IMPLEMENTATION_GUIDE.md** - Step-by-step implementation instructions
6. **TECH_STACK_DETAILS.md** - Detailed technology selections and rationale
7. **DEPLOYMENT_GUIDE.md** - Production deployment instructions
8. **TESTING_GUIDE.md** - Testing strategies and examples

---

**Built with love for Microsoft Hackathon 2026 | Singapore**

**Last Updated:** March 7, 2026
**Version:** 1.0.0-hackathon