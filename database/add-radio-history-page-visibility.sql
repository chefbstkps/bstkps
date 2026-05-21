-- Voeg paginazichtbaarheid 'radio_history' toe aan user_page_visibility.
-- Voer uit in Supabase SQL Editor als de tabel user_page_visibility al bestaat.

-- 1. Constraint aanpassen zodat 'radio_history' is toegestaan
ALTER TABLE user_page_visibility DROP CONSTRAINT IF EXISTS chk_page_key;
ALTER TABLE user_page_visibility ADD CONSTRAINT chk_page_key CHECK (page_key IN (
  'storingen', 'installation', 'issue', 'accessories', 'inventory', 'brands', 'organizations', 'radio_archive', 'radio_history', 'telefoon', 'phone_numbers'
));

-- 2. Functie get_user_page_visibility bijwerken (radio_history in de lijst)
CREATE OR REPLACE FUNCTION get_user_page_visibility(p_user_id UUID)
RETURNS TABLE (page_key TEXT, visible BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.page_key,
    CASE
      WHEN k.page_key = 'phone_numbers' THEN COALESCE(v.visible, true)
      ELSE COALESCE(v.visible, (u.role <> 'user'))
    END
  FROM (VALUES
    ('storingen'::TEXT), ('installation'::TEXT), ('issue'::TEXT), ('accessories'::TEXT),
    ('inventory'::TEXT), ('brands'::TEXT), ('organizations'::TEXT), ('radio_archive'::TEXT), ('radio_history'::TEXT), ('telefoon'::TEXT), ('phone_numbers'::TEXT)
  ) AS k(page_key)
  CROSS JOIN app_users u
  LEFT JOIN user_page_visibility v ON v.user_id = p_user_id AND v.page_key = k.page_key
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
