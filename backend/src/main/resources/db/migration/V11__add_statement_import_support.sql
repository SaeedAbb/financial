-- Add provider tracking to transactions
ALTER TABLE transactions 
ADD COLUMN import_provider VARCHAR(50),
ADD COLUMN import_batch_id UUID,
ADD COLUMN original_description TEXT,
ADD COLUMN provider_reference VARCHAR(255);

-- Create import batch tracking table
CREATE TABLE import_batches (
    id BIGSERIAL PRIMARY KEY,
    batch_id UUID NOT NULL UNIQUE,
    user_id VARCHAR(255) NOT NULL,
    portfolio_id BIGINT,
    provider VARCHAR(50) NOT NULL,
    file_name VARCHAR(255),
    transaction_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_import_batch_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_transactions_provider ON transactions(import_provider);
CREATE INDEX idx_transactions_import_batch ON transactions(import_batch_id);
CREATE INDEX idx_import_batches_user ON import_batches(user_id);
CREATE INDEX idx_import_batches_provider ON import_batches(provider);
CREATE INDEX idx_import_batches_status ON import_batches(status);
CREATE INDEX idx_import_batches_batch_id ON import_batches(batch_id);

-- Add comment to document the feature
COMMENT ON TABLE import_batches IS 'Tracks statement import operations from various providers';
COMMENT ON COLUMN transactions.import_provider IS 'Provider from which this transaction was imported (TRADE_REPUBLIC, etc)';
COMMENT ON COLUMN transactions.import_batch_id IS 'Reference to the import batch this transaction belongs to';
COMMENT ON COLUMN transactions.original_description IS 'Original transaction description from the provider statement';
COMMENT ON COLUMN transactions.provider_reference IS 'Provider-specific reference number or ID';