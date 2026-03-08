"""
SnapSight AI - Agent Orchestrator (v2)
Now returns MULTIPLE chart suggestions per question.
"""

import sys
import os
import asyncio

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.sql_agent import generate_sql
from agents.viz_agent import recommend_charts
from agents.insight_agent import generate_insight
from database.connection import execute_query


async def process_question(question: str) -> dict:
    """
    Main orchestration pipeline — 3-agent design (query_agent removed to reduce latency).
    SQL agent has the full schema and works well without pre-parsed intent.
    Viz + insight agents run in parallel.
    """
    result = {
        "question": question,
        "sql": "",
        "data": [],
        "columns": [],
        "suggestions": [],
        "insight": "",
        "success": True,
        "error": None,
        "agent_steps": []
    }

    try:
        # ====== AGENT 1: SQL Generation ======
        result["agent_steps"].append("Generating SQL query...")
        sql = await generate_sql(question)
        result["sql"] = sql
        result["agent_steps"].append("SQL query generated")

        # ====== EXECUTE SQL ======
        result["agent_steps"].append("Fetching data from database...")
        db_result = execute_query(sql)

        if not db_result["success"]:
            error_msg = db_result.get('error', 'Unknown error')

            # Check if it's a column name error
            if "Invalid column name" in str(error_msg):
                result["success"] = False
                result["error"] = (
                    f"Database error: {error_msg}\n\n"
                    "📋 This suggests a column name mismatch. Your database schema may not match the expected schema.\n\n"
                    "✅ TO FIX:\n"
                    "1. Run the diagnostic: python backend/database/check_schema.py\n"
                    "2. If tables are missing, run: python backend/database/seed_data.py\n"
                    "3. If columns are different, update the schema definition."
                )
                result["insight"] = "The database schema doesn't match expectations. Please check your database configuration."
                return result

            # Retry with simplified query
            result["agent_steps"].append("Retrying with rephrased query...")
            sql = await generate_sql(question + " (simplify if needed)")
            result["sql"] = sql
            db_result = execute_query(sql)

        if not db_result["success"]:
            result["success"] = False
            error_msg = db_result.get('error', 'Unknown error')

            # More detailed error message
            if "Invalid column name" in str(error_msg):
                result["error"] = (
                    f"Database error: {error_msg}\n\n"
                    "The column referenced in the query doesn't exist in your database.\n"
                    "Please verify your database tables are properly created and seeded."
                )
            else:
                result["error"] = f"Database error: {error_msg}"

            result["insight"] = "Sorry, I couldn't fetch data for this question. Please check your database configuration or try rephrasing."
            return result

        result["data"] = db_result["data"]
        result["columns"] = db_result["columns"]
        result["agent_steps"].append(f"Retrieved {db_result['row_count']} rows")

        # ====== AGENTS 2 & 3: Viz + Insight (parallel) ======
        result["agent_steps"].append("Generating charts & insight...")
        suggestions, insight = await asyncio.gather(
            recommend_charts(question, {}, db_result["columns"], db_result["data"]),
            generate_insight(question, db_result["data"], db_result["columns"]),
        )
        result["suggestions"] = suggestions
        result["insight"] = insight
        result["agent_steps"].append(f"Generated {len(suggestions)} chart options + insight")

        return result

    except Exception as e:
        result["success"] = False
        result["error"] = str(e)
        result["insight"] = "An error occurred while processing your question. Please try again."
        return result
