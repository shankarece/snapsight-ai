"""
SnapSight AI - Seed Data Generator
Generates realistic sample business data and inserts into Azure SQL Database.
Run this once to populate your database.

Usage: py seed_data.py
"""

import os
import random
from datetime import datetime, timedelta
import pymssql
from dotenv import load_dotenv

load_dotenv()

# ---- Configuration ----
CATEGORIES = ["Cloud Services", "Consulting", "Licenses", "Support"]
REGIONS = ["North America", "Europe", "Asia Pacific", "Latin America"]
INDUSTRIES = ["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Education"]
STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]

SALESPERSONS = [
    "Alice Chen", "Bob Martinez", "Carol Williams", "David Kim",
    "Emma Thompson", "Frank Patel", "Grace Lee", "Henry Johnson",
    "Isabel Santos", "James O'Brien", "Karen Nakamura", "Luis Garcia",
    "Maria Rodriguez", "Nathan Brown", "Olivia Davis", "Peter Wilson"
]

COMPANY_PREFIXES = [
    "Acme", "Global", "Prime", "Summit", "Vertex", "Nexus", "Apex",
    "Stellar", "Pacific", "Atlantic", "Nordic", "Alpine", "Metro",
    "Pioneer", "Quantum", "Fusion", "Horizon", "Zenith", "Cascade", "Echo"
]

COMPANY_SUFFIXES = [
    "Corp", "Inc", "Technologies", "Solutions", "Systems", "Group",
    "Enterprises", "Industries", "Labs", "Digital", "Analytics",
    "Partners", "Dynamics", "Networks", "Innovations"
]

PRODUCT_NAMES = {
    "Cloud Services": [
        "CloudSync Pro", "DataVault Enterprise", "CloudScale Platform",
        "SmartCloud Suite", "CloudGuard Security", "CloudOps Manager"
    ],
    "Consulting": [
        "Strategy Blueprint", "Digital Transformation Pack", "AI Readiness Assessment",
        "Cloud Migration Service", "Data Strategy Workshop", "Tech Advisory Premium"
    ],
    "Licenses": [
        "Enterprise License Suite", "Developer Pro License", "Team Collaboration License",
        "Analytics Platform License", "Security Compliance Pack", "API Gateway License"
    ],
    "Support": [
        "24/7 Premium Support", "Dedicated Account Manager", "Priority Response Plan",
        "On-site Support Package", "Training & Enablement", "Managed Services Plan"
    ]
}

DEAL_PREFIXES = [
    "Enterprise Upgrade", "New Partnership", "Platform Migration",
    "Annual Renewal", "Expansion Deal", "Pilot Program",
    "Strategic Alliance", "Digital Overhaul", "Cloud Adoption",
    "Security Enhancement", "Data Modernization", "Infrastructure Refresh"
]


def get_connection():
    server = os.getenv("AZURE_SQL_SERVER")
    database = os.getenv("AZURE_SQL_DATABASE")
    username = os.getenv("AZURE_SQL_USERNAME")
    password = os.getenv("AZURE_SQL_PASSWORD")
    if not all([server, database, username, password]):
        raise ValueError(
            "Missing database credentials in .env file! "
            "Check AZURE_SQL_SERVER, AZURE_SQL_DATABASE, AZURE_SQL_USERNAME, AZURE_SQL_PASSWORD"
        )
    return pymssql.connect(server=server, user=username, password=password, database=database)


def random_date(start_year=2025, end_year=2026):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 3, 1)
    delta = end - start
    random_days = random.randint(0, delta.days)
    return start + timedelta(days=random_days)


def get_quarter(date):
    month = date.month
    if month <= 3:
        return "Q1"
    elif month <= 6:
        return "Q2"
    elif month <= 9:
        return "Q3"
    else:
        return "Q4"


def generate_company_name():
    return f"{random.choice(COMPANY_PREFIXES)} {random.choice(COMPANY_SUFFIXES)}"


