-- Add current_price column to stock_master table
-- This migration adds the current_price field to support real-time stock pricing

ALTER TABLE basis.stock_master 
ADD COLUMN current_price NUMERIC(15,2) DEFAULT 0.00;

-- Add constraint to ensure current_price is not negative
ALTER TABLE basis.stock_master 
ADD CONSTRAINT chk_stock_master_current_price_non_negative 
CHECK (current_price >= 0);

-- Update existing records to have a default price of 100.00 for demo purposes
-- In a real application, you would populate this from an external data source
UPDATE basis.stock_master 
SET current_price = 100.00 
WHERE current_price IS NULL OR current_price = 0;

-- Add comment to document the column
COMMENT ON COLUMN basis.stock_master.current_price IS 'Current market price of the stock for real-time calculations';