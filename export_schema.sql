-- Export all tables and their structure
-- Table definitions
SELECT tablename FROM pg_tables WHERE schemaname='public';

-- Get column info for all tables
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema='public' 
ORDER BY table_name, ordinal_position;

-- Get indexes
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE schemaname='public';

-- Get constraints
SELECT constraint_name, table_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema='public';
