-- Add status column to radios table with predefined options
-- Status can be: Actief, Defect, Kwijtgeraakt, Ingetrokken, Uitgeschakeld, Inactief

-- First, add the column as nullable
ALTER TABLE radios 
ADD COLUMN IF NOT EXISTS status TEXT;

-- Set default value for existing records
UPDATE radios 
SET status = 'Actief' 
WHERE status IS NULL;

-- Add check constraint for valid status values
ALTER TABLE radios
ADD CONSTRAINT radios_status_check 
CHECK (status IN ('Actief', 'Defect', 'Kwijtgeraakt', 'Ingetrokken', 'Uitgeschakeld', 'Inactief'));

-- Make the column NOT NULL after setting defaults
ALTER TABLE radios
ALTER COLUMN status SET NOT NULL;

-- Set default for new records
ALTER TABLE radios
ALTER COLUMN status SET DEFAULT 'Actief';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_radios_status ON radios(status);

