-- Voeg tags kolom toe aan phone_numbers voor zoekbare tags.
-- Voer uit in Supabase SQL Editor als de tabel phone_numbers al bestaat.

ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS tags TEXT;
