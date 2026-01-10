import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import GlobalErrorToast from './components/GlobalErrorToast'
import GlobalLoading from './components/GlobalLoading'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import VerifyOTP from './pages/VerifyOTP'
import PendingApproval from './pages/PendingApproval'
import AccountRejected from './pages/AccountRejected'
import Dashboard from './pages/Dashboard'
import BusinessRequirement from './pages/BusinessRequirement'
import Profiles from './pages/Profiles'
import ProfileDetail from './pages/ProfileDetail'
import DecisionMakers from './pages/DecisionMakers'
import Requirements from './pages/Requirements'
import RequirementDetail from './pages/RequirementDetail'
import Leads from './pages/Leads'
import Integrations from './pages/Integrations'
import Campaigns from './pages/Campaigns'
import CampaignCreate from './pages/CampaignCreate'
import CampaignDetail from './pages/CampaignDetail'
import Templates from './pages/Templates'
import TemplateCreate from './pages/TemplateCreate'
import Tickets from './pages/Tickets'
import CreateTicket from './pages/CreateTicket'
import TicketDetail from './pages/TicketDetail'
import Settings from './pages/Settings'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSystem from './pages/admin/AdminSystem'
import AdminCampaigns from './pages/admin/AdminCampaigns'
import AdminScraping from './pages/admin/AdminScraping'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminLogs from './pages/admin/AdminLogs'
import AdminSettings from './pages/admin/AdminSettings'
import AdminTickets from './pages/admin/AdminTickets'
import AdminTicketDetail from './pages/admin/AdminTicketDetail'
import UsageTracking from './pages/admin/UsageTracking'
import UserApprovalManagement from './pages/admin/UserApprovalManagement'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import './App.css'
import { getCurrentUser } from './store/slices/authSlice'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { RootState } from './types/redux/rootState.types'

interface PrivateRouteProps {
  children: React.ReactNode
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, token } = useAppSelector((state: RootState) => state.auth)

  useEffect(() => {
    // Initialize AOS with settings for scroll up/down
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: false, // Allow animation every time element comes into view
      mirror: true, // Animate elements when scrolling past them
      offset: 100,
      debounceDelay: 50,
      throttleDelay: 99,
    })

    // Refresh AOS on scroll to ensure animations work both ways
    const handleScroll = () => {
      AOS.refresh()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // On app load (and when token changes), fetch current user so header shows correct name after refresh
  useEffect(() => {
    if (token && !user) {
      dispatch(getCurrentUser())
    }
  }, [token, user, dispatch])

  // Redirect admins from regular dashboard to admin dashboard
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'admin' && location.pathname === '/dashboard') {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [isAuthenticated, user, navigate, location.pathname])

  return (
    <div className="App">
      <GlobalLoading />
      <GlobalErrorToast />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/account-rejected" element={<AccountRejected />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/business-requirement"
          element={
            <PrivateRoute>
              <BusinessRequirement />
            </PrivateRoute>
          }
        />
        <Route
          path="/requirements"
          element={
            <PrivateRoute>
              <Requirements />
            </PrivateRoute>
          }
        />
        <Route
          path="/requirements/:id"
          element={
            <PrivateRoute>
              <RequirementDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/leads"
          element={
            <PrivateRoute>
              <Leads />
            </PrivateRoute>
          }
        />
        <Route
          path="/profiles"
          element={
            <PrivateRoute>
              <Profiles />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <PrivateRoute>
              <ProfileDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/decision-makers/:requirementId"
          element={
            <PrivateRoute>
              <DecisionMakers />
            </PrivateRoute>
          }
        />
        <Route
          path="/campaigns"
          element={
            <PrivateRoute>
              <Campaigns />
            </PrivateRoute>
          }
        />
        <Route
          path="/campaigns/new"
          element={
            <PrivateRoute>
              <CampaignCreate />
            </PrivateRoute>
          }
        />
        <Route
          path="/campaigns/:id/edit"
          element={
            <PrivateRoute>
              <CampaignCreate />
            </PrivateRoute>
          }
        />
        <Route
          path="/campaigns/:id"
          element={
            <PrivateRoute>
              <CampaignDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <PrivateRoute>
              <Templates />
            </PrivateRoute>
          }
        />
        <Route
          path="/templates/new"
          element={
            <PrivateRoute>
              <TemplateCreate />
            </PrivateRoute>
          }
        />
        <Route
          path="/templates/:id/edit"
          element={
            <PrivateRoute>
              <TemplateCreate />
            </PrivateRoute>
          }
        />
        <Route
          path="/tickets"
          element={
            <PrivateRoute>
              <Tickets />
            </PrivateRoute>
          }
        />
        <Route
          path="/tickets/new"
          element={
            <PrivateRoute>
              <CreateTicket />
            </PrivateRoute>
          }
        />
        <Route
          path="/tickets/:id"
          element={
            <PrivateRoute>
              <TicketDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/integrations"
          element={
            <PrivateRoute>
              <Integrations />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/system"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminSystem />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/campaigns"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminCampaigns />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/tickets"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminTickets />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/tickets/:id"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminTicketDetail />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/scraping"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminScraping />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminAnalytics />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminLogs />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/usagetracking"
          element={
            <PrivateRoute>
              <AdminRoute>
                <UsageTracking />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminSettings />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/user-approvals"
          element={
            <PrivateRoute>
              <AdminRoute>
                <UserApprovalManagement />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/usagetracking"
          element={
            <PrivateRoute>
              <AdminRoute>
                <UsageTracking />
              </AdminRoute>
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