def seed_sales(cursor, num_rows=400):
    """Generate sales data with realistic patterns."""
    print(f"  Inserting {num_rows} sales records...")

    revenue_ranges = {
        "Cloud Services": (5000, 80000),
        "Consulting": (10000, 60000),
        "Licenses": (2000, 40000),
        "Support": (1000, 25000)
    }

    region_weights = {
        "North America": 1.3,
        "Europe": 1.0,
        "Asia Pacific": 0.9,
        "Latin America": 0.6
    }

    for _ in range(num_rows):
        date = random_date()
        category = random.choice(CATEGORIES)
        region = random.choice(REGIONS)
        salesperson = random.choice(SALESPERSONS)

        min_rev, max_rev = revenue_ranges[category]
        base_revenue = random.uniform(min_rev, max_rev)
        revenue = round(base_revenue * region_weights[region], 2)
        expense_ratio = random.uniform(0.40, 0.75)
        expenses = round(revenue * expense_ratio, 2)
        units = random.randint(1, 200)
        quarter = get_quarter(date)

        month_boost = 1 + (date.month * 0.02)
        revenue = round(revenue * month_boost, 2)

        cursor.execute(
            "INSERT INTO sales (sale_date, product_category, region, salesperson, "
            "revenue, expenses, units_sold, quarter) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (date.strftime("%Y-%m-%d"), category, region, salesperson,
             revenue, expenses, units, quarter)
        )


def seed_customers(cursor, num_rows=300):
    """Generate customer data."""
    print(f"  Inserting {num_rows} customer records...")

    ltv_ranges = {
        "new": (500, 15000),
        "returning": (10000, 150000),
        "churned": (1000, 30000)
    }

    type_weights = ["new"] * 30 + ["returning"] * 55 + ["churned"] * 15

    for _ in range(num_rows):
        name = generate_company_name()
        date = random_date(2023, 2026)
        ctype = random.choice(type_weights)
        region = random.choice(REGIONS)
        min_ltv, max_ltv = ltv_ranges[ctype]
        ltv = round(random.uniform(min_ltv, max_ltv), 2)
        industry = random.choice(INDUSTRIES)

        cursor.execute(
            "INSERT INTO customers (customer_name, signup_date, customer_type, "
            "region, lifetime_value, industry) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (name, date.strftime("%Y-%m-%d"), ctype, region, ltv, industry)
        )


def seed_products(cursor):
    """Generate product data."""
    all_products = []
    for category, products in PRODUCT_NAMES.items():
        for product in products:
            all_products.append((product, category))

    print(f"  Inserting {len(all_products)} product records...")

    price_ranges = {
        "Cloud Services": (99, 2999),
        "Consulting": (5000, 50000),
        "Licenses": (49, 999),
        "Support": (199, 4999)
    }

    for product_name, category in all_products:
        launch_date = random_date(2022, 2025)
        min_p, max_p = price_ranges[category]
        price = round(random.uniform(min_p, max_p), 2)
        monthly_rev = round(price * random.uniform(50, 500), 2)

        cursor.execute(
            "INSERT INTO products (product_name, category, launch_date, price, monthly_revenue) "
            "VALUES (%s, %s, %s, %s, %s)",
            (product_name, category, launch_date.strftime("%Y-%m-%d"), price, monthly_rev)
        )


def seed_pipeline(cursor, num_rows=200):
    """Generate sales pipeline data."""
    print(f"  Inserting {num_rows} pipeline records...")

    stage_weights = (
        ["Lead"] * 35 + ["Qualified"] * 25 + ["Proposal"] * 18 +
        ["Negotiation"] * 10 + ["Closed Won"] * 7 + ["Closed Lost"] * 5
    )

    value_ranges = {
        "Lead": (5000, 50000),
        "Qualified": (15000, 100000),
        "Proposal": (25000, 200000),
        "Negotiation": (50000, 500000),
        "Closed Won": (30000, 400000),
        "Closed Lost": (10000, 150000)
    }

    for _ in range(num_rows):
        company = generate_company_name()
        deal_prefix = random.choice(DEAL_PREFIXES)
        deal_name = f"{deal_prefix} - {company}"
        stage = random.choice(stage_weights)
        min_v, max_v = value_ranges[stage]
        deal_value = round(random.uniform(min_v, max_v), 2)
        salesperson = random.choice(SALESPERSONS)
        created = random_date()
        days_to_close = random.randint(14, 180)
        expected_close = created + timedelta(days=days_to_close)

        cursor.execute(
            "INSERT INTO pipeline (deal_name, stage, deal_value, salesperson, "
            "created_date, expected_close) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (deal_name, stage, deal_value, salesperson,
             created.strftime("%Y-%m-%d"), expected_close.strftime("%Y-%m-%d"))
        )


