import { useState, useEffect, type FormEvent } from 'react'
import { getCurrentUser } from '../store/slices/authSlice'
import Layout from '../components/Layout'
import api from '../config/api'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'
import { AxiosError } from 'axios'

interface SettingsFormData {
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface TouchedFields {
  currentPassword: boolean
  newPassword: boolean
  confirmPassword: boolean
}

interface FormErrors {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface ShowPassword {
  current: boolean
  new: boolean
  confirm: boolean
}

function Settings() {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated } = useAppSelector((state: RootState) => state.auth)
  const [formData, setFormData] = useState<SettingsFormData>({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [touched, setTouched] = useState<TouchedFields>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [errors, setErrors] = useState<FormErrors>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<ShowPassword>({
    current: false,
    new: false,
    confirm: false,
  })
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false)

  useEffect(() => {
    // Fetch user data if authenticated but user data is missing
    if (isAuthenticated && !user) {
      dispatch(getCurrentUser())
    }
  }, [dispatch, isAuthenticated, user])

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
      }))
    }
  }, [user])

  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessToast])

  const validateField = (field: keyof FormErrors, value: string): boolean => {
    let error = ''
    switch (field) {
      case 'currentPassword':
        if (!value || !value.trim()) {
          error = 'Please enter your current password'
        }
        break
      case 'newPassword':
        if (!value || !value.trim()) {
          error = 'Please enter a new password'
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters long'
        } else if (value === formData.currentPassword) {
          error = 'New password must be different from current password'
        }
        break
      case 'confirmPassword':
        if (!value || !value.trim()) {
          error = 'Please confirm your new password'
        } else if (value !== formData.newPassword) {
          error = 'Passwords do not match'
        }
        break
      default:
        break
    }
    setErrors(prev => ({ ...prev, [field]: error }))
    return !error
  }

  const handleBlur = (field: keyof FormErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const value = formData[field as keyof SettingsFormData]
    validateField(field, value)
  }

  const handleChange = (field: keyof SettingsFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (touched[field as keyof TouchedFields]) {
      validateField(field as keyof FormErrors, value)
    }
    // Also validate confirm password when new password changes
    if (field === 'newPassword' && touched.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    })
    
    // Validate all fields
    const isCurrentPasswordValid = validateField('currentPassword', formData.currentPassword)
    const isNewPasswordValid = validateField('newPassword', formData.newPassword)
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword)
    
    if (!isCurrentPasswordValid || !isNewPasswordValid || !isConfirmPasswordValid) {
      return
    }

    try {
      setSaving(true)
      await api.put('/auth/update-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })
      
      // Show success toast
      setShowSuccessToast(true)
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      setTouched({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      })
      setErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: unknown) {
      console.error('Error updating password:', error)
      const axiosError = error as AxiosError<{ message?: string; error?: string }>
      const errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || 'Failed to update password. Please try again.'
      setErrors(prev => ({
        ...prev,
        currentPassword: errorMessage,
      }))
      setTouched(prev => ({
        ...prev,
        currentPassword: true,
      }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-lg text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed top-20 right-6 z-50 animate-fade-in">
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] animate-slide-in-right">
              <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-green-800">Password Updated</p>
                <p className="text-xs text-green-700">Your password has been successfully updated. A confirmation email has been sent.</p>
              </div>
            </div>
          </div>
        )}

        {/* Account Settings */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Account Information</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field - Read Only */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Email address cannot be changed</p>
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleChange('currentPassword', e.target.value)}
                  onBlur={() => handleBlur('currentPassword')}
                  placeholder="Enter your current password"
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 text-gray-900 transition-all duration-200 ${
                    touched.currentPassword && errors.currentPassword
                      ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword.current ? (
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
              {touched.currentPassword && errors.currentPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleChange('newPassword', e.target.value)}
                  onBlur={() => handleBlur('newPassword')}
                  placeholder="Enter your new password"
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 text-gray-900 transition-all duration-200 ${
                    touched.newPassword && errors.newPassword
                      ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword.new ? (
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
              {touched.newPassword && errors.newPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.newPassword}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Confirm your new password"
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 text-gray-900 transition-all duration-200 ${
                    touched.confirmPassword && errors.confirmPassword
                      ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword.confirm ? (
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
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

export default Settings

