-- Add structuur column to radios table

-- Add the new column
ALTER TABLE radios ADD COLUMN IF NOT EXISTS structuur TEXT;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_radios_structuur ON radios(structuur);

