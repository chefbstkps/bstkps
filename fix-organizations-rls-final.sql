-- Final fix: Apply policies to the 'authenticated' role instead of 'public'

-- Drop all existing policies
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

-- Create policies for the 'authenticated' role (not public)
-- GROEPEN
CREATE POLICY "Enable read for authenticated users" ON groepen
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON groepen
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON groepen
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON groepen
    FOR DELETE TO authenticated USING (true);

-- STRUCTUREN
CREATE POLICY "Enable read for authenticated users" ON structuren
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON structuren
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON structuren
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON structuren
    FOR DELETE TO authenticated USING (true);

-- AFDELINGEN
CREATE POLICY "Enable read for authenticated users" ON afdelingen
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON afdelingen
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON afdelingen
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON afdelingen
    FOR DELETE TO authenticated USING (true);

