"""
SnapSight AI - Agent 1: Query Understanding Agent
Interprets the user's natural language question and extracts structured intent.
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

SYSTEM_PROMPT = """You are a query understanding agent for a business intelligence tool.
Your job is to analyze a user's natural language question about business data and extract structured intent.

Given a question, return a JSON object with these fields:
{
    "intent": "trend" | "comparison" | "breakdown" | "ranking" | "aggregation" | "funnel" | "single_metric",
    "metrics": ["revenue", "expenses", "profit", etc.],
    "dimensions": ["month", "region", "product_category", etc.],
    "filters": {"column": "value"} or {},
    "time_range": "last_quarter" | "this_year" | "all_time" | "monthly" | null,
    "aggregation": "SUM" | "COUNT" | "AVG" | "MAX" | "MIN",
    "sort_order": "DESC" | "ASC" | null,
    "limit": number or null,
    "original_question": "the original question"
}

Available tables and columns:
- sales: id, sale_date, product_category (Cloud Services/Consulting/Licenses/Support), region (North America/Europe/Asia Pacific/Latin America), salesperson, revenue, expenses, units_sold, quarter (Q1/Q2/Q3/Q4)
- customers: id, customer_name, signup_date, customer_type (new/returning/churned), region, lifetime_value, industry (Technology/Finance/Healthcare/Retail/Manufacturing/Education)
- products: id, product_name, category, launch_date, price, monthly_revenue
- pipeline: id, deal_name, stage (Lead/Qualified/Proposal/Negotiation/Closed Won/Closed Lost), deal_value, salesperson, created_date, expected_close

Return ONLY valid JSON. No explanation, no markdown, no code blocks."""


async def understand_question(question: str) -> dict:
    """
    Takes a natural language question and returns structured intent.
    """
    try:
        response = client.chat.completions.create(
            model=DEPLOYMENT,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": question}
            ],
            temperature=0.1,
            max_tokens=500
        )

        result_text = response.choices[0].message.content.strip()

        # Clean up response - remove markdown code blocks if present
        if result_text.startswith("```"):
            result_text = result_text.split("\n", 1)[1]
            result_text = result_text.rsplit("```", 1)[0]

        intent = json.loads(result_text)
        intent["original_question"] = question
        return intent

    except json.JSONDecodeError:
        # Fallback if LLM doesn't return valid JSON
        return {
            "intent": "aggregation",
            "metrics": ["revenue"],
            "dimensions": [],
            "filters": {},
            "time_range": "all_time",
            "aggregation": "SUM",
            "sort_order": "DESC",
            "limit": 20,
            "original_question": question
        }
    except Exception as e:
        print(f"Query Agent Error: {e}")
        return {
            "intent": "aggregation",
            "metrics": ["revenue"],
            "dimensions": [],
            "filters": {},
            "time_range": "all_time",
            "aggregation": "SUM",
            "sort_order": "DESC",
            "limit": 20,
            "original_question": question,
            "error": str(e)
        }
