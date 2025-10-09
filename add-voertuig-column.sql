-- Add voertuig column to radios table
-- This column is specifically for mobile type radios to track which vehicle they are installed in

ALTER TABLE radios ADD COLUMN IF NOT EXISTS voertuig VARCHAR(100);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_radios_voertuig ON radios(voertuig);

-- Add comment to document the column
COMMENT ON COLUMN radios.voertuig IS 'Vehicle information for mobile type radios';

