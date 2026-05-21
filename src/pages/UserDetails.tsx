import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import { OrganizationService } from '../services/organizationService'
import type { UserPageVisibility, UserPageKey, SessionTimeoutMinutes, SessionTimeoutType, AppUser, UpdateUserData } from '../types'
import { USER_PAGE_KEYS } from '../types'
import { ArrowLeft, Save, Edit, X } from 'lucide-react'
import './UserDetails.css'
import './UserManagement.css'

const ROLES: Array<AppUser['role']> = ['admin', 'super_user', 'user']

const PAGE_LABELS: Record<UserPageKey, string> = {
  storingen: 'Storingen',
  installation: 'Installation',
  issue: 'Afgifte',
  accessories: 'Accessoires',
  inventory: 'Inventory',
  brands: 'Merken',
  organizations: 'Organisatie',
  radio_archive: 'Radio archief',
  radio_history: 'Radio geschiedenis',
  telefoon: 'Telefoon',
  phone_numbers: 'Telefoonnummers',
}

const SESSION_TIMEOUT_OPTIONS: { value: SessionTimeoutMinutes; label: string }[] = [
  { value: 10, label: '10 minuten' },
  { value: 30, label: '30 minuten' },
  { value: 60, label: '60 minuten' },
  { value: null, label: 'Nooit' },
]

