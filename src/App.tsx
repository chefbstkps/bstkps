import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ReactQueryProvider } from './contexts/ReactQueryProvider'
import { PerformanceSettingsProvider } from './contexts/PerformanceSettingsContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PageVisibilityGuard from './components/PageVisibilityGuard'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Login from './pages/Login'
import Profile from './pages/Profile'
import UserManagement from './pages/UserManagement'
import UserDetails from './pages/UserDetails'
import UsersLog from './pages/UsersLog'
import Dashboard from './pages/Dashboard'
import Radios from './pages/Radios'
import RadioDetails from './pages/RadioDetails'
import Telefoon from './pages/Telefoon'
import TelefoonDetails from './pages/TelefoonDetails'
import RadioArchive from './pages/RadioArchive'
import RadioArchiveDetails from './pages/RadioArchiveDetails'
import Accessories from './pages/Accessories'
import Brands from './pages/Brands'
import Organizations from './pages/Organizations'
import Inventory from './pages/Inventory'
import Storingen from './pages/Storingen'
import FaultDetails from './pages/FaultDetails'
import Issue from './pages/Issue'
import Installation from './pages/Installation'
import './App.css'

function AppLayout() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <PageVisibilityGuard />
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <ReactQueryProvider>
      <PerformanceSettingsProvider>
        <LanguageProvider>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/user-management" element={<UserManagement />} />
                  <Route path="/user-management/:id" element={<UserDetails />} />
                  <Route path="/users-log" element={<UsersLog />} />
                  <Route path="/radios" element={<Radios />} />
                  <Route path="/radios/:id" element={<RadioDetails />} />
                  <Route path="/telefoon" element={<Telefoon />} />
                  <Route path="/telefoon/:id" element={<TelefoonDetails />} />
                  <Route path="/radio-archive" element={<RadioArchive />} />
                  <Route path="/radio-archive/:id" element={<RadioArchiveDetails />} />
                  <Route path="/accessories" element={<Accessories />} />
                  <Route path="/brands" element={<Brands />} />
                  <Route path="/organizations" element={<Organizations />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/storingen" element={<Storingen />} />
                  <Route path="/storingen/:id" element={<FaultDetails />} />
                  <Route path="/issue" element={<Issue />} />
                  <Route path="/installation" element={<Installation />} />
                </Route>
              </Routes>
            </Router>
          </AuthProvider>
        </LanguageProvider>
      </PerformanceSettingsProvider>
    </ReactQueryProvider>
  )
}

export default App