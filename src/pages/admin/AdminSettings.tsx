import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../config/api'

interface AdminSettings {
  maintenanceMode: boolean
  registrationEnabled: boolean
  maxUsersPerPlan: number
  profilesPerRole: number
}

interface SystemSetting {
  id: string
  key: string
  value: string
  description: string | null
  updated_at: string
  updated_by: string | null
}

function AdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>({
    maintenanceMode: false,
    registrationEnabled: true,
    maxUsersPerPlan: 100,
    profilesPerRole: 2,
  })
  const [saving, setSaving] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [successPopup, setSuccessPopup] = useState<{ message: string } | null>(null)
  const [errorPopup, setErrorPopup] = useState<{ message: string } | null>(null)

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await api.get('/admin/settings')
        const systemSettings: SystemSetting[] = response.data.settings || []
        
        // Find records_per_role setting
        const recordsPerRoleSetting = systemSettings.find(s => s.key === 'records_per_role')
        if (recordsPerRoleSetting) {
          const value = parseInt(recordsPerRoleSetting.value, 10)
          if (!isNaN(value)) {
            setSettings(prev => ({
              ...prev,
              profilesPerRole: value,
            }))
            setLastUpdated(recordsPerRoleSetting.updated_at)
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Update records_per_role setting
      await api.put(`/admin/settings/records_per_role`, {
        value: settings.profilesPerRole,
      })

      // Update last updated timestamp
      const response = await api.get('/admin/settings/records_per_role')
      if (response.data && response.data.updated_at) {
        setLastUpdated(response.data.updated_at)
      }

      setSuccessPopup({ message: 'Settings saved successfully!' })
    } catch (error: any) {
      console.error('Error saving settings:', error)
      const errorMessage = error.response?.data?.message || 'Failed to save settings'
      setErrorPopup({ message: errorMessage })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-2">Configure platform settings</p>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 space-y-6">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-900">Maintenance Mode</h3>
              <p className="text-sm text-gray-600">Put the platform in maintenance mode</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Registration */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-900">User Registration</h3>
              <p className="text-sm text-gray-600">Allow new user registrations</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.registrationEnabled}
                onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Profiles Per Role */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="mb-4">
              <label htmlFor="profilesPerRole" className="block text-sm font-semibold text-gray-900 mb-1">
                Profiles Per Role
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Number of LinkedIn profiles to scrape per decision maker role. Higher values mean more profiles but longer scraping times.
              </p>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mb-2">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <input
                id="profilesPerRole"
                type="number"
                min="1"
                max="100"
                value={settings.profilesPerRole}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10)
                  if (!isNaN(value) && value >= 1 && value <= 100) {
                    setSettings({ ...settings, profilesPerRole: value })
                  }
                }}
                disabled={loading}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-600">
                profiles per role (1-100)
              </span>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Success Popup */}
        {successPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                <p className="text-gray-600 mb-6">{successPopup.message}</p>
                <button
                  onClick={() => setSuccessPopup(null)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Popup */}
        {errorPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
                <p className="text-gray-600 mb-6">{errorPopup.message}</p>
                <button
                  onClick={() => setErrorPopup(null)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminSettings

