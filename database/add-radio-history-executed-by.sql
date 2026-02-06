-- Voeg kolom executed_by toe aan radio_history om vast te leggen welke gebruiker
-- de actie heeft uitgevoerd (snelle actie of wijziging).
-- Bestaande geschiedenis krijgt 'Admin'. Voer uit in Supabase SQL Editor.

ALTER TABLE radio_history ADD COLUMN IF NOT EXISTS executed_by TEXT;

UPDATE radio_history SET executed_by = 'Admin' WHERE executed_by IS NULL;

CREATE INDEX IF NOT EXISTS idx_radio_history_executed_by ON radio_history(executed_by);

COMMENT ON COLUMN radio_history.executed_by IS 'Username of the user who performed this action; Admin for legacy records.';
