-- Fix Row Level Security policies for organizations tables

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON groepen;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON structuren;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON afdelingen;

-- Create correct policies for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON groepen
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all operations for authenticated users" ON structuren
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all operations for authenticated users" ON afdelingen
    FOR ALL USING (auth.uid() IS NOT NULL);

