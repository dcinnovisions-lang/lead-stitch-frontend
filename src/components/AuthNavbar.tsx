import { Link, useLocation } from 'react-router-dom'

function AuthNavbar() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'
  const isRegisterPage = location.pathname === '/register'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm backdrop-blur-lg bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700 transition-all">
              Lead Stitch
            </h1>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              Home
            </Link>
            {!isLoginPage && (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
              >
                Sign In
              </Link>
            )}
            {!isRegisterPage && (
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {isLoginPage ? 'Sign Up' : 'Get Started'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default AuthNavbar

