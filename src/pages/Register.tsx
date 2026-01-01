import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../store/slices/authSlice'
import AuthNavbar from '../components/AuthNavbar'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'
import type { RegisterData } from '../types/api/auth.types'

interface TouchedFields {
  email: boolean
  password: boolean
  firstName: boolean
  lastName: boolean
}

interface FormErrors {
  email: string
  password: string
  firstName: string
  lastName: string
}

function Register() {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [touched, setTouched] = useState<TouchedFields>({
    email: false,
    password: false,
    firstName: false,
    lastName: false,
  })
  const [errors, setErrors] = useState<FormErrors>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector((state: RootState) => state.auth)
  const errorMessage = typeof error === 'string' ? error : (error?.message || '')

  const validateEmail = (value: string): string => {
    if (!value) {
      return 'Please fill out this field'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  const validatePassword = (value: string): string => {
    if (!value) {
      return 'Please fill out this field'
    }
    if (value.length < 6) {
      return 'Must be at least 6 characters long'
    }
    return ''
  }

  const validateName = (value: string): string => {
    if (!value) {
      return `Please fill out this field`
    }
    return ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    // Validate on change if field has been touched
    if (touched[name]) {
      let error = ''
      if (name === 'email') {
        error = validateEmail(value)
      } else if (name === 'password') {
        error = validatePassword(value)
      } else if (name === 'firstName' || name === 'lastName') {
        error = validateName(value)
      }
      setErrors({ ...errors, [name]: error })
    }
  }

  const handleBlur = (field: keyof TouchedFields) => {
    setTouched({ ...touched, [field]: true })
    
    let error = ''
    if (field === 'email') {
      error = validateEmail(formData.email)
    } else if (field === 'password') {
      error = validatePassword(formData.password)
    } else if (field === 'firstName' || field === 'lastName') {
      error = validateName(formData[field])
    }
    setErrors({ ...errors, [field]: error })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      firstName: true,
      lastName: true,
    })
    
    // Validate all fields
    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)
    const firstNameError = validateName(formData.firstName)
    const lastNameError = validateName(formData.lastName)
    
    setErrors({
      email: emailError,
      password: passwordError,
      firstName: firstNameError,
      lastName: lastNameError,
    })
    
    // Only submit if no errors
    if (!emailError && !passwordError && !firstNameError && !lastNameError) {
      const result = await dispatch(register(formData))
      if (register.fulfilled.match(result)) {
        // Redirect to login page with success message
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Please login with your credentials.' 
          } 
        })
      }
    }
    
    return false
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Navigation Bar */}
      <AuthNavbar />

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left Side - Register Form */}
        <div className="w-full order-2 lg:order-1">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 max-w-lg mx-auto">
            {/* Logo/Title */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Lead Stitch
              </h1>
              <p className="text-gray-600 text-lg">Create your account to get started.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                  {errorMessage.includes('already registered') && (
                    <p className="mt-2 text-xs text-red-600">
                      <Link to="/login" className="underline hover:text-red-700 font-medium">
                        Click here to login instead
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('firstName')}
                    className={`w-full px-4 py-3.5 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 ${
                      touched.firstName && errors.firstName
                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                    }`}
                    placeholder="John"
                  />
                  {touched.firstName && errors.firstName && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('lastName')}
                    className={`w-full px-4 py-3.5 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 ${
                      touched.lastName && errors.lastName
                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                    }`}
                    placeholder="Doe"
                  />
                  {touched.lastName && errors.lastName && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  className={`w-full px-4 py-3.5 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 ${
                    touched.email && errors.email
                      ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                  }`}
                  placeholder="your@email.com"
                />
                {touched.email && errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    className={`w-full px-4 py-3.5 pr-12 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 ${
                      touched.password && errors.password
                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                    }`}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 focus:outline-none transition-colors p-1.5 rounded-md hover:bg-gray-100"
                    tabIndex={-1}
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
                {touched.password && errors.password ? (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.password}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters long</p>
                )}
              </div>

              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                  I agree to the{' '}
                  <Link to="#" className="text-blue-600 hover:text-blue-700 font-medium">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="#" className="text-blue-600 hover:text-blue-700 font-medium">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Benefits */}
        <div className="hidden lg:flex order-1 lg:order-2 items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-6 shadow-lg">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Start Your Lead Generation Journey
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of businesses using Lead Stitch to grow their sales pipeline.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-300">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mt-0.5">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Lead Discovery</h3>
                  <p className="text-sm text-gray-600">Automatically identify decision-makers</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-300">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mt-0.5">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email Enrichment</h3>
                  <p className="text-sm text-gray-600">Get verified email addresses instantly</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-300">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mt-0.5">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Campaign Management</h3>
                  <p className="text-sm text-gray-600">Track and automate your email campaigns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default Register
