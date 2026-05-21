import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authService, isSessionStillValid } from '../services/authService'
import type { AppUser, LoginCredentials } from '../types'

const STORAGE_KEY = 'bst_user'
const LOGGED_IN_AT_KEY = 'bst_logged_in_at'
const LAST_ACTIVITY_AT_KEY = 'bst_last_activity_at'

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (credentials: LoginCredentials) => Promise<void>
  signOut: () => Promise<void>
  signOutOtherDevices: () => Promise<void>
  refreshUser: () => Promise<void>
  isAdmin: () => boolean
  isSuperUser: () => boolean
  isSuperUserOrAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const persistUser = useCallback((userData: AppUser | null, loggedInAt?: number) => {
    if (userData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
      if (loggedInAt !== undefined) {
        localStorage.setItem(LOGGED_IN_AT_KEY, String(loggedInAt))
        const now = Date.now()
        localStorage.setItem(LAST_ACTIVITY_AT_KEY, String(now))
      }
      setUser(userData)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LOGGED_IN_AT_KEY)
      localStorage.removeItem(LAST_ACTIVITY_AT_KEY)
      setUser(null)
    }
  }, [])

  const getLoggedInAtMs = useCallback((): number => {
    const raw = localStorage.getItem(LOGGED_IN_AT_KEY)
    if (raw) return parseInt(raw, 10)
    return 0
  }, [])

  const clearSessionAndRedirectToLogin = useCallback(() => {
    persistUser(null)
    window.location.href = '/login'
  }, [persistUser])

  const ensureSessionValid = useCallback(
    (userData: AppUser): boolean => {
      if (!isSessionStillValid(getLoggedInAtMs(), userData.sessions_invalidated_at)) {
        clearSessionAndRedirectToLogin()
        return false
      }
      return true
    },
    [getLoggedInAtMs, clearSessionAndRedirectToLogin]
  )

  const loadUserWithPageVisibility = useCallback(async (userId: string): Promise<AppUser | null> => {
    const fresh = await authService.getCurrentUser(userId)
    if (!fresh) return null
    try {
      const page_visibility = await authService.getUserPageVisibility(userId)
      return { ...fresh, page_visibility }
    } catch {
      return fresh
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setLoading(false)
      return
    }
    try {
      const parsed = JSON.parse(stored) as AppUser
      const loggedInAt = localStorage.getItem(LOGGED_IN_AT_KEY)
      loadUserWithPageVisibility(parsed.id).then((userWithVisibility) => {
        if (userWithVisibility) {
          if (!isSessionStillValid(
            loggedInAt ? parseInt(loggedInAt, 10) : 0,
            userWithVisibility.sessions_invalidated_at
          )) {
            localStorage.removeItem(STORAGE_KEY)
            localStorage.removeItem(LOGGED_IN_AT_KEY)
            localStorage.removeItem(LAST_ACTIVITY_AT_KEY)
            setUser(null)
            return
          }
          setUser(userWithVisibility)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithVisibility))
          if (!loggedInAt) {
            const fallback = userWithVisibility.last_login
              ? new Date(userWithVisibility.last_login).getTime()
              : Date.now()
            localStorage.setItem(LOGGED_IN_AT_KEY, String(fallback))
            localStorage.setItem(LAST_ACTIVITY_AT_KEY, String(Date.now()))
          }
          if ((userWithVisibility.session_timeout_type ?? 'since_login') === 'inactivity' && !localStorage.getItem(LAST_ACTIVITY_AT_KEY)) {
            localStorage.setItem(LAST_ACTIVITY_AT_KEY, String(Date.now()))
          }
        } else {
          localStorage.removeItem(STORAGE_KEY)
          localStorage.removeItem(LOGGED_IN_AT_KEY)
          localStorage.removeItem(LAST_ACTIVITY_AT_KEY)
          setUser(null)
        }
      }).catch(() => {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(LOGGED_IN_AT_KEY)
        localStorage.removeItem(LAST_ACTIVITY_AT_KEY)
        setUser(null)
      }).finally(() => setLoading(false))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LOGGED_IN_AT_KEY)
      localStorage.removeItem(LAST_ACTIVITY_AT_KEY)
      setUser(null)
      setLoading(false)
    }
  }, [loadUserWithPageVisibility])

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const userData = await authService.login(credentials)
    const withVisibility = await loadUserWithPageVisibility(userData.id)
    persistUser(withVisibility ?? userData, Date.now())
  }, [persistUser, loadUserWithPageVisibility])

  const signOut = useCallback(async () => {
    if (user?.id) {
      await authService.logout(user.id)
    }
    persistUser(null)
  }, [user?.id, persistUser])

  const signOutOtherDevices = useCallback(async () => {
    if (!user?.id) return
    const invalidatedAt = await authService.invalidateOtherSessions(user.id)
    const loggedInAt = new Date(invalidatedAt).getTime()
    const withVisibility = await loadUserWithPageVisibility(user.id)
    if (withVisibility) {
      persistUser(
        { ...withVisibility, sessions_invalidated_at: invalidatedAt },
        loggedInAt
      )
    }
  }, [user?.id, persistUser, loadUserWithPageVisibility])

  useEffect(() => {
    if (!user?.id) return

    const checkSession = async () => {
      const fresh = await authService.getCurrentUser(user.id)
      if (!fresh) {
        clearSessionAndRedirectToLogin()
        return
      }
      if (!isSessionStillValid(getLoggedInAtMs(), fresh.sessions_invalidated_at)) {
        clearSessionAndRedirectToLogin()
        return
      }

      setUser((prev) =>
        prev ? { ...prev, sessions_invalidated_at: fresh.sessions_invalidated_at } : prev
      )

      const timeoutMinutes = fresh.session_timeout_minutes
      if (timeoutMinutes == null) return

      const timeoutType = fresh.session_timeout_type ?? 'since_login'
      const refKey = timeoutType === 'inactivity' ? LAST_ACTIVITY_AT_KEY : LOGGED_IN_AT_KEY
      const refAt = localStorage.getItem(refKey)
      if (!refAt) return
      const elapsed = Date.now() - parseInt(refAt, 10)
      const limitMs = timeoutMinutes * 60 * 1000
      if (elapsed >= limitMs) {
        clearSessionAndRedirectToLogin()
      }
    }

    const interval = setInterval(() => {
      void checkSession()
    }, 60_000)
    void checkSession()
    return () => clearInterval(interval)
  }, [user?.id, getLoggedInAtMs, clearSessionAndRedirectToLogin])

  // Update last activity timestamp on user interaction (for inactivity timeout)
  useEffect(() => {
    if (!user?.id) return
    if ((user.session_timeout_type ?? 'since_login') !== 'inactivity') return

    const updateActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_AT_KEY, String(Date.now()))
    }

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach((ev) => window.addEventListener(ev, updateActivity))
    return () => events.forEach((ev) => window.removeEventListener(ev, updateActivity))
  }, [user?.id, user?.session_timeout_type])

  const refreshUser = useCallback(async () => {
    if (!user?.id) return
    const withVisibility = await loadUserWithPageVisibility(user.id)
    if (!withVisibility) {
      clearSessionAndRedirectToLogin()
      return
    }
    if (!ensureSessionValid(withVisibility)) return
    persistUser(withVisibility)
  }, [user?.id, persistUser, loadUserWithPageVisibility, ensureSessionValid, clearSessionAndRedirectToLogin])

  const isAdmin = () => user?.role === 'admin'
  const isSuperUser = () => user?.role === 'super_user'
  const isSuperUserOrAdmin = () => user?.role === 'admin' || user?.role === 'super_user'

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    signOutOtherDevices,
    refreshUser,
    isAdmin,
    isSuperUser,
    isSuperUserOrAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
