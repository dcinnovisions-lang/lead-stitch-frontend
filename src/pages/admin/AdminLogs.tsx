import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'

type LogLevel = 'all' | 'error' | 'warn' | 'info'

function AdminLogs() {
  const [logLevel, setLogLevel] = useState<LogLevel>('all')

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600 mt-2">View and monitor system logs</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow border border-gray-200 mb-6">
          <div className="flex gap-4">
            <select
              value={logLevel}
              onChange={(e) => setLogLevel(e.target.value as LogLevel)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Logs</option>
              <option value="error">Errors</option>
              <option value="warn">Warnings</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>

        {/* Logs Viewer */}
        <div className="bg-gray-900 rounded-xl shadow border border-gray-200 p-6">
          <div className="text-green-400 font-mono text-sm">
            <div className="mb-2">[INFO] System logs will be displayed here</div>
            <div className="mb-2">[INFO] Log viewer implementation coming soon...</div>
            <div className="text-gray-500">This feature will show real-time system logs</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminLogs

