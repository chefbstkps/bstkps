-- Fix RLS policies for organizations tables using the working approach from storingen
-- This uses simple USING (true) policies without role restrictions

-- First, disable RLS temporarily
ALTER TABLE groepen DISABLE ROW LEVEL SECURITY;
ALTER TABLE structuren DISABLE ROW LEVEL SECURITY;
ALTER TABLE afdelingen DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON groepen;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON groepen;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON groepen;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON groepen;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON groepen;
DROP POLICY IF EXISTS "Enable read access for anonymous users" ON groepen;
DROP POLICY IF EXISTS "Enable insert access for anonymous users" ON groepen;
DROP POLICY IF EXISTS "Enable update access for anonymous users" ON groepen;
DROP POLICY IF EXISTS "Enable delete access for anonymous users" ON groepen;

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON structuren;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON structuren;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON structuren;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON structuren;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON structuren;
DROP POLICY IF EXISTS "Enable read access for anonymous users" ON structuren;
DROP POLICY IF EXISTS "Enable insert access for anonymous users" ON structuren;
DROP POLICY IF EXISTS "Enable update access for anonymous users" ON structuren;
DROP POLICY IF EXISTS "Enable delete access for anonymous users" ON structuren;

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON afdelingen;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON afdelingen;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON afdelingen;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON afdelingen;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON afdelingen;
DROP POLICY IF EXISTS "Enable read access for anonymous users" ON afdelingen;
DROP POLICY IF EXISTS "Enable insert access for anonymous users" ON afdelingen;
DROP POLICY IF EXISTS "Enable update access for anonymous users" ON afdelingen;
DROP POLICY IF EXISTS "Enable delete access for anonymous users" ON afdelingen;

-- Re-enable RLS
ALTER TABLE groepen ENABLE ROW LEVEL SECURITY;
ALTER TABLE structuren ENABLE ROW LEVEL SECURITY;
ALTER TABLE afdelingen ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies (similar to storingen tables)
-- GROEPEN
CREATE POLICY "Enable all operations for authenticated users" ON groepen FOR ALL USING (true);
CREATE POLICY "Enable read access for anonymous users" ON groepen FOR SELECT USING (true);
CREATE POLICY "Enable insert access for anonymous users" ON groepen FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for anonymous users" ON groepen FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for anonymous users" ON groepen FOR DELETE USING (true);

-- STRUCTUREN
CREATE POLICY "Enable all operations for authenticated users" ON structuren FOR ALL USING (true);
CREATE POLICY "Enable read access for anonymous users" ON structuren FOR SELECT USING (true);
CREATE POLICY "Enable insert access for anonymous users" ON structuren FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for anonymous users" ON structuren FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for anonymous users" ON structuren FOR DELETE USING (true);

-- AFDELINGEN
CREATE POLICY "Enable all operations for authenticated users" ON afdelingen FOR ALL USING (true);
CREATE POLICY "Enable read access for anonymous users" ON afdelingen FOR SELECT USING (true);
CREATE POLICY "Enable insert access for anonymous users" ON afdelingen FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for anonymous users" ON afdelingen FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for anonymous users" ON afdelingen FOR DELETE USING (true);

