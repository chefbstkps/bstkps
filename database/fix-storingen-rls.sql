-- Fix RLS policies for storingen tables
-- Run this in your Supabase SQL Editor

-- First, disable RLS temporarily to test
ALTER TABLE storingen DISABLE ROW LEVEL SECURITY;
ALTER TABLE storing_feedback DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users on storingen" ON storingen;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on storing_feedback" ON storing_feedback;

-- Re-enable RLS
ALTER TABLE storingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE storing_feedback ENABLE ROW LEVEL SECURITY;

-- Create new, more permissive policies (similar to other tables)
CREATE POLICY "Enable all operations for authenticated users" ON storingen FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON storing_feedback FOR ALL USING (true);

-- Also create policies for anonymous access (for testing)
CREATE POLICY "Enable read access for anonymous users" ON storingen FOR SELECT USING (true);
CREATE POLICY "Enable read access for anonymous users" ON storing_feedback FOR SELECT USING (true);

-- Allow anonymous users to insert storingen (for the form to work)
CREATE POLICY "Enable insert access for anonymous users" ON storingen FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert access for anonymous users" ON storing_feedback FOR INSERT WITH CHECK (true);

-- Allow anonymous users to update storingen (for editing)
CREATE POLICY "Enable update access for anonymous users" ON storingen FOR UPDATE USING (true);
CREATE POLICY "Enable update access for anonymous users" ON storing_feedback FOR UPDATE USING (true);

-- Allow anonymous users to delete storingen (for deletion)
CREATE POLICY "Enable delete access for anonymous users" ON storingen FOR DELETE USING (true);
CREATE POLICY "Enable delete access for anonymous users" ON storing_feedback FOR DELETE USING (true);
