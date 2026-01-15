-- Add transaction fingerprint to prevent duplicate imports
ALTER TABLE basis.transactions
ADD COLUMN transaction_fingerprint VARCHAR(64);

-- Add duplicate count to import batches
ALTER TABLE basis.import_batches
ADD COLUMN duplicate_count INTEGER DEFAULT 0;

-- Create index for efficient duplicate checking
CREATE INDEX idx_transactions_user_fingerprint ON basis.transactions(user_id, transaction_fingerprint);

-- Create unique constraint to enforce uniqueness at database level
-- This prevents duplicate transactions for the same user
ALTER TABLE basis.transactions
ADD CONSTRAINT unique_user_transaction_fingerprint 
UNIQUE (user_id, transaction_fingerprint);

-- Add comments to document the feature
COMMENT ON COLUMN basis.transactions.transaction_fingerprint IS 'SHA-256 hash of transaction attributes to prevent duplicate imports';
COMMENT ON COLUMN basis.import_batches.duplicate_count IS 'Number of duplicate transactions skipped during import';

-- Update existing transactions to have fingerprints (for backwards compatibility)
-- This will be done in the application code during first run