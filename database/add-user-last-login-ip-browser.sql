-- Registreer IP-adres en browser (user agent) bij laatste login.
-- Voer uit na add-user-fields.sql.

-- =============================================================================
-- 1. Kolommen toevoegen aan app_users
-- =============================================================================
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS last_login_ip TEXT,
  ADD COLUMN IF NOT EXISTS last_login_user_agent TEXT;

-- =============================================================================
-- 2. login_user – optionele p_ip en p_user_agent, en teruggeven in result
-- =============================================================================
DROP FUNCTION IF EXISTS login_user(TEXT, TEXT);
DROP FUNCTION IF EXISTS login_user(TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION login_user(
  p_username TEXT,
  p_password TEXT,
  p_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
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
  session_timeout_minutes INTEGER,
  telefoonnummer TEXT,
  rang TEXT,
  organisatie TEXT,
  structuur TEXT,
  afdeling TEXT,
  last_login_ip TEXT,
  last_login_user_agent TEXT
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
  SET
    last_login = now(),
    updated_at = now(),
    last_login_ip = NULLIF(TRIM(COALESCE(p_ip, '')), ''),
    last_login_user_agent = NULLIF(TRIM(COALESCE(p_user_agent, '')), '')
  WHERE app_users.id = v_user.id;

  RETURN QUERY
  SELECT
    v_user.id, v_user.username, v_user.email, v_user.first_name, v_user.last_name,
    v_user.role, v_user.is_active, v_user.must_change_password,
    now(), v_user.created_at, now(),
    v_user.session_timeout_minutes,
    v_user.telefoonnummer, v_user.rang, v_user.organisatie, v_user.structuur, v_user.afdeling,
    NULLIF(TRIM(COALESCE(p_ip, '')), ''),
    NULLIF(TRIM(COALESCE(p_user_agent, '')), '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. get_user_by_id – last_login_ip en last_login_user_agent teruggeven
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
  session_timeout_minutes INTEGER,
  telefoonnummer TEXT,
  rang TEXT,
  organisatie TEXT,
  structuur TEXT,
  afdeling TEXT,
  last_login_ip TEXT,
  last_login_user_agent TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.username, u.email, u.first_name, u.last_name, u.role,
    u.is_active, u.must_change_password, u.last_login, u.created_at, u.updated_at,
    u.session_timeout_minutes, u.telefoonnummer, u.rang, u.organisatie, u.structuur, u.afdeling,
    u.last_login_ip, u.last_login_user_agent
  FROM app_users u
  WHERE u.id = p_id AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. get_all_users – last_login_ip en last_login_user_agent teruggeven
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
  session_timeout_minutes INTEGER,
  telefoonnummer TEXT,
  rang TEXT,
  organisatie TEXT,
  structuur TEXT,
  afdeling TEXT,
  last_login_ip TEXT,
  last_login_user_agent TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.username, u.email, u.first_name, u.last_name, u.role,
    u.is_active, u.must_change_password, u.last_login, u.created_at, u.updated_at,
    u.session_timeout_minutes, u.telefoonnummer, u.rang, u.organisatie, u.structuur, u.afdeling,
    u.last_login_ip, u.last_login_user_agent
  FROM app_users u
  ORDER BY u.username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
