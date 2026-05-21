import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import { OrganizationService } from '../services/organizationService'
import { UserPlus, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'
import './Signup.css'

export default function Signup() {
  const { isAuthenticated, loading } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [telefoonnummer, setTelefoonnummer] = useState('')
  const [rang, setRang] = useState('')
  const [organisatie, setOrganisatie] = useState('')
  const [structuur, setStructuur] = useState('')
  const [afdeling, setAfdeling] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
      setStructuur('')
      setAfdeling('')
      setAfdelingen([])
    } else {
      setStructuren([])
      setStructuur('')
      setAfdeling('')
      setAfdelingen([])
    }
  }, [organisatie, groepen])

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
      setAfdeling('')
    } else {
      setAfdelingen([])
      setAfdeling('')
    }
  }, [structuur, structuren])

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

  const handleNext = () => {
    setError('')
    if (!username.trim()) {
      setError('Gebruikersnaam is verplicht')
      return
    }
    if (!email.trim()) {
      setError('E-mail is verplicht')
      return
    }
    if (!firstName.trim()) {
      setError('Voornaam is verplicht')
      return
    }
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !email.trim() || !firstName.trim()) {
      setError('Vul alle verplichte velden in')
      return
    }
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
        telefoonnummer: telefoonnummer || undefined,
        rang: rang || undefined,
        organisatie: organisatie || undefined,
        structuur: structuur || undefined,
        afdeling: afdeling || undefined,
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
            Stap {step} van 2 – {step === 1 ? 'Accountgegevens' : 'Wachtwoord & organisatie'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {error && (
            <div className="signup-form__error" role="alert">
              {error}
            </div>
          )}

          <div className={step === 1 ? 'signup-form__step' : 'signup-form__step signup-form__step--hidden'}>
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

              <div className="signup-form__row">
                <div className="signup-form__group">
                  <label className="signup-form__label" htmlFor="telefoonnummer">
                    Telefoonnummer
                  </label>
                  <input
                    id="telefoonnummer"
                    type="tel"
                    className="signup-form__input"
                    value={telefoonnummer}
                    onChange={(e) => setTelefoonnummer(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
                <div className="signup-form__group">
                  <label className="signup-form__label" htmlFor="rang">
                    Rang
                  </label>
                  <input
                    id="rang"
                    type="text"
                    className="signup-form__input"
                    value={rang}
                    onChange={(e) => setRang(e.target.value)}
                  />
                </div>
              </div>

            <div className="signup-form__step-actions">
              <button
                type="button"
                className="signup-form__btn-next"
                onClick={handleNext}
              >
                Volgende
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className={step === 2 ? 'signup-form__step' : 'signup-form__step signup-form__step--hidden'}>
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

              <label className="signup-form__label" htmlFor="organisatie">
                Organisatie
              </label>
              <select
                id="organisatie"
                className="signup-form__select"
                value={organisatie}
                onChange={(e) => setOrganisatie(e.target.value)}
              >
                <option value="">Selecteer organisatie</option>
                {groepen.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>

              <label className="signup-form__label" htmlFor="structuur">
                Structuur
              </label>
              <select
                id="structuur"
                className="signup-form__select"
                value={structuur}
                onChange={(e) => setStructuur(e.target.value)}
                disabled={!organisatie}
              >
                <option value="">Selecteer structuur</option>
                {structuren.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>

              <label className="signup-form__label" htmlFor="afdeling">
                Afdeling
              </label>
              <select
                id="afdeling"
                className="signup-form__select"
                value={afdeling}
                onChange={(e) => setAfdeling(e.target.value)}
                disabled={!structuur}
              >
                <option value="">Selecteer afdeling</option>
                {afdelingen.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>

            <div className="signup-form__step-actions signup-form__step-actions--two">
              <button
                type="button"
                className="signup-form__btn-back"
                onClick={() => {
                  setError('')
                  setStep(1)
                }}
              >
                <ArrowLeft size={18} />
                Terug
              </button>
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
            </div>
          </div>

          <p className="signup-form__login-link">
            Heb je al een account? <Link to="/login">Inloggen</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