const SESSION_TIMEOUT_TYPE_OPTIONS: { value: SessionTimeoutType; label: string }[] = [
  { value: 'since_login', label: 'Verloop ongeacht activiteit (X minuten na inloggen)' },
  { value: 'inactivity', label: 'Verloop na inactiviteit (X minuten zonder actie)' },
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
  radio_history: true,
  telefoon: true,
  phone_numbers: true,
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
  const [sessionTimeoutType, setSessionTimeoutType] = useState<SessionTimeoutType>('since_login')
  const [savedSessionTimeoutType, setSavedSessionTimeoutType] = useState<SessionTimeoutType>('since_login')
  const [editOpen, setEditOpen] = useState(false)

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
    mutationFn: async (payload: { timeout: SessionTimeoutMinutes; type: SessionTimeoutType }) => {
      if (!id) return
      await authService.setUserSessionTimeout(id, payload.timeout, payload.type)
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ['app-user', id] })
      setSavedSessionTimeout(payload.timeout)
      setSavedSessionTimeoutType(payload.type)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (vars: { data: UpdateUserData }) => authService.updateUser(id!, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-user', id] })
      setEditOpen(false)
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
      const type = user.session_timeout_type ?? 'since_login'
      setSessionTimeout(timeout)
      setSavedSessionTimeout(timeout)
      setSessionTimeoutType(type)
      setSavedSessionTimeoutType(type)
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
  const hasSessionTimeoutChanges = sessionTimeout !== savedSessionTimeout || sessionTimeoutType !== savedSessionTimeoutType

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
          <div className="user-details-card__header-row">
            <h2 className="user-details-card__title">Gegevens</h2>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setEditOpen(true)}
              aria-label="Gebruiker bewerken"
            >
              <Edit size={18} />
              Bewerken
            </button>
          </div>
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
              <dt>Telefoonnummer</dt>
              <dd>{user.telefoonnummer || '—'}</dd>
            </div>
            <div className="user-details-dl__row">
              <dt>Rang</dt>
              <dd>{user.rang || '—'}</dd>
            </div>
            <div className="user-details-dl__row">
              <dt>Organisatie</dt>
              <dd>{user.organisatie || '—'}</dd>
            </div>
            <div className="user-details-dl__row">
              <dt>Structuur</dt>
              <dd>{user.structuur || '—'}</dd>
            </div>
            <div className="user-details-dl__row">
              <dt>Afdeling</dt>
              <dd>{user.afdeling || '—'}</dd>
            </div>
            <div className="user-details-dl__row">
              <dt>Laatste login</dt>
              <dd>{formatDate(user.last_login)}</dd>
            </div>
            <div className="user-details-dl__row">
              <dt>Laatste login IP</dt>
              <dd>{user.last_login_ip || '—'}</dd>
            </div>
            <div className="user-details-dl__row">
              <dt>Browser (laatste login)</dt>
              <dd className="user-details-dl__user-agent">{user.last_login_user_agent || '—'}</dd>
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
            &quot;Nooit&quot; betekent dat de sessie niet vervalt. Kies of de timer loopt vanaf inloggen of alleen na inactiviteit.
          </p>
          <div className="user-details-session-timeout">
            <div className="user-details-session-timeout-type">
              {SESSION_TIMEOUT_TYPE_OPTIONS.map((opt) => (
                <label key={opt.value} className="user-details-radio">
                  <input
                    type="radio"
                    name="sessionTimeoutType"
                    value={opt.value}
                    checked={sessionTimeoutType === opt.value}
                    onChange={() => setSessionTimeoutType(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="user-details-session-timeout-minutes">
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
                  onClick={() => sessionTimeoutMutation.mutate({ timeout: sessionTimeout, type: sessionTimeoutType })}
                  disabled={sessionTimeoutMutation.isPending}
                >
                  <Save size={18} />
                  {sessionTimeoutMutation.isPending ? 'Opslaan...' : 'Opslaan'}
                </button>
              )}
            </div>
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

      {editOpen && user && (
        <EditUserModal
          user={user}
          onClose={() => setEditOpen(false)}
          onSubmit={(data) => updateMutation.mutate({ data })}
          isSubmitting={updateMutation.isPending}
          error={updateMutation.error?.message}
        />
      )}
    </div>
  )
}

function EditUserModal({
  user,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  user: AppUser
  onClose: () => void
  onSubmit: (data: UpdateUserData) => void
  isSubmitting: boolean
  error: string | undefined
}) {
  const [first_name, setFirst_name] = useState(user.first_name)
  const [last_name, setLast_name] = useState(user.last_name)
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState<AppUser['role']>(user.role)
  const [is_active, setIs_active] = useState(user.is_active)
  const [telefoonnummer, setTelefoonnummer] = useState(user.telefoonnummer ?? '')
  const [rang, setRang] = useState(user.rang ?? '')
  const [organisatie, setOrganisatie] = useState(user.organisatie ?? '')
  const [structuur, setStructuur] = useState(user.structuur ?? '')
  const [afdeling, setAfdeling] = useState(user.afdeling ?? '')

  const { data: groepen = [] } = useQuery({
    queryKey: ['groepen'],
    queryFn: () => OrganizationService.getAllGroepen(),
  })

  const [structuren, setStructuren] = useState<{ id: string; name: string }[]>([])
  const [afdelingen, setAfdelingen] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (organisatie) {
      const selectedGroep = groepen.find((g) => g.name === organisatie)
      if (selectedGroep) {
        OrganizationService.getStructurenByGroep(selectedGroep.id)
          .then(setStructuren)
          .catch(console.error)
      } else {
        setStructuren([])
      }
      if (organisatie !== user.organisatie) {
        setStructuur('')
        setAfdeling('')
      }
      setAfdelingen([])
    } else {
      setStructuren([])
      setStructuur('')
      setAfdeling('')
      setAfdelingen([])
    }
  }, [organisatie, groepen, user.organisatie])

  useEffect(() => {
    if (structuur) {
      const selectedStructuur = structuren.find((s) => s.name === structuur)
      if (selectedStructuur) {
        OrganizationService.getAfdelingenByStructuur(selectedStructuur.id)
          .then(setAfdelingen)
          .catch(console.error)
      } else {
        setAfdelingen([])
      }
      if (structuur !== user.structuur) {
        setAfdeling('')
      }
    } else {
      setAfdelingen([])
      setAfdeling('')
    }
  }, [structuur, structuren, user.structuur])

  useEffect(() => {
    if (user.organisatie && groepen.length > 0) {
      const selectedGroep = groepen.find((g) => g.name === user.organisatie)
      if (selectedGroep) {
        OrganizationService.getStructurenByGroep(selectedGroep.id)
          .then(setStructuren)
          .catch(console.error)
      }
    }
  }, [user.organisatie, groepen])

  useEffect(() => {
    if (user.structuur && structuren.length > 0) {
      const selectedStructuur = structuren.find((s) => s.name === user.structuur)
      if (selectedStructuur) {
        OrganizationService.getAfdelingenByStructuur(selectedStructuur.id)
          .then(setAfdelingen)
          .catch(console.error)
      }
    }
  }, [user.structuur, structuren])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      first_name,
      last_name,
      email,
      role,
      is_active,
      telefoonnummer: telefoonnummer || undefined,
      rang: rang || undefined,
      organisatie: organisatie || undefined,
      structuur: structuur || undefined,
      afdeling: afdeling || undefined,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal user-mgmt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Gebruiker bewerken: {user.username}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Sluiten">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            {error && <div className="user-mgmt-modal__error">{error}</div>}
            <div className="user-mgmt-modal__grid">
              <div className="user-mgmt-modal__group">
                <label className="user-mgmt-modal__label">Voornaam</label>
                <input type="text" className="user-mgmt-modal__input" value={first_name} onChange={(e) => setFirst_name(e.target.value)} />
              </div>
              <div className="user-mgmt-modal__group">
                <label className="user-mgmt-modal__label">Achternaam</label>
                <input type="text" className="user-mgmt-modal__input" value={last_name} onChange={(e) => setLast_name(e.target.value)} />
              </div>
              <div className="user-mgmt-modal__group user-mgmt-modal__group--full">
                <label className="user-mgmt-modal__label">E-mail *</label>
                <input type="email" className="user-mgmt-modal__input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="user-mgmt-modal__group">
                <label className="user-mgmt-modal__label">Rol</label>
                <select className="user-mgmt-modal__select" value={role} onChange={(e) => setRole(e.target.value as AppUser['role'])}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="user-mgmt-modal__group">
                <label className="user-mgmt-modal__label">
                  <input type="checkbox" checked={is_active} onChange={(e) => setIs_active(e.target.checked)} />
                  Actief
                </label>
              </div>
              <div className="user-mgmt-modal__group">
                <label className="user-mgmt-modal__label">Telefoonnummer</label>
                <input type="tel" className="user-mgmt-modal__input" value={telefoonnummer} onChange={(e) => setTelefoonnummer(e.target.value)} />
              </div>
              <div className="user-mgmt-modal__group">
                <label className="user-mgmt-modal__label">Rang</label>
                <input type="text" className="user-mgmt-modal__input" value={rang} onChange={(e) => setRang(e.target.value)} />
              </div>
              <div className="user-mgmt-modal__group">
                <label className="user-mgmt-modal__label">Organisatie</label>
                <select
                  className="user-mgmt-modal__select"
                  value={organisatie}
                  onChange={(e) => setOrganisatie(e.target.value)}
                >
                  <option value="">Selecteer organisatie</option>
                  {groepen.map((g) => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="user-mgmt-modal__group">
                <label className="user-mgmt-modal__label">Structuur</label>
                <select
                  className="user-mgmt-modal__select"
                  value={structuur}
                  onChange={(e) => setStructuur(e.target.value)}
                  disabled={!organisatie}
                >
                  <option value="">Selecteer structuur</option>
                  {structuren.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="user-mgmt-modal__group">
                <label className="user-mgmt-modal__label">Afdeling</label>
                <select
                  className="user-mgmt-modal__select"
                  value={afdeling}
                  onChange={(e) => setAfdeling(e.target.value)}
                  disabled={!structuur}
                >
                  <option value="">Selecteer afdeling</option>
                  {afdelingen.map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Annuleren</button>
            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>{isSubmitting ? 'Opslaan...' : 'Opslaan'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
