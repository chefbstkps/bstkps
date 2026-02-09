-- Add telefoonnummer, rang, organisatie, structuur, afdeling to app_users.
-- Run after auth-system-simple.sql, auth-system-rpc-extensions.sql, add-session-timeout.sql.

-- =============================================================================
-- 1. Add columns to app_users
-- =============================================================================
ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS telefoonnummer TEXT,
ADD COLUMN IF NOT EXISTS rang TEXT,
ADD COLUMN IF NOT EXISTS organisatie TEXT,
ADD COLUMN IF NOT EXISTS structuur TEXT,
ADD COLUMN IF NOT EXISTS afdeling TEXT;

-- =============================================================================
-- 2. Update create_user – add new parameters
-- =============================================================================
CREATE OR REPLACE FUNCTION create_user(
  p_username TEXT,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_password TEXT,
  p_role TEXT,
  p_telefoonnummer TEXT DEFAULT NULL,
  p_rang TEXT DEFAULT NULL,
  p_organisatie TEXT DEFAULT NULL,
  p_structuur TEXT DEFAULT NULL,
  p_afdeling TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO app_users (
    username, email, first_name, last_name, password_hash, role,
    telefoonnummer, rang, organisatie, structuur, afdeling
  )
  VALUES (
    p_username,
    p_email,
    NULLIF(TRIM(p_first_name), ''),
    NULLIF(TRIM(p_last_name), ''),
    hash_password(p_password),
    COALESCE(NULLIF(TRIM(p_role), ''), 'user'),
    NULLIF(TRIM(p_telefoonnummer), ''),
    NULLIF(TRIM(p_rang), ''),
    NULLIF(TRIM(p_organisatie), ''),
    NULLIF(TRIM(p_structuur), ''),
    NULLIF(TRIM(p_afdeling), '')
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. Update update_user – add new parameters
-- =============================================================================
DROP FUNCTION IF EXISTS update_user(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN);
CREATE OR REPLACE FUNCTION update_user(
  p_id UUID,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_telefoonnummer TEXT DEFAULT NULL,
  p_rang TEXT DEFAULT NULL,
  p_organisatie TEXT DEFAULT NULL,
  p_structuur TEXT DEFAULT NULL,
  p_afdeling TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE app_users
  SET
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    email = COALESCE(p_email, email),
    role = COALESCE(p_role, role),
    is_active = COALESCE(p_is_active, is_active),
    telefoonnummer = COALESCE(p_telefoonnummer, telefoonnummer),
    rang = COALESCE(p_rang, rang),
    organisatie = COALESCE(p_organisatie, organisatie),
    structuur = COALESCE(p_structuur, structuur),
    afdeling = COALESCE(p_afdeling, afdeling),
    updated_at = now()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. Update get_user_by_id – return new columns
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
  afdeling TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.username, u.email, u.first_name, u.last_name, u.role,
    u.is_active, u.must_change_password, u.last_login, u.created_at, u.updated_at,
    u.session_timeout_minutes, u.telefoonnummer, u.rang, u.organisatie, u.structuur, u.afdeling
  FROM app_users u
  WHERE u.id = p_id AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. Update login_user – return new columns
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
  session_timeout_minutes INTEGER,
  telefoonnummer TEXT,
  rang TEXT,
  organisatie TEXT,
  structuur TEXT,
  afdeling TEXT
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
    v_user.id, v_user.username, v_user.email, v_user.first_name, v_user.last_name,
    v_user.role, v_user.is_active, v_user.must_change_password,
    now(), v_user.created_at, now(),
    v_user.session_timeout_minutes,
    v_user.telefoonnummer, v_user.rang, v_user.organisatie, v_user.structuur, v_user.afdeling;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. Update get_all_users – return new columns
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
  afdeling TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.username, u.email, u.first_name, u.last_name, u.role,
    u.is_active, u.must_change_password, u.last_login, u.created_at, u.updated_at,
    u.session_timeout_minutes, u.telefoonnummer, u.rang, u.organisatie, u.structuur, u.afdeling
  FROM app_users u
  ORDER BY u.username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
