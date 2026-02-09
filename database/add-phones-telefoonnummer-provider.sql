-- Add telefoonnummer and provider to phones table

ALTER TABLE phones
  ADD COLUMN IF NOT EXISTS telefoonnummer VARCHAR(50),
  ADD COLUMN IF NOT EXISTS provider VARCHAR(100);
