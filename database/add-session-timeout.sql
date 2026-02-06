-- Session timeout per user: minutes until automatic logout (NULL = never).
-- Run after auth-system-simple.sql and auth-system-rpc-extensions.sql.

-- =============================================================================
-- 1. Add session_timeout_minutes to app_users
-- =============================================================================
ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER
CHECK (session_timeout_minutes IS NULL OR session_timeout_minutes IN (10, 30, 60));

COMMENT ON COLUMN app_users.session_timeout_minutes IS 'Minutes until automatic logout. NULL = never expire.';

-- =============================================================================
-- 2. Update get_user_by_id to return session_timeout_minutes
-- =============================================================================
DROP FUNCTION IF EXISTS get_user_by_id(UUID);
CREATE OR REPLACE FUNCTION get_user_by_id(p_id UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  is_active BOOLEAN,
  must_change_password BOOLEAN,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  session_timeout_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.username, u.email, u.first_name, u.last_name, u.role,
    u.is_active, u.must_change_password, u.last_login, u.created_at, u.updated_at,
    u.session_timeout_minutes
  FROM app_users u
  WHERE u.id = p_id AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. Update login_user to return session_timeout_minutes
-- =============================================================================
DROP FUNCTION IF EXISTS login_user(TEXT, TEXT);
CREATE OR REPLACE FUNCTION login_user(p_username TEXT, p_password TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  is_active BOOLEAN,
  must_change_password BOOLEAN,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  session_timeout_minutes INTEGER
) AS $$
DECLARE
  v_user app_users%ROWTYPE;
BEGIN
  SELECT * INTO v_user
  FROM app_users
  WHERE LOWER(app_users.username) = LOWER(p_username)
    AND app_users.is_active = true
  LIMIT 1;

  IF v_user.id IS NULL THEN
    RETURN;
  END IF;

  IF NOT verify_password(p_password, v_user.password_hash) THEN
    RETURN;
  END IF;

  UPDATE app_users
  SET last_login = now(), updated_at = now()
  WHERE app_users.id = v_user.id;

  RETURN QUERY
  SELECT
    v_user.id,
    v_user.username,
    v_user.email,
    v_user.first_name,
    v_user.last_name,
    v_user.role,
    v_user.is_active,
    v_user.must_change_password,
    now(),
    v_user.created_at,
    now(),
    v_user.session_timeout_minutes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. Update get_all_users to return session_timeout_minutes
-- =============================================================================
DROP FUNCTION IF EXISTS get_all_users();
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  is_active BOOLEAN,
  must_change_password BOOLEAN,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  session_timeout_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.username, u.email, u.first_name, u.last_name, u.role,
    u.is_active, u.must_change_password, u.last_login, u.created_at, u.updated_at,
    u.session_timeout_minutes
  FROM app_users u
  ORDER BY u.username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. set_user_session_timeout – admin sets session timeout for a user
-- =============================================================================
CREATE OR REPLACE FUNCTION set_user_session_timeout(
  p_user_id UUID,
  p_session_timeout_minutes INTEGER
)
RETURNS void AS $$
BEGIN
  IF p_session_timeout_minutes IS NOT NULL
     AND p_session_timeout_minutes NOT IN (10, 30, 60) THEN
    RAISE EXCEPTION 'session_timeout_minutes must be 10, 30, 60 or NULL';
  END IF;

  UPDATE app_users
  SET
    session_timeout_minutes = p_session_timeout_minutes,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
