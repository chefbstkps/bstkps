-- User page visibility: which pages are visible for each user (admin-configurable).
-- Run after auth-system-rpc-extensions.sql.
-- Default: role 'user' = all pages hidden; admin/super_user = all visible (unless a row overrides).
--
-- Bestaande installatie: voer sectie 2 (functie get_user_page_visibility) opnieuw uit om phone_numbers toe te voegen.

-- =============================================================================
-- 1. user_page_visibility table
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_page_visibility (
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  page_key TEXT NOT NULL,
  visible BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, page_key),
  CONSTRAINT chk_page_key CHECK (page_key IN (
    'storingen', 'installation', 'issue', 'accessories', 'inventory', 'brands', 'organizations', 'radio_archive', 'telefoon', 'phone_numbers'
  ))
);

CREATE INDEX IF NOT EXISTS idx_user_page_visibility_user_id ON user_page_visibility (user_id);

-- =============================================================================
-- 2. get_user_page_visibility – one row per page_key.
--    If a row exists: use it. Else: default visible = true for admin/super_user, false for role 'user'.
--    phone_numbers (Telefoonnummers): standaard altijd zichtbaar voor nieuwe gebruikers.
-- =============================================================================
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
    ('inventory'::TEXT), ('brands'::TEXT), ('organizations'::TEXT), ('radio_archive'::TEXT), ('telefoon'::TEXT), ('phone_numbers'::TEXT)
  ) AS k(page_key)
  CROSS JOIN app_users u
  LEFT JOIN user_page_visibility v ON v.user_id = p_user_id AND v.page_key = k.page_key
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. set_user_page_visibility – upsert one page visibility for a user
-- =============================================================================
CREATE OR REPLACE FUNCTION set_user_page_visibility(
  p_user_id UUID,
  p_page_key TEXT,
  p_visible BOOLEAN
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_page_visibility (user_id, page_key, visible)
  VALUES (p_user_id, p_page_key, p_visible)
  ON CONFLICT (user_id, page_key)
  DO UPDATE SET visible = p_visible;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
