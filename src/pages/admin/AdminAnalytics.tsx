import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../config/api'
import type { AxiosError } from 'axios'

interface AnalyticsStats {
  users?: {
    total?: number
    active?: number
    new_this_month?: number
    [key: string]: unknown
  }
  email_campaigns?: {
    sent?: number
    delivered?: number
    opened?: number
    clicked?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}

function AdminAnalytics() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await api.get<AnalyticsStats>('/admin/system/stats')
      setStats(response.data)
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>
      console.error('Error fetching analytics:', axiosError)
    } finally {
      setLoading(false)
    }
  }

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-2">Platform-wide analytics and insights</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">User Growth</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">Total Users</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.users?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Active Users</span>
                  <span className="text-2xl font-bold text-green-600">{stats.users?.active || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg">
                  <span className="text-gray-700">New This Month</span>
                  <span className="text-2xl font-bold text-indigo-600">{stats.users?.new_this_month || 0}</span>
                </div>
              </div>
            </div>

            {/* Email Performance */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Email Performance</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg">
                  <span className="text-gray-700">Total Sent</span>
                  <span className="text-2xl font-bold text-indigo-600">{stats.email_campaigns?.sent || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Delivered</span>
                  <span className="text-2xl font-bold text-green-600">{stats.email_campaigns?.delivered || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">Opened</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.email_campaigns?.opened || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg">
                  <span className="text-gray-700">Clicked</span>
                  <span className="text-2xl font-bold text-indigo-600">{stats.email_campaigns?.clicked || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminAnalytics

