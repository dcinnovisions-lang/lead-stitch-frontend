import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { AxiosError } from 'axios'
import api from '../config/api'

interface LocationState {
  email?: string
}

interface PasswordTouched {
  password: boolean
  confirm: boolean
}

interface VerifyOTPResponse {
  verified?: boolean
  email?: string
  message?: string
}

interface ResetPasswordResponse {
  success?: boolean
  message?: string
}

function VerifyOTP() {
  const location = useLocation()
  const navigate = useNavigate()
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false)
  const [verified, setVerified] = useState<boolean>(false)
  const [showPasswordReset, setShowPasswordReset] = useState<boolean>(false)
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('')
  const [passwordTouched, setPasswordTouched] = useState<PasswordTouched>({ password: false, confirm: false })
  const [resetLoading, setResetLoading] = useState<boolean>(false)
  const [resetSuccess, setResetSuccess] = useState<boolean>(false)
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [requestingNewOTP, setRequestingNewOTP] = useState<boolean>(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const locationState = location.state as LocationState | null
  const email = locationState?.email || ''
  const verifiedOTP = useRef<string>('') // Store verified OTP

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password')
    }
    // Focus first input on mount
    if (inputRefs.current[0] && !verified) {
      inputRefs.current[0].focus()
    }
  }, [email, navigate, verified])

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('')
        const newOtp = [...otp]
        digits.forEach((digit, i) => {
          if (i < 6) {
            newOtp[i] = digit
          }
        })
        setOtp(newOtp)
        if (digits.length === 6) {
          inputRefs.current[5]?.focus()
        } else if (digits.length > 0) {
          inputRefs.current[digits.length]?.focus()
        }
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await api.post<VerifyOTPResponse>('/auth/verify-otp', { 
        email, 
        otp: otpString 
      })
      
      if (response.data.verified) {
        verifiedOTP.current = otpString // Store verified OTP
        setVerified(true)
        setShowPasswordReset(true)
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      console.error('Verify OTP error:', err)
      const errorMessage = axiosError.response?.data?.message || 'Invalid OTP. Please try again.'
      setError(errorMessage)
      setShowErrorModal(true)
      // Clear OTP on error
      setOtp(['', '', '', '', '', ''])
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }
    } finally {
      setLoading(false)
    }
  }

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError('Please enter a password')
      return false
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return false
    }
    setPasswordError('')
    return true
  }

  const validateConfirmPassword = (value: string): boolean => {
    if (!value) {
      setConfirmPasswordError('Please confirm your password')
      return false
    }
    if (value !== newPassword) {
      setConfirmPasswordError('Passwords do not match')
      return false
    }
    setConfirmPasswordError('')
    return true
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value)
    setError('')
    if (passwordTouched.password) {
      validatePassword(e.target.value)
    }
    // Re-validate confirm password if it's been touched
    if (passwordTouched.confirm) {
      validateConfirmPassword(confirmPassword)
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    setError('')
    if (passwordTouched.confirm) {
      validateConfirmPassword(e.target.value)
    }
  }

  const handlePasswordBlur = (field: keyof PasswordTouched) => {
    setPasswordTouched({ ...passwordTouched, [field]: true })
    if (field === 'password') {
      validatePassword(newPassword)
    } else if (field === 'confirm') {
      validateConfirmPassword(confirmPassword)
    }
  }

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordTouched({ password: true, confirm: true })
    setError('')
    
    const isPasswordValid = validatePassword(newPassword)
    const isConfirmValid = validateConfirmPassword(confirmPassword)
    
    if (!isPasswordValid || !isConfirmValid) {
      return
    }

    setResetLoading(true)
    
    try {
      const response = await api.post<ResetPasswordResponse>('/auth/reset-password', {
        email,
        otp: verifiedOTP.current,
        newPassword,
        confirmPassword
      })
      
      if (response.data.success) {
        setResetSuccess(true)
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      console.error('Reset password error:', err)
      const errorMessage = axiosError.response?.data?.message || 'Failed to reset password. Please try again.'
      setError(errorMessage)
      setShowErrorModal(true)
    } finally {
      setResetLoading(false)
    }
  }

  // Password Reset Success Screen
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="w-full max-w-md mx-auto relative z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200/50 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
              <p className="text-gray-600 mb-2">Your password has been updated successfully. A confirmation email with your login credentials has been sent to your email address.</p>
              <p className="text-gray-600 text-sm">You can now login with your new password.</p>
            </div>
            <Link
              to="/login"
              className="inline-block w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Password Reset Form (after OTP verification)
  if (showPasswordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="w-full max-w-md mx-auto relative z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200/50">
            {/* Logo/Title */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">
                Lead Stitch
              </h1>
              <p className="text-gray-600 text-base">Set your new password</p>
              <p className="text-blue-600 font-semibold mt-1 text-sm">{email}</p>
            </div>

            {/* Global Error Message */}
            {error && !showErrorModal && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            )}

            {/* Password Reset Form */}
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={handlePasswordChange}
                    onBlur={() => handlePasswordBlur('password')}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      passwordTouched.password && passwordError
                        ? 'border-red-500 bg-red-50/50 focus:border-red-500' 
                        : passwordTouched.password && newPassword && !passwordError
                        ? 'border-green-500 bg-green-50/30 focus:border-green-500'
                        : 'border-gray-300 bg-white focus:border-blue-500 hover:border-gray-400'
                    }`}
                    placeholder="Enter new password"
                    disabled={resetLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
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
                {passwordTouched.password && passwordError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {passwordError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onBlur={() => handlePasswordBlur('confirm')}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      passwordTouched.confirm && confirmPasswordError
                        ? 'border-red-500 bg-red-50/50 focus:border-red-500' 
                        : passwordTouched.confirm && confirmPassword && !confirmPasswordError
                        ? 'border-green-500 bg-green-50/30 focus:border-green-500'
                        : 'border-gray-300 bg-white focus:border-blue-500 hover:border-gray-400'
                    }`}
                    placeholder="Confirm new password"
                    disabled={resetLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
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
                {passwordTouched.confirm && confirmPasswordError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 active:from-blue-700 active:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {resetLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting Password...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Error Modal - Bigger */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 animate-in slide-in-from-top-2">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
                  <p className="text-base text-gray-700 leading-relaxed">{error}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowErrorModal(false)
                    setError('')
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-base"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // OTP Verification Form (initial state)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md mx-auto relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200/50">
          {/* Logo/Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">
              Lead Stitch
            </h1>
            <p className="text-gray-600 text-base">Enter the 6-digit OTP sent to</p>
            <p className="text-blue-600 font-semibold mt-1">{email}</p>
          </div>

          {/* Global Error Message */}
          {error && !showErrorModal && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* OTP Input Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    if (el) {
                      inputRefs.current[index] = el
                    }
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 border-gray-300 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 active:from-blue-700 active:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify OTP'
              )}
            </button>
          </form>

          {/* Back to Forgot Password Link */}
          <div className="mt-6 text-center">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              ← Back to Forgot Password
            </Link>
          </div>
        </div>
      </div>

      {/* Error Modal - Bigger */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 animate-in slide-in-from-top-2">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h3>
                <p className="text-base text-gray-700 leading-relaxed">{error}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setRequestingNewOTP(true)
                  try {
                    const response = await api.post<{ message?: string }>('/auth/forgot-password', { email })
                    if (response.data.message && response.data.message !== 'Kindly signup') {
                      setShowErrorModal(false)
                      setError('')
                      setOtp(['', '', '', '', '', ''])
                      // Show success message
                      alert('New OTP has been sent to your email address.')
                      if (inputRefs.current[0]) {
                        inputRefs.current[0].focus()
                      }
                    }
                  } catch (err) {
                    console.error('Error requesting new OTP:', err)
                    // Error handling for new OTP request
                    alert('Failed to send new OTP. Please try again.')
                  } finally {
                    setRequestingNewOTP(false)
                  }
                }}
                disabled={requestingNewOTP}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestingNewOTP ? 'Sending...' : 'Request New OTP'}
              </button>
              <button
                onClick={() => {
                  setShowErrorModal(false)
                  setError('')
                  setOtp(['', '', '', '', '', ''])
                  if (inputRefs.current[0]) {
                    inputRefs.current[0].focus()
                  }
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-base"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}

export default VerifyOTP
