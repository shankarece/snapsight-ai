"""
SnapSight AI - Agent 2: SQL Generation Agent
Converts structured intent into a valid SQL query for Azure SQL Database.
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

SYSTEM_PROMPT = """You are a SQL expert agent. Given a user's natural language question and a database schema, generate a valid SQL query for Azure SQL Database (T-SQL).

DATABASE SCHEMA:

TABLE: sales
- id (INT, PRIMARY KEY, auto-increment)
- sale_date (DATE) - date of the sale
- product_category (VARCHAR) - values: 'Cloud Services', 'Consulting', 'Licenses', 'Support'
- region (VARCHAR) - values: 'North America', 'Europe', 'Asia Pacific', 'Latin America'
- salesperson (VARCHAR) - name of the salesperson
- revenue (DECIMAL) - sale revenue in USD
- expenses (DECIMAL) - associated expenses in USD
- units_sold (INT) - number of units sold
- quarter (VARCHAR) - values: 'Q1', 'Q2', 'Q3', 'Q4'

TABLE: customers
- id (INT, PRIMARY KEY, auto-increment)
- customer_name (VARCHAR) - company or person name
- signup_date (DATE) - date customer signed up
- customer_type (VARCHAR) - values: 'new', 'returning', 'churned'
- region (VARCHAR) - values: 'North America', 'Europe', 'Asia Pacific', 'Latin America'
- lifetime_value (DECIMAL) - total customer lifetime value in USD
- industry (VARCHAR) - values: 'Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education'

TABLE: products
- id (INT, PRIMARY KEY, auto-increment)
- product_name (VARCHAR) - name of the product
- category (VARCHAR) - values: 'Cloud Services', 'Consulting', 'Licenses', 'Support'
- launch_date (DATE) - product launch date
- price (DECIMAL) - product price in USD
- monthly_revenue (DECIMAL) - average monthly revenue from this product in USD

TABLE: pipeline
- id (INT, PRIMARY KEY, auto-increment)
- deal_name (VARCHAR) - name of the deal/opportunity
- stage (VARCHAR) - values: 'Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'
- deal_value (DECIMAL) - potential deal value in USD
- salesperson (VARCHAR) - salesperson managing the deal
- created_date (DATE) - when the deal was created
- expected_close (DATE) - expected closing date

RULES:
- Return ONLY the SQL query, nothing else
- No markdown, no code blocks, no explanation
- Use appropriate aggregations (SUM, COUNT, AVG)
- Always include ORDER BY for sorted results
- Limit results to TOP 20 rows maximum for visualization
- Use aliases for calculated columns (e.g., SUM(revenue) AS total_revenue)
- For profit calculations, use (revenue - expenses) AS profit
- For monthly trends, use FORMAT(sale_date, 'yyyy-MM') AS month or DATENAME(MONTH, sale_date) AS month
- For quarterly data, use the quarter column directly
- Use GROUP BY for aggregated queries
- Handle 'top N' requests with TOP N
- For questions asking for 'tabular', 'table', 'list', 'show all', 'individual records' or similar:
  Generate a plain SELECT ... FROM table with appropriate WHERE/ORDER BY — do NOT use GROUP BY or aggregate functions.
  These should return raw row-level data, not aggregations.

VISUALIZATION-FRIENDLY OUTPUT RULES (critical for correct charts):
- ALWAYS put the dimension/category column FIRST in SELECT, metrics AFTER
  e.g., SELECT region, SUM(revenue) AS total_revenue  (NOT: SELECT SUM(revenue) AS total_revenue, region)
- Use clear, descriptive aliases: total_revenue, deal_count, avg_price (NOT: s, cnt, x)
- For counts, alias as *_count (e.g., customer_count, deal_count) — NOT as revenue-sounding names
- For units/quantities, alias as units_sold, total_units — NOT with dollar-sign-implying names
- Include at most 1 dimension column and 1-3 metric columns for clean chart rendering
- ORDER BY the primary metric DESC for rankings, or by the dimension ASC for time-series"""


async def generate_sql(question: str, intent: dict = None) -> str:
    """
    Takes a natural language question (and optional structured intent)
    and returns a valid SQL query string.
    """
    try:
        user_message = f"Question: {question}"
        if intent:
            user_message += f"\n\nStructured intent: {json.dumps(intent)}"

        response = client.chat.completions.create(
            model=DEPLOYMENT,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.1,
            max_tokens=500
        )

        sql = response.choices[0].message.content.strip()

        # Clean up - remove markdown code blocks if present
        if sql.startswith("```"):
            sql = sql.split("\n", 1)[1]
            sql = sql.rsplit("```", 1)[0].strip()
        if sql.lower().startswith("sql"):
            sql = sql[3:].strip()

        # Safety check - only allow SELECT statements
        if not sql.upper().strip().startswith("SELECT"):
            return "SELECT TOP 20 product_category, SUM(revenue) AS total_revenue FROM sales GROUP BY product_category ORDER BY total_revenue DESC"

        # Validate common column names to catch schema mismatches early
        sql_upper = sql.upper()

        # Check for common column name issues
        if "PRODUCT_NAME" in sql_upper and "PRODUCT" in sql_upper:
            # Warn about potential column name mismatch
            print(f"⚠️  Warning: Query references 'product_name'. Verify this column exists in your database.")
            print(f"    To check, run: python backend/database/check_schema.py")

        return sql

    except Exception as e:
        print(f"SQL Agent Error: {e}")
        # Return a safe fallback query
        return "SELECT TOP 20 product_category, SUM(revenue) AS total_revenue FROM sales GROUP BY product_category ORDER BY total_revenue DESC"
