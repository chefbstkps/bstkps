-- Create organizations schema tables
-- Hierarchy: Groepen (Groups) -> Structuren (Structures) -> Afdelingen (Departments)

-- Groepen table (e.g., "Politie", "Brandweer")
CREATE TABLE IF NOT EXISTS groepen (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Structuren table (e.g., "Regio Oost", "Regio West")
CREATE TABLE IF NOT EXISTS structuren (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    groep_id UUID NOT NULL REFERENCES groepen(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(groep_id, name)
);

-- Afdelingen table (e.g., "Recherche", "Arrestatie Team")
CREATE TABLE IF NOT EXISTS afdelingen (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    structuur_id UUID NOT NULL REFERENCES structuren(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(structuur_id, name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_structuren_groep_id ON structuren(groep_id);
CREATE INDEX IF NOT EXISTS idx_afdelingen_structuur_id ON afdelingen(structuur_id);

-- Enable Row Level Security
ALTER TABLE groepen ENABLE ROW LEVEL SECURITY;
ALTER TABLE structuren ENABLE ROW LEVEL SECURITY;
ALTER TABLE afdelingen ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON groepen;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON groepen;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON groepen;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON groepen;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON groepen;

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON structuren;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON structuren;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON structuren;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON structuren;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON structuren;

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON afdelingen;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON afdelingen;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON afdelingen;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON afdelingen;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON afdelingen;

-- Create policies for authenticated users - GROEPEN
CREATE POLICY "Enable read for authenticated users" ON groepen
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON groepen
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON groepen
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON groepen
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create policies for authenticated users - STRUCTUREN
CREATE POLICY "Enable read for authenticated users" ON structuren
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON structuren
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON structuren
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON structuren
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create policies for authenticated users - AFDELINGEN
CREATE POLICY "Enable read for authenticated users" ON afdelingen
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON afdelingen
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON afdelingen
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON afdelingen
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_groepen_updated_at ON groepen;
DROP TRIGGER IF EXISTS update_structuren_updated_at ON structuren;
DROP TRIGGER IF EXISTS update_afdelingen_updated_at ON afdelingen;

-- Create triggers
CREATE TRIGGER update_groepen_updated_at BEFORE UPDATE ON groepen
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_structuren_updated_at BEFORE UPDATE ON structuren
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_afdelingen_updated_at BEFORE UPDATE ON afdelingen
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

