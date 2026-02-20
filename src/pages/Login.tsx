import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import './Login.css'

export default function Login() {
  const { signIn, isAuthenticated, loading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="login-page">
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
    setSubmitting(true)
    try {
      await signIn({ username, password })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inloggen mislukt')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <img src="/logobst.svg" alt="BST" className="login-card__logo" />
          <h1 className="login-card__title">Inloggen</h1>
          <p className="login-card__subtitle">Log in met je gebruikersnaam en wachtwoord</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-form__error" role="alert">
              {error}
            </div>
          )}

          <label className="login-form__label" htmlFor="username">
            Gebruikersnaam
          </label>
          <input
            id="username"
            type="text"
            className="login-form__input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />

          <label className="login-form__label" htmlFor="password">
            Wachtwoord
          </label>
          <div className="login-form__password-wrap">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="login-form__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="login-form__toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
              aria-label={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            className="login-form__submit"
            disabled={submitting}
          >
            {submitting ? (
              <span className="login-form__submit-text">Bezig met inloggen...</span>
            ) : (
              <>
                <LogIn className="login-form__submit-icon" />
                <span className="login-form__submit-text">Inloggen</span>
              </>
            )}
          </button>

          <p className="login-form__signup-link">
            Nog geen account? <Link to="/signup">Registreren</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
