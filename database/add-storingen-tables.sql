-- Create storingen table
CREATE TABLE IF NOT EXISTS storingen (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  storingnummer VARCHAR(7) UNIQUE NOT NULL,
  soort_storing VARCHAR(50) NOT NULL CHECK (soort_storing IN ('Radio', 'Telefonie', 'Waarschuwingsapparatuur')),
  telefonie_type VARCHAR(20) CHECK (telefonie_type IN ('Glasvezel', 'Koper')),
  waarschuwingsapparatuur_type VARCHAR(20) CHECK (waarschuwingsapparatuur_type IN ('Zwaailicht', 'Sirene')),
  betrokken_afdeling VARCHAR(100) NOT NULL,
  adres TEXT NOT NULL,
  locatie VARCHAR(20) NOT NULL CHECK (locatie IN ('Gebouw', 'Voertuig', 'Anders')),
  aard_storing TEXT NOT NULL,
  naam_contactpersoon VARCHAR(100) NOT NULL,
  telefoonnummer_contactpersoon VARCHAR(20) NOT NULL,
  aansluitnummer VARCHAR(50),
  telefoonnummer_storing VARCHAR(20),
  datum_storing_binnengekomen DATE NOT NULL,
  datum_storing_begonnen DATE NOT NULL,
  handeling VARCHAR(50) NOT NULL CHECK (handeling IN ('Zelf afhandelen', 'Verwezen naar Telesur')),
  telesur_ticketnummer VARCHAR(50),
  datum_verwezen DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storing_feedback table
CREATE TABLE IF NOT EXISTS storing_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  storing_id UUID NOT NULL REFERENCES storingen(id) ON DELETE CASCADE,
  is_afgehandeld BOOLEAN NOT NULL DEFAULT FALSE,
  datum_afgehandeld DATE,
  afgehandeld_door VARCHAR(100),
  hoe_afgehandeld TEXT,
  gebruikte_materialen TEXT,
  opmerkingen TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_storingen_storingnummer ON storingen(storingnummer);
CREATE INDEX IF NOT EXISTS idx_storingen_soort_storing ON storingen(soort_storing);
CREATE INDEX IF NOT EXISTS idx_storingen_betrokken_afdeling ON storingen(betrokken_afdeling);
CREATE INDEX IF NOT EXISTS idx_storingen_created_at ON storingen(created_at);
CREATE INDEX IF NOT EXISTS idx_storing_feedback_storing_id ON storing_feedback(storing_id);
CREATE INDEX IF NOT EXISTS idx_storing_feedback_is_afgehandeld ON storing_feedback(is_afgehandeld);

-- Create function to auto-generate storingnummer
CREATE OR REPLACE FUNCTION generate_storingnummer()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get the highest storingnummer and increment by 1
  SELECT COALESCE(MAX(CAST(storingnummer AS INTEGER)), 7000000) + 1
  INTO next_number
  FROM storingen
  WHERE storingnummer ~ '^[0-9]+$';
  
  -- Set the new storingnummer if not provided
  IF NEW.storingnummer IS NULL OR NEW.storingnummer = '' THEN
    NEW.storingnummer := next_number::TEXT;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate storingnummer
CREATE TRIGGER trigger_generate_storingnummer
  BEFORE INSERT ON storingen
  FOR EACH ROW
  EXECUTE FUNCTION generate_storingnummer();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at timestamp
CREATE TRIGGER trigger_update_storingen_updated_at
  BEFORE UPDATE ON storingen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_storing_feedback_updated_at
  BEFORE UPDATE ON storing_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE storingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE storing_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your auth requirements)
-- For now, allowing all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users on storingen" ON storingen
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on storing_feedback" ON storing_feedback
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert some sample data for testing
INSERT INTO storingen (
  storingnummer,
  soort_storing,
  telefonie_type,
  betrokken_afdeling,
  adres,
  locatie,
  aard_storing,
  naam_contactpersoon,
  telefoonnummer_contactpersoon,
  datum_storing_binnengekomen,
  datum_storing_begonnen,
  handeling
) VALUES (
  '7000001',
  'Radio',
  NULL,
  'Brandweer',
  'Hoofdstraat 123, Amsterdam',
  'Voertuig',
  'Radio werkt niet, geen geluid',
  'Jan de Vries',
  '06-12345678',
  '2024-01-15',
  '2024-01-15',
  'Zelf afhandelen'
), (
  '7000002',
  'Telefonie',
  'Glasvezel',
  'Politie',
  'Kerkstraat 45, Rotterdam',
  'Gebouw',
  'Geen internetverbinding',
  'Piet Jansen',
  '06-87654321',
  '2024-01-16',
  '2024-01-16',
  'Verwezen naar Telesur'
);

-- Update the second record with Telesur information
UPDATE storingen 
SET telesur_ticketnummer = 'TEL-2024-001', 
    datum_verwezen = '2024-01-16'
WHERE storingnummer = '7000002';

-- Add some sample feedback
INSERT INTO storing_feedback (
  storing_id,
  is_afgehandeld,
  datum_afgehandeld,
  afgehandeld_door,
  hoe_afgehandeld,
  gebruikte_materialen,
  opmerkingen
) VALUES (
  (SELECT id FROM storingen WHERE storingnummer = '7000001'),
  TRUE,
  '2024-01-15',
  'Technicus A',
  'Batterij vervangen en radio getest',
  'Nieuwe batterij type XYZ',
  'Radio werkt nu perfect'
), (
  (SELECT id FROM storingen WHERE storingnummer = '7000002'),
  FALSE,
  NULL,
  NULL,
  'Ticket aangemaakt bij Telesur, wachtend op reactie',
  NULL,
  'Glasvezel aansluiting gecontroleerd, geen fysieke schade'
);
