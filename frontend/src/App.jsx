import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { canAccess } from './config/roles'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/dashboard/Dashboard'
import SMEList from './pages/smes/SMEList'
import SMEDetail from './pages/smes/SMEDetail'
import DataIntegration from './pages/data/DataIntegration'
import Predictions from './pages/predictions/Predictions'
import Alerts from './pages/alerts/Alerts'
import Scorecard from './pages/scorecard/Scorecard'
import Recommendations from './pages/recommendations/Recommendations'
import CreditAssessment from './pages/credit/CreditAssessment'
import SectorAnalytics from './pages/sector/SectorAnalytics'
import Portfolio from './pages/portfolio/Portfolio'
import Reports from './pages/reports/Reports'
import UserManagement from './pages/admin/UserManagement'
import AuditLogs from './pages/audit/AuditLogs'
import EngagementOverview from './pages/engagements/EngagementOverview'
import Profile from './pages/profile/Profile'
import Unauthorized from './pages/Unauthorized'
import Landing from './pages/Landing'
import Spinner from './components/ui/Spinner'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

function RoleRoute({ children }) {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  if (!canAccess(user.role, pathname)) return <Navigate to="/unauthorized" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public landing */}
          <Route path="/" element={<Landing />} />

          {/* Guest-only routes */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

          {/* Unauthorized page — accessible while logged in */}
          <Route path="/unauthorized" element={<PrivateRoute><Unauthorized /></PrivateRoute>} />

          {/* Role-protected routes */}
          <Route path="/dashboard" element={<RoleRoute><Dashboard /></RoleRoute>} />
          <Route path="/smes" element={<RoleRoute><SMEList /></RoleRoute>} />
          <Route path="/smes/:id" element={<RoleRoute><SMEDetail /></RoleRoute>} />
          <Route path="/smes/:id/scorecard" element={<RoleRoute><Scorecard /></RoleRoute>} />
          <Route path="/data" element={<RoleRoute><DataIntegration /></RoleRoute>} />
          <Route path="/predictions" element={<RoleRoute><Predictions /></RoleRoute>} />
          <Route path="/alerts" element={<RoleRoute><Alerts /></RoleRoute>} />
          <Route path="/scorecard" element={<RoleRoute><Scorecard /></RoleRoute>} />
          <Route path="/recommendations" element={<RoleRoute><Recommendations /></RoleRoute>} />
          <Route path="/credit" element={<RoleRoute><CreditAssessment /></RoleRoute>} />
          <Route path="/sector" element={<RoleRoute><SectorAnalytics /></RoleRoute>} />
          <Route path="/portfolio" element={<RoleRoute><Portfolio /></RoleRoute>} />
          <Route path="/reports" element={<RoleRoute><Reports /></RoleRoute>} />
          <Route path="/engagements" element={<RoleRoute><EngagementOverview /></RoleRoute>} />
          <Route path="/admin/users" element={<RoleRoute><UserManagement /></RoleRoute>} />
          <Route path="/audit" element={<RoleRoute><AuditLogs /></RoleRoute>} />
          <Route path="/profile" element={<RoleRoute><Profile /></RoleRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
