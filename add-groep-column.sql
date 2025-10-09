-- Add groep column to radios table
-- This column is used to distinguish between different groups: Politie, Brandweer, EMS, etc.

ALTER TABLE radios ADD COLUMN IF NOT EXISTS groep VARCHAR(100);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_radios_groep ON radios(groep);

-- Add comment to document the column
COMMENT ON COLUMN radios.groep IS 'Group classification: Politie, Brandweer, EMS, etc.';

