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


@app.get("/api/insights/catalog")
async def get_insights_catalog():
    """
    Return a static categorized list of ~20 possible questions based on the schema.
    No DB call — purely informational for the discovery home screen.
    """
    return {
        "categories": [
            {
                "name": "Sales",
                "questions": [
                    "Show revenue trend by month for the latest year",
                    "Break down revenue by product category",
                    "Which region has the highest total revenue?",
                    "Top 5 salespeople by total revenue",
                    "Revenue vs expenses trend by quarter"
                ]
            },
            {
                "name": "Customers",
                "questions": [
                    "Compare new vs returning vs churned customer counts by region",
                    "Which industry has the most customers?",
                    "Customer lifetime value by industry",
                    "Customer acquisition trend by month",
                    "Customer type breakdown by region"
                ]
            },
            {
                "name": "Pipeline",
                "questions": [
                    "Show the sales pipeline funnel by stage",
                    "Average deal value by pipeline stage",
                    "Total deals by stage and region",
                    "Deals created by month",
                    "Expected close date distribution"
                ]
            },
            {
                "name": "Products",
                "questions": [
                    "Which product category has the highest profit margin?",
                    "Monthly revenue by product category",
                    "Product price vs monthly revenue correlation",
                    "Top products by units sold",
                    "Product launch date impact on revenue"
                ]
            }
        ]
    }


# ---- GitHub Copilot Integration Endpoints ----

@app.post("/api/copilot-explain")
async def copilot_explain(request: dict):
    """
    Copilot-style deep insight explanation.
    Analyzes query + data + existing insight and generates deeper business context.
    """
    try:
        question = request.get("question", "")
        data = request.get("data", [])
        insight = request.get("insight", "")
        chart_type = request.get("chart_type", "unknown")

        if not data or not insight:
            return {
                "success": True,
                "explanation": "This analysis looks interesting! To understand it better, I'd need more context about your specific business goals and KPIs."
            }

        # Use LLM to generate deeper explanation
        from agents.insight_agent import generate_insight
        from agents.query_agent import parse_intent

        deeper_prompt = f"""
You are a business intelligence consultant analyzing a data visualization.

User's original question: {question}
Chart type: {chart_type}
Current insight: {insight}

Sample data (first 3 rows):
{data[:3]}

Provide a deeper 2-3 paragraph analysis that:
1. Explains WHY this pattern exists (root causes, business drivers)
2. What implications this has for business decisions
3. What specific actions should be taken
4. Any risks, opportunities, or trends highlighted by this data

Use professional business language. Reference specific numbers from the data.
Provide actionable recommendations, not just observations.
        """

        # Call Azure OpenAI for explanation
        import os
        from openai import AsyncAzureOpenAI

        client = AsyncAzureOpenAI(
            api_version="2024-02-15-preview",
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_KEY")
        )

        response = await client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
            messages=[{"role": "user", "content": deeper_prompt}],
            temperature=0.7,
            max_tokens=500
        )

        explanation = response.choices[0].message.content

        return {
            "success": True,
            "explanation": explanation
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Copilot explanation failed: {str(e)}",
            "explanation": "Unable to generate deeper insights at this time. Please try again."
        }


@app.post("/api/copilot-suggest")
async def copilot_suggest(request: dict):
    """
    Copilot-style next step suggestions.
    Suggests logical follow-up questions based on current query and data.
    """
    try:
        question = request.get("question", "")
        data = request.get("data", [])
        columns = request.get("columns", [])

        if not question or not columns:
            return {
                "success": True,
                "suggestions": [
                    "Break down by product category",
                    "Compare this vs previous period",
                    "Analyze by customer segment"
                ]
            }

        suggestion_prompt = f"""
Based on the user's analysis question and available data, suggest 3-4 logical next steps.

Original question: {question}
Available columns: {columns}

Suggest follow-up questions that:
- Drill down into key dimensions
- Compare across important segments
- Investigate underlying trends
- Test assumptions

Format as JSON array: ["Question 1", "Question 2", ...]
Each question should be actionable and specific.
        """

        import os
        from openai import AsyncAzureOpenAI
        import json

        client = AsyncAzureOpenAI(
            api_version="2024-02-15-preview",
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_KEY")
        )

        response = await client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
            messages=[{"role": "user", "content": suggestion_prompt}],
            temperature=0.7,
            max_tokens=300
        )

        response_text = response.choices[0].message.content
        suggestions = json.loads(response_text)

        return {
            "success": True,
            "suggestions": suggestions if isinstance(suggestions, list) else [suggestions]
        }

    except Exception as e:
        return {
            "success": True,
            "suggestions": [
                "Show breakdown by category",
                "Compare trend over time",
                "Analyze by region"
            ]
        }


@app.post("/api/copilot-chat")
async def copilot_chat(request: dict):
    """
    Copilot-style interactive chat about a specific chart or dataset.
    Answer user questions about the current visualization.
    """
    try:
        user_question = request.get("question", "")
        data = request.get("data", [])
        chart_type = request.get("chart_type", "")
        columns = request.get("columns", [])

        if not user_question:
            return {"success": False, "error": "Question required"}

        chat_prompt = f"""
You are analyzing a {chart_type} chart with the following data structure.

Columns: {columns}
Sample data (first 5 rows):
{data[:5]}

User question: {user_question}

Provide a direct, specific answer based on the data shown.
- Reference actual values and percentages when possible
- Be concise (2-3 sentences max)
- If asking about a trend, describe the direction and magnitude
- If asking about a comparison, give the actual difference
        """

        import os
        from openai import AsyncAzureOpenAI

        client = AsyncAzureOpenAI(
            api_version="2024-02-15-preview",
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_KEY")
        )

        response = await client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
            messages=[{"role": "user", "content": chat_prompt}],
            temperature=0.7,
            max_tokens=200
        )

        answer = response.choices[0].message.content

        return {
            "success": True,
            "response": answer
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Chat failed: {str(e)}",
            "response": "I'm having trouble analyzing this right now. Please try again."
        }


# ---- Run Server ----
if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("  SnapSight AI - Starting Server")
    print("  From prompt to pinboard in seconds.")
    print("=" * 50 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
