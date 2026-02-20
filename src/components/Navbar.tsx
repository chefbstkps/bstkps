import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { Radio, Package, Upload, Wrench, Home, LogOut, Tag, Menu, X, AlertTriangle, Building2, Archive, ArchiveRestore, User, Users, ClipboardList, ShieldCheck, ChevronDown, Smartphone, Phone } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import './Navbar.css'

export default function Navbar() {
  const { t } = useLanguage()
  const { user, signOut, isAdmin } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const adminDropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const pathToPageKey: Record<string, string> = {
    '/storingen': 'storingen',
    '/installation': 'installation',
    '/issue': 'issue',
    '/accessories': 'accessories',
    '/inventory': 'inventory',
    '/brands': 'brands',
    '/organizations': 'organizations',
    '/radio-archive': 'radio_archive',
    '/telefoon': 'telefoon',
    '/phone-numbers': 'phone_numbers',
  }

  const isPageVisible = (path: string) => {
    const key = pathToPageKey[path]
    if (!key) return true
    if (!user?.page_visibility) return true
    return user.page_visibility[key as keyof typeof user.page_visibility] !== false
  }

  const allMainNavItems = [
    { path: '/', label: t('nav.dashboard'), icon: Home },
    { path: '/radios', label: t('nav.radios'), icon: Radio },
    { path: '/telefoon', label: 'Telefoon', icon: Smartphone },
    { path: '/phone-numbers', label: 'Telefoonnummers', icon: Phone },
    { path: '/storingen', label: 'Storingen', icon: AlertTriangle },
    { path: '/installation', label: t('nav.installation'), icon: Wrench },
  ]
  const mainNavItems = allMainNavItems.filter((item) => isPageVisible(item.path))
  const mainNavItemsDesktop = mainNavItems.filter((item) => item.path !== '/installation')

  const radioArchiveItem = { path: '/radio-archive', label: 'Radio archief', icon: ArchiveRestore }
  const showRadioArchive = isPageVisible('/radio-archive')

  const allSecondaryNavItems = [
    { path: '/profile', label: 'Mijn profiel', icon: User },
    { path: '/issue', label: t('nav.issue'), icon: Upload },
    { path: '/accessories', label: t('nav.accessories'), icon: Package },
    { path: '/inventory', label: 'Inventory', icon: Archive },
    { path: '/brands', label: t('nav.brands'), icon: Tag },
    { path: '/organizations', label: 'Organisaties', icon: Building2 },
  ]
  const secondaryNavItems = allSecondaryNavItems.filter((item) => isPageVisible(item.path))

  const adminDropdownItems = [
    { path: '/profile', label: 'Mijn profiel', icon: User },
    { path: '/user-management', label: 'Gebruikersbeheer', icon: Users },
    { path: '/users-log', label: 'Activiteitenlogboek', icon: ClipboardList },
  ]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close hamburger menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setIsAdminDropdownOpen(false)
      }
    }

    if (isMobileMenuOpen || isAdminDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen, isAdminDropdownOpen])

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
          {mainNavItemsDesktop.map(({ path, label, icon: Icon }) => (
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
            {showRadioArchive && (() => {
              const Icon = radioArchiveItem.icon
              return (
                <Link
                  to={radioArchiveItem.path}
                  className={`navbar__link ${location.pathname === radioArchiveItem.path || location.pathname.startsWith(radioArchiveItem.path + '/') ? 'navbar__link--active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="navbar__icon" />
                  <span className="navbar__text">{radioArchiveItem.label}</span>
                </Link>
              )
            })()}
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

        <div className="navbar__right">
          {isAdmin() && (
            <div className="navbar__admin-wrap" ref={adminDropdownRef}>
              <button
                type="button"
                className={`navbar__admin-btn ${isAdminDropdownOpen ? 'navbar__admin-btn--open' : ''} ${adminDropdownItems.some(({ path }) => location.pathname === path) ? 'navbar__admin-btn--active' : ''}`}
                onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                aria-expanded={isAdminDropdownOpen}
                aria-haspopup="true"
              >
                <ShieldCheck className="navbar__icon" />
                <span className="navbar__admin-text">Admin</span>
                <ChevronDown className="navbar__admin-chevron" />
              </button>
              {isAdminDropdownOpen && (
                <div className="navbar__admin-dropdown">
                  {adminDropdownItems.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      className={`navbar__admin-dropdown-link ${location.pathname === path ? 'navbar__admin-dropdown-link--active' : ''}`}
                      onClick={() => setIsAdminDropdownOpen(false)}
                    >
                      <Icon className="navbar__admin-dropdown-icon" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="navbar__user">
          {user && (
            <div className="navbar__user-info">
              {!isAdmin() && (
                <Link to="/profile" className="navbar__user-email" title="Mijn profiel">
                  {user.username || user.email}
                </Link>
              )}
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
      </div>
    </nav>
  )
}
