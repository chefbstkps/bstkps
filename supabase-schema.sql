-- BST Management Database Schema
-- This file contains the SQL schema for the BST Management application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create radios table
CREATE TABLE IF NOT EXISTS radios (
    id VARCHAR(4) PRIMARY KEY,
    merk VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Portable', 'Mobile', 'Base')),
    serienummer VARCHAR(100) NOT NULL UNIQUE,
    alias VARCHAR(100) NOT NULL,
    afdeling VARCHAR(100) NOT NULL,
    groep VARCHAR(100), -- Group classification: Politie, Brandweer, EMS, etc.
    voertuig VARCHAR(100), -- Vehicle information for mobile type radios
    opmerking TEXT,
    registratiedatum DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accessories table
CREATE TABLE IF NOT EXISTS accessories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merk VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    serienummer VARCHAR(100),
    opmerking TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create radio history table
CREATE TABLE IF NOT EXISTS radio_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    radio_id VARCHAR(4) NOT NULL REFERENCES radios(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('radio', 'accessory')),
    item_id VARCHAR(100) NOT NULL,
    afdeling VARCHAR(100) NOT NULL,
    issued_to VARCHAR(100) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create installations table
CREATE TABLE IF NOT EXISTS installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('radio', 'accessory')),
    item_id VARCHAR(100) NOT NULL,
    vehicle_merk VARCHAR(100) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_afdeling VARCHAR(100) NOT NULL,
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(brand_id, name)
);

-- Create models table
CREATE TABLE IF NOT EXISTS models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_radios_type ON radios(type);
CREATE INDEX IF NOT EXISTS idx_radios_afdeling ON radios(afdeling);
CREATE INDEX IF NOT EXISTS idx_radios_groep ON radios(groep);
CREATE INDEX IF NOT EXISTS idx_radios_voertuig ON radios(voertuig);
CREATE INDEX IF NOT EXISTS idx_radios_created_at ON radios(created_at);

CREATE INDEX IF NOT EXISTS idx_radio_history_radio_id ON radio_history(radio_id);
CREATE INDEX IF NOT EXISTS idx_radio_history_timestamp ON radio_history(timestamp);

CREATE INDEX IF NOT EXISTS idx_issues_item_type ON issues(item_type);
CREATE INDEX IF NOT EXISTS idx_issues_item_id ON issues(item_id);
CREATE INDEX IF NOT EXISTS idx_issues_issued_at ON issues(issued_at);

CREATE INDEX IF NOT EXISTS idx_installations_item_type ON installations(item_type);
CREATE INDEX IF NOT EXISTS idx_installations_item_id ON installations(item_id);
CREATE INDEX IF NOT EXISTS idx_installations_installed_at ON installations(installed_at);

CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_created_at ON brands(created_at);

