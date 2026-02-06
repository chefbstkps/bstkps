-- Add Brands, Categories, and Models tables to existing BST Management database
-- This file only adds the new tables without conflicting with existing ones

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
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_created_at ON brands(created_at);

CREATE INDEX IF NOT EXISTS idx_categories_brand_id ON categories(brand_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON categories(created_at);

CREATE INDEX IF NOT EXISTS idx_models_category_id ON models(category_id);
CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);
CREATE INDEX IF NOT EXISTS idx_models_created_at ON models(created_at);

-- Create triggers for updated_at (only for new tables)
CREATE TRIGGER update_brands_updated_at 
    BEFORE UPDATE ON brands 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at 
    BEFORE UPDATE ON models 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Enable Row Level Security (RLS) for better security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all operations - adjust based on your auth requirements)
CREATE POLICY "Allow all operations on brands" ON brands FOR ALL USING (true);
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on models" ON models FOR ALL USING (true);
