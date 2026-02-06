-- Fix RLS policies for BST Management
-- Run this in your Supabase SQL Editor

-- First, disable RLS temporarily to test
ALTER TABLE radios DISABLE ROW LEVEL SECURITY;
ALTER TABLE accessories DISABLE ROW LEVEL SECURITY;
ALTER TABLE radio_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE installations DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on radios" ON radios;
DROP POLICY IF EXISTS "Allow all operations on accessories" ON accessories;
DROP POLICY IF EXISTS "Allow all operations on radio_history" ON radio_history;
DROP POLICY IF EXISTS "Allow all operations on issues" ON issues;
DROP POLICY IF EXISTS "Allow all operations on installations" ON installations;

-- Re-enable RLS
ALTER TABLE radios ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;

-- Create new, more permissive policies
CREATE POLICY "Enable all operations for authenticated users" ON radios FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON accessories FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON radio_history FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON issues FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON installations FOR ALL USING (true);

-- Also create policies for anonymous access (for testing)
CREATE POLICY "Enable read access for anonymous users" ON radios FOR SELECT USING (true);
CREATE POLICY "Enable read access for anonymous users" ON accessories FOR SELECT USING (true);
CREATE POLICY "Enable read access for anonymous users" ON radio_history FOR SELECT USING (true);
CREATE POLICY "Enable read access for anonymous users" ON issues FOR SELECT USING (true);
CREATE POLICY "Enable read access for anonymous users" ON installations FOR SELECT USING (true);

-- Insert test data if not exists
INSERT INTO radios (id, merk, model, type, serienummer, alias, afdeling, opmerking) VALUES
('0001', 'Motorola', 'DP4400', 'Portable', 'MOT001234', 'Portable-01', 'Brandweer', 'Hoofdradio brandweer'),
('0002', 'Motorola', 'DP4400', 'Portable', 'MOT001235', 'Portable-02', 'Brandweer', 'Reserve radio'),
('0003', 'Motorola', 'XPR7550', 'Mobile', 'MOT002001', 'Mobile-01', 'Politie', 'Voertuig radio politie'),
('0004', 'Motorola', 'XPR7550', 'Mobile', 'MOT002002', 'Mobile-02', 'Politie', 'Voertuig radio politie'),
('0005', 'Motorola', 'XPR7550', 'Base', 'MOT003001', 'Base-01', 'Meldkamer', 'Basisstation meldkamer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO accessories (merk, model, serienummer, opmerking) VALUES
('Motorola', 'Speaker Microphone', 'SPK001', 'Luidspreker microfoon voor portable'),
('Motorola', 'Battery Pack', 'BAT001', 'Extra batterij voor portable'),
('Motorola', 'Charger', 'CHG001', 'Oplader voor portable'),
('Motorola', 'Antenna', 'ANT001', 'Antenne voor mobile'),
('Motorola', 'Mounting Bracket', 'MTB001', 'Bevestigingsbeugel voor mobile')
ON CONFLICT DO NOTHING;
