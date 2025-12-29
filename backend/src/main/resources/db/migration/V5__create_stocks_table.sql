-- Create stocks table for investment portfolio management
CREATE TABLE basis.stocks (
    id BIGINT PRIMARY KEY DEFAULT nextval('basis.id_sequence'),
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    portfolio_id BIGINT NOT NULL REFERENCES basis.portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL CHECK (length(trim(symbol)) > 0),
    company_name VARCHAR(255) NOT NULL CHECK (length(trim(company_name)) > 0),
    quantity DECIMAL(15,6) NOT NULL CHECK (quantity > 0),
    purchase_price DECIMAL(15,2) NOT NULL CHECK (purchase_price > 0),
    purchase_date DATE NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SOLD')),
    sale_price DECIMAL(15,2) CHECK (sale_price IS NULL OR sale_price > 0),
    sale_date DATE CHECK (sale_date IS NULL OR sale_date >= purchase_date),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    
    -- Constraint to ensure sale fields are consistent
    CONSTRAINT check_sale_consistency CHECK (
        (status = 'ACTIVE' AND sale_price IS NULL AND sale_date IS NULL) OR
        (status = 'SOLD' AND sale_price IS NOT NULL AND sale_date IS NOT NULL)
    )
);

-- Create indices for better query performance
CREATE INDEX idx_stocks_portfolio_id ON basis.stocks(portfolio_id);
CREATE INDEX idx_stocks_symbol ON basis.stocks(symbol);
CREATE INDEX idx_stocks_status ON basis.stocks(status);
CREATE INDEX idx_stocks_purchase_date ON basis.stocks(purchase_date DESC);
CREATE INDEX idx_stocks_portfolio_status ON basis.stocks(portfolio_id, status);
CREATE INDEX idx_stocks_portfolio_symbol ON basis.stocks(portfolio_id, symbol);

-- Create trigger for updated_at column
CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE
    ON basis.stocks FOR EACH ROW
    EXECUTE FUNCTION basis.update_updated_at_column();