import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import type { ModalConfig } from '../utils/modal'
import { getCampaignById, getCampaignRecipients, sendCampaign, deleteCampaign, clearCurrentCampaign, clearError } from '../store/slices/campaignsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'
import { useSocket, CampaignProgress, CampaignStats, RecipientUpdate } from '../hooks/useSocket'
import { useCampaignPolling } from '../hooks/useCampaignPolling'

type RecipientFilter = 'all' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed'

function CampaignDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    // Redux state
    const { currentCampaign, recipients, loading, sending, error } = useAppSelector((state: RootState) => state.campaigns)

    // Socket.io for real-time updates
    const {
        isConnected,
        connectionError,
        joinCampaignRoom,
        leaveCampaignRoom,
        onCampaignProgress,
        onCampaignStats,
        onRecipientUpdate,
        onCampaignStatusChange
    } = useSocket()

    // Local UI state
    const [filter, setFilter] = useState<RecipientFilter>('all')
    const [deleting, setDeleting] = useState<boolean>(false)
    const [liveProgress, setLiveProgress] = useState<CampaignProgress | null>(null)
    const [liveStats, setLiveStats] = useState<CampaignStats | null>(null)
    const [modal, setModal] = useState<ModalConfig | null>(null)

    // Fetch campaign data on mount
    useEffect(() => {
        if (id) {
            // Campaign IDs are UUIDs (strings), not numbers
            // Pass the ID directly as a string to the backend
            console.log('📋 Fetching campaign:', id)
            dispatch(getCampaignById(id))
            dispatch(getCampaignRecipients(id))
        }

        // Cleanup on unmount
        return () => {
            dispatch(clearCurrentCampaign())
        }
    }, [id, dispatch])

    // Join campaign room for real-time updates
    useEffect(() => {
        if (id && isConnected) {
            console.log(`🔌 Joining campaign room for real-time updates: ${id}`)
            joinCampaignRoom(id)

            return () => {
                console.log(`🔌 Leaving campaign room: ${id}`)
                leaveCampaignRoom(id)
            }
        } else if (id && !isConnected) {
            console.warn(`⚠️ Socket not connected, cannot join campaign room: ${id}`)
        }
    }, [id, isConnected, joinCampaignRoom, leaveCampaignRoom])

    // Use polling as fallback if WebSocket is not connected
    useCampaignPolling(id, !isConnected, 2000)

    // Listen to real-time campaign progress
    useEffect(() => {
        if (!id || !isConnected) {
            console.log('⚠️ Skipping socket listener setup - id or connection missing', { id, isConnected })
            return
        }

        console.log('🔌 Setting up socket event listeners for campaign:', id)

        const unsubscribeProgress = onCampaignProgress((data: CampaignProgress) => {
            console.log('📊 Campaign progress update:', data)
            setLiveProgress(data)

            // Update campaign status if changed
            if (data.status && currentCampaign) {
                dispatch(getCampaignById(id))
            }
        })

        const unsubscribeStats = onCampaignStats((stats: CampaignStats) => {
            console.log('📈 Campaign stats update received:', stats)
            // Always update liveStats - this is the source of truth from backend
            setLiveStats(stats)
            // Refresh recipients to get latest data (but stats come from liveStats, not recipients)
            dispatch(getCampaignRecipients(id)).then(() => {
                console.log('✅ Recipients refreshed after stats update')
            }).catch((err) => {
                console.error('❌ Error refreshing recipients after stats update:', err)
            })
        })

        const unsubscribeRecipient = onRecipientUpdate((update: RecipientUpdate) => {
            console.log('👤 Recipient update received:', update)
            // Immediately refresh recipients list to get latest status
            // This ensures UI updates even if socket events are delayed
            dispatch(getCampaignRecipients(id)).then(() => {
                console.log('✅ Recipients refreshed after update')
            }).catch((err) => {
                console.error('❌ Error refreshing recipients after update:', err)
            })
        })

        const unsubscribeStatus = onCampaignStatusChange((data) => {
            console.log('🔄 Campaign status change:', data)
            // Refresh campaign data
            dispatch(getCampaignById(id))
        })

        return () => {
            console.log('🧹 Cleaning up socket event listeners')
            unsubscribeProgress?.()
            unsubscribeStats?.()
            unsubscribeRecipient?.()
            unsubscribeStatus?.()
        }
    }, [id, isConnected, onCampaignProgress, onCampaignStats, onRecipientUpdate, onCampaignStatusChange, dispatch, currentCampaign])

    // Clear error when component unmounts or error changes
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                dispatch(clearError())
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [error, dispatch])

    const handleSendCampaign = async () => {
        setModal({
            title: 'Confirm Send Campaign',
            message: 'Are you sure you want to send this campaign? This will send emails to all recipients.',
            type: 'warning',
            showCancel: true,
            confirmText: 'Send',
            cancelText: 'Cancel',
            onConfirm: async () => {
                await performSendCampaign()
            },
        })
    }

    const performSendCampaign = async () => {

        try {
            console.log('📧 ========== SEND CAMPAIGN CLICKED ==========')
            console.log('📧 Campaign ID:', id)

            if (!id) return

            // Reset live progress
            setLiveProgress(null)
            setLiveStats(null)

            // Campaign IDs are UUIDs (strings), pass directly
            const result = await dispatch(sendCampaign(id))

            if (sendCampaign.fulfilled.match(result)) {
                console.log('✅ Campaign send response received:', result.payload)

                // Show success message but don't alert - real-time updates will show progress
                // Refresh campaign data to get updated status
                await dispatch(getCampaignById(id))
                await dispatch(getCampaignRecipients(id))

                // Campaign is now being sent, real-time updates will handle the rest
            } else {
                const errorMessage = result.payload || 'Unknown error occurred'
                setModal({
                    title: 'Error',
                    message: `Failed to send campaign: ${errorMessage}\n\nCheck the browser console and backend logs for more details.`,
                    type: 'error',
                })
            }
        } catch (error: any) {
            console.error('❌ ========== SEND CAMPAIGN ERROR ==========')
            console.error('❌ Error:', error)
            setModal({
                title: 'Error',
                message: `Failed to send campaign: ${error.message || 'Unknown error occurred'}`,
                type: 'error',
            })
        }
    }

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-gray-100 text-gray-700 border-gray-200',
            sent: 'bg-blue-100 text-blue-700 border-blue-200',
            delivered: 'bg-green-100 text-green-700 border-green-200',
            opened: 'bg-purple-100 text-purple-700 border-purple-200',
            clicked: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            replied: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            bounced: 'bg-red-100 text-red-700 border-red-200',
            failed: 'bg-red-100 text-red-700 border-red-200',
            unsubscribed: 'bg-orange-100 text-orange-700 border-orange-200',
        }
        return colors[status] || colors.pending
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sent':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                )
            case 'delivered':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                )
            case 'opened':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                )
            case 'clicked':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                )
            case 'replied':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                )
            case 'bounced':
            case 'failed':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )
            default:
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const filteredRecipients = recipients.filter(recipient => {
        if (filter === 'all') return true
        return recipient.status === filter
    })

    // Calculate stats from recipients array (fallback only)
    const calculateStats = () => {
        if (recipients.length === 0) {
            return {
                total: 0,
                sent: 0,
                delivered: 0,
                opened: 0,
                clicked: 0,
                replied: 0,
                bounced: 0,
                failed: 0
            }
        }

        return {
            total: recipients.length,
            sent: recipients.filter(r =>
                r.status === 'sent' || r.sent_at ||
                r.status === 'delivered' || r.delivered_at ||
                r.status === 'opened' || r.opened_at ||
                r.status === 'clicked' || r.clicked_at ||
                r.status === 'replied' || r.replied_at
            ).length,
            delivered: recipients.filter(r =>
                (r.status === 'delivered' || r.delivered_at) &&
                r.status !== 'bounced' && !r.bounced_at &&
                r.status !== 'failed' && !r.error_message
            ).length,
            opened: recipients.filter(r =>
                r.status === 'opened' || r.opened_at ||
                r.status === 'clicked' || r.clicked_at ||
                r.status === 'replied' || r.replied_at
            ).length,
            clicked: recipients.filter(r =>
                r.status === 'clicked' || r.clicked_at ||
                r.status === 'replied' || r.replied_at
            ).length,
            replied: recipients.filter(r => r.status === 'replied' || r.replied_at).length,
            bounced: recipients.filter(r =>
                r.status === 'bounced' || (r.bounced_at && r.status !== 'delivered')
            ).length,
            failed: recipients.filter(r =>
                r.status === 'failed' && !r.sent_at && !r.delivered_at && r.error_message
            ).length,
        }
    }

    // ALWAYS prioritize liveStats when available (from real-time updates via socket)
    // liveStats comes directly from backend and is the source of truth
    // Only fall back to calculating from recipients if liveStats is null/undefined
    const stats = liveStats ?? calculateStats()

    // Ensure stats object always has all required fields with defaults
    const finalStats = {
        total: stats?.total ?? 0,
        sent: stats?.sent ?? 0,
        delivered: stats?.delivered ?? 0,
        opened: stats?.opened ?? 0,
        clicked: stats?.clicked ?? 0,
        replied: stats?.replied ?? 0,
        bounced: stats?.bounced ?? 0,
        failed: stats?.failed ?? 0,
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        )
    }

    if (!currentCampaign && !loading) {
        return (
            <Layout>
                <div className="text-center py-20 max-w-2xl mx-auto px-4">
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                        <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Campaign</h2>
                        <p className="text-red-700 mb-2">{error || 'Campaign not found or failed to load'}</p>
                        {id && (
                            <p className="text-sm text-red-600">Campaign ID: {id}</p>
                        )}
                        {error && error.includes('500') && (
                            <p className="text-sm text-red-600 mt-2">
                                The server encountered an error. Please check the backend logs or try again later.
                            </p>
                        )}
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                dispatch(clearError())
                                navigate('/campaigns')
                            }}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Back to Campaigns
                        </button>
                        <button
                            onClick={() => {
                                dispatch(clearError())
                                if (id) {
                                    const campaignId = parseInt(id, 10)
                                    if (!isNaN(campaignId)) {
                                        dispatch(getCampaignById(campaignId))
                                        dispatch(getCampaignRecipients(campaignId))
                                    }
                                }
                            }}
                            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </Layout>
        )
    }

    const campaign = currentCampaign

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/campaigns')}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Campaigns
                    </button>

                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
                            {campaign.description && (
                                <p className="text-gray-600 mb-4">{campaign.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Subject: <span className="font-semibold text-gray-900">{campaign.subject}</span></span>
                                <span>Status: <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(campaign.status)}`}>
                                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                </span></span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {campaign?.status === 'draft' && (
                                <button
                                    onClick={handleSendCampaign}
                                    disabled={sending}
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    {sending ? 'Sending...' : 'Send Campaign'}
                                </button>
                            )}
                            <button
                                onClick={() => navigate(`/campaigns/${id}/edit`)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Edit Campaign
                            </button>
                            <button
                                onClick={() => {
                                    if (deleting) return
                                    setModal({
                                        title: 'Confirm Delete',
                                        message: 'Delete this campaign? This action cannot be undone.',
                                        type: 'warning',
                                        showCancel: true,
                                        confirmText: 'Delete',
                                        cancelText: 'Cancel',
                                        onConfirm: async () => {
                                            try {
                                                setDeleting(true)
                                                if (!id) return
                                                // Campaign IDs are UUIDs (strings), pass directly
                                                const result = await dispatch(deleteCampaign(id))
                                                if (deleteCampaign.fulfilled.match(result)) {
                                                    setModal({
                                                        title: 'Success',
                                                        message: 'Campaign deleted.',
                                                        type: 'success',
                                                        onConfirm: () => {
                                                            navigate('/campaigns', {
                                                                state: { toast: 'Campaign deleted.', highlightId: null },
                                                            })
                                                        },
                                                    })
                                                } else {
                                                    setModal({
                                                        title: 'Error',
                                                        message: result.payload || 'Failed to delete campaign.',
                                                        type: 'error',
                                                    })
                                                }
                                            } catch (error: any) {
                                                setModal({
                                                    title: 'Error',
                                                    message: error.message || 'Failed to delete campaign.',
                                                    type: 'error',
                                                })
                                            } finally {
                                                setDeleting(false)
                                            }
                                        },
                                    })
                                }}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>

                    {/* Connection Status Indicator */}
                    <div className={`mb-4 p-3 rounded-xl border-2 flex items-center justify-between ${isConnected
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                        }`}>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                            <span className="text-sm font-medium">
                                {isConnected
                                    ? '🟢 Live updates active'
                                    : '🟡 Using polling (reconnecting...)'}
                            </span>
                        </div>
                        {connectionError && (
                            <span className="text-xs text-yellow-700">{connectionError}</span>
                        )}
                    </div>

                    {/* Live Progress Bar */}
                    {liveProgress && (liveProgress.status === 'sending' || liveProgress.status === 'completed') && (
                        <div className="mb-6 bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {liveProgress.status === 'sending' ? 'Sending Campaign...' : 'Campaign Completed'}
                                </h3>
                                <span className="text-sm font-medium text-gray-600">
                                    {liveProgress.sent} / {liveProgress.total} sent
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                                <div
                                    className={`h-4 rounded-full transition-all duration-300 ${liveProgress.status === 'completed'
                                        ? 'bg-green-600'
                                        : 'bg-blue-600'
                                        }`}
                                    style={{ width: `${liveProgress.progress}%` }}
                                />
                            </div>
                            <div className="flex gap-4 text-sm">
                                <span className="text-green-600 font-medium">
                                    ✅ Sent: {liveProgress.sent}
                                </span>
                                {liveProgress.failed > 0 && (
                                    <span className="text-red-600 font-medium">
                                        ❌ Failed: {liveProgress.failed}
                                    </span>
                                )}
                                {liveProgress.status === 'sending' && (
                                    <span className="text-blue-600 font-medium">
                                        {liveProgress.progress}% Complete
                                    </span>
                                )}
                            </div>
                            {liveProgress.error && (
                                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                    Error: {liveProgress.error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error Message */}
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

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
                        {[
                            { label: 'Total', value: finalStats.total, key: 'all' },
                            { label: 'Sent', value: finalStats.sent, key: 'sent', color: 'text-blue-600' },
                            { label: 'Delivered', value: finalStats.delivered, key: 'delivered', color: 'text-green-600' },
                            { label: 'Opened', value: finalStats.opened, key: 'opened', color: 'text-purple-600' },
                            { label: 'Clicked', value: finalStats.clicked, key: 'clicked', color: 'text-indigo-600' },
                            { label: 'Replied', value: finalStats.replied, key: 'replied', color: 'text-emerald-600' },
                            { label: 'Bounced', value: finalStats.bounced, key: 'bounced', color: 'text-red-600' },
                            { label: 'Failed', value: finalStats.failed, key: 'failed', color: 'text-red-600' },
                        ].map((stat) => (
                            <button
                                key={stat.key}
                                onClick={() => setFilter(stat.key as RecipientFilter)}
                                className={`p-4 rounded-xl border-2 transition-all ${filter === stat.key
                                    ? 'bg-blue-50 border-blue-500 shadow-md'
                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                                    }`}
                            >
                                <p className={`text-2xl font-bold mb-1 ${stat.color || 'text-gray-900'}`}>{stat.value}</p>
                                <p className={`text-sm font-medium ${filter === stat.key ? 'text-blue-700' : 'text-gray-600'}`}>
                                    {stat.label}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recipients Table */}
                <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Recipients ({filteredRecipients.length})</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sent At</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Delivered At</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Opened At</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Clicked At</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Replied At</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Error</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRecipients.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                            No recipients found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecipients.map((recipient) => (
                                        <tr key={recipient.id} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{recipient.name || 'Unknown'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{recipient.email || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(recipient.status || 'pending')}`}>
                                                    {getStatusIcon(recipient.status || 'pending')}
                                                    {(recipient.status || 'pending').charAt(0).toUpperCase() + (recipient.status || 'pending').slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{formatDate(recipient.sent_at)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{formatDate(recipient.delivered_at)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{formatDate(recipient.opened_at)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{formatDate(recipient.clicked_at)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{formatDate(recipient.replied_at)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-red-600 max-w-xs truncate" title={recipient.error_message}>
                                                    {recipient.error_message || '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
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

export default CampaignDetail

