-- Create portfolios table for investment management
CREATE TABLE basis.portfolios (
    id BIGINT PRIMARY KEY DEFAULT nextval('basis.id_sequence'),
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    user_id VARCHAR(255) NOT NULL, -- Keycloak user ID from JWT subject
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) > 0),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- Create indices for better query performance
CREATE INDEX idx_portfolios_user_id ON basis.portfolios(user_id);
CREATE INDEX idx_portfolios_name ON basis.portfolios(user_id, name);
CREATE INDEX idx_portfolios_created_at ON basis.portfolios(created_at DESC);

-- Create trigger for updated_at column
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE
    ON basis.portfolios FOR EACH ROW
    EXECUTE FUNCTION basis.update_updated_at_column();