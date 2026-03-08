# SnapSight AI - Database Setup Guide

## Complete Setup Instructions

Follow these steps to set up your Azure SQL database with SnapSight AI.

---

## Step 1: Create Azure SQL Resources

### Create Resource Group
```bash
az group create --name snapsight-rg --location eastus
```

### Create SQL Server
```bash
az sql server create \
  --name snapsight-server \
  --resource-group snapsight-rg \
  --admin-user sqladmin \
  --admin-password YourStrongPassword123!
```

### Create SQL Database
```bash
az sql db create \
  --name snapsight-db \
  --server snapsight-server \
  --resource-group snapsight-rg \
  --sku Basic
```

---

## Step 2: Configure Firewall

Allow your machine to connect:

```bash
# Get your public IP
YOUR_IP=$(curl -s https://api.ipify.org)
echo "Your IP: $YOUR_IP"

# Add firewall rule
az sql server firewall-rule create \
  --name AllowMyIP \
  --server snapsight-server \
  --resource-group snapsight-rg \
  --start-ip-address $YOUR_IP \
  --end-ip-address $YOUR_IP
```

Or allow Azure services:
```bash
az sql server firewall-rule create \
  --name AllowAzureServices \
  --server snapsight-server \
  --resource-group snapsight-rg \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

---

## Step 3: Configure Backend

### Create `.env` file

Create `backend/.env`:

```bash
# Azure SQL Configuration
AZURE_SQL_SERVER=snapsight-server.database.windows.net
AZURE_SQL_DATABASE=snapsight-db
AZURE_SQL_USERNAME=sqladmin
AZURE_SQL_PASSWORD=YourStrongPassword123!

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
# If requirements.txt doesn't exist:
pip install pymssql python-dotenv openai
```

---

## Step 4: Seed Your Database

### Option A: Automatic (Recommended)

```bash
cd backend
python database/seed_data.py
```

**Expected output:**
```
==================================================
SnapSight AI - Database Seed Script
==================================================

Connecting to Azure SQL Database...
Connected!

Creating tables...
  Creating tables...

Clearing existing data...
  Clearing existing data...

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

==================================================
Database seeded successfully!
==================================================
```

### Option B: Manual SQL

In Azure Portal → Query Editor:

```sql
-- Create sales table
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
);

-- Create customers table
CREATE TABLE customers (
    id INT PRIMARY KEY IDENTITY(1,1),
    customer_name VARCHAR(100) NOT NULL,
    signup_date DATE NOT NULL,
    customer_type VARCHAR(20) NOT NULL,
    region VARCHAR(50) NOT NULL,
    lifetime_value DECIMAL(12,2) NOT NULL,
    industry VARCHAR(50) NOT NULL
);

-- Create products table
CREATE TABLE products (
    id INT PRIMARY KEY IDENTITY(1,1),
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    launch_date DATE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    monthly_revenue DECIMAL(12,2) NOT NULL
);

-- Create pipeline table
CREATE TABLE pipeline (
    id INT PRIMARY KEY IDENTITY(1,1),
    deal_name VARCHAR(100) NOT NULL,
    stage VARCHAR(30) NOT NULL,
    deal_value DECIMAL(12,2) NOT NULL,
    salesperson VARCHAR(100) NOT NULL,
    created_date DATE NOT NULL,
    expected_close DATE NOT NULL
);
```

Then run `python database/seed_data.py` to populate data.

---

## Step 5: Verify Setup

### Check Schema
```bash
cd backend
python database/check_schema.py
```

You should see:
- ✅ All 4 tables exist
- ✅ Correct columns in each table
- ✅ Data rows visible

### Test Connection
```bash
python database/connection.py
```

Should output:
```
✅ Successfully connected to Azure SQL Database!
Connection established.
```

---

## Step 6: Start Backend

```bash
uvicorn main:app --reload --port 8000
```

Should show:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

## Step 7: Test Backend API

```bash
# Check health
curl http://localhost:8000/health

# Make a query
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Show revenue by product category"}'
```

---

## Step 8: Start Frontend

In another terminal:
```bash
cd frontend
npm start
```

Should open `http://localhost:3000`

---

## Verification Checklist

- [ ] Azure SQL database created
- [ ] Firewall rules configured
- [ ] `.env` file created with credentials
- [ ] Dependencies installed
- [ ] Database seeded successfully
- [ ] `check_schema.py` shows all tables
- [ ] Backend starts without errors
- [ ] `/health` endpoint returns "connected"
- [ ] Frontend loads on localhost:3000
- [ ] Can submit queries and get results

---

## Data Structure

### Sales Table (400 rows)
Tracks all sales transactions with revenue, expenses, units, and quarters.

**Sample query:**
```sql
SELECT TOP 5 sale_date, product_category, revenue FROM sales;
```

### Customers Table (300 rows)
Customer information including type, region, and lifetime value.

**Sample query:**
```sql
SELECT TOP 5 customer_name, customer_type, lifetime_value FROM customers;
```

### Products Table (24 rows)
Product catalog with pricing and revenue metrics.

**Sample query:**
```sql
SELECT * FROM products WHERE category = 'Cloud Services';
```

### Pipeline Table (200 rows)
Sales pipeline deals in various stages.

**Sample query:**
```sql
SELECT COUNT(*) as lead_count FROM pipeline WHERE stage = 'Lead';
```

---

## Query Examples to Try

Once setup is complete, try these queries in the frontend:

1. **Revenue by product category**
   ```
   Revenue by product category
   ```

2. **Top 5 salespeople**
   ```
   Top 5 salespeople by revenue
   ```

3. **Customer breakdown**
   ```
   Compare new vs returning customers by region
   ```

4. **Tabular query**
   ```
   Show me all products with pricing in tabular form
   ```

5. **Pipeline analysis**
   ```
   Show sales pipeline deals by stage
   ```

---

## Troubleshooting

If you get database errors:

1. **Run diagnostic:**
   ```bash
   python database/check_schema.py
   ```

2. **Check error message** - tells you what's wrong

3. **See `TROUBLESHOOTING.md`** for detailed solutions

---

## Resetting Your Database

If you need a clean slate:

### Option 1: Drop and recreate tables
```bash
cd backend
python database/seed_data.py
# This automatically clears and recreates everything
```

### Option 2: Manual reset in Azure Portal
```sql
DROP TABLE IF EXISTS [sales];
DROP TABLE IF EXISTS [customers];
DROP TABLE IF EXISTS [products];
DROP TABLE IF EXISTS [pipeline];
```

Then run seed script again.

---

## Performance Tips

For better performance with larger datasets:

1. **Add indexes** to frequently queried columns:
   ```sql
   CREATE INDEX idx_sales_date ON sales(sale_date);
   CREATE INDEX idx_sales_category ON sales(product_category);
   CREATE INDEX idx_customers_type ON customers(customer_type);
   CREATE INDEX idx_products_category ON products(category);
   ```

2. **Upgrade database tier** if queries are slow:
   ```bash
   az sql db update --name snapsight-db \
     --server snapsight-server \
     --resource-group snapsight-rg \
     --sku Standard
   ```

3. **Monitor database size:**
   ```bash
   az sql db show --name snapsight-db \
     --server snapsight-server \
     --resource-group snapsight-rg
   ```

---

## Next Steps

- 🎨 Customize your AI prompts in the agents
- 📊 Upload your own data
- 🔧 Configure Azure OpenAI for better insights
- 🚀 Deploy to production

