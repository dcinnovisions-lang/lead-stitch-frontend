import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCampaigns, deleteCampaign, clearError } from '../store/slices/campaignsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'

type CampaignFilter = 'all' | 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused'
type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'cancelled' | 'sent'

interface LocationState {
  toast?: string
  highlightId?: number
}

interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
}

function Campaigns() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  
  // Redux state
  const { campaigns, loading, error } = useAppSelector((state: RootState) => state.campaigns)
  
  // Local UI state
  const [filter, setFilter] = useState<CampaignFilter>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [highlightId, setHighlightId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    console.log('🔄 Campaigns component - filter changed or mounted:', filter)
    dispatch(getCampaigns())
  }, [filter, dispatch])

  useEffect(() => {
    const locationState = location.state as LocationState | null
    if (locationState?.toast) {
      setToast({ message: locationState.toast, type: 'success' })
      setHighlightId(locationState.highlightId || null)
      navigate(location.pathname, { replace: true })
    }
  }, [location, navigate])

  // Clear error when component unmounts or error changes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  const getStatusColor = (status: CampaignStatus): string => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
      sending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      paused: 'bg-orange-100 text-orange-700 border-orange-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[status] || colors.draft
  }

  const getStatusIcon = (status: CampaignStatus): React.ReactNode | null => {
    switch (status) {
      case 'draft':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      case 'scheduled':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'sending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesFilter = filter === 'all' || campaign.status === filter
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (campaign.description && campaign.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const openCampaign = (campaignId: string | number, focus?: string) => {
    navigate(`/campaigns/${campaignId}`, { state: { focus } })
  }

  const canSend = (status) => ['draft', 'scheduled'].includes(status)

  const handleSendRedirect = (campaignId) => {
    openCampaign(campaignId, 'send')
  }

  const handleDeleteCampaign = async (campaign) => {
    if (deletingId) return
    if (!window.confirm(`Delete "${campaign.name}"? This action cannot be undone.`)) return

    try {
      setDeletingId(campaign.id)
      const result = await dispatch(deleteCampaign(campaign.id))
      if (deleteCampaign.fulfilled.match(result)) {
        setToast({ message: 'Campaign deleted successfully.', type: 'success' })
      } else {
        const errorMessage = result.payload || 'Failed to delete campaign'
        alert(errorMessage)
      }
    } catch (error) {
      alert(error.message || 'Failed to delete campaign')
    } finally {
      setDeletingId(null)
    }
  }


  const stats = {
    all: campaigns.length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    sending: campaigns.filter(c => c.status === 'sending').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Email Campaigns</h1>
              <p className="text-lg text-gray-600">Create and manage your email outreach campaigns</p>
            </div>
            <button
              onClick={() => navigate('/campaigns/new')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Campaign
            </button>
          </div>

          {toast && (
            <div className={`mb-4 border rounded-2xl px-6 py-4 flex items-center justify-between ${
              toast.type === 'error' 
                ? 'bg-red-50 border-red-200 text-red-800'
                : toast.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              <span className="font-medium">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className={`${
                  toast.type === 'error'
                    ? 'text-red-600 hover:text-red-900'
                    : toast.type === 'info'
                    ? 'text-blue-600 hover:text-blue-900'
                    : 'text-green-600 hover:text-green-900'
                }`}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl px-6 py-4 flex items-center justify-between">
              <span className="font-medium">{error}</span>
              <button
                onClick={() => dispatch(clearError())}
                className="text-red-600 hover:text-red-900"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          <div className="mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl text-white p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="uppercase text-sm tracking-wider text-blue-100 font-semibold">How sending works</p>
                <h2 className="text-2xl font-bold mt-2">Save drafts, review, then send from this dashboard</h2>
                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Campaigns are always saved as drafts on creation. Confirm content, recipients, and SMTP settings, then click “Send Campaign”
                  from this page when you’re ready.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3 backdrop-blur text-sm font-semibold">
                <span>1. Save Draft</span>
                <span className="opacity-70">→</span>
                <span>2. Review & Send</span>
                <span className="opacity-70">→</span>
                <span>3. Track Results</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {[
              { label: 'All', value: stats.all, key: 'all' },
              { label: 'Draft', value: stats.draft, key: 'draft' },
              { label: 'Scheduled', value: stats.scheduled, key: 'scheduled' },
              { label: 'Sending', value: stats.sending, key: 'sending' },
              { label: 'Completed', value: stats.completed, key: 'completed' },
              { label: 'Paused', value: stats.paused, key: 'paused' },
            ].map((stat) => (
              <button
                key={stat.key}
                onClick={() => setFilter(stat.key as CampaignFilter)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  filter === stat.key
                    ? 'bg-blue-50 border-blue-500 shadow-md'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className={`text-sm font-medium ${filter === stat.key ? 'text-blue-700' : 'text-gray-600'}`}>
                  {stat.label}
                </p>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Campaigns List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No campaigns found' : 'No campaigns yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filter'
                : 'Create your first email campaign to start reaching out to leads'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/campaigns/new')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Campaign
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className={`bg-white rounded-2xl border-2 transition-all p-6 ${
                  highlightId === campaign.id
                    ? 'border-blue-500 shadow-xl shadow-blue-100'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900 truncate">{campaign.name}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor((campaign.status || 'draft') as CampaignStatus)}`}>
                        {getStatusIcon((campaign.status || 'draft') as CampaignStatus)}
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Subject:{' '}
                        <span className="font-semibold text-gray-900">{campaign.subject || 'N/A'}</span>
                      </span>
                    </div>
                    {campaign.description && (
                      <p className="text-gray-600 mb-4 line-clamp-2">{campaign.description}</p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Recipients</p>
                        <p className="text-lg font-semibold text-gray-900">{campaign.total_recipients || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Sent</p>
                        <p className="text-lg font-semibold text-blue-600">{campaign.sent_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Opened</p>
                        <p className="text-lg font-semibold text-green-600">{campaign.opened_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Clicked</p>
                        <p className="text-lg font-semibold text-purple-600">{campaign.clicked_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Replied</p>
                        <p className="text-lg font-semibold text-emerald-600">{campaign.replied_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Bounced</p>
                        <p className="text-lg font-semibold text-red-600">{campaign.bounced_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Unsubscribed</p>
                        <p className="text-lg font-semibold text-orange-600">{campaign.unsubscribed_count || 0}</p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>Created: {formatDate(campaign.created_at)}</span>
                      {campaign.scheduled_at && (
                        <span>Scheduled: {formatDateTime(campaign.scheduled_at)}</span>
                      )}
                      {campaign.started_at && (
                        <span>Started: {formatDateTime(campaign.started_at)}</span>
                      )}
                      {campaign.completed_at && (
                        <span>Completed: {formatDateTime(campaign.completed_at)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                  {canSend(campaign.status) && (
                    <button
                      onClick={() => handleSendRedirect(campaign.id)}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg hover:shadow-xl transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Campaign
                    </button>
                  )}
                  <button
                    onClick={() => openCampaign(campaign.id)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 transition"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 transition"
                  >
                    Edit Draft
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(campaign)}
                    disabled={deletingId === campaign.id}
                    className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-60"
                  >
                    {deletingId === campaign.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Campaigns


