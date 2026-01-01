import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../config/api'

interface ScrapingStats {
  [key: string]: unknown
}

interface QueueStatus {
  [key: string]: unknown
}

function AdminScraping() {
  const [stats, setStats] = useState<ScrapingStats | null>(null)
  const [queue, setQueue] = useState<QueueStatus | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, queueRes] = await Promise.all([
        api.get<ScrapingStats>('/admin/scraping/stats'),
        api.get<QueueStatus>('/admin/system/queue'),
      ])
      setStats(statsRes.data)
      setQueue(queueRes.data)
    } catch (error) {
      console.error('Error fetching scraping data:', error)
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
          <h1 className="text-3xl font-bold text-gray-900">Scraping Jobs Monitor</h1>
          <p className="text-gray-600 mt-2">Monitor LinkedIn scraping jobs and queue status</p>
        </div>

        {/* Queue Stats */}
        {queue && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-yellow-100">Waiting</h3>
                <svg className="w-6 h-6 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-4xl font-bold">{queue.counts?.waiting || 0}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-100">Active</h3>
                <svg className="w-6 h-6 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-4xl font-bold">{queue.counts?.active || 0}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-100">Completed</h3>
                <svg className="w-6 h-6 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-4xl font-bold">{queue.counts?.completed || 0}</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-red-100">Failed</h3>
                <svg className="w-6 h-6 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-4xl font-bold">{queue.counts?.failed || 0}</p>
            </div>
          </div>
        )}

        {/* Recent Jobs */}
        {queue && queue.recent_jobs && queue.recent_jobs.length > 0 && (
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Jobs</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {queue.recent_jobs.slice(0, 20).map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">{job.id}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          job.state === 'completed' ? 'bg-green-100 text-green-800' :
                          job.state === 'failed' ? 'bg-red-100 text-red-800' :
                          job.state === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.state}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{job.progress || 0}%</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {job.createdAt ? new Date(job.createdAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminScraping

