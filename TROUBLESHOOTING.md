# SnapSight AI - Troubleshooting Guide

## Error: "Invalid column name 'product_name'"

This error means your Azure SQL database doesn't have the expected table structure.

### Quick Diagnosis

**Step 1: Check your actual database schema**

```bash
cd backend
python database/check_schema.py
```

This script will show you:
- ✅ Which tables exist (or don't)
- ✅ What columns each table has
- ✅ How many rows are in each table

### Solution A: Tables Don't Exist (Most Common)

If the diagnostic shows "❌ Table DOES NOT EXIST":

**Step 1: Verify your .env file**

Check that `backend/.env` exists and has these variables:
```
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your-database-name
AZURE_SQL_USERNAME=your-username
AZURE_SQL_PASSWORD=your-password
```

**Step 2: Run the seed script**

```bash
cd backend
python database/seed_data.py
```

This will:
- ✅ Create all 4 tables (sales, customers, products, pipeline)
- ✅ Insert sample data into each table
- ✅ Verify everything was created successfully

**Expected output:**
```
Connecting to Azure SQL Database...
Connected!

Creating tables...
  Creating tables...

Clearing existing data...
  ...

Seeding data:
  Inserting 400 sales records...
  Inserting 300 customer records...
  Inserting 24 product records...
  Inserting 200 pipeline records...

Verifying data:
  sales: 400 rows
  customers: 300 rows
  products: 24 rows
  pipeline: 200 rows

Database seeded successfully!
```

### Solution B: Wrong Column Names

If the diagnostic shows tables exist but with different columns:

**Example: If you see `product` instead of `product_name`:**

Edit `backend/database/schema.py` and update the column names to match your actual schema.

Then restart the backend:
```bash
uvicorn main:app --reload --port 8000
```

### Solution C: Database Connection Failure

If the diagnostic fails to connect:

**1. Verify credentials:**
```bash
# From backend directory
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('SERVER:', os.getenv('AZURE_SQL_SERVER'))"
```

Should print your server name.

**2. Check firewall rules in Azure Portal:**
- Go to Azure SQL Database → Networking
- Ensure your IP address is in the firewall rules
- Or add "Allow Azure services and resources to access this server"

**3. Test connection manually:**
```bash
python database/connection.py
```

This will tell you if the connection works.

---

## Other Common Errors

### Error: "Module not found: pymssql"

**Fix:**
```bash
pip install pymssql
# or
pip install -r requirements.txt
```

### Error: "Connection timeout" or "Network unreachable"

**Likely causes:**
1. ❌ Wrong server name (missing `.database.windows.net` suffix)
2. ❌ Firewall blocking your IP
3. ❌ Network connectivity issue

**Fix:**
1. Verify server name: `your-server.database.windows.net`
2. Add your IP to Azure SQL firewall
3. Test network: `ping your-server.database.windows.net`

### Error: "Authentication failed"

**Check:**
1. ❌ Username and password are correct
2. ❌ Username format (usually `username@servername`)
3. ❌ Special characters in password (may need escaping)

**Fix:**
1. Go to Azure Portal → SQL Database → Settings → User
2. Reset password and use it in `.env`
3. Make sure password is quoted if it has special chars:
   ```
   AZURE_SQL_PASSWORD="my$pecial@password"
   ```

---

## Database Schema Reference

### Expected Tables and Columns

**Table: sales**
- `id` (INT) - Primary key
- `sale_date` (DATE) - Date of sale
- `product_category` (VARCHAR) - Cloud Services, Consulting, Licenses, Support
- `region` (VARCHAR) - North America, Europe, Asia Pacific, Latin America
- `salesperson` (VARCHAR) - Salesperson name
- `revenue` (DECIMAL) - Sale amount in USD
- `expenses` (DECIMAL) - Associated expenses
- `units_sold` (INT) - Quantity sold
- `quarter` (VARCHAR) - Q1, Q2, Q3, Q4

**Table: customers**
- `id` (INT) - Primary key
- `customer_name` (VARCHAR) - Company/person name
- `signup_date` (DATE) - When they signed up
- `customer_type` (VARCHAR) - new, returning, churned
- `region` (VARCHAR) - Geographic region
- `lifetime_value` (DECIMAL) - Total customer value
- `industry` (VARCHAR) - Technology, Finance, Healthcare, Retail, Manufacturing, Education

**Table: products**
- `id` (INT) - Primary key
- `product_name` (VARCHAR) - Product name
- `category` (VARCHAR) - Cloud Services, Consulting, Licenses, Support
- `launch_date` (DATE) - When launched
- `price` (DECIMAL) - Product price
- `monthly_revenue` (DECIMAL) - Avg monthly revenue

**Table: pipeline**
- `id` (INT) - Primary key
- `deal_name` (VARCHAR) - Deal name
- `stage` (VARCHAR) - Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost
- `deal_value` (DECIMAL) - Deal amount
- `salesperson` (VARCHAR) - Salesperson name
- `created_date` (DATE) - When deal was created
- `expected_close` (DATE) - Expected closing date

---

## Testing Your Setup

### Test 1: Seed Data Script
```bash
cd backend
python database/seed_data.py
```

### Test 2: Check Schema
```bash
python database/check_schema.py
```

### Test 3: Database Connection
```bash
python database/connection.py
```

### Test 4: Manual SQL Query
In Azure SQL Query Editor, run:
```sql
SELECT TOP 5 * FROM products;
```

Should return products with `product_name` column.

### Test 5: Full Backend Test
```bash
# Start backend
uvicorn main:app --reload --port 8000

# In another terminal, test API
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Revenue by product category"}'
```

Should return data without errors.

---

## Still Having Issues?

### Diagnostic Checklist

- [ ] .env file exists in `backend/` directory
- [ ] All 4 credentials filled in .env
- [ ] IP address whitelisted in Azure SQL firewall
- [ ] `python database/check_schema.py` runs without errors
- [ ] Shows 4 tables with correct columns
- [ ] Shows rows in each table (not 0)
- [ ] Backend server starts: `uvicorn main:app --reload --port 8000`
- [ ] API responds to `/health` endpoint

### Debug Command

View detailed error messages:

```bash
# Backend (shows detailed errors)
uvicorn main:app --reload --port 8000 --log-level debug

# Then make a request that fails
# The detailed error will appear in the console
```

---

## Contact & Support

If these steps don't resolve the issue:

1. Run the diagnostic script: `python database/check_schema.py`
2. Copy the full output
3. Include error message from frontend
4. Check that:
   - ✅ Azure SQL server is running
   - ✅ Database exists in Azure portal
   - ✅ Firewall allows your IP
   - ✅ Credentials are correct

