"""
SnapSight AI - Database Schema Definition
This file provides the schema context that gets sent to Azure OpenAI
so the LLM can generate accurate SQL queries.
"""

DB_SCHEMA = """
DATABASE SCHEMA FOR SNAPSIGHT AI:

TABLE: sales
- id (INT, PRIMARY KEY, auto-increment)
- sale_date (DATE) - date of the sale
- product_category (VARCHAR) - one of: 'Cloud Services', 'Consulting', 'Licenses', 'Support'
- region (VARCHAR) - one of: 'North America', 'Europe', 'Asia Pacific', 'Latin America'
- salesperson (VARCHAR) - name of the salesperson
- revenue (DECIMAL) - sale revenue in USD
- expenses (DECIMAL) - associated expenses in USD
- units_sold (INT) - number of units sold
- quarter (VARCHAR) - one of: 'Q1', 'Q2', 'Q3', 'Q4'

TABLE: customers
- id (INT, PRIMARY KEY, auto-increment)
- customer_name (VARCHAR) - company or person name
- signup_date (DATE) - date customer signed up
- customer_type (VARCHAR) - one of: 'new', 'returning', 'churned'
- region (VARCHAR) - one of: 'North America', 'Europe', 'Asia Pacific', 'Latin America'
- lifetime_value (DECIMAL) - total customer lifetime value in USD
- industry (VARCHAR) - one of: 'Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education'

TABLE: products
- id (INT, PRIMARY KEY, auto-increment)
- product_name (VARCHAR) - name of the product
- category (VARCHAR) - one of: 'Cloud Services', 'Consulting', 'Licenses', 'Support'
- launch_date (DATE) - product launch date
- price (DECIMAL) - product price in USD
- monthly_revenue (DECIMAL) - average monthly revenue from this product in USD

TABLE: pipeline
- id (INT, PRIMARY KEY, auto-increment)
- deal_name (VARCHAR) - name of the deal/opportunity
- stage (VARCHAR) - one of: 'Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'
- deal_value (DECIMAL) - potential deal value in USD
- salesperson (VARCHAR) - salesperson managing the deal
- created_date (DATE) - when the deal was created
- expected_close (DATE) - expected closing date

RELATIONSHIPS:
- sales.product_category relates to products.category
- sales.region relates to customers.region
- sales.salesperson relates to pipeline.salesperson
- pipeline stages follow the order: Lead -> Qualified -> Proposal -> Negotiation -> Closed Won/Closed Lost
"""


def get_schema():
    """Return the database schema string for LLM context."""
    return DB_SCHEMA