def clear_tables(cursor):
    """Clear all existing data."""
    print("  Clearing existing data...")
    for table in ["sales", "customers", "products", "pipeline"]:
        try:
            cursor.execute(f"DELETE FROM {table}")
        except Exception:
            pass


def create_tables(cursor):
    """Create tables if they don't exist."""
    print("  Creating tables...")

    tables_sql = [
        """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sales' AND xtype='U')
        CREATE TABLE sales (
            id INT PRIMARY KEY IDENTITY(1,1),
            sale_date DATE NOT NULL,
            product_category VARCHAR(50) NOT NULL,
            region VARCHAR(50) NOT NULL,
            salesperson VARCHAR(100) NOT NULL,
            revenue DECIMAL(12,2) NOT NULL,
            expenses DECIMAL(12,2) NOT NULL,
            units_sold INT NOT NULL,
            quarter VARCHAR(10) NOT NULL
        )
        """,
        """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customers' AND xtype='U')
        CREATE TABLE customers (
            id INT PRIMARY KEY IDENTITY(1,1),
            customer_name VARCHAR(100) NOT NULL,
            signup_date DATE NOT NULL,
            customer_type VARCHAR(20) NOT NULL,
            region VARCHAR(50) NOT NULL,
            lifetime_value DECIMAL(12,2) NOT NULL,
            industry VARCHAR(50) NOT NULL
        )
        """,
        """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='products' AND xtype='U')
        CREATE TABLE products (
            id INT PRIMARY KEY IDENTITY(1,1),
            product_name VARCHAR(100) NOT NULL,
            category VARCHAR(50) NOT NULL,
            launch_date DATE NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            monthly_revenue DECIMAL(12,2) NOT NULL
        )
        """,
        """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='pipeline' AND xtype='U')
        CREATE TABLE pipeline (
            id INT PRIMARY KEY IDENTITY(1,1),
            deal_name VARCHAR(100) NOT NULL,
            stage VARCHAR(30) NOT NULL,
            deal_value DECIMAL(12,2) NOT NULL,
            salesperson VARCHAR(100) NOT NULL,
            created_date DATE NOT NULL,
            expected_close DATE NOT NULL
        )
        """
    ]

    for sql in tables_sql:
        try:
            cursor.execute(sql)
        except Exception as e:
            print(f"    Warning: {e}")


def main():
    print("=" * 50)
    print("SnapSight AI - Database Seed Script")
    print("=" * 50)

    try:
        print("\nConnecting to Azure SQL Database...")
        conn = get_connection()
        cursor = conn.cursor()
        print("Connected!\n")

        # Create tables
        create_tables(cursor)
        conn.commit()

        # Clear existing data
        clear_tables(cursor)
        conn.commit()

        # Seed all tables
        print("\nSeeding data:")
        seed_sales(cursor, 400)
        conn.commit()

        seed_customers(cursor, 300)
        conn.commit()

        seed_products(cursor)
        conn.commit()

        seed_pipeline(cursor, 200)
        conn.commit()

        # Verify counts
        print("\nVerifying data:")
        for table in ["sales", "customers", "products", "pipeline"]:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  {table}: {count} rows")

        cursor.close()
        conn.close()

        print("\n" + "=" * 50)
        print("Database seeded successfully!")
        print("=" * 50)

    except Exception as e:
        print(f"\nERROR: {e}")
        print("\nTroubleshooting:")
        print("1. Check your database credentials in .env")
        print("2. Make sure your IP is allowed in Azure SQL firewall")
        print("3. Verify the password is correct")
        raise


if __name__ == "__main__":
    main()
