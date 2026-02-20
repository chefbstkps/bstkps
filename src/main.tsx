import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'

registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('App ready to work offline')
  },
  onNeedRefresh() {
    if (window.confirm('Nieuwe versie beschikbaar. Nu vernieuwen?')) {
      window.location.reload()
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)