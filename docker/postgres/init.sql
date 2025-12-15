-- Initialize the database for Financial project
-- This script runs automatically when the PostgreSQL container starts

-- Ensure the database and user exist
CREATE DATABASE financial_db;
CREATE USER financial_user WITH ENCRYPTED PASSWORD 'financial_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE financial_db TO financial_user;

-- Connect to the financial database
\c financial_db;

-- Create schema
CREATE SCHEMA IF NOT EXISTS financial;

-- Grant schema privileges
GRANT ALL ON SCHEMA financial TO financial_user;
GRANT ALL ON ALL TABLES IN SCHEMA financial TO financial_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA financial TO financial_user;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a comment for documentation
COMMENT ON DATABASE financial_db IS 'Financial Management System Database - Spring Boot + Angular Monorepo';

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Financial database initialized successfully at %', NOW();
END
$$;