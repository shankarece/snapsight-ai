"""
SnapSight AI - Database Schema Diagnostic Tool
Check what columns actually exist in your database.
"""

import os
import pymssql
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    server = os.getenv("AZURE_SQL_SERVER")
    database = os.getenv("AZURE_SQL_DATABASE")
    username = os.getenv("AZURE_SQL_USERNAME")
    password = os.getenv("AZURE_SQL_PASSWORD")
    if not all([server, database, username, password]):
        raise ValueError(
            "Missing database credentials in .env file! "
            "Check: AZURE_SQL_SERVER, AZURE_SQL_DATABASE, AZURE_SQL_USERNAME, AZURE_SQL_PASSWORD"
        )
    return pymssql.connect(server=server, user=username, password=password, database=database)

def check_table_exists(cursor, table_name):
    """Check if table exists."""
    cursor.execute("""
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = %s
    """, (table_name,))
    return cursor.fetchone()[0] > 0

def get_table_columns(cursor, table_name):
    """Get all columns for a table."""
    cursor.execute("""
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = %s
        ORDER BY ORDINAL_POSITION
    """, (table_name,))
    return cursor.fetchall()

def main():
    print("=" * 70)
    print("SnapSight AI - Database Schema Diagnostic")
    print("=" * 70)

    try:
        print("\n[*] Connecting to Azure SQL Database...")
        conn = get_connection()
        cursor = conn.cursor()
        print("[OK] Connected!\n")

        tables = ["sales", "customers", "products", "pipeline"]

        for table in tables:
            print(f"\n[TABLE] {table.upper()}")
            print("-" * 70)

            if check_table_exists(cursor, table):
                print(f"[OK] Table EXISTS\n")
                columns = get_table_columns(cursor, table)

                if columns:
                    print(f"Columns found ({len(columns)}):")
                    for col_name, col_type in columns:
                        print(f"  - {col_name:<25} ({col_type})")

                    # Count rows
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    print(f"\n[ROWS] Total rows: {count}")
                else:
                    print("[ERROR] No columns found (table may be corrupted)")
            else:
                print(f"[ERROR] Table DOES NOT EXIST")

        cursor.close()
        conn.close()

        print("\n" + "=" * 70)
        print("RECOMMENDATIONS:")
        print("=" * 70)
        print("""
If tables are missing or have wrong columns:

1. Run the seed script to create and populate tables:
   cd backend
   python database/seed_data.py

2. If you still see errors after seeding:
   - Check your .env file has correct credentials
   - Check Azure SQL firewall allows your IP
   - Manually run: ALTER DATABASE <dbname> SET COMPATIBILITY_LEVEL = 150;

3. To reset everything:
   - Delete all tables manually in Azure SQL
   - Run seed_data.py again
""")
        print("=" * 70)

    except Exception as e:
        print(f"\n[ERROR] {e}")
        print("\nTroubleshooting:")
        print("1. Verify .env file exists in backend/ directory")
        print("2. Check AZURE_SQL_SERVER, AZURE_SQL_DATABASE, AZURE_SQL_USERNAME, AZURE_SQL_PASSWORD")
        print("3. Verify your IP is allowed in Azure SQL firewall")
        print("4. Test connection manually in Azure portal")

if __name__ == "__main__":
    main()
