"""
SnapSight AI - Agent 4: Insight Generation Agent
Analyzes query results and generates plain-English business insights.
"""

import os
import json
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version="2024-10-21"
)

DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")

SYSTEM_PROMPT = """You are a business intelligence insight agent. Given a user's question and the data results from a SQL query, generate a concise, actionable business insight.

RULES:
- Write exactly 1-2 sentences
- Include specific numbers and percentages from the data
- Highlight the most important finding or trend
- Make it actionable - suggest what the data implies for business decisions
- Use plain English, no jargon
- Do NOT mention SQL, queries, databases, or technical terms
- Do NOT start with "Based on the data" or "The data shows"
- Start directly with the insight
- Format large numbers with K (thousands) or M (millions)

EXAMPLES:
- "Revenue grew 45% from Q1 ($420K) to Q4 ($610K), with Cloud Services driving 60% of the growth. Consider increasing Cloud investment for next quarter."
- "North America leads with $2.1M in sales, but Asia Pacific grew fastest at 94% YoY. APAC expansion could be a high-ROI opportunity."
- "Customer churn dropped from 25 to 12 per month (-52%) while new acquisitions rose 58%. The retention strategy is clearly working."
"""


async def generate_insight(question: str, data: list, columns: list) -> str:
    """
    Takes the question and query results, returns a business insight string.
    """
    try:
        # Limit data sent to LLM to save tokens
        sample_data = data[:20] if len(data) > 20 else data

        user_message = (
            f"Question: {question}\n\n"
            f"Columns: {columns}\n\n"
            f"Data ({len(data)} rows):\n{json.dumps(sample_data, indent=2, default=str)}"
        )

        response = client.chat.completions.create(
            model=DEPLOYMENT,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3,
            max_tokens=200
        )

        insight = response.choices[0].message.content.strip()

        # Clean up any quotes
        if insight.startswith('"') and insight.endswith('"'):
            insight = insight[1:-1]

        return insight

    except Exception as e:
        print(f"Insight Agent Error: {e}")
        # Generate a basic fallback insight
        if data and columns:
            row_count = len(data)
            col_count = len(columns)
            return f"Found {row_count} results across {col_count} dimensions. Explore the chart for detailed patterns."
        return "Data retrieved successfully. Explore the chart to discover insights."
