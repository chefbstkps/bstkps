-- Signup: allows unauthenticated users to register. New users get is_active = false.
-- They can only log in after an admin approves them (sets is_active = true in User Management).
-- Run after add-user-fields.sql.

-- =============================================================================
-- signup_user – public registration (creates user with is_active = false)
-- =============================================================================
CREATE OR REPLACE FUNCTION signup_user(
  p_username TEXT,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_password TEXT
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Check for duplicate username (case-insensitive)
  IF EXISTS (SELECT 1 FROM app_users WHERE LOWER(username) = LOWER(TRIM(p_username))) THEN
    RAISE EXCEPTION 'Gebruikersnaam is al in gebruik';
  END IF;

  -- Check for duplicate email (case-insensitive)
  IF EXISTS (SELECT 1 FROM app_users WHERE LOWER(email) = LOWER(TRIM(p_email))) THEN
    RAISE EXCEPTION 'E-mailadres is al in gebruik';
  END IF;

  INSERT INTO app_users (
    username,
    email,
    first_name,
    last_name,
    password_hash,
    role,
    is_active,
    must_change_password
  )
  VALUES (
    TRIM(p_username),
    TRIM(LOWER(p_email)),
    NULLIF(TRIM(p_first_name), ''),
    NULLIF(TRIM(p_last_name), ''),
    hash_password(p_password),
    'user',
    false,  -- Not active until admin approves
    true
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow anonymous users to call signup_user
GRANT EXECUTE ON FUNCTION signup_user(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
