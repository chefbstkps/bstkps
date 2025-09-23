import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ReactQueryProvider } from './contexts/ReactQueryProvider'
import { PerformanceSettingsProvider } from './contexts/PerformanceSettingsContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import Radios from './pages/Radios'
import RadioDetails from './pages/RadioDetails'
import Accessories from './pages/Accessories'
import Brands from './pages/Brands'
import Storingen from './pages/Storingen'
import FaultDetails from './pages/FaultDetails'
import Issue from './pages/Issue'
import Installation from './pages/Installation'
import './App.css'

function App() {
  return (
    <ReactQueryProvider>
      <PerformanceSettingsProvider>
        <LanguageProvider>
          <AuthProvider>
            <Router>
              <div className="app">
                <Navbar />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/radios" element={<Radios />} />
                    <Route path="/radios/:id" element={<RadioDetails />} />
                    <Route path="/accessories" element={<Accessories />} />
                    <Route path="/brands" element={<Brands />} />
                    <Route path="/storingen" element={<Storingen />} />
                    <Route path="/storingen/:id" element={<FaultDetails />} />
                    <Route path="/issue" element={<Issue />} />
                    <Route path="/installation" element={<Installation />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </Router>
          </AuthProvider>
        </LanguageProvider>
      </PerformanceSettingsProvider>
    </ReactQueryProvider>
  )
}

export default App