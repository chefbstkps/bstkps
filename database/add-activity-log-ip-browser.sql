-- Voeg IP-adres en browser (user agent) toe aan activiteitenlog.
-- Voer uit na auth-system-simple.sql en auth-system-rpc-extensions.sql.

-- =============================================================================
-- 1. Kolommen toevoegen aan user_activity_logs
-- =============================================================================
ALTER TABLE user_activity_logs
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- =============================================================================
-- 2. get_user_activity_logs – ip_address en user_agent teruggeven
-- =============================================================================
DROP FUNCTION IF EXISTS get_user_activity_logs(UUID);
CREATE OR REPLACE FUNCTION get_user_activity_logs(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username TEXT,
  activity_type TEXT,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    u.username,
    l.activity_type,
    l.success,
    l.error_message,
    l.created_at,
    l.ip_address,
    l.user_agent
  FROM user_activity_logs l
  JOIN app_users u ON u.id = l.user_id
  WHERE (p_user_id IS NULL OR l.user_id = p_user_id)
  ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
