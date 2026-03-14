"""
SnapSight AI - Database Connection
Connects to Azure SQL Database and executes queries.
"""

import os
import pymssql
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    """Create and return a connection to Azure SQL Database."""
    server = os.getenv("AZURE_SQL_SERVER")      # e.g. snapsight-server.database.windows.net
    database = os.getenv("AZURE_SQL_DATABASE")   # e.g. snapsightdb
    username = os.getenv("AZURE_SQL_USERNAME")   # e.g. snapsightadmin
    password = os.getenv("AZURE_SQL_PASSWORD")   # your password

    if not all([server, database, username, password]):
        raise ValueError("Missing database credentials in .env file")

    conn = pymssql.connect(
        server=server,
        user=username,
        password=password,
        database=database,
        login_timeout=120,
        timeout=120
    )
    return conn


def execute_query(sql: str) -> dict:
    """Execute a SQL query and return results as a list of dictionaries."""
    try:
        conn = get_connection()
        cursor = conn.cursor(as_dict=True)
        cursor.execute(sql)
        results = cursor.fetchall()

        # Get column names
        columns = list(results[0].keys()) if results else []

        # Convert Decimal to float for JSON
        clean_results = []
        for row in results:
            clean_row = {}
            for key, value in row.items():
                if hasattr(value, 'is_integer'):
                    value = float(value)
                clean_row[key] = value
            clean_results.append(clean_row)

        cursor.close()
        conn.close()

        return {
            "success": True,
            "columns": columns,
            "data": clean_results,
            "row_count": len(clean_results)
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "columns": [],
            "data": [],
            "row_count": 0
        }


def test_connection():
    """Test if the database connection works."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1 AS test")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        print("Database connection successful!")
        return True
    except Exception as e:
        print(f"Connection failed: {e}")
        return False


if __name__ == "__main__":
    test_connection()