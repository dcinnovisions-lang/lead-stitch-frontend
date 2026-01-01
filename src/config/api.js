import axios from 'axios'

// Get API URL based on environment (build-time detection)
// Uses different variable names: VITE_API_URL_DEV for development, VITE_API_URL_PROD for production
// Checks import.meta.env.PROD to determine which one to use
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production'

export const API_URL = isProduction
  ? (import.meta.env.VITE_API_URL_PROD || 'https://api.yourdomain.com/api')
  : (import.meta.env.VITE_API_URL_DEV || 'http://localhost:5000/api')

// Store reference will be set after store is created
let storeRef = null

export const setStoreReference = (store) => {
  storeRef = store
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available - check both localStorage and sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're already on the login page or if it's a login/register request
      const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/register'
      const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register')

      if (!isLoginPage && !isAuthRequest) {
        // Handle unauthorized - clear token from both storages and redirect to login (only if not already on login page)
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        window.location.href = '/login'
      }
    } else if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
      // Handle connection refused - backend server not running
      console.error('Backend server is not running. Please start it on port 5000.')
      // Dispatch global error if store is available
      if (storeRef) {
        import('../store/slices/errorSlice').then(({ setGlobalError }) => {
          storeRef.dispatch(
            setGlobalError({
              message: 'Cannot connect to backend server. Please make sure the backend is running.',
              type: 'network',
            })
          )
        })
      }
    } else if (error.response?.status >= 500) {
      // Server errors - dispatch global error if store is available
      if (storeRef) {
        import('../store/slices/errorSlice').then(({ setGlobalError }) => {
          storeRef.dispatch(
            setGlobalError({
              message: error.response?.data?.message || 'Server error occurred. Please try again later.',
              type: 'api',
            })
          )
        })
      }
    }
    return Promise.reject(error)
  }
)

export default api

