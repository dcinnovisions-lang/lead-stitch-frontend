import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import api from '../../config/api'
import type { AxiosError } from 'axios'

interface SystemStats {
  totalUsers?: number
  totalRequirements?: number
  totalCampaigns?: number
  totalTickets?: number
  users?: {
    total?: number
    active?: number
    admins?: number
    new_today?: number
    [key: string]: unknown
  }
  campaigns?: {
    total?: number
    active?: number
    [key: string]: unknown
  }
  email_campaigns?: {
    sent?: number
    delivered?: number
    opened?: number
    clicked?: number
    [key: string]: unknown
  }
  profiles?: {
    total?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface SystemHealth {
  status?: string
  uptime?: number
  services?: Record<string, { status: string }>
  [key: string]: unknown
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, healthRes] = await Promise.all([
        api.get<SystemStats>('/admin/system/stats'),
        api.get<SystemHealth>('/admin/system/health'),
      ])
      setStats(statsRes.data)
      setHealth(healthRes.data)
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>
      console.error('Error fetching dashboard data:', axiosError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-lg text-gray-600">Platform overview and system monitoring</p>
        </div>

        {/* System Health Alert */}
        {health && (
          <div className={`mb-6 p-6 rounded-xl border-2 ${
            health.status === 'healthy' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  health.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'
                }`}>
                  {health.status === 'healthy' ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">System Status: {health.status?.toUpperCase() || 'UNKNOWN'}</h3>
                  <p className="text-sm text-gray-600">Last checked: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
              {health.services && (
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(health.services).map(([service, data]) => (
                  <div key={service} className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                      data.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <p className="text-xs font-medium text-gray-700 capitalize">{service}</p>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Users Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Users</h3>
              <p className="text-4xl font-bold text-gray-900 mb-4">{stats.users?.total || 0}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active</span>
                  <span className="font-semibold text-gray-900">{stats.users?.active || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Admins</span>
                  <span className="font-semibold text-gray-900">{stats.users?.admins || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New Today</span>
                  <span className="font-semibold text-gray-900">{stats.users?.new_today || 0}</span>
                </div>
              </div>
            </div>

            {/* Campaigns Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <button
                  onClick={() => navigate('/admin/campaigns')}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Campaigns</h3>
              <p className="text-4xl font-bold text-gray-900 mb-4">{stats.campaigns?.total || 0}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active</span>
                  <span className="font-semibold text-gray-900">{stats.campaigns?.active || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="font-semibold text-gray-900">{stats.campaigns?.total || 0}</span>
                </div>
              </div>
            </div>

            {/* Email Stats Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Emails Sent</h3>
              <p className="text-4xl font-bold text-gray-900 mb-4">{stats.email_campaigns?.sent || 0}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivered</span>
                  <span className="font-semibold text-gray-900">{stats.email_campaigns?.delivered || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Opened</span>
                  <span className="font-semibold text-gray-900">{stats.email_campaigns?.opened || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Clicked</span>
                  <span className="font-semibold text-gray-900">{stats.email_campaigns?.clicked || 0}</span>
                </div>
              </div>
            </div>

            {/* Profiles Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">LinkedIn Profiles</h3>
              <p className="text-4xl font-bold text-gray-900 mb-4">{stats.profiles?.total || 0}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Scraped</span>
                  <span className="font-semibold text-gray-900">{stats.profiles?.total || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => navigate('/admin/users')}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition">
                <svg className="w-6 h-6 text-blue-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">User Management</h3>
                <p className="text-sm text-gray-600">Manage all users</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/system')}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition">
                <svg className="w-6 h-6 text-green-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">System Health</h3>
                <p className="text-sm text-gray-600">Monitor services</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/campaigns')}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition">
                <svg className="w-6 h-6 text-indigo-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Campaigns</h3>
                <p className="text-sm text-gray-600">View all campaigns</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/analytics')}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition">
                <svg className="w-6 h-6 text-amber-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600">View reports</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/usagetracking')}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition">
                <svg className="w-6 h-6 text-purple-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Usage Tracking</h3>
                <p className="text-sm text-gray-600">Monitor API usage</p>
              </div>
            </div>
          </button>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">New user registered</p>
                <p className="text-sm text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Campaign completed</p>
                <p className="text-sm text-gray-500">15 minutes ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard

