-- Complete fix for Row Level Security policies for organizations tables

-- GROEPEN table
-- Drop all existing policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON groepen;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON groepen;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON groepen;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON groepen;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON groepen;

-- Create separate policies for each operation
CREATE POLICY "Enable read for authenticated users" ON groepen
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON groepen
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON groepen
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON groepen
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- STRUCTUREN table
-- Drop all existing policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON structuren;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON structuren;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON structuren;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON structuren;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON structuren;

-- Create separate policies for each operation
CREATE POLICY "Enable read for authenticated users" ON structuren
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON structuren
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON structuren
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON structuren
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- AFDELINGEN table
-- Drop all existing policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON afdelingen;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON afdelingen;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON afdelingen;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON afdelingen;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON afdelingen;

-- Create separate policies for each operation
CREATE POLICY "Enable read for authenticated users" ON afdelingen
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON afdelingen
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON afdelingen
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON afdelingen
    FOR DELETE USING (auth.uid() IS NOT NULL);

