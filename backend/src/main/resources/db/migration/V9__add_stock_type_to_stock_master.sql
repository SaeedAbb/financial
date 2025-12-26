-- V9: Add stock_type column to stock_master table
-- This migration adds a stock_type field to support different types of securities

ALTER TABLE basis.stock_master 
ADD COLUMN stock_type VARCHAR(50);

-- Add comment to document the column
COMMENT ON COLUMN basis.stock_master.stock_type IS 'Type of security (e.g., Common Stock, ETP, ADR, REIT, etc.)';

-- Create index for better query performance on stock type
CREATE INDEX idx_stock_master_stock_type ON basis.stock_master(stock_type);