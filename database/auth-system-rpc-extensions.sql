-- Extensions for Profile, User Management and Activity Log
-- Run after auth-system-simple.sql. Uses existing hash_password and app_users / user_activity_logs.

-- =============================================================================
-- 1. update_user – update profile (first_name, last_name, email) or admin edit (+ role, is_active)
-- =============================================================================
CREATE OR REPLACE FUNCTION update_user(
  p_id UUID,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL
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
    updated_at = now()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 2. change_password – user changes own password (verify current, set new)
-- Parameter order must match Supabase schema cache: p_current_password, p_new_password, p_user_id
-- =============================================================================
CREATE OR REPLACE FUNCTION change_password(
  p_current_password TEXT,
  p_new_password TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT password_hash INTO v_hash FROM app_users WHERE id = p_user_id;
  IF v_hash IS NULL THEN
    RETURN false;
  END IF;
  IF NOT verify_password(p_current_password, v_hash) THEN
    RETURN false;
  END IF;
  UPDATE app_users
  SET password_hash = hash_password(p_new_password),
      must_change_password = false,
      updated_at = now()
  WHERE id = p_user_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. get_all_users – returns all users (no password_hash) for admin
-- =============================================================================
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
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.username, u.email, u.first_name, u.last_name, u.role,
    u.is_active, u.must_change_password, u.last_login, u.created_at, u.updated_at
  FROM app_users u
  ORDER BY u.username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. create_user – insert new user with hashed password
-- =============================================================================
CREATE OR REPLACE FUNCTION create_user(
  p_username TEXT,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_password TEXT,
  p_role TEXT
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO app_users (username, email, first_name, last_name, password_hash, role)
  VALUES (
    p_username,
    p_email,
    NULLIF(TRIM(p_first_name), ''),
    NULLIF(TRIM(p_last_name), ''),
    hash_password(p_password),
    COALESCE(NULLIF(TRIM(p_role), ''), 'user')
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. delete_user – remove user (cascade will remove activity logs)
-- =============================================================================
CREATE OR REPLACE FUNCTION delete_user(p_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM app_users WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. reset_password – admin sets new password for a user
-- =============================================================================
CREATE OR REPLACE FUNCTION reset_password(p_user_id UUID, p_new_password TEXT)
RETURNS void AS $$
BEGIN
  UPDATE app_users
  SET password_hash = hash_password(p_new_password),
      must_change_password = true,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. get_user_activity_logs – logs with username; p_user_id NULL = all (admin)
-- =============================================================================
CREATE OR REPLACE FUNCTION get_user_activity_logs(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username TEXT,
  activity_type TEXT,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ
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
    l.created_at
  FROM user_activity_logs l
  JOIN app_users u ON u.id = l.user_id
  WHERE (p_user_id IS NULL OR l.user_id = p_user_id)
  ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
