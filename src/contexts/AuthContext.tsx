import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authService } from '../services/authService'
import type { AppUser, LoginCredentials } from '../types'

const STORAGE_KEY = 'bst_user'

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (credentials: LoginCredentials) => Promise<void>
  signOut: () => Promise<void>
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

  const persistUser = useCallback((userData: AppUser | null) => {
    if (userData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
      setUser(userData)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      setUser(null)
    }
  }, [])

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
      loadUserWithPageVisibility(parsed.id).then((userWithVisibility) => {
        if (userWithVisibility) {
          setUser(userWithVisibility)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithVisibility))
        } else {
          localStorage.removeItem(STORAGE_KEY)
          setUser(null)
        }
      }).catch(() => {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
      }).finally(() => setLoading(false))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      setUser(null)
      setLoading(false)
    }
  }, [loadUserWithPageVisibility])

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const userData = await authService.login(credentials)
    const withVisibility = await loadUserWithPageVisibility(userData.id)
    persistUser(withVisibility ?? userData)
  }, [persistUser, loadUserWithPageVisibility])

  const signOut = useCallback(async () => {
    if (user?.id) {
      await authService.logout(user.id)
    }
    persistUser(null)
  }, [user?.id, persistUser])

  const refreshUser = useCallback(async () => {
    if (!user?.id) return
    const withVisibility = await loadUserWithPageVisibility(user.id)
    if (withVisibility) persistUser(withVisibility)
  }, [user?.id, persistUser, loadUserWithPageVisibility])

  const isAdmin = () => user?.role === 'admin'
  const isSuperUser = () => user?.role === 'super_user'
  const isSuperUserOrAdmin = () => user?.role === 'admin' || user?.role === 'super_user'

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signOut,
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
