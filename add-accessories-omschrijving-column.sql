-- Add omschrijving column to accessories table
-- This column will store a description for each accessory

-- Add the omschrijving column
ALTER TABLE accessories 
ADD COLUMN IF NOT EXISTS omschrijving TEXT;

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_accessories_omschrijving ON accessories(omschrijving);

-- Add comment to document the column
COMMENT ON COLUMN accessories.omschrijving IS 'Description of the accessory';

