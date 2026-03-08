-- SnapSight AI - Database Schema
-- Run this script in Azure SQL to create all tables

-- Table 1: Sales data
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sales' AND xtype='U')
CREATE TABLE sales (
    id              INT PRIMARY KEY IDENTITY(1,1),
    sale_date       DATE NOT NULL,
    product_category VARCHAR(50) NOT NULL,
    region          VARCHAR(50) NOT NULL,
    salesperson     VARCHAR(100) NOT NULL,
    revenue         DECIMAL(12,2) NOT NULL,
    expenses        DECIMAL(12,2) NOT NULL,
    units_sold      INT NOT NULL,
    quarter         VARCHAR(10) NOT NULL
);

-- Table 2: Customers
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customers' AND xtype='U')
CREATE TABLE customers (
    id              INT PRIMARY KEY IDENTITY(1,1),
    customer_name   VARCHAR(100) NOT NULL,
    signup_date     DATE NOT NULL,
    customer_type   VARCHAR(20) NOT NULL,
    region          VARCHAR(50) NOT NULL,
    lifetime_value  DECIMAL(12,2) NOT NULL,
    industry        VARCHAR(50) NOT NULL
);

-- Table 3: Products
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='products' AND xtype='U')
CREATE TABLE products (
    id              INT PRIMARY KEY IDENTITY(1,1),
    product_name    VARCHAR(100) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    launch_date     DATE NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    monthly_revenue DECIMAL(12,2) NOT NULL
);

-- Table 4: Sales Pipeline
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='pipeline' AND xtype='U')
CREATE TABLE pipeline (
    id              INT PRIMARY KEY IDENTITY(1,1),
    deal_name       VARCHAR(100) NOT NULL,
    stage           VARCHAR(30) NOT NULL,
    deal_value      DECIMAL(12,2) NOT NULL,
    salesperson     VARCHAR(100) NOT NULL,
    created_date    DATE NOT NULL,
    expected_close  DATE NOT NULL
);

PRINT 'All tables created successfully!';
