-- Tabel voor gearchiveerde radio's. Dezelfde radio (id/serienummer) mag meerdere keren
-- gearchiveerd worden; elke rij heeft een unieke archive_id.
-- Bij verwijderen van een radio wordt deze eerst hierin gekopieerd door de app.
-- Voer dit script uit in de Supabase SQL Editor.

-- =============================================================================
-- NIEUWE INSTALLATIE: volledige aanmaak
-- =============================================================================
CREATE TABLE IF NOT EXISTS radios_archive (
  archive_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id TEXT NOT NULL,
  merk TEXT NOT NULL,
  model TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Portable', 'Mobile', 'Base')),
  serienummer TEXT NOT NULL,
  alias TEXT NOT NULL,
  afdeling TEXT NOT NULL,
  groep TEXT,
  structuur TEXT,
  voertuig TEXT,
  opmerking TEXT,
  status TEXT NOT NULL CHECK (status IN ('Actief', 'Defect', 'Kwijtgeraakt', 'Ingetrokken', 'Uitgeschakeld', 'Inactief')),
  registratiedatum DATE NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_radios_archive_archived_at ON radios_archive (archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_radios_archive_id ON radios_archive (id);

ALTER TABLE radios_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read radios_archive for authenticated" ON radios_archive;
CREATE POLICY "Allow read radios_archive for authenticated" ON radios_archive
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert radios_archive for authenticated" ON radios_archive;
CREATE POLICY "Allow insert radios_archive for authenticated" ON radios_archive
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- BESTAANDE INSTALLATIE: als je al een radios_archive met id als PRIMARY KEY had
-- Voer onderstaande uit om over te zetten naar archive_id + archived_by.
-- =============================================================================
-- Stap 1: kolommen toevoegen
-- ALTER TABLE radios_archive ADD COLUMN IF NOT EXISTS archive_id UUID DEFAULT gen_random_uuid();
-- ALTER TABLE radios_archive ADD COLUMN IF NOT EXISTS archived_by TEXT;

-- Stap 2: backfill archive_id voor bestaande rijen
-- UPDATE radios_archive SET archive_id = gen_random_uuid() WHERE archive_id IS NULL;

-- Stap 3: primary key wijzigen (vervang de constraintnaam als die anders is)
-- ALTER TABLE radios_archive DROP CONSTRAINT IF EXISTS radios_archive_pkey;
-- ALTER TABLE radios_archive ALTER COLUMN archive_id SET NOT NULL;
-- ALTER TABLE radios_archive ADD PRIMARY KEY (archive_id);

-- Stap 4: index voor id (optioneel)
-- CREATE INDEX IF NOT EXISTS idx_radios_archive_id ON radios_archive (id);
