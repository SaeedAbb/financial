-- Remove user-related tables and indexes
-- This migration removes the user management functionality 
-- as it's not needed for the financial application

-- Drop trigger first
DROP TRIGGER IF EXISTS update_users_updated_at ON basis.users;

-- Drop indexes
DROP INDEX IF EXISTS basis.idx_users_username;
DROP INDEX IF EXISTS basis.idx_users_email;
DROP INDEX IF EXISTS basis.idx_users_active;

-- Drop the users table
DROP TABLE IF EXISTS basis.users;

-- Note: We keep the schema, sequence, and update function as they might be useful for future financial entities