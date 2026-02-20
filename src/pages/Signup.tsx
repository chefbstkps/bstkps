import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import './Signup.css'

export default function Signup() {
  const { isAuthenticated, loading } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="signup-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Laden...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen')
      return
    }
    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens bevatten')
      return
    }
    setSubmitting(true)
    try {
      await authService.signup({
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        password,
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registratie mislukt')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="signup-page">
        <div className="signup-card signup-card--success">
          <div className="signup-card__header">
            <img src="/logobst.svg" alt="BST" className="signup-card__logo" />
            <h1 className="signup-card__title">Aanmelding ontvangen</h1>
            <p className="signup-card__subtitle">
              Je account is aangemaakt. Na goedkeuring door een beheerder kun je inloggen.
              Wees geduldig; je ontvangt geen e-mailbevestiging.
            </p>
            <Link to="/login" className="signup-form__link-btn">
              Terug naar inloggen
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-card__header">
          <img src="/logobst.svg" alt="BST" className="signup-card__logo" />
          <h1 className="signup-card__title">Registreren</h1>
          <p className="signup-card__subtitle">
            Maak een account aan. Na goedkeuring door een beheerder kun je inloggen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {error && (
            <div className="signup-form__error" role="alert">
              {error}
            </div>
          )}

          <label className="signup-form__label" htmlFor="username">
            Gebruikersnaam *
          </label>
          <input
            id="username"
            type="text"
            className="signup-form__input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />

          <label className="signup-form__label" htmlFor="email">
            E-mail *
          </label>
          <input
            id="email"
            type="email"
            className="signup-form__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <div className="signup-form__row">
            <div className="signup-form__group">
              <label className="signup-form__label" htmlFor="firstName">
                Voornaam *
              </label>
              <input
                id="firstName"
                type="text"
                className="signup-form__input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
              />
            </div>
            <div className="signup-form__group">
              <label className="signup-form__label" htmlFor="lastName">
                Achternaam
              </label>
              <input
                id="lastName"
                type="text"
                className="signup-form__input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>

          <label className="signup-form__label" htmlFor="password">
            Wachtwoord *
          </label>
          <div className="signup-form__password-wrap">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="signup-form__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
            <button
              type="button"
              className="signup-form__toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
              aria-label={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <span className="signup-form__hint">Minimaal 6 tekens</span>

          <label className="signup-form__label" htmlFor="confirmPassword">
            Bevestig wachtwoord *
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="signup-form__input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
          />
          {password && confirmPassword && password !== confirmPassword && (
            <span className="signup-form__error-inline">Wachtwoorden komen niet overeen</span>
          )}

          <button
            type="submit"
            className="signup-form__submit"
            disabled={submitting}
          >
            {submitting ? (
              <span className="signup-form__submit-text">Bezig met registreren...</span>
            ) : (
              <>
                <UserPlus className="signup-form__submit-icon" />
                <span className="signup-form__submit-text">Registreren</span>
              </>
            )}
          </button>

          <p className="signup-form__login-link">
            Heb je al een account? <Link to="/login">Inloggen</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
