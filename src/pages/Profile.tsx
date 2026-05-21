import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import type { UpdateUserData, ChangePasswordData } from '../types'
import { User, Lock, Eye, EyeOff, Monitor } from 'lucide-react'
import './Profile.css'

type Tab = 'profile' | 'password' | 'sessions'

export default function Profile() {
  const { user, refreshUser, signOutOtherDevices } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profile form
  const [first_name, setFirst_name] = useState(user?.first_name ?? '')
  const [last_name, setLast_name] = useState(user?.last_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [profileSaving, setProfileSaving] = useState(false)

  // Password form
  const [current_password, setCurrent_password] = useState('')
  const [new_password, setNew_password] = useState('')
  const [confirm_password, setConfirm_password] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [sessionsSaving, setSessionsSaving] = useState(false)

  if (!user) return null

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setProfileSaving(true)
    try {
      const data: UpdateUserData = { first_name, last_name, email }
      await authService.updateUser(user.id, data)
      await refreshUser()
      setMessage({ type: 'success', text: 'Profiel bijgewerkt.' })
      await authService.logActivity(user.id, 'profile_update', true)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Opslaan mislukt' })
      await authService.logActivity(user.id, 'profile_update', false, err instanceof Error ? err.message : undefined)
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (new_password !== confirm_password) {
      setMessage({ type: 'error', text: 'Nieuw wachtwoord en bevestiging komen niet overeen.' })
      return
    }
    if (new_password.length < 6) {
      setMessage({ type: 'error', text: 'Nieuw wachtwoord moet minimaal 6 tekens zijn.' })
      return
    }
    setPasswordSaving(true)
    try {
      const data: ChangePasswordData = {
        current_password,
        new_password,
        confirm_password,
      }
      await authService.changePassword(user.id, data)
      setMessage({ type: 'success', text: 'Wachtwoord gewijzigd.' })
      setCurrent_password('')
      setNew_password('')
      setConfirm_password('')
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Wachtwoord wijzigen mislukt' })
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleSignOutOtherDevices = async () => {
    const ok = window.confirm(
      'Alle andere browsers en apparaten worden uitgelogd. Je blijft op dit apparaat ingelogd. Doorgaan?'
    )
    if (!ok) return
    setMessage(null)
    setSessionsSaving(true)
    try {
      await signOutOtherDevices()
      setMessage({
        type: 'success',
        text: 'Andere sessies zijn beëindigd. Je bent op dit apparaat nog ingelogd.',
      })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Uitloggen op andere apparaten mislukt',
      })
    } finally {
      setSessionsSaving(false)
    }
  }

  const formatDate = (s: string | undefined) => {
    if (!s) return '—'
    try {
      return new Date(s).toLocaleString('nl-NL')
    } catch {
      return s
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <h1>Mijn profiel</h1>
        <p>Bekijk en bewerk je accountgegevens</p>
      </div>

      <div className="profile-tabs">
        <button
          type="button"
          className={`profile-tabs__tab ${activeTab === 'profile' ? 'profile-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} />
          Profielgegevens
        </button>
        <button
          type="button"
          className={`profile-tabs__tab ${activeTab === 'password' ? 'profile-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          <Lock size={18} />
          Wachtwoord wijzigen
        </button>
        <button
          type="button"
          className={`profile-tabs__tab ${activeTab === 'sessions' ? 'profile-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <Monitor size={18} />
          Sessies
        </button>
      </div>

      {message && (
        <div className={`profile-page__message profile-page__message--${message.type}`} role="alert">
          {message.text}
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="profile-form">
          <div className="profile-form__grid">
            <div className="profile-form__group">
              <label className="profile-form__label">Gebruikersnaam</label>
              <input
                type="text"
                className="profile-form__input profile-form__input--readonly"
                value={user.username}
                readOnly
                disabled
              />
            </div>
            <div className="profile-form__group">
              <label className="profile-form__label">Rol</label>
              <input
                type="text"
                className="profile-form__input profile-form__input--readonly"
                value={user.role}
                readOnly
                disabled
              />
            </div>
            <div className="profile-form__group">
              <label className="profile-form__label">Laatste login</label>
              <input
                type="text"
                className="profile-form__input profile-form__input--readonly"
                value={formatDate(user.last_login)}
                readOnly
                disabled
              />
            </div>
            <div className="profile-form__group">
              <label className="profile-form__label" htmlFor="profile-first_name">Voornaam</label>
              <input
                id="profile-first_name"
                type="text"
                className="profile-form__input"
                value={first_name}
                onChange={(e) => setFirst_name(e.target.value)}
              />
            </div>
            <div className="profile-form__group">
              <label className="profile-form__label" htmlFor="profile-last_name">Achternaam</label>
              <input
                id="profile-last_name"
                type="text"
                className="profile-form__input"
                value={last_name}
                onChange={(e) => setLast_name(e.target.value)}
              />
            </div>
            <div className="profile-form__group profile-form__group--full">
              <label className="profile-form__label" htmlFor="profile-email">E-mail</label>
              <input
                id="profile-email"
                type="email"
                className="profile-form__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn--primary" disabled={profileSaving}>
            {profileSaving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </form>
      )}

      {activeTab === 'sessions' && (
        <div className="profile-form profile-sessions">
          <h2 className="profile-sessions__title">Actieve sessies</h2>
          <p className="profile-sessions__text">
            Je bent ingelogd via een sessie in deze browser. Als je op een ander apparaat bent
            ingelogd en die sessie wilt beëindigen, log je hier alle andere browsers en apparaten
            uit. Op dit apparaat blijf je ingelogd.
          </p>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleSignOutOtherDevices}
            disabled={sessionsSaving}
          >
            {sessionsSaving ? 'Bezig...' : 'Uitloggen op alle andere apparaten'}
          </button>
        </div>
      )}

      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="profile-form">
          <div className="profile-form__group">
            <label className="profile-form__label" htmlFor="current-password">Huidig wachtwoord</label>
            <div className="profile-form__password-wrap">
              <input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                className="profile-form__input"
                value={current_password}
                onChange={(e) => setCurrent_password(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="profile-form__toggle-pw"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? 'Verbergen' : 'Tonen'}
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="profile-form__group">
            <label className="profile-form__label" htmlFor="new-password">Nieuw wachtwoord</label>
            <div className="profile-form__password-wrap">
              <input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                className="profile-form__input"
                value={new_password}
                onChange={(e) => setNew_password(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="profile-form__toggle-pw"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? 'Verbergen' : 'Tonen'}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="profile-form__group">
            <label className="profile-form__label" htmlFor="confirm-password">Bevestig nieuw wachtwoord</label>
            <input
              id="confirm-password"
              type="password"
              className="profile-form__input"
              value={confirm_password}
              onChange={(e) => setConfirm_password(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={passwordSaving}>
            {passwordSaving ? 'Wijzigen...' : 'Wachtwoord wijzigen'}
          </button>
        </form>
      )}
    </div>
  )
}