CREATE INDEX IF NOT EXISTS idx_categories_brand_id ON categories(brand_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON categories(created_at);

CREATE INDEX IF NOT EXISTS idx_models_category_id ON models(category_id);
CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);
CREATE INDEX IF NOT EXISTS idx_models_created_at ON models(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_radios_updated_at ON radios;
DROP TRIGGER IF EXISTS update_accessories_updated_at ON accessories;
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_models_updated_at ON models;

-- Create triggers for updated_at
CREATE TRIGGER update_radios_updated_at 
    BEFORE UPDATE ON radios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessories_updated_at 
    BEFORE UPDATE ON accessories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at 
    BEFORE UPDATE ON brands 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at 
    BEFORE UPDATE ON models 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO radios (id, merk, model, type, serienummer, alias, afdeling, groep, voertuig, opmerking) VALUES
('0001', 'Motorola', 'DP4400', 'Portable', 'MOT001234', 'Portable-01', 'Brandweer', 'Brandweer', NULL, 'Hoofdradio brandweer'),
('0002', 'Motorola', 'DP4400', 'Portable', 'MOT001235', 'Portable-02', 'Brandweer', 'Brandweer', NULL, 'Reserve radio'),
('0003', 'Motorola', 'XPR7550', 'Mobile', 'MOT002001', 'Mobile-01', 'Politie', 'Politie', 'Toyota Land Cruiser - PZ-001', 'Voertuig radio politie'),
('0004', 'Motorola', 'XPR7550', 'Mobile', 'MOT002002', 'Mobile-02', 'Politie', 'Politie', 'Ford Ranger - PZ-002', 'Voertuig radio politie'),
('0005', 'Motorola', 'XPR7550', 'Base', 'MOT003001', 'Base-01', 'Meldkamer', 'EMS', NULL, 'Basisstation meldkamer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO accessories (merk, model, serienummer, opmerking) VALUES
('Motorola', 'Speaker Microphone', 'SPK001', 'Luidspreker microfoon voor portable'),
('Motorola', 'Battery Pack', 'BAT001', 'Extra batterij voor portable'),
('Motorola', 'Charger', 'CHG001', 'Oplader voor portable'),
('Motorola', 'Antenna', 'ANT001', 'Antenne voor mobile'),
('Motorola', 'Mounting Bracket', 'MTB001', 'Bevestigingsbeugel voor mobile')
ON CONFLICT DO NOTHING;

-- Insert sample brands data
INSERT INTO brands (name, description) VALUES
('Motorola', 'Amerikaanse fabrikant van communicatieapparatuur'),
('Kenwood', 'Japanse fabrikant van radio- en communicatieapparatuur'),
('Icom', 'Japanse fabrikant van radio- en communicatieapparatuur'),
('Yaesu', 'Japanse fabrikant van amateurradio apparatuur'),
('Baofeng', 'Chinese fabrikant van goedkope radio apparatuur')
ON CONFLICT (name) DO NOTHING;

-- Insert sample categories data
INSERT INTO categories (brand_id, name, description) VALUES
((SELECT id FROM brands WHERE name = 'Motorola'), 'Portable Radios', 'Draagbare radio apparatuur'),
((SELECT id FROM brands WHERE name = 'Motorola'), 'Mobile Radios', 'Mobiele radio apparatuur voor voertuigen'),
((SELECT id FROM brands WHERE name = 'Motorola'), 'Base Stations', 'Vaste basisstations'),
((SELECT id FROM brands WHERE name = 'Motorola'), 'Accessories', 'Toebehoren en accessoires'),
((SELECT id FROM brands WHERE name = 'Kenwood'), 'Portable Radios', 'Draagbare radio apparatuur'),
((SELECT id FROM brands WHERE name = 'Kenwood'), 'Mobile Radios', 'Mobiele radio apparatuur voor voertuigen'),
((SELECT id FROM brands WHERE name = 'Icom'), 'Portable Radios', 'Draagbare radio apparatuur'),
((SELECT id FROM brands WHERE name = 'Icom'), 'Mobile Radios', 'Mobiele radio apparatuur voor voertuigen')
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert sample models data
INSERT INTO models (category_id, name, description) VALUES
((SELECT c.id FROM categories c JOIN brands b ON c.brand_id = b.id WHERE b.name = 'Motorola' AND c.name = 'Portable Radios'), 'DP4400', 'Digitale portable radio'),
((SELECT c.id FROM categories c JOIN brands b ON c.brand_id = b.id WHERE b.name = 'Motorola' AND c.name = 'Portable Radios'), 'XPR7550', 'Digitale portable radio'),
((SELECT c.id FROM categories c JOIN brands b ON c.brand_id = b.id WHERE b.name = 'Motorola' AND c.name = 'Portable Radios'), 'CP200d', 'Digitale portable radio'),
((SELECT c.id FROM categories c JOIN brands b ON c.brand_id = b.id WHERE b.name = 'Motorola' AND c.name = 'Mobile Radios'), 'XPR5550', 'Digitale mobiele radio'),
((SELECT c.id FROM categories c JOIN brands b ON c.brand_id = b.id WHERE b.name = 'Motorola' AND c.name = 'Mobile Radios'), 'XPR5550e', 'Digitale mobiele radio'),
((SELECT c.id FROM categories c JOIN brands b ON c.brand_id = b.id WHERE b.name = 'Motorola' AND c.name = 'Base Stations'), 'XPR8300', 'Digitale basisstation'),
((SELECT c.id FROM categories c JOIN brands b ON c.brand_id = b.id WHERE b.name = 'Motorola' AND c.name = 'Accessories'), 'Speaker Microphone', 'Luidspreker microfoon'),
((SELECT c.id FROM categories c JOIN brands b ON c.brand_id = b.id WHERE b.name = 'Motorola' AND c.name = 'Accessories'), 'Battery Pack', 'Batterij pakket'),
((SELECT c.id FROM categories c JOIN brands b ON c.brand_id = b.id WHERE b.name = 'Motorola' AND c.name = 'Accessories'), 'Charger', 'Oplader'),
((SELECT c.id FROM categories c JOIN brands b ON c.brand_id = b.id WHERE b.name = 'Kenwood' AND c.name = 'Portable Radios'), 'TK-3170', 'Digitale portable radio'),
((SELECT c.id FROM categories c JOIN brands b ON c.brand_id = b.id WHERE b.name = 'Kenwood' AND c.name = 'Mobile Radios'), 'TK-7180', 'Digitale mobiele radio'),
((SELECT c.id FROM categories c JOIN brands b ON c.brand_id = b.id WHERE b.name = 'Icom' AND c.name = 'Portable Radios'), 'F1000', 'Digitale portable radio'),
((SELECT c.id FROM categories c JOIN brands b ON c.brand_id = b.id WHERE b.name = 'Icom' AND c.name = 'Mobile Radios'), 'F2000', 'Digitale mobiele radio')
ON CONFLICT (category_id, name) DO NOTHING;

-- Create views for easier querying
CREATE OR REPLACE VIEW radio_stats AS
SELECT 
    COUNT(*) as total_radios,
    COUNT(*) FILTER (WHERE type = 'Portable') as portable_radios,
    COUNT(*) FILTER (WHERE type = 'Mobile') as mobile_radios,
    COUNT(*) FILTER (WHERE type = 'Base') as base_radios
FROM radios;

CREATE OR REPLACE VIEW accessory_stats AS
SELECT COUNT(*) as total_accessories
FROM accessories;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE radios ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on radios" ON radios;
DROP POLICY IF EXISTS "Allow all operations on accessories" ON accessories;
DROP POLICY IF EXISTS "Allow all operations on radio_history" ON radio_history;
DROP POLICY IF EXISTS "Allow all operations on issues" ON issues;
DROP POLICY IF EXISTS "Allow all operations on installations" ON installations;
DROP POLICY IF EXISTS "Allow all operations on brands" ON brands;
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;
DROP POLICY IF EXISTS "Allow all operations on models" ON models;

-- Create policies (for now, allow all operations - adjust based on your auth requirements)
CREATE POLICY "Allow all operations on radios" ON radios FOR ALL USING (true);
CREATE POLICY "Allow all operations on accessories" ON accessories FOR ALL USING (true);
CREATE POLICY "Allow all operations on radio_history" ON radio_history FOR ALL USING (true);
CREATE POLICY "Allow all operations on issues" ON issues FOR ALL USING (true);
CREATE POLICY "Allow all operations on installations" ON installations FOR ALL USING (true);
CREATE POLICY "Allow all operations on brands" ON brands FOR ALL USING (true);
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on models" ON models FOR ALL USING (true);
