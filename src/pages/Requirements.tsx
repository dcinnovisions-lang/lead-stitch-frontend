import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBusinessRequirements } from '../store/slices/businessRequirementSlice'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import api from '../config/api'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'
import type { BusinessRequirement } from '../types/api/businessRequirement.types'
import type { ModalConfig } from '../utils/modal'
import { AxiosError } from 'axios'

interface RequirementWithStats extends BusinessRequirement {
  decisionMakersCount: number
  profilesCount: number
}

type ViewMode = 'grid' | 'list'
type SortBy = 'newest' | 'oldest' | 'name' | 'industry'
type FilterStatus = 'all' | 'draft' | 'in-progress' | 'completed'

interface StatusBadge {
  label: string
  color: string
}

function Requirements() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { requirements, loading } = useAppSelector((state: RootState) => state.businessRequirement)
  
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterIndustry, setFilterIndustry] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedRequirements, setSelectedRequirements] = useState<(number | string)[]>([])
  const [requirementsWithStats, setRequirementsWithStats] = useState<RequirementWithStats[]>([])
  const [loadingStats, setLoadingStats] = useState<boolean>(false)
  const [modal, setModal] = useState<ModalConfig | null>(null)

  useEffect(() => {
    dispatch(getBusinessRequirements())
  }, [dispatch])

  // Fetch stats for each requirement (decision makers count, profiles count)
  useEffect(() => {
    const fetchStats = async () => {
      if (requirements.length === 0) {
        setRequirementsWithStats([])
        return
      }

      setLoadingStats(true)
      try {
        const statsPromises = requirements.map(async (req) => {
          try {
            // Fetch decision makers count
            let decisionMakersCount = 0
            try {
              const dmResponse = await api.get<unknown[]>(`/decision-makers/requirement/${req.id}`)
              decisionMakersCount = dmResponse.data?.length || 0
            } catch (dmError) {
              // If endpoint doesn't exist or returns error, count is 0
              const error = dmError as AxiosError
              console.warn(`Could not fetch decision makers for ${req.id}:`, error.message)
            }

            // Fetch profiles count
            let profilesCount = 0
            try {
              const profilesResponse = await api.get<unknown[]>(`/profiles?requirementId=${req.id}`)
              profilesCount = Array.isArray(profilesResponse.data) ? profilesResponse.data.length : 0
            } catch (profilesError) {
              // If endpoint doesn't exist or returns error, count is 0
              const error = profilesError as AxiosError
              console.warn(`Could not fetch profiles for ${req.id}:`, error.message)
            }

            return {
              ...req,
              decisionMakersCount,
              profilesCount,
            }
          } catch (error) {
            console.error(`Error fetching stats for requirement ${req.id}:`, error)
            return {
              ...req,
              decisionMakersCount: 0,
              profilesCount: 0,
            }
          }
        })

        const stats = await Promise.all(statsPromises)
        setRequirementsWithStats(stats)
      } catch (error) {
        console.error('Error fetching requirements stats:', error)
        setRequirementsWithStats(requirements.map(req => ({
          ...req,
          decisionMakersCount: 0,
          profilesCount: 0,
        })))
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [requirements])

  // Get unique industries for filter
  const industries = ['all', ...new Set(requirements.map(r => r.industry).filter(Boolean))]

  // Filter and sort requirements
  const filteredRequirements = requirementsWithStats
    .filter(req => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          req.requirement_text?.toLowerCase().includes(query) ||
          req.operation_name?.toLowerCase().includes(query) ||
          req.industry?.toLowerCase().includes(query) ||
          req.product_service?.toLowerCase().includes(query) ||
          req.target_location?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Industry filter
      if (filterIndustry !== 'all' && req.industry !== filterIndustry) {
        return false
      }

      // Status filter (based on decision makers and profiles)
      if (filterStatus !== 'all') {
        if (filterStatus === 'draft' && req.decisionMakersCount > 0) return false
        if (filterStatus === 'in-progress' && (req.decisionMakersCount === 0 || req.profilesCount === 0)) return false
        if (filterStatus === 'completed' && req.profilesCount === 0) return false
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || b.createdAt || '').getTime() - new Date(a.created_at || a.createdAt || '').getTime()
        case 'oldest':
          return new Date(a.created_at || a.createdAt || '').getTime() - new Date(b.created_at || b.createdAt || '').getTime()
        case 'name':
          return (a.operation_name || '').localeCompare(b.operation_name || '')
        case 'industry':
          return (a.industry || '').localeCompare(b.industry || '')
        default:
          return 0
      }
    })

  // Calculate stats
  const stats = {
    total: requirements.length,
    withDecisionMakers: requirementsWithStats.filter(r => r.decisionMakersCount > 0).length,
    withProfiles: requirementsWithStats.filter(r => r.profilesCount > 0).length,
    completed: requirementsWithStats.filter(r => r.decisionMakersCount > 0 && r.profilesCount > 0).length,
  }

  const handleSelectRequirement = (id: number | string) => {
    setSelectedRequirements(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedRequirements.length === filteredRequirements.length) {
      setSelectedRequirements([])
    } else {
      setSelectedRequirements(filteredRequirements.map(r => r.id))
    }
  }

  const handleDelete = async (id: number | string) => {
    setModal({
      title: 'Delete Requirement',
      message: 'Are you sure you want to delete this requirement? This action cannot be undone.',
      type: 'warning',
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await api.delete(`/business-requirements/${id}`)
          setModal({
            title: 'Deleted',
            message: 'Business requirement deleted successfully.',
            type: 'success',
            showCancel: false,
          })
          dispatch(getBusinessRequirements())
          setSelectedRequirements(prev => prev.filter(i => i !== id))
        } catch (error) {
          const axiosError = error as AxiosError<{ message?: string }>
          console.error('Error deleting requirement:', error)
          const errorMessage = axiosError.response?.data?.message || 'Failed to delete requirement. Please try again.'
          setModal({
            title: 'Error',
            message: errorMessage,
            type: 'error',
            showCancel: false,
          })
        }
      },
    })
  }

  const handleBulkDelete = async () => {
    setModal({
      title: 'Delete Requirements',
      message: `Are you sure you want to delete ${selectedRequirements.length} requirement(s)? This action cannot be undone.`,
      type: 'warning',
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await Promise.all(selectedRequirements.map(id => api.delete(`/business-requirements/${id}`)))
          setModal({
            title: 'Deleted',
            message: `${selectedRequirements.length} requirement(s) deleted successfully.`,
            type: 'success',
            showCancel: false,
          })
          dispatch(getBusinessRequirements())
          setSelectedRequirements([])
        } catch (error) {
          const axiosError = error as AxiosError<{ message?: string }>
          console.error('Error deleting requirements:', error)
          const errorMessage = axiosError.response?.data?.message || 'Failed to delete some requirements. Please try again.'
          setModal({
            title: 'Error',
            message: errorMessage,
            type: 'error',
            showCancel: false,
          })
        }
      },
    })
  }

  const getStatusBadge = (req: RequirementWithStats): StatusBadge => {
    if (req.decisionMakersCount === 0) {
      return { label: 'Draft', color: 'bg-gray-100 text-gray-800' }
    }
    if (req.profilesCount === 0) {
      return { label: 'In Progress', color: 'bg-blue-100 text-blue-800' }
    }
    return { label: 'Completed', color: 'bg-green-100 text-green-800' }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const truncateText = (text: string | undefined, maxLength: number = 150): string => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  if (loading || loadingStats) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading requirements...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Modal */}
      {modal && (
        <Modal
          isOpen={!!modal}
          onClose={() => setModal(null)}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          showCancel={modal.showCancel}
          confirmText={modal.confirmText || 'OK'}
          cancelText={modal.cancelText || 'Cancel'}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Requirements</h1>
            <p className="text-gray-600">Manage and track all your business requirements</p>
          </div>
          <button
            onClick={() => navigate('/business-requirement')}
            className="bg-gradient-to-r from-blue-600 to-blue-600 text-white px-6 py-3 rounded-lg font-blue hover:from-blue-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
          >
            + Create New Requirement
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Requirements</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">With Decision Makers</p>
                <p className="text-3xl font-bold text-gray-900">{stats.withDecisionMakers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">With Profiles</p>
                <p className="text-3xl font-bold text-gray-900">{stats.withProfiles}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search requirements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Industry Filter */}
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Industries</option>
              {industries.filter(i => i !== 'all').map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="industry">Industry A-Z</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedRequirements.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{selectedRequirements.length} selected</span>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Requirements List/Grid */}
        {filteredRequirements.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No requirements found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterIndustry !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Get started by creating your first business requirement'}
            </p>
            {!searchQuery && filterIndustry === 'all' && filterStatus === 'all' && (
              <button
                onClick={() => navigate('/business-requirement')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                Create Your First Requirement
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequirements.map((req) => {
              const status = getStatusBadge(req)
              return (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {req.operation_name || 'Untitled Requirement'}
                        </h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedRequirements.includes(req.id)}
                        onChange={() => handleSelectRequirement(req.id)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {truncateText(req.requirement_text, 120)}
                    </p>

                    {/* Meta Info */}
                    <div className="space-y-2 mb-4">
                      {req.industry && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {req.industry}
                        </div>
                      )}
                      {req.target_location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {req.target_location}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {req.decisionMakersCount} Decision Makers
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {req.profilesCount} Profiles
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{formatDate(req.created_at)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/requirements/${req.id}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View Journey
                        </button>
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRequirements.length === filteredRequirements.length && filteredRequirements.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Requirement</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Industry</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Decision Makers</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Profiles</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequirements.map((req) => {
                  const status = getStatusBadge(req)
                  return (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRequirements.includes(req.id)}
                          onChange={() => handleSelectRequirement(req.id)}
                          className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{req.operation_name || 'Untitled'}</div>
                          <div className="text-sm text-gray-500 mt-1">{truncateText(req.requirement_text, 80)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{req.industry || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{req.target_location || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{req.decisionMakersCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{req.profilesCount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(req.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/requirements/${req.id}`)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View Journey
                          </button>
                          <button
                            onClick={() => handleDelete(req.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Results Count */}
        {filteredRequirements.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredRequirements.length} of {requirements.length} requirements
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Requirements

