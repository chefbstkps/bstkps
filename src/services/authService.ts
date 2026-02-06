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
} from '../types'
import { USER_PAGE_KEYS } from '../types'

const ACTIVITY_LOGS_TABLE = 'user_activity_logs'

export const authService = {
  /**
   * Validate credentials and return user. Uses RPC login_user (checks password in DB).
   */
  async login(credentials: LoginCredentials): Promise<AppUser> {
    const { data, error } = await supabase
      .rpc('login_user', {
        p_username: credentials.username,
        p_password: credentials.password,
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
      created_at: row.created_at,
      updated_at: row.updated_at,
      session_timeout_minutes: (row.session_timeout_minutes as SessionTimeoutMinutes) ?? null,
    }

    await this.logActivity(user.id, 'login', true)
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
      created_at: row.created_at,
      updated_at: row.updated_at,
      session_timeout_minutes: (row.session_timeout_minutes as SessionTimeoutMinutes) ?? null,
    }
  },

  /**
   * Write activity to user_activity_logs.
   */
  async logActivity(
    userId: string | null,
    activityType: 'login' | 'logout' | 'password_change' | 'profile_update',
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    if (!userId) return

    await supabase.from(ACTIVITY_LOGS_TABLE).insert({
      user_id: userId,
      activity_type: activityType,
      success,
      error_message: errorMessage ?? null,
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
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      session_timeout_minutes: (row.session_timeout_minutes as SessionTimeoutMinutes) ?? null,
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
   */
  async setUserSessionTimeout(
    userId: string,
    sessionTimeoutMinutes: SessionTimeoutMinutes
  ): Promise<void> {
    const { error } = await supabase.rpc('set_user_session_timeout', {
      p_user_id: userId,
      p_session_timeout_minutes: sessionTimeoutMinutes,
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
