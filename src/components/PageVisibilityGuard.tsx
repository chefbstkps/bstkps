import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function getPageKeyForPath(path: string): string | null {
  if (path === '/storingen' || path.startsWith('/storingen/')) return 'storingen'
  if (path === '/installation') return 'installation'
  if (path === '/issue') return 'issue'
  if (path === '/accessories') return 'accessories'
  if (path === '/inventory') return 'inventory'
  if (path === '/brands') return 'brands'
  if (path === '/organizations') return 'organizations'
  if (path === '/radio-archive' || path.startsWith('/radio-archive/')) return 'radio_archive'
  return null
}

export default function PageVisibilityGuard() {
  const location = useLocation()
  const { user } = useAuth()
  const pageKey = getPageKeyForPath(location.pathname)
  if (!pageKey) return <Outlet />
  if (!user?.page_visibility) return <Outlet />
  if (user.page_visibility[pageKey as keyof typeof user.page_visibility] !== false) return <Outlet />
  return <Navigate to="/" replace />
}
