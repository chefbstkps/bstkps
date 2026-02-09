import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import type { UserActivityLogEntry } from '../types'
import { RefreshCw, ClipboardList } from 'lucide-react'
import './UsersLog.css'

const ACTIVITY_TYPES: Array<UserActivityLogEntry['activity_type']> = [
  'login',
  'logout',
  'password_change',
  'profile_update',
]

const ACTIVITY_LABELS: Record<UserActivityLogEntry['activity_type'], string> = {
  login: 'Login',
  logout: 'Logout',
  password_change: 'Wachtwoord gewijzigd',
  profile_update: 'Profiel bijgewerkt',
}

export default function UsersLog() {
  const { isAdmin } = useAuth()
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [userFilter, setUserFilter] = useState('')

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['user-activity-logs'],
    queryFn: () => authService.getUserActivityLogs(null),
    enabled: isAdmin(),
  })

  const filteredLogs = useMemo(() => {
    let list = [...logs]
    if (activityTypeFilter) {
      list = list.filter((l) => l.activity_type === activityTypeFilter)
    }
    if (fromDate) {
      const from = new Date(fromDate)
      from.setHours(0, 0, 0, 0)
      list = list.filter((l) => new Date(l.created_at) >= from)
    }
    if (toDate) {
      const to = new Date(toDate)
      to.setHours(23, 59, 59, 999)
      list = list.filter((l) => new Date(l.created_at) <= to)
    }
    if (userFilter.trim()) {
      const q = userFilter.trim().toLowerCase()
      list = list.filter((l) => l.username.toLowerCase().includes(q))
    }
    return list
  }, [logs, activityTypeFilter, fromDate, toDate, userFilter])

  const stats = useMemo(() => {
    const total = filteredLogs.length
    const success = filteredLogs.filter((l) => l.success).length
    const failed = total - success
    return { total, success, failed }
  }, [filteredLogs])

  if (!isAdmin()) {
    return (
      <div className="users-log-page">
        <div className="users-log-page__denied">
          <h1>Geen toegang</h1>
          <p>Alleen beheerders hebben toegang tot het activiteitenlogboek.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="users-log-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Laden...</p>
        </div>
      </div>
    )
  }

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString('nl-NL')
    } catch {
      return s
    }
  }

  return (
    <div className="users-log-page">
      <div className="users-log-page__header">
        <div>
          <h1>Activiteitenlogboek</h1>
          <p>Overzicht van inlog-, uitlog- en wijzigingsactiviteit</p>
        </div>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Vernieuwen"
        >
          <RefreshCw size={20} className={isFetching ? 'users-log-page__spin' : ''} />
          Vernieuwen
        </button>
      </div>

      <div className="users-log-page__stats">
        <div className="users-log-stat">
          <span className="users-log-stat__value">{stats.total}</span>
          <span className="users-log-stat__label">Totaal</span>
        </div>
        <div className="users-log-stat users-log-stat--success">
          <span className="users-log-stat__value">{stats.success}</span>
          <span className="users-log-stat__label">Geslaagd</span>
        </div>
        <div className="users-log-stat users-log-stat--failed">
          <span className="users-log-stat__value">{stats.failed}</span>
          <span className="users-log-stat__label">Mislukt</span>
        </div>
      </div>

      <div className="users-log-page__filters">
        <div className="users-log-page__filter">
          <label className="users-log-page__filter-label">Type</label>
          <select
            className="users-log-page__filter-select"
            value={activityTypeFilter}
            onChange={(e) => setActivityTypeFilter(e.target.value)}
          >
            <option value="">Alle</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>{ACTIVITY_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div className="users-log-page__filter">
          <label className="users-log-page__filter-label">Vanaf datum</label>
          <input
            type="date"
            className="users-log-page__filter-input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="users-log-page__filter">
          <label className="users-log-page__filter-label">Tot datum</label>
          <input
            type="date"
            className="users-log-page__filter-input"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="users-log-page__filter">
          <label className="users-log-page__filter-label">Gebruiker</label>
          <input
            type="text"
            className="users-log-page__filter-input"
            placeholder="Gebruikersnaam zoeken..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="users-log-page__table-wrap">
        <table className="users-log-table">
          <thead>
            <tr>
              <th>Tijd</th>
              <th>Gebruiker</th>
              <th>Type</th>
              <th>Status</th>
              <th>IP-adres</th>
              <th>Browser</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="users-log-table__empty">
                  <ClipboardList size={40} />
                  Geen activiteiten gevonden
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.created_at)}</td>
                  <td>{log.username}</td>
                  <td>{ACTIVITY_LABELS[log.activity_type]}</td>
                  <td>
                    <span className={`users-log-table__status users-log-table__status--${log.success ? 'ok' : 'fail'}`}>
                      {log.success ? 'Geslaagd' : 'Mislukt'}
                    </span>
                  </td>
                  <td>{log.ip_address || '—'}</td>
                  <td className="users-log-table__user-agent">{log.user_agent || '—'}</td>
                  <td className="users-log-table__details">{log.error_message || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
