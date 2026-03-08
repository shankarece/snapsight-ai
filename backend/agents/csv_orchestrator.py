"""
SnapSight AI - CSV Orchestrator
Handles questions about user-uploaded CSV data.
Skips SQL generation; runs viz + insight agents on the provided data.
"""

import asyncio
from agents.viz_agent import recommend_charts
from agents.insight_agent import generate_insight


async def process_csv_question(question: str, data: list, columns: list) -> dict:
    """
    Pipeline for CSV-mode queries.
    Data is already in memory — no SQL or query_agent needed.
    """
    result = {
        "question": question,
        "sql": "(CSV upload — no SQL generated)",
        "data": data,
        "columns": columns,
        "suggestions": [],
        "insight": "",
        "success": True,
        "error": None,
        "agent_steps": ["CSV data loaded", f"Retrieved {len(data)} rows"],
    }

    try:
        result["agent_steps"].append("Generating charts & insight...")

        suggestions, insight = await asyncio.gather(
            recommend_charts(question, {}, columns, data),
            generate_insight(question, data, columns),
        )

        result["suggestions"] = suggestions
        result["insight"] = insight
        result["agent_steps"].append(f"Generated {len(suggestions)} chart options + insight")

    except Exception as e:
        result["success"] = False
        result["error"] = str(e)
        result["insight"] = "An error occurred while analyzing your CSV data."

    return result
