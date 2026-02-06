-- User Login System for BST app
-- Run this in Supabase SQL Editor to create app_users, activity logs, and password functions.

-- =============================================================================
-- 1. app_users table
-- =============================================================================
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'super_user', 'user')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for login lookup
CREATE INDEX IF NOT EXISTS idx_app_users_username_lower ON app_users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_app_users_is_active ON app_users (is_active);

-- =============================================================================
-- 2. user_activity_logs table
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'password_change', 'profile_update')),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs (created_at);

-- =============================================================================
-- 3. Password functions (SHA256 + salt – for production use bcrypt/argon2)
-- =============================================================================
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(password || 'bst_salt', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash_password(password) = hash;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. RPC for verify_password (callable from client via supabase.rpc)
-- =============================================================================
-- Note: We expose verify_password via RPC so the client can check the password
-- without sending the hash to the client. The login flow is:
-- 1. Client fetches user by username (password_hash is in DB).
-- 2. Client calls verify_password_rpc(password, password_hash) – this runs in DB.
-- 3. If true, login succeeds.
-- For security we use a single RPC that accepts username and password and returns
-- the user row only if valid (so we never send password_hash to client).
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
  updated_at TIMESTAMPTZ
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
    RETURN; -- no row
  END IF;

  IF NOT verify_password(p_password, v_user.password_hash) THEN
    RETURN; -- no row
  END IF;

  -- Update last_login
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
    now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. RLS (Row Level Security)
-- =============================================================================
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- app_users: no direct SELECT for anon (login and get user via RPCs only)
-- Allow anon to call login_user and get_user_by_id (SECURITY DEFINER)
-- So we need a policy that allows INSERT into user_activity_logs for logging.
-- login_user is SECURITY DEFINER so it runs with definer rights and can read app_users.
-- For logging we need to allow insert. Easiest: allow service role only for app_users writes,
-- and for user_activity_logs allow insert when... we don't have auth.uid() for custom auth.
-- So: use service role in backend, or allow anon to execute login_user and to insert into user_activity_logs.
-- Supabase anon key: typically we'd use a backend or allow selected operations.

-- Policy: allow anyone to call login_user (it's SECURITY DEFINER and only returns non-sensitive data)
-- For user_activity_logs we need to insert from the client. We can allow INSERT without a user check
-- if we pass user_id in the payload (and trust the client for activity logging). Or restrict to service role.
-- Simple approach: allow authenticated (Supabase) OR allow anon to insert with a check that user_id exists.
-- Custom auth means we don't have Supabase auth.uid(). So either:
-- A) Use a Postgres role that the client uses with a limited policy, or
-- B) Allow INSERT on user_activity_logs for any user_id that exists in app_users (for logging).
-- We'll add policy: allow insert on user_activity_logs (for login/logout logging from client).
DROP POLICY IF EXISTS "Allow insert activity log" ON user_activity_logs;
CREATE POLICY "Allow insert activity log" ON user_activity_logs
  FOR INSERT WITH CHECK (true);

-- Allow reading app_users by username for login check - but login_user RPC does that server-side.
-- So we don't need to expose SELECT on app_users to anon. Only service role needs full access.
-- For getCurrentUser we need to fetch by id. So we need SELECT where id = X. But we don't have auth.uid().
-- So we'll fetch user in the app after login and store in localStorage; getCurrentUser can call an RPC that
-- takes user_id (from localStorage) and returns that user row. So we need an RPC get_user_by_id(id) SECURITY DEFINER.
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
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.username, u.email, u.first_name, u.last_name, u.role,
    u.is_active, u.must_change_password, u.last_login, u.created_at, u.updated_at
  FROM app_users u
  WHERE u.id = p_id AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. Initial admin user (password: admin123 – change in production!)
-- =============================================================================
INSERT INTO app_users (username, email, password_hash, first_name, last_name, role, must_change_password)
VALUES (
  'admin',
  'admin@example.com',
  hash_password('admin123'),
  'Admin',
  'User',
  'admin',
  true
)
ON CONFLICT (username) DO NOTHING;
