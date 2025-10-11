-- Fix issued_to_id column type from UUID to TEXT
-- This is needed because radio IDs are not UUIDs (e.g., "1001")

-- First, drop the column (if it has data, this will lose it - make sure to backup first!)
ALTER TABLE inventory_transactions 
DROP COLUMN IF EXISTS issued_to_id;

-- Add it back as TEXT
ALTER TABLE inventory_transactions 
ADD COLUMN issued_to_id TEXT;

-- If you have existing data and want to preserve it, use this alternative approach:
-- 1. Add a temporary column
-- ALTER TABLE inventory_transactions ADD COLUMN issued_to_id_temp TEXT;
-- 2. Copy data (converting UUID to TEXT)
-- UPDATE inventory_transactions SET issued_to_id_temp = issued_to_id::TEXT WHERE issued_to_id IS NOT NULL;
-- 3. Drop old column
-- ALTER TABLE inventory_transactions DROP COLUMN issued_to_id;
-- 4. Rename temp column
-- ALTER TABLE inventory_transactions RENAME COLUMN issued_to_id_temp TO issued_to_id;

