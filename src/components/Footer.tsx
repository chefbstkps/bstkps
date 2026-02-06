import { useLanguage } from '../contexts/LanguageContext'
import packageJson from '../../package.json'
import './Footer.css'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__content">
          <div className="footer__text-block">
            <p className="footer__text">
              © 2024 {t('app.title')}. Alle rechten voorbehouden.
            </p>
            <div className="footer__powered-row">
              <span className="footer__powered">Powered by: Levens, A. for BST</span>
              <span className="footer__version">v{packageJson.version}</span>
            </div>
          </div>
          <div className="footer__links">
            <a href="#" className="footer__link">Privacy</a>
            <a href="#" className="footer__link">Voorwaarden</a>
            <a href="#" className="footer__link">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
