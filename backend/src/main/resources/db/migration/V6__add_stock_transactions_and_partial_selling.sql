-- Add partial selling support to stocks table
ALTER TABLE basis.stocks 
ADD COLUMN available_quantity DECIMAL(15,6),
ADD COLUMN sold_quantity DECIMAL(15,6) NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0);

-- Create stock_transactions table for tracking individual buy/sell events
CREATE TABLE basis.stock_transactions (
    id BIGINT PRIMARY KEY DEFAULT nextval('basis.id_sequence'),
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    stock_id BIGINT NOT NULL REFERENCES basis.stocks(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('BUY', 'SELL')),
    quantity DECIMAL(15,6) NOT NULL CHECK (quantity > 0),
    price_per_share DECIMAL(15,2) NOT NULL CHECK (price_per_share > 0),
    transaction_date DATE NOT NULL,
    total_value DECIMAL(15,2) NOT NULL CHECK (total_value > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- Initialize available_quantity for existing stocks
UPDATE basis.stocks 
SET available_quantity = CASE 
    WHEN status = 'SOLD' THEN 0 
    ELSE quantity 
END
WHERE available_quantity IS NULL;

-- Make available_quantity NOT NULL after initialization
ALTER TABLE basis.stocks 
ALTER COLUMN available_quantity SET NOT NULL,
ADD CONSTRAINT check_available_quantity CHECK (available_quantity >= 0);

-- Update sold_quantity for existing sold stocks
UPDATE basis.stocks 
SET sold_quantity = CASE 
    WHEN status = 'SOLD' THEN quantity 
    ELSE 0 
END;

-- Create initial buy transactions for all existing stocks
INSERT INTO basis.stock_transactions (stock_id, type, quantity, price_per_share, transaction_date, total_value)
SELECT 
    id,
    'BUY',
    quantity,
    purchase_price,
    purchase_date,
    quantity * purchase_price
FROM basis.stocks;

-- Create sell transactions for fully sold stocks
INSERT INTO basis.stock_transactions (stock_id, type, quantity, price_per_share, transaction_date, total_value)
SELECT 
    id,
    'SELL',
    quantity,
    sale_price,
    sale_date,
    quantity * sale_price
FROM basis.stocks 
WHERE status = 'SOLD' AND sale_price IS NOT NULL AND sale_date IS NOT NULL;

-- Create indices for better query performance on stock_transactions
CREATE INDEX idx_stock_transactions_stock_id ON basis.stock_transactions(stock_id);
CREATE INDEX idx_stock_transactions_type ON basis.stock_transactions(type);
CREATE INDEX idx_stock_transactions_transaction_date ON basis.stock_transactions(transaction_date DESC);
CREATE INDEX idx_stock_transactions_stock_type ON basis.stock_transactions(stock_id, type);

-- Update the sale consistency constraint to allow partial sales
ALTER TABLE basis.stocks 
DROP CONSTRAINT IF EXISTS check_sale_consistency;

-- Add new constraints for partial selling
ALTER TABLE basis.stocks 
ADD CONSTRAINT check_partial_sale_consistency CHECK (
    -- Active stocks can have partial sales
    (status = 'ACTIVE' AND available_quantity > 0 AND available_quantity <= quantity) OR
    -- Fully sold stocks have no available quantity
    (status = 'SOLD' AND available_quantity = 0 AND sold_quantity = quantity AND 
     sale_price IS NOT NULL AND sale_date IS NOT NULL)
),
ADD CONSTRAINT check_quantity_balance CHECK (
    available_quantity + sold_quantity = quantity
);

-- Add constraint to ensure transaction total_value is calculated correctly
ALTER TABLE basis.stock_transactions 
ADD CONSTRAINT check_total_value_calculation CHECK (
    ABS(total_value - (quantity * price_per_share)) < 0.01
);