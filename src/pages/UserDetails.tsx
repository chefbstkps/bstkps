import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import type { UserPageVisibility, UserPageKey, SessionTimeoutMinutes } from '../types'
import { USER_PAGE_KEYS } from '../types'
import { ArrowLeft, Save } from 'lucide-react'
import './UserDetails.css'

const PAGE_LABELS: Record<UserPageKey, string> = {
  storingen: 'Storingen',
  installation: 'Installation',
  issue: 'Afgifte',
  accessories: 'Accessoires',
  inventory: 'Inventory',
  brands: 'Merken',
  organizations: 'Organisatie',
  radio_archive: 'Radio archief',
}

const SESSION_TIMEOUT_OPTIONS: { value: SessionTimeoutMinutes; label: string }[] = [
  { value: 10, label: '10 minuten' },
  { value: 30, label: '30 minuten' },
  { value: 60, label: '60 minuten' },
  { value: null, label: 'Nooit' },
]

const defaultVisibility: UserPageVisibility = {
  storingen: true,
  installation: true,
  issue: true,
  accessories: true,
  inventory: true,
  brands: true,
  organizations: true,
  radio_archive: true,
}

export default function UserDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAdmin } = useAuth()
  const [visibility, setVisibility] = useState<UserPageVisibility>(defaultVisibility)
  const [savedVisibility, setSavedVisibility] = useState<UserPageVisibility>(defaultVisibility)
  const [sessionTimeout, setSessionTimeout] = useState<SessionTimeoutMinutes>(null)
  const [savedSessionTimeout, setSavedSessionTimeout] = useState<SessionTimeoutMinutes>(null)

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['app-user', id],
    queryFn: () => authService.getCurrentUser(id!),
    enabled: !!id && isAdmin(),
  })

  const { data: pageVisibility } = useQuery({
    queryKey: ['user-page-visibility', id],
    queryFn: () => authService.getUserPageVisibility(id!),
    enabled: !!id && isAdmin(),
  })

  const saveMutation = useMutation({
    mutationFn: async (vis: UserPageVisibility) => {
      if (!id) return
      for (const key of USER_PAGE_KEYS) {
        await authService.setUserPageVisibility(id, key, vis[key])
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-page-visibility', id] })
      setSavedVisibility(visibility)
    },
  })

  const sessionTimeoutMutation = useMutation({
    mutationFn: async (timeout: SessionTimeoutMinutes) => {
      if (!id) return
      await authService.setUserSessionTimeout(id, timeout)
    },
    onSuccess: (_, timeout) => {
      queryClient.invalidateQueries({ queryKey: ['app-user', id] })
      setSavedSessionTimeout(timeout)
    },
  })

  useEffect(() => {
    if (pageVisibility) {
      setVisibility(pageVisibility)
      setSavedVisibility(pageVisibility)
    }
  }, [pageVisibility])

  useEffect(() => {
    if (user) {
      const timeout = user.session_timeout_minutes ?? null
      setSessionTimeout(timeout)
      setSavedSessionTimeout(timeout)
    }
  }, [user])

  const handleToggle = (key: UserPageKey) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    saveMutation.mutate(visibility)
  }

  const formatDate = (s: string | undefined) => {
    if (!s) return '—'
    try {
      return new Date(s).toLocaleString('nl-NL')
    } catch {
      return s
    }
  }

  if (!isAdmin()) {
    return (
      <div className="user-details-page">
        <div className="user-details-page__denied">
          <h1>Geen toegang</h1>
          <p>Alleen beheerders hebben toegang tot gebruikersdetails.</p>
          <button type="button" className="btn btn--secondary" onClick={() => navigate('/user-management')}>
            Terug naar Gebruikersbeheer
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || !id) {
    return (
      <div className="user-details-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Laden...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="user-details-page">
        <div className="user-details-page__error">
          <p>Gebruiker niet gevonden.</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/user-management')}>
            Terug naar Gebruikersbeheer
          </button>
        </div>
      </div>
    )
  }

  const hasChanges =
    USER_PAGE_KEYS.some((key) => visibility[key] !== savedVisibility[key])
  const hasSessionTimeoutChanges = sessionTimeout !== savedSessionTimeout

  return (
    <div className="user-details-page">
      <div className="user-details-page__header">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => navigate('/user-management')}
        >
          <ArrowLeft size={20} />
          Terug naar Gebruikersbeheer
        </button>
        <h1 className="user-details-page__title">Gebruikersdetails</h1>
      </div>

      <div className="user-details-page__grid">
        <section className="user-details-card">
          <h2 className="user-details-card__title">Gegevens</h2>
          <dl className="user-details-dl">
            <div className="user-details-dl__row">
              <dt>Gebruikersnaam</dt>
              <dd>{user.username}</dd>
            </div>
            <div className="user-details-dl__row">
              <dt>Naam</dt>
              <dd>{[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}</dd>
            </div>
            <div className="user-details-dl__row">
              <dt>E-mail</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="user-details-dl__row">
              <dt>Rol</dt>
              <dd>
                <span className={`user-details-role user-details-role--${user.role}`}>
                  {user.role}
                </span>
              </dd>
            </div>
            <div className="user-details-dl__row">
              <dt>Status</dt>
              <dd>{user.is_active ? 'Actief' : 'Inactief'}</dd>
            </div>
            <div className="user-details-dl__row">
              <dt>Laatste login</dt>
              <dd>{formatDate(user.last_login)}</dd>
            </div>
            <div className="user-details-dl__row">
              <dt>Aangemaakt</dt>
              <dd>{formatDate(user.created_at)}</dd>
            </div>
            <div className="user-details-dl__row">
              <dt>Bijgewerkt</dt>
              <dd>{formatDate(user.updated_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="user-details-card">
          <h2 className="user-details-card__title">Sessie verloop</h2>
          <p className="user-details-card__intro">
            Na het geselecteerd aantal minuten wordt de gebruiker automatisch uitgelogd en moet opnieuw inloggen.
            &quot;Nooit&quot; betekent dat de sessie niet vervalt.
          </p>
          <div className="user-details-session-timeout">
            <select
              className="user-details-select"
              value={sessionTimeout ?? 'never'}
              onChange={(e) => {
                const v = e.target.value
                setSessionTimeout(v === 'never' ? null : (Number(v) as 10 | 30 | 60))
              }}
            >
              {SESSION_TIMEOUT_OPTIONS.map((opt) => (
                <option key={String(opt.value)} value={opt.value ?? 'never'}>
                  {opt.label}
                </option>
              ))}
            </select>
            {hasSessionTimeoutChanges && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => sessionTimeoutMutation.mutate(sessionTimeout)}
                disabled={sessionTimeoutMutation.isPending}
              >
                <Save size={18} />
                {sessionTimeoutMutation.isPending ? 'Opslaan...' : 'Opslaan'}
              </button>
            )}
          </div>
        </section>

        <section className="user-details-card">
          <h2 className="user-details-card__title">Pagina's zichtbaarheid</h2>
          <p className="user-details-card__intro">
            Bepaal welke pagina's deze gebruiker in het menu ziet en kan openen.
          </p>
          <ul className="user-details-toggles">
            {USER_PAGE_KEYS.map((key) => (
              <li key={key} className="user-details-toggles__item">
                <label className="user-details-toggle">
                  <input
                    type="checkbox"
                    checked={visibility[key]}
                    onChange={() => handleToggle(key)}
                  />
                  <span className="user-details-toggle__label">{PAGE_LABELS[key]}</span>
                </label>
              </li>
            ))}
          </ul>
          {hasChanges && (
            <div className="user-details-card__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                <Save size={18} />
                {saveMutation.isPending ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
