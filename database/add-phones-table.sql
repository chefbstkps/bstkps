-- Telefoontoestellen: vergelijkbaar met radios maar zonder id (4-char) en alias.
-- Type: Smart Phone, Dumb Phone, Wired Phone, Wireless Phone.

CREATE TABLE IF NOT EXISTS phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merk VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Smart Phone', 'Dumb Phone', 'Wired Phone', 'Wireless Phone')),
  serienummer VARCHAR(100) NOT NULL UNIQUE,
  afdeling VARCHAR(100) NOT NULL,
  groep VARCHAR(100),
  structuur VARCHAR(100),
  voertuig VARCHAR(100),
  opmerking TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Actief' CHECK (status IN ('Actief', 'Defect', 'Kwijtgeraakt', 'Ingetrokken', 'Uitgeschakeld', 'Inactief')),
  registratiedatum DATE NOT NULL DEFAULT CURRENT_DATE,
  added_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phones_type ON phones(type);
CREATE INDEX IF NOT EXISTS idx_phones_afdeling ON phones(afdeling);
CREATE INDEX IF NOT EXISTS idx_phones_groep ON phones(groep);
CREATE INDEX IF NOT EXISTS idx_phones_status ON phones(status);
CREATE INDEX IF NOT EXISTS idx_phones_created_at ON phones(created_at DESC);

ALTER TABLE phones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on phones" ON phones;
CREATE POLICY "Allow all operations on phones" ON phones FOR ALL USING (true);

CREATE OR REPLACE FUNCTION update_phones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_phones_updated_at ON phones;
CREATE TRIGGER update_phones_updated_at
  BEFORE UPDATE ON phones
  FOR EACH ROW EXECUTE FUNCTION update_phones_updated_at();
