import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthGuard, AdminGuard } from './components/AuthGuard'
import { AppLayout } from './components/AppLayout'
import { AdminLayout } from './components/AdminLayout'

import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Feed from './pages/app/Feed'
import Stats from './pages/app/Stats'
import Film from './pages/app/Film'
import Wellness from './pages/app/Wellness'
import Playbook from './pages/app/Playbook'
import Profile from './pages/app/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import AdminRoster from './pages/admin/Roster'
import AdminFilm from './pages/admin/Film'
import AdminStats from './pages/admin/Stats'
import AdminWellness from './pages/admin/Wellness'
import AdminPlaybook from './pages/admin/Playbook'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Authenticated player routes */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/app/feed" element={<Feed />} />
              <Route path="/app/stats" element={<Stats />} />
              <Route path="/app/film" element={<Film />} />
              <Route path="/app/wellness" element={<Wellness />} />
              <Route path="/app/playbook" element={<Playbook />} />
              <Route path="/app/profile" element={<Profile />} />
            </Route>

            {/* Admin-only routes */}
            <Route element={<AdminGuard />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/roster" element={<AdminRoster />} />
                <Route path="/admin/film" element={<AdminFilm />} />
                <Route path="/admin/stats" element={<AdminStats />} />
                <Route path="/admin/wellness" element={<AdminWellness />} />
                <Route path="/admin/playbook" element={<AdminPlaybook />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
