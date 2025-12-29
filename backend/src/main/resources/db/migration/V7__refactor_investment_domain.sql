-- V7: Refactor Investment Domain - Separate Stock Master, Portfolio Positions, and Generic Transactions

-- 1. Create stock master table (reference data only)
CREATE TABLE basis.stock_master (
    id BIGINT PRIMARY KEY DEFAULT nextval('basis.id_sequence'),
    symbol VARCHAR(20) NOT NULL UNIQUE CHECK (length(trim(symbol)) > 0),
    company_name VARCHAR(255) NOT NULL CHECK (length(trim(company_name)) > 0),
    exchange VARCHAR(50),
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap_category VARCHAR(20) CHECK (market_cap_category IS NULL OR market_cap_category IN ('MEGA', 'LARGE', 'MID', 'SMALL', 'MICRO', 'NANO')),
    isin VARCHAR(20) CHECK (isin IS NULL OR isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create portfolio positions table
CREATE TABLE basis.portfolio_positions (
    id BIGINT PRIMARY KEY DEFAULT nextval('basis.id_sequence'),
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    portfolio_id BIGINT NOT NULL REFERENCES basis.portfolios(id) ON DELETE CASCADE,
    stock_id BIGINT NOT NULL REFERENCES basis.stock_master(id),
    quantity DECIMAL(15,6) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    average_cost_basis DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (average_cost_basis >= 0),
    first_purchase_date DATE,
    last_transaction_date DATE,
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT unique_portfolio_stock UNIQUE (portfolio_id, stock_id)
);

-- 3. Create generic transactions table
CREATE TABLE basis.transactions (
    id BIGINT PRIMARY KEY DEFAULT nextval('basis.id_sequence'),
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    user_id VARCHAR(255) NOT NULL,
    transaction_category VARCHAR(20) NOT NULL CHECK (transaction_category IN ('STOCK', 'CRYPTO', 'FOREX', 'COMMODITY', 'BOND', 'ETF', 'MUTUAL_FUND', 'OPTION')),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('BUY', 'SELL', 'DIVIDEND', 'FEE', 'SPLIT', 'MERGER', 'TRANSFER_IN', 'TRANSFER_OUT', 'INTEREST', 'TAX')),
    reference_id BIGINT NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(15,6) NOT NULL CHECK (quantity > 0),
    price_per_unit DECIMAL(15,2) NOT NULL CHECK (price_per_unit > 0),
    total_amount DECIMAL(15,2) NOT NULL,
    fees DECIMAL(15,2) DEFAULT 0 CHECK (fees >= 0),
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- 4. Migrate existing stock data to new structure
-- First, populate stock_master with unique stocks
INSERT INTO basis.stock_master (symbol, company_name, created_at, updated_at)
SELECT DISTINCT symbol, company_name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM basis.stocks;

-- 5. Create portfolio positions from existing stocks
INSERT INTO basis.portfolio_positions (
    portfolio_id, 
    stock_id, 
    quantity, 
    average_cost_basis, 
    first_purchase_date, 
    last_transaction_date, 
    status
)
SELECT 
    s.portfolio_id,
    sm.id,
    s.available_quantity,
    s.purchase_price,
    s.purchase_date,
    COALESCE(s.sale_date, s.purchase_date),
    CASE WHEN s.status = 'SOLD' AND s.available_quantity = 0 THEN 'CLOSED' ELSE 'ACTIVE' END
FROM basis.stocks s
INNER JOIN basis.stock_master sm ON s.symbol = sm.symbol;

-- 6. Migrate stock_transactions to generic transactions table
INSERT INTO basis.transactions (
    user_id,
    transaction_category,
    transaction_type,
    reference_id,
    reference_type,
    symbol,
    quantity,
    price_per_unit,
    total_amount,
    fees,
    transaction_date,
    created_at
)
SELECT 
    p.user_id,
    'STOCK',
    st.type,
    pp.id,
    'PORTFOLIO_POSITION',
    s.symbol,
    st.quantity,
    st.price_per_share,
    st.total_value,
    0, -- No fees in old structure
    st.transaction_date,
    st.created_at
FROM basis.stock_transactions st
INNER JOIN basis.stocks s ON st.stock_id = s.id
INNER JOIN basis.portfolios p ON s.portfolio_id = p.id
INNER JOIN basis.stock_master sm ON s.symbol = sm.symbol
INNER JOIN basis.portfolio_positions pp ON pp.portfolio_id = p.id AND pp.stock_id = sm.id;

-- 7. Create indices for better performance
-- Stock master indices
CREATE INDEX idx_stock_master_symbol ON basis.stock_master(symbol);
CREATE INDEX idx_stock_master_exchange ON basis.stock_master(exchange);
CREATE INDEX idx_stock_master_sector ON basis.stock_master(sector);

-- Portfolio positions indices
CREATE INDEX idx_portfolio_positions_portfolio_id ON basis.portfolio_positions(portfolio_id);
CREATE INDEX idx_portfolio_positions_stock_id ON basis.portfolio_positions(stock_id);
CREATE INDEX idx_portfolio_positions_status ON basis.portfolio_positions(status);
CREATE INDEX idx_portfolio_positions_portfolio_status ON basis.portfolio_positions(portfolio_id, status);

-- Transactions indices
CREATE INDEX idx_transactions_user_id ON basis.transactions(user_id);
CREATE INDEX idx_transactions_reference ON basis.transactions(reference_id, reference_type);
CREATE INDEX idx_transactions_user_category ON basis.transactions(user_id, transaction_category);
CREATE INDEX idx_transactions_user_type ON basis.transactions(user_id, transaction_type);
CREATE INDEX idx_transactions_user_symbol ON basis.transactions(user_id, symbol);
CREATE INDEX idx_transactions_date ON basis.transactions(transaction_date DESC);
CREATE INDEX idx_transactions_user_date ON basis.transactions(user_id, transaction_date DESC);

-- 8. Create triggers for updated_at columns
CREATE TRIGGER update_stock_master_updated_at BEFORE UPDATE
    ON basis.stock_master FOR EACH ROW
    EXECUTE FUNCTION basis.update_updated_at_column();

CREATE TRIGGER update_portfolio_positions_updated_at BEFORE UPDATE
    ON basis.portfolio_positions FOR EACH ROW
    EXECUTE FUNCTION basis.update_updated_at_column();

-- 9. Drop old tables after data migration
DROP TABLE basis.stock_transactions;
DROP TABLE basis.stocks;

-- 10. Add comments to document the new structure
COMMENT ON TABLE basis.stock_master IS 'Master reference table for stock information';
COMMENT ON TABLE basis.portfolio_positions IS 'User portfolio positions tracking stock holdings';
COMMENT ON TABLE basis.transactions IS 'Generic transaction table for all investment activities';

COMMENT ON COLUMN basis.stock_master.symbol IS 'Stock ticker symbol (e.g., AAPL, GOOGL)';
COMMENT ON COLUMN basis.stock_master.market_cap_category IS 'Market capitalization category: MEGA, LARGE, MID, SMALL, MICRO, NANO';
COMMENT ON COLUMN basis.portfolio_positions.average_cost_basis IS 'Weighted average cost per share';
COMMENT ON COLUMN basis.transactions.transaction_category IS 'Type of investment: STOCK, CRYPTO, FOREX, etc.';
COMMENT ON COLUMN basis.transactions.reference_type IS 'Type of entity being referenced (e.g., PORTFOLIO_POSITION)';