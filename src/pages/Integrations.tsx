import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import EmailSMTPConfig from '../components/EmailSMTPConfig'
import { getLinkedInCredentials, saveLinkedInCredentials, deleteLinkedInCredentials, clearError } from '../store/slices/integrationsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'
import type { ModalConfig } from '../utils/modal'

type TabType = 'linkedin' | 'email' | 'smtp'

interface LinkedInFormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
}

function Integrations() {
  const dispatch = useAppDispatch()
  
  // Redux state
  const { linkedInCredentials, loading, saving, error } = useAppSelector((state: RootState) => state.integrations)
  
  // Local UI state
  const [activeTab, setActiveTab] = useState<TabType>('linkedin')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [formData, setFormData] = useState<LinkedInFormData>({
    email: '',
    password: '',
  })
  const [modal, setModal] = useState<ModalConfig | null>(null)
  const [showForm, setShowForm] = useState<boolean>(false)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    dispatch(getLinkedInCredentials())
  }, [dispatch])

  // Clear error when component unmounts or error changes
  useEffect(() => {
    if (error) {
      setModal({
        title: 'Error',
        message: error,
        type: 'error',
        showCancel: false,
      })
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  const handleConnectLinkedIn = () => {
    setShowForm(true)
    setFormData({ email: '', password: '' })
    setErrors({})
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveCredentials = async () => {
    if (!validateForm()) {
      return
    }

    // Show confirmation modal with strict warning
    setModal({
      title: 'Double-Check Before Saving',
      message: 'IMPORTANT: Please ensure you have entered the CORRECT LinkedIn email and password. We store them exactly as you enter them, so double-check before saving.',
      type: 'warning',
      showCancel: true,
      confirmText: 'Yes, Verify & Save',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await performSave()
      },
    })
  }

  const performSave = async () => {
    try {
      const result = await dispatch(saveLinkedInCredentials({
        email: formData.email,
        password: formData.password,
      }))

      if (saveLinkedInCredentials.fulfilled.match(result)) {
        if (result.payload.success) {
          setModal({
            title: 'Success!',
            message: result.payload.message || 'LinkedIn credentials saved successfully! Your password has been encrypted and stored securely.',
            type: 'success',
            showCancel: false,
          })

          // Refresh credentials
          await dispatch(getLinkedInCredentials())
          setShowForm(false)
          setFormData({ email: '', password: '' })
          setErrors({})
        } else {
          setModal({
            title: 'Verification Failed',
            message: result.payload.message || 'Failed to verify credentials. Please check your email and password and try again.',
            type: 'error',
            showCancel: false,
          })
        }
      } else {
        setModal({
          title: 'Error',
          message: result.payload || 'Failed to save credentials. Please try again.',
          type: 'error',
          showCancel: false,
        })
      }
    } catch (error) {
      console.error('Error saving credentials:', error)
      setModal({
        title: 'Error',
        message: error.message || 'Failed to save credentials. Please try again.',
        type: 'error',
        showCancel: false,
      })
    }
  }

  const handleDelete = async () => {
    setModal({
      title: 'Delete Credentials',
      message: 'Are you sure you want to delete your LinkedIn credentials? You will need to reconfigure them before starting scraping.',
      type: 'warning',
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const result = await dispatch(deleteLinkedInCredentials())
          if (deleteLinkedInCredentials.fulfilled.match(result)) {
            setModal({
              title: 'Deleted',
              message: 'LinkedIn credentials deleted successfully!',
              type: 'success',
              showCancel: false,
            })
            setFormData({ email: '', password: '' })
          } else {
            setModal({
              title: 'Error',
              message: result.payload || 'Unable to delete LinkedIn credentials. Please try again later.',
              type: 'error',
              showCancel: false,
            })
          }
        } catch (error) {
          console.error('Error deleting credentials:', error)
          setModal({
            title: 'Error',
            message: error.message || 'Unable to delete LinkedIn credentials. Please try again later.',
            type: 'error',
            showCancel: false,
          })
        }
      },
    })
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations</h1>
          <p className="text-gray-600">Manage your third-party service connections</p>
        </div>

        {/* Tabs Navigation - Full Width */}
        <div className="mb-6 flex gap-2 bg-gray-50 rounded-xl p-1.5 border border-gray-100">
          <button
            onClick={() => setActiveTab('linkedin')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'linkedin'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                : 'bg-transparent text-gray-600 hover:bg-white/50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span>LinkedIn Integration</span>
          </button>
          <button
            onClick={() => setActiveTab('smtp')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'smtp'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                : 'bg-transparent text-gray-600 hover:bg-white/50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>SMTP Configuration</span>
          </button>
        </div>

        {/* LinkedIn Integration Content */}
        {activeTab === 'linkedin' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50/30 px-6 py-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">LinkedIn Integration</h2>
                <p className="text-gray-600 text-sm mt-1">Connect your LinkedIn account for profile scraping</p>
              </div>
              {linkedInCredentials && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-emerald-700 text-sm font-semibold">Connected</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Saved Credentials Display */}
                {linkedInCredentials && !showForm && (
                  <div className="bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-100 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-emerald-200">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">LinkedIn Credentials Configured</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Email:</span>
                            <span className="text-sm text-emerald-700 font-medium">{linkedInCredentials.email}</span>
                          </div>
                          {linkedInCredentials.lastUsedAt && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">Last used:</span>
                              <span className="text-sm text-gray-600">{new Date(linkedInCredentials.lastUsedAt as string).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Credentials Form */}
                {showForm && (
                  <div className="space-y-6">
                    {/* Critical Warning */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-amber-900 mb-3">CRITICAL: Enter Correct LinkedIn Credentials</h3>
                      <div className="space-y-2 text-sm text-amber-800">
                        <p className="font-semibold">Before submitting, please ensure:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>You are entering your <strong>LinkedIn account</strong> email and password (NOT your Lead Stitch app credentials)</li>
                          <li>The email and password are <strong>100% correct</strong> and you can log in to LinkedIn.com with them</li>
                          <li>We <strong>do not automatically verify</strong> these credentials—double-check them before saving</li>
                          <li>Incorrect credentials will cause <strong>scraping to fail</strong> and you'll need to update them</li>
                        </ul>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-6">
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            LinkedIn Email Address *
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, email: e.target.value }))
                              if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                            }}
                            placeholder="your.email@example.com"
                            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                              errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                            required
                            autoFocus
                          />
                          {errors.email && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.email}
                            </p>
                          )}
                          <p className="mt-1.5 text-xs text-gray-600">
                            This must be the exact email you use to log into LinkedIn.com
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            LinkedIn Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={formData.password}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, password: e.target.value }))
                                if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                              }}
                              placeholder="Enter your LinkedIn password"
                              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12 ${
                                errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                              }`}
                              required
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && formData.email && formData.password && !saving) {
                                  handleSaveCredentials()
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                          {errors.password && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.password}
                            </p>
                          )}
                          <p className="mt-1.5 text-xs text-gray-600">
                            Your password will be encrypted and stored securely. We do not automatically verify credentials.
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={handleSaveCredentials}
                            disabled={saving || !formData.email || !formData.password}
                            className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Save Credentials</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowForm(false)
                              setFormData({ email: '', password: '' })
                              setErrors({})
                            }}
                            disabled={saving}
                            className="px-6 py-3.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons - Show when form is not visible */}
                {!showForm && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleConnectLinkedIn}
                      disabled={saving}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <span>{linkedInCredentials ? 'Update LinkedIn Credentials' : 'Add LinkedIn Credentials'}</span>
                    </button>
                    {linkedInCredentials && (
                      <button
                        onClick={handleDelete}
                        disabled={saving}
                        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* SMTP Configuration Content */}
        {activeTab === 'smtp' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8">
              <EmailSMTPConfig />
            </div>
          </div>
        )}
      </div>

      {/* Custom Modal */}
      {modal && (
        <Modal
          isOpen={true}
          onClose={() => setModal(null)}
          title={modal.title}
          message={modal.message}
          type={modal.type || 'info'}
          onConfirm={() => {
            if (modal.onConfirm) {
              modal.onConfirm()
            }
            setModal(null)
          }}
          onCancel={() => {
            if (modal.onCancel) {
              modal.onCancel()
            }
            setModal(null)
          }}
          confirmText={modal.confirmText || 'OK'}
          cancelText={modal.cancelText || 'Cancel'}
          showCancel={modal.showCancel || false}
        />
      )}
    </Layout>
  )
}

export default Integrations
