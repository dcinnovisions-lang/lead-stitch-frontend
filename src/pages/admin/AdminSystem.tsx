import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../config/api'

interface SystemHealth {
  status?: string
  uptime?: number
  [key: string]: unknown
}

interface QueueStatus {
  [key: string]: unknown
}

function AdminSystem() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [queue, setQueue] = useState<QueueStatus | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchSystemData()
    const interval = setInterval(fetchSystemData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchSystemData = async () => {
    try {
      const [healthRes, queueRes] = await Promise.all([
        api.get<SystemHealth>('/admin/system/health'),
        api.get<QueueStatus>('/admin/system/queue'),
      ])
      setHealth(healthRes.data)
      setQueue(queueRes.data)
    } catch (error) {
      console.error('Error fetching system data:', error)
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
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600 mt-2">Real-time system health and queue status</p>
        </div>

        {/* System Health */}
        {health && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Health</h2>
            <div className={`p-6 rounded-lg border-2 ${
              health.status === 'healthy' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Overall Status</h3>
                  <p className="text-sm text-gray-600 capitalize">{health.status}</p>
                </div>
                <div className={`px-4 py-2 rounded-full ${
                  health.status === 'healthy' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                }`}>
                  {health.status === 'healthy' ? '✓ Healthy' : '⚠ Degraded'}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(health.services).map(([service, data]) => (
                  <div key={service} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 capitalize">{service}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        data.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {data.status}
                      </span>
                    </div>
                    {data.error && (
                      <p className="mt-2 text-xs text-red-600">{data.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Queue Status */}
        {queue && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Queue Status</h2>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{queue.counts?.waiting || 0}</div>
                  <div className="text-sm text-gray-600">Waiting</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{queue.counts?.active || 0}</div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{queue.counts?.completed || 0}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{queue.counts?.failed || 0}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>

              {queue.recent_jobs && queue.recent_jobs.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Jobs</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {queue.recent_jobs.slice(0, 10).map((job) => (
                          <tr key={job.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{job.id}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                job.state === 'completed' ? 'bg-green-100 text-green-800' :
                                job.state === 'failed' ? 'bg-red-100 text-red-800' :
                                job.state === 'active' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {job.state}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">{job.progress || 0}%</td>
                            <td className="px-4 py-2 text-sm text-gray-600">
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
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminSystem

