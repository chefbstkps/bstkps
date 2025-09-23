import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { Radio, Package, Upload, Wrench, Home, LogOut, Tag, Menu, X, AlertTriangle } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import './Navbar.css'

export default function Navbar() {
  const { t } = useLanguage()
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Main navigation items (always visible)
  const mainNavItems = [
    { path: '/', label: t('nav.dashboard'), icon: Home },
    { path: '/radios', label: t('nav.radios'), icon: Radio },
    { path: '/storingen', label: 'Storingen', icon: AlertTriangle },
    { path: '/issue', label: t('nav.issue'), icon: Upload },
    { path: '/installation', label: t('nav.installation'), icon: Wrench },
  ]

  // Secondary navigation items (in hamburger menu on all screen sizes)
  const secondaryNavItems = [
    { path: '/accessories', label: t('nav.accessories'), icon: Package },
    { path: '/brands', label: t('nav.brands'), icon: Tag },
  ]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="navbar__brand">
          <Link to="/" className="navbar__logo-link">
            <img 
              src="/logobst.svg" 
              alt="BST Logo" 
              className="navbar__logo"
            />
          </Link>
          <h1 className="navbar__title">{t('app.title')}</h1>
        </div>
        
        {/* Desktop Menu */}
        <div className="navbar__menu navbar__menu--desktop">
          {mainNavItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`navbar__link ${location.pathname === path ? 'navbar__link--active' : ''}`}
            >
              <Icon className="navbar__icon" />
              <span className="navbar__text">{label}</span>
            </Link>
          ))}
        </div>

        {/* Hamburger Menu Button (visible on all screen sizes) */}
        <button
          className="navbar__mobile-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="navbar__mobile-icon" /> : <Menu className="navbar__mobile-icon" />}
        </button>

        {/* Mobile Main Menu (only Radios and Storingen on small screens) */}
        <div className="navbar__menu navbar__menu--mobile-main">
          {mainNavItems.slice(1, 3).map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`navbar__link ${location.pathname === path ? 'navbar__link--active' : ''}`}
            >
              <Icon className="navbar__icon" />
              <span className="navbar__text">{label}</span>
            </Link>
          ))}
        </div>

        {/* Hamburger Menu (visible on all screen sizes) */}
        <div 
          ref={menuRef}
          className={`navbar__menu navbar__menu--mobile ${isMobileMenuOpen ? 'navbar__menu--open' : ''}`}
        >
          <div className="navbar__mobile-section">
            <h3 className="navbar__mobile-section-title">Hoofdmenu</h3>
            {mainNavItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`navbar__link ${location.pathname === path ? 'navbar__link--active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="navbar__icon" />
                <span className="navbar__text">{label}</span>
              </Link>
            ))}
          </div>
          
          <div className="navbar__mobile-section">
            <h3 className="navbar__mobile-section-title">Beheer</h3>
            {secondaryNavItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`navbar__link ${location.pathname === path ? 'navbar__link--active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="navbar__icon" />
                <span className="navbar__text">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="navbar__user">
          {user && (
            <div className="navbar__user-info">
              <span className="navbar__user-email">{user.email}</span>
              <button
                onClick={handleLogout}
                className="navbar__logout"
                title={t('common.logout')}
              >
                <LogOut className="navbar__logout-icon" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
