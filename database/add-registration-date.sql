-- Add registration date column to existing radios table
-- This script safely adds the registratiedatum column to an existing database

-- Add the registratiedatum column with a default value
ALTER TABLE radios 
ADD COLUMN IF NOT EXISTS registratiedatum DATE DEFAULT CURRENT_DATE;

-- Update existing records to have today's date as registration date
-- This is only needed if you want to set a specific date for existing radios
-- UPDATE radios SET registratiedatum = CURRENT_DATE WHERE registratiedatum IS NULL;

-- Make the column NOT NULL after adding it (optional, only if you want to enforce it)
-- ALTER TABLE radios ALTER COLUMN registratiedatum SET NOT NULL;
