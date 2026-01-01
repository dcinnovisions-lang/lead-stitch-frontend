import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../store/slices/authSlice'
import { getBusinessRequirements } from '../store/slices/businessRequirementSlice'
import Layout from '../components/Layout'
import api from '../config/api'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'

interface DashboardStats {
  totalRequirements: number
  totalDecisionMakers: number
  totalProfiles: number
  activeCampaigns: number
}

interface ExampleQuery {
  text: string
  icon: string
}

function Dashboard() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAppSelector((state: RootState) => state.auth)
  const { requirements } = useAppSelector((state: RootState) => state.businessRequirement)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Redirect admins to admin dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      // Fetch user data if role is missing
      if (!user.role) {
        dispatch(getCurrentUser())
        return
      }
      // Redirect if admin
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate, dispatch])
  const [stats, setStats] = useState<DashboardStats>({
    totalRequirements: 0,
    totalDecisionMakers: 0,
    totalProfiles: 0,
    activeCampaigns: 0,
  })
  const [loadingStats, setLoadingStats] = useState<boolean>(true)

  useEffect(() => {
    // Fetch user data if authenticated but user data is missing
    if (isAuthenticated && !user) {
      dispatch(getCurrentUser())
    }
  }, [dispatch, isAuthenticated, user])

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getBusinessRequirements())
    }
  }, [dispatch, isAuthenticated])

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated || requirements.length === 0) {
        setLoadingStats(false)
        return
      }

      try {
        let totalDMs = 0
        let totalProfiles = 0

        // Fetch stats for all requirements
        for (const req of requirements) {
          try {
            const dmResponse = await api.get<unknown[]>(`/decision-makers/requirement/${req.id}`)
            totalDMs += dmResponse.data?.length || 0

            const profilesResponse = await api.get<unknown[]>(`/profiles?requirementId=${req.id}`)
            totalProfiles += Array.isArray(profilesResponse.data) ? profilesResponse.data.length : 0
          } catch (error) {
            // Silently continue if stats can't be fetched
          }
        }

        setStats({
          totalRequirements: requirements.length,
          totalDecisionMakers: totalDMs,
          totalProfiles: totalProfiles,
          activeCampaigns: 0, // TODO: Implement campaigns count
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [requirements, isAuthenticated])

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    )
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate('/business-requirement', { state: { searchQuery: searchQuery.trim() } })
    }
  }

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query)
    navigate('/business-requirement', { state: { searchQuery: query } })
  }

  const exampleQueries: ExampleQuery[] = [
    {
      text: "I want to sell books across the Netherlands",
      icon: "📚",
    },
    {
      text: "Find marketing directors in tech companies",
      icon: "💼",
    },
    {
      text: "Identify sales managers in healthcare",
      icon: "🏥",
    },
    {
      text: "Locate HR leaders in finance industry",
      icon: "👥",
    },
  ]

  // Recent requirements (last 5)
  const recentRequirements = requirements.slice(0, 5)

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user?.firstName) {
      return user.firstName;
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown date'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {getUserDisplayName()}! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Ready to find your next leads? Let's get started.
          </p>
        </div>

        {/* Main Search Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-blue-50/20 rounded-3xl p-8 md:p-12 border border-blue-100 shadow-xl">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  What do you want to sell or promote?
                </h2>
                <p className="text-lg text-gray-600">
                  Describe your business requirement and we'll find the perfect decision-makers for you
                </p>
              </div>

              <form onSubmit={handleSearch} className="mb-8">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., I want to sell enterprise software to tech companies in Europe..."
                    className="w-full pl-14 pr-6 py-5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 placeholder-gray-400 text-lg shadow-sm transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-6 w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={!searchQuery.trim()}
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Find Decision Makers
                  </span>
                </button>
              </form>

              {/* Example Queries */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-4 text-center">Try these examples:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {exampleQueries.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(example.text)}
                      className="group relative bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-blue-300 hover:bg-white rounded-xl p-4 text-left transition-all hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{example.icon}</span>
                        <span className="text-sm text-gray-700 group-hover:text-blue-700 font-medium flex-1">
                          {example.text}
                        </span>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Requirements Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Recent Requirements</h2>
                <p className="text-gray-600">Your latest business requirement searches</p>
              </div>
              {requirements.length > 5 && (
              <button
                onClick={() => navigate('/requirements')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
              >
                  View all
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {recentRequirements.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No requirements yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Get started by describing what you want to sell or promote. We'll help you find the right decision-makers.
              </p>
              <button
                onClick={() => navigate('/business-requirement')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Requirement
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentRequirements.map((req, index) => (
                <div
                  key={req.id}
                  onClick={() => navigate(`/decision-makers/${req.id}`)}
                  className="p-6 md:p-8 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-blue-50/30 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 mb-1 truncate">
                            {req.operation_name || 'Untitled Requirement'}
                          </h3>
                          <p className="text-sm text-gray-500">{formatDate(req.created_at || req.createdAt)}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        {req.requirement_text}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {req.target_location && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {req.target_location}
                          </span>
                        )}
                        {req.industry && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {req.industry}
                          </span>
                        )}
                        {req.product_service && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {req.product_service}
                          </span>
                        )}
                      </div>
                    </div>
                      <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {!loadingStats && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-blue-700 mb-1">Total Requirements</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalRequirements}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-purple-700 mb-1">Decision Makers</p>
                <p className="text-3xl font-bold text-purple-900">{stats.totalDecisionMakers}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-green-700 mb-1">LinkedIn Profiles</p>
                <p className="text-3xl font-bold text-green-900">{stats.totalProfiles}</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-emerald-700 mb-1">Active Campaigns</p>
                <p className="text-3xl font-bold text-emerald-900">{stats.activeCampaigns}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard
