"""
SnapSight AI - FastAPI Backend Server
Main entry point for the API.

Run with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import asyncio
import random

from agents.orchestrator import process_question
from agents.csv_orchestrator import process_csv_question
from database.connection import test_connection

# ---- App Setup ----
app = FastAPI(
    title="SnapSight AI",
    description="From prompt to pinboard in seconds. AI-powered natural language BI.",
    version="1.0.0"
)

# Allow frontend to connect (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Models ----
class QuestionRequest(BaseModel):
    question: str

class CsvQuestionRequest(BaseModel):
    question: str
    data: list
    columns: list


class HealthResponse(BaseModel):
    status: str
    database: str
    message: str


# ---- Routes ----

@app.get("/")
async def root():
    """Root endpoint - API info."""
    return {
        "app": "SnapSight AI",
        "tagline": "From prompt to pinboard in seconds.",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if the API and database are working."""
    db_ok = test_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "message": "SnapSight AI is running!"
    }


@app.post("/api/ask")
async def ask_question(request: QuestionRequest):
    """
    Main endpoint - takes a natural language question and returns
    chart data, SQL, visualization config, and AI insight.
    
    This is where the 4-agent pipeline runs:
    1. Query Understanding Agent
    2. SQL Generation Agent  
    3. Visualization Agent
    4. Insight Generation Agent
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    result = await process_question(request.question)

    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail={
                "error": result.get("error", "Unknown error"),
                "question": request.question
            }
        )

    return result


@app.post("/api/ask-csv")
async def ask_csv_question(request: CsvQuestionRequest):
    """
    Analyze a user's uploaded CSV data with a natural language question.
    Skips SQL generation — data is provided directly.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    if not request.data:
        raise HTTPException(status_code=400, detail="No data provided")

    result = await process_csv_question(request.question, request.data, request.columns)

    if not result["success"]:
        raise HTTPException(status_code=500, detail={"error": result.get("error", "Unknown error")})

    return result


@app.post("/api/discover")
async def discover_insights():
    """
    SpotIQ-style: run 4 diverse analytical questions in parallel and return results.
    Covers revenue trends, customer segments, pipeline health, and regional performance.
    """
    discovery_pool = [
        "Show revenue trend by month for the latest year",
        "Which product category has the highest profit margin?",
        "Compare new vs returning vs churned customer counts by region",
        "Show the sales pipeline funnel by stage",
        "Who are the top 5 salespeople by total revenue?",
        "Which region has the highest total revenue?",
        "What is the average deal value by pipeline stage?",
        "Show customer lifetime value by industry",
        "What is the revenue vs expenses trend by quarter?",
        "Which industry has the most customers?",
    ]
    selected = random.sample(discovery_pool, 4)
    tasks = [process_question(q) for q in selected]
    raw_results = await asyncio.gather(*tasks, return_exceptions=True)
    valid_results = [r for r in raw_results if isinstance(r, dict) and r.get("success")]
    return {"results": valid_results}


@app.get("/api/suggestions")
async def get_suggestions():
    """Return suggested questions for the frontend."""
    return {
        "suggestions": [
            "Show me revenue vs expenses by month",
            "What is our profit trend this year?",
            "Break down revenue by product category",
            "Compare regional performance by quarter",
            "How is customer retention trending?",
            "Show me the sales pipeline funnel",
            "Who are our top 5 salespeople by revenue?",
            "What is the average deal value by stage?",
            "Which industry has the highest customer lifetime value?",
            "Show me monthly customer acquisition"
        ]
    }


# ---- Run Server ----
if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("  SnapSight AI - Starting Server")
    print("  From prompt to pinboard in seconds.")
    print("=" * 50 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
