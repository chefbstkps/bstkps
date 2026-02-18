import { supabase } from '../lib/supabase'
import type {
  AppUser,
  LoginCredentials,
  CreateUserData,
  UpdateUserData,
  ChangePasswordData,
  ResetPasswordData,
  UserActivityLogEntry,
  UserPageVisibility,
  UserPageKey,
  SessionTimeoutMinutes,
  SessionTimeoutType,
} from '../types'
import { USER_PAGE_KEYS } from '../types'

const ACTIVITY_LOGS_TABLE = 'user_activity_logs'

export const authService = {
  /**
   * Validate credentials and return user. Uses RPC login_user (checks password in DB).
   * Registreert IP en browser (user agent) bij succesvolle login.
   */
  async login(credentials: LoginCredentials): Promise<AppUser> {
    let ip = ''
    try {
      const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) })
      const json = await res.json()
      if (typeof json?.ip === 'string') ip = json.ip
    } catch {
      // negeer; ip blijft leeg
    }
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''

    const { data, error } = await supabase.rpc('login_user', {
      p_username: credentials.username,
      p_password: credentials.password,
      p_ip: ip || null,
      p_user_agent: userAgent || null,
    })

    if (error) {
      throw new Error(error.message || 'Inloggen mislukt')
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row || !row.id) {
      throw new Error('Ongeldige gebruikersnaam of wachtwoord')
    }

    const user: AppUser = {
      id: row.id,
      username: row.username,
      email: row.email,
      first_name: row.first_name ?? '',
      last_name: row.last_name ?? '',
      role: row.role,
      is_active: row.is_active,
      must_change_password: row.must_change_password,
      last_login: row.last_login,
      last_login_ip: row.last_login_ip ?? undefined,
      last_login_user_agent: row.last_login_user_agent ?? undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      session_timeout_minutes: (row.session_timeout_minutes as SessionTimeoutMinutes) ?? null,
      session_timeout_type: (row.session_timeout_type as SessionTimeoutType) ?? 'since_login',
      telefoonnummer: row.telefoonnummer ?? undefined,
      rang: row.rang ?? undefined,
      organisatie: row.organisatie ?? undefined,
      structuur: row.structuur ?? undefined,
      afdeling: row.afdeling ?? undefined,
    }

    await this.logActivity(user.id, 'login', true, undefined, ip || null, userAgent || null)
    return user
  },

  /**
   * Log logout activity and optionally clear server-side session (none for localStorage-only).
   */
  async logout(userId: string | null): Promise<void> {
    if (userId) {
      await this.logActivity(userId, 'logout', true)
    }
  },

  /**
   * Fetch current user by ID (e.g. after app load from localStorage).
   */
  async getCurrentUser(userId: string): Promise<AppUser | null> {
    const { data, error } = await supabase.rpc('get_user_by_id', { p_id: userId })

    if (error) {
      console.error('getCurrentUser error:', error)
      return null
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row || !row.id) return null

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      first_name: row.first_name ?? '',
      last_name: row.last_name ?? '',
      role: row.role,
      is_active: row.is_active,
      must_change_password: row.must_change_password,
      last_login: row.last_login,
      last_login_ip: row.last_login_ip ?? undefined,
      last_login_user_agent: row.last_login_user_agent ?? undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      session_timeout_minutes: (row.session_timeout_minutes as SessionTimeoutMinutes) ?? null,
      session_timeout_type: (row.session_timeout_type as SessionTimeoutType) ?? 'since_login',
      telefoonnummer: row.telefoonnummer ?? undefined,
      rang: row.rang ?? undefined,
      organisatie: row.organisatie ?? undefined,
      structuur: row.structuur ?? undefined,
      afdeling: row.afdeling ?? undefined,
    }
  },

  /**
   * Write activity to user_activity_logs. Optioneel ip_address en user_agent (voor login).
   */
  async logActivity(
    userId: string | null,
    activityType: 'login' | 'logout' | 'password_change' | 'profile_update',
    success: boolean,
    errorMessage?: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    if (!userId) return

    await supabase.from(ACTIVITY_LOGS_TABLE).insert({
      user_id: userId,
      activity_type: activityType,
      success,
      error_message: errorMessage ?? null,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
    })
  },

  /**
   * Update user (profile: first_name, last_name, email; admin: + role, is_active).
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<void> {
    const { error } = await supabase.rpc('update_user', {
      p_id: userId,
      p_first_name: data.first_name ?? null,
      p_last_name: data.last_name ?? null,
      p_email: data.email ?? null,
      p_role: data.role ?? null,
      p_is_active: data.is_active ?? null,
      p_telefoonnummer: data.telefoonnummer ?? null,
      p_rang: data.rang ?? null,
      p_organisatie: data.organisatie ?? null,
      p_structuur: data.structuur ?? null,
      p_afdeling: data.afdeling ?? null,
    })
    if (error) throw new Error(error.message)
  },

  /**
   * User changes own password. Logs password_change activity on success.
   */
  async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    const { data: ok, error } = await supabase.rpc('change_password', {
      p_user_id: userId,
      p_current_password: data.current_password,
      p_new_password: data.new_password,
    })
    if (error) throw new Error(error.message)
    if (!ok) throw new Error('Huidig wachtwoord is onjuist')
    await this.logActivity(userId, 'password_change', true)
  },

  /**
   * Get all users (admin). No password_hash.
   */
  async getAllUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase.rpc('get_all_users')
    if (error) throw new Error(error.message)
    const rows = Array.isArray(data) ? data : data ? [data] : []
    return rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      username: row.username as string,
      email: row.email as string,
      first_name: (row.first_name as string) ?? '',
      last_name: (row.last_name as string) ?? '',
      role: row.role as AppUser['role'],
      is_active: row.is_active as boolean,
      must_change_password: row.must_change_password as boolean,
      last_login: row.last_login as string | undefined,
      last_login_ip: (row.last_login_ip as string) ?? undefined,
      last_login_user_agent: (row.last_login_user_agent as string) ?? undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      session_timeout_minutes: (row.session_timeout_minutes as SessionTimeoutMinutes) ?? null,
      session_timeout_type: ((row as { session_timeout_type?: string }).session_timeout_type as SessionTimeoutType) ?? 'since_login',
      telefoonnummer: (row.telefoonnummer as string) ?? undefined,
      rang: (row.rang as string) ?? undefined,
      organisatie: (row.organisatie as string) ?? undefined,
      structuur: (row.structuur as string) ?? undefined,
      afdeling: (row.afdeling as string) ?? undefined,
    }))
  },

  /**
   * Create user (admin). Password is hashed in DB.
   */
  async createUser(data: CreateUserData): Promise<string> {
    const { data: id, error } = await supabase.rpc('create_user', {
      p_username: data.username,
      p_email: data.email,
      p_first_name: data.first_name,
      p_last_name: data.last_name,
      p_password: data.password,
      p_role: data.role,
      p_telefoonnummer: data.telefoonnummer ?? null,
      p_rang: data.rang ?? null,
      p_organisatie: data.organisatie ?? null,
      p_structuur: data.structuur ?? null,
      p_afdeling: data.afdeling ?? null,
    })
    if (error) throw new Error(error.message)
    return id as string
  },

  /**
   * Delete user (admin). Cascades to activity logs.
   */
  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.rpc('delete_user', { p_id: userId })
    if (error) throw new Error(error.message)
  },

  /**
   * Admin resets password for a user. Sets must_change_password = true.
   */
  async resetPassword(data: ResetPasswordData): Promise<void> {
    const { error } = await supabase.rpc('reset_password', {
      p_user_id: data.user_id,
      p_new_password: data.new_password,
    })
    if (error) throw new Error(error.message)
    await this.logActivity(data.user_id, 'password_change', true)
  },

  /**
   * Get activity logs. If userId is omitted, returns all (admin).
   */
  async getUserActivityLogs(userId?: string | null): Promise<UserActivityLogEntry[]> {
    const { data, error } = await supabase.rpc('get_user_activity_logs', {
      p_user_id: userId ?? null,
    })
    if (error) throw new Error(error.message)
    const rows = Array.isArray(data) ? data : data ? [data] : []
    return rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      user_id: row.user_id as string,
      username: row.username as string,
      activity_type: row.activity_type as UserActivityLogEntry['activity_type'],
      success: row.success as boolean,
      error_message: (row.error_message as string) ?? null,
      created_at: row.created_at as string,
      ip_address: (row.ip_address as string) ?? null,
      user_agent: (row.user_agent as string) ?? null,
    }))
  },

  /**
   * Get page visibility for a user (which nav pages are visible). Default all true if no rows.
   */
  async getUserPageVisibility(userId: string): Promise<UserPageVisibility> {
    const { data, error } = await supabase.rpc('get_user_page_visibility', {
      p_user_id: userId,
    })
    if (error) throw new Error(error.message)
    const rows = Array.isArray(data) ? data : data ? [data] : []
    const map: UserPageVisibility = {} as UserPageVisibility
    for (const key of USER_PAGE_KEYS) {
      map[key] = true
    }
    for (const row of rows as Array<{ page_key: string; visible: boolean }>) {
      if (USER_PAGE_KEYS.includes(row.page_key as UserPageKey)) {
        map[row.page_key as UserPageKey] = row.visible
      }
    }
    return map
  },

  /**
   * Set session timeout for a user (admin). 10, 30, 60 minutes or null (never).
   * Type: since_login = timeout since login; inactivity = timeout after last activity.
   */
  async setUserSessionTimeout(
    userId: string,
    sessionTimeoutMinutes: SessionTimeoutMinutes,
    sessionTimeoutType: SessionTimeoutType = 'since_login'
  ): Promise<void> {
    const { error } = await supabase.rpc('set_user_session_timeout', {
      p_user_id: userId,
      p_session_timeout_minutes: sessionTimeoutMinutes,
      p_session_timeout_type: sessionTimeoutType,
    })
    if (error) throw new Error(error.message)
  },

  /**
   * Set one page visibility for a user (admin).
   */
  async setUserPageVisibility(
    userId: string,
    pageKey: UserPageKey,
    visible: boolean
  ): Promise<void> {
    const { error } = await supabase.rpc('set_user_page_visibility', {
      p_user_id: userId,
      p_page_key: pageKey,
      p_visible: visible,
    })
    if (error) throw new Error(error.message)
  },
}
