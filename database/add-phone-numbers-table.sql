-- Tabel voor het beheren van telefoonnummers (PhoneNumbers pagina).
-- Kolommen: contactpersoon, organisatie, structuur, afdeling, tel_nummer, status, opmerking,
-- accountnummer, rang, functie, adres, pand_no, extensie (alle optioneel).

CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contactpersoon TEXT NOT NULL,
  organisatie TEXT,
  structuur TEXT,
  afdeling TEXT,
  tel_nummer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'actief' CHECK (status IN ('actief', 'buiten werking', 'defect', 'inactief')),
  opmerking TEXT,
  accountnummer TEXT,
  rang TEXT,
  functie TEXT,
  adres TEXT,
  pand_no TEXT,
  extensie TEXT,
  tags TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_contactpersoon ON phone_numbers (contactpersoon);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_tel_nummer ON phone_numbers (tel_nummer);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_organisatie ON phone_numbers (organisatie);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_structuur ON phone_numbers (structuur);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_afdeling ON phone_numbers (afdeling);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_status ON phone_numbers (status);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_created_at ON phone_numbers (created_at);

-- RLS (Row Level Security)
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on phone_numbers" ON phone_numbers;
CREATE POLICY "Allow all operations on phone_numbers" ON phone_numbers FOR ALL USING (true);

-- Trigger voor updated_at (gebruikt bestaande functie indien aanwezig, anders eigen functie)
CREATE OR REPLACE FUNCTION update_phone_numbers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_phone_numbers_updated_at ON phone_numbers;
CREATE TRIGGER update_phone_numbers_updated_at
  BEFORE UPDATE ON phone_numbers
  FOR EACH ROW EXECUTE FUNCTION update_phone_numbers_updated_at();
