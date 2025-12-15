-- Initial schema creation
CREATE SCHEMA IF NOT EXISTS basis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sequence for ID generation
CREATE SEQUENCE IF NOT EXISTS basis.id_sequence
    START WITH 1000
    INCREMENT BY 1;

-- Example User table
CREATE TABLE basis.users (
    id BIGINT PRIMARY KEY DEFAULT nextval('basis.id_sequence'),
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- Create indices
CREATE INDEX idx_users_username ON basis.users(username);
CREATE INDEX idx_users_email ON basis.users(email);
CREATE INDEX idx_users_active ON basis.users(active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION basis.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON basis.users FOR EACH ROW
    EXECUTE FUNCTION basis.update_updated_at_column();