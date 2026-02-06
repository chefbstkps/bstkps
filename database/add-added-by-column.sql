-- Voeg kolom added_by toe aan radios om vast te leggen welke gebruiker de radio heeft toegevoegd.
-- Bestaande radio's krijgen 'Admin' als toegevoegd-door gebruiker.
-- Voer dit script uit in de Supabase SQL Editor.

ALTER TABLE radios ADD COLUMN IF NOT EXISTS added_by TEXT;

-- Bestaande radio's: zet toegevoegd-door op Admin
UPDATE radios SET added_by = 'Admin' WHERE added_by IS NULL;

CREATE INDEX IF NOT EXISTS idx_radios_added_by ON radios(added_by);

COMMENT ON COLUMN radios.added_by IS 'Username of the user who added this radio; Admin for legacy records.';
