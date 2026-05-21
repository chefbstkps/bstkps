-- Remote logout: invalidate localStorage sessions on other browsers/devices.
-- Run after add-session-timeout-type.sql (or equivalent get_user_by_id / login_user definitions).

-- =============================================================================
-- 1. Column sessions_invalidated_at on app_users
-- =============================================================================
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS sessions_invalidated_at TIMESTAMPTZ;

COMMENT ON COLUMN app_users.sessions_invalidated_at IS
  'Sessions with bst_logged_in_at < this timestamp are invalid. NULL = no remote invalidation yet.';

-- =============================================================================
-- 2. Extend activity log type for audit
-- =============================================================================
ALTER TABLE user_activity_logs
  DROP CONSTRAINT IF EXISTS user_activity_logs_activity_type_check;

ALTER TABLE user_activity_logs
  ADD CONSTRAINT user_activity_logs_activity_type_check
  CHECK (activity_type IN (
    'login', 'logout', 'password_change', 'profile_update', 'invalidate_other_sessions'
  ));

-- =============================================================================
-- 3. invalidate_other_sessions – bump invalidation timestamp (current browser updates local logged_in_at)
-- =============================================================================
CREATE OR REPLACE FUNCTION invalidate_other_sessions(p_user_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_at TIMESTAMPTZ := now();
BEGIN
  UPDATE app_users
  SET sessions_invalidated_at = v_at, updated_at = v_at
  WHERE id = p_user_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found or inactive';
  END IF;

  RETURN v_at;
END;
$$;

GRANT EXECUTE ON FUNCTION invalidate_other_sessions(UUID) TO anon;
GRANT EXECUTE ON FUNCTION invalidate_other_sessions(UUID) TO authenticated;

-- =============================================================================
-- 4. get_user_by_id – return sessions_invalidated_at
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
  session_timeout_type TEXT,
  telefoonnummer TEXT,
  rang TEXT,
  organisatie TEXT,
  structuur TEXT,
  afdeling TEXT,
  last_login_ip TEXT,
  last_login_user_agent TEXT,
  sessions_invalidated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.username, u.email, u.first_name, u.last_name, u.role,
    u.is_active, u.must_change_password, u.last_login, u.created_at, u.updated_at,
    u.session_timeout_minutes, COALESCE(u.session_timeout_type, 'since_login'),
    u.telefoonnummer, u.rang, u.organisatie, u.structuur, u.afdeling,
    u.last_login_ip, u.last_login_user_agent,
    u.sessions_invalidated_at
  FROM app_users u
  WHERE u.id = p_id AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. login_user – return sessions_invalidated_at (4-arg signatuur)
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
  session_timeout_type TEXT,
  telefoonnummer TEXT,
  rang TEXT,
  organisatie TEXT,
  structuur TEXT,
  afdeling TEXT,
  last_login_ip TEXT,
  last_login_user_agent TEXT,
  sessions_invalidated_at TIMESTAMPTZ
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
    COALESCE(v_user.session_timeout_type, 'since_login'),
    v_user.telefoonnummer, v_user.rang, v_user.organisatie, v_user.structuur, v_user.afdeling,
    NULLIF(TRIM(COALESCE(p_ip, '')), ''),
    NULLIF(TRIM(COALESCE(p_user_agent, '')), ''),
    v_user.sessions_invalidated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
