-- Create savings table for financial management
CREATE TABLE basis.savings (
    id BIGINT PRIMARY KEY DEFAULT nextval('basis.id_sequence'),
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    user_id VARCHAR(255) NOT NULL, -- Keycloak user ID from JWT subject
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    saving_type VARCHAR(20) NOT NULL CHECK (saving_type IN ('CASH', 'GOLD', 'OTHER')),
    saving_date DATE NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- Create indices for better query performance
CREATE INDEX idx_savings_user_id ON basis.savings(user_id);
CREATE INDEX idx_savings_date ON basis.savings(saving_date);
CREATE INDEX idx_savings_type ON basis.savings(saving_type);
CREATE INDEX idx_savings_user_date ON basis.savings(user_id, saving_date DESC);

-- Create trigger for updated_at column
CREATE TRIGGER update_savings_updated_at BEFORE UPDATE
    ON basis.savings FOR EACH ROW
    EXECUTE FUNCTION basis.update_updated_at_column();