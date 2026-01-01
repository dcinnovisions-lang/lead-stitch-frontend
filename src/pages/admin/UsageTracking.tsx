import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../config/api'
import type { AxiosError } from 'axios'

type TimeRange = '1h' | '1d' | '7d' | '28d' | '90d'
type ActiveTab = 'summary' | 'detailed' | 'billing'

interface FreeTierStatus {
  dailyUsage?: number
  dailyLimit?: number
  dailyRemaining?: number
  dailyLimitExceeded?: boolean
  monthlyUsage?: number
  monthlyLimit?: number
  monthlyRemaining?: number
  monthlyLimitExceeded?: boolean
}

interface UsageSummary {
  totalRequests?: number
  freeTierStatus?: FreeTierStatus
}

interface UsageData {
  timeRange?: string
  cloudUsage?: {
    totalRequests?: number
    dailyUsage?: Record<string, number>
    hourlyUsage?: Record<string, number>
  }
  localUsage?: {
    totalRequests?: number
    requestsByDate?: Record<string, {
      count?: number
      models?: Record<string, number>
      hourlyCounts?: Record<string, number>
    }>
    recentCalls?: Array<{
      timestamp?: string
      model?: string
      tokens?: {
        promptTokens?: number
        completionTokens?: number
        totalTokens?: number
      }
    }>
  }
  freeTierStatus?: FreeTierStatus
  freeTierInfo?: {
    dailyLimit?: number
    monthlyLimit?: number
  }
  recommendation?: string
}

interface BillingData {
  hasBilling?: boolean
  message?: string
  billingAccountName?: string | null
  note?: string
}

interface UsageResponse {
  success?: boolean
  data?: UsageData
  timestamp?: string
}

interface SummaryResponse {
  success?: boolean
  data?: {
    summary?: UsageSummary
  }
  timestamp?: string
}

interface BillingResponse {
  success?: boolean
  data?: BillingData
  timestamp?: string
  note?: string
}

function UsageTracking() {
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [billing, setBilling] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('28d')
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const fetchUsageData = async (showLoader = false) => {
    try {
      if (showLoader) {
        setRefreshing(true)
      } else if (!usageData && !summary) {
        setLoading(true)
      }

      const [summaryRes, usageRes, billingRes] = await Promise.all([
        api.get<SummaryResponse>('/gemini-usage/summary'),
        api.get<UsageResponse>(`/gemini-usage?timeRange=${timeRange}`),
        api.get<BillingResponse>('/gemini-usage/billing').catch(() => ({ 
          data: { success: false, error: 'Billing info not available' } as BillingResponse
        }))
      ])
      
      setSummary(summaryRes.data.data?.summary || null)
      setUsageData(usageRes.data.data || null)
      setBilling(billingRes.data.data || null)
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>
      console.error('Error fetching usage data:', axiosError)
      if (axiosError.response?.status === 403) {
        alert('Admin access required')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUsageData()
  }, [timeRange])

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return 'N/A'
    return new Intl.NumberFormat().format(num)
  }

  const getUsagePercentage = (used: number | undefined, limit: number | undefined): number => {
    if (!limit || limit === 0) return 0
    if (!used) return 0
    return Math.min(100, (used / limit) * 100)
  }

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  const freeTierStatus = summary?.freeTierStatus || usageData?.freeTierStatus
  const dailyPercentage = getUsagePercentage(freeTierStatus?.dailyUsage, freeTierStatus?.dailyLimit)
  const monthlyPercentage = getUsagePercentage(freeTierStatus?.monthlyUsage, freeTierStatus?.monthlyLimit)

  // Get available dates for filtering
  const availableDates: string[] = []
  if (usageData?.localUsage?.requestsByDate) {
    availableDates.push(...Object.keys(usageData.localUsage.requestsByDate).sort().reverse())
  } else if (usageData?.cloudUsage?.dailyUsage) {
    availableDates.push(...Object.keys(usageData.cloudUsage.dailyUsage).sort().reverse())
  }

  // Filter data by selected date
  const filteredData = selectedDate && usageData?.localUsage?.requestsByDate?.[selectedDate]
    ? usageData.localUsage.requestsByDate[selectedDate]
    : null

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gemini API Usage Tracking</h1>
          <p className="text-gray-600 mt-2">Monitor API usage, free tier status, and billing information</p>
        </div>

        {/* Time Range Selector & Refresh */}
        <div className="bg-white p-4 rounded-xl shadow border border-gray-200 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1h">Last 1 hour</option>
              <option value="1d">Last 1 day</option>
              <option value="7d">Last 7 days</option>
              <option value="28d">Last 28 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <button
            onClick={() => fetchUsageData(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {refreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>

        {/* Refresh Overlay */}
        {refreshing && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-900 font-medium">Refreshing data...</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'summary'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('detailed')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'detailed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Detailed Usage
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'billing'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Billing
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {/* Usage Source Info */}
                {usageData?.recommendation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">{usageData.recommendation}</p>
                  </div>
                )}

                {/* Daily Usage Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Usage</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Used / Total</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatNumber(freeTierStatus?.dailyUsage)} / {formatNumber(freeTierStatus?.dailyLimit)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${getUsageColor(dailyPercentage)}`}
                          style={{ width: `${Math.min(100, dailyPercentage)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">
                          Remaining: {formatNumber(freeTierStatus?.dailyRemaining)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          freeTierStatus?.dailyLimitExceeded
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {freeTierStatus?.dailyLimitExceeded ? 'Exceeded' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly Usage Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Usage</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Used / Total</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatNumber(freeTierStatus?.monthlyUsage)} / {formatNumber(freeTierStatus?.monthlyLimit)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${getUsageColor(monthlyPercentage)}`}
                          style={{ width: `${Math.min(100, monthlyPercentage)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">
                          Remaining: {formatNumber(freeTierStatus?.monthlyRemaining)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          freeTierStatus?.monthlyLimitExceeded
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {freeTierStatus?.monthlyLimitExceeded ? 'Exceeded' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning Messages */}
                {(freeTierStatus?.dailyLimitExceeded || freeTierStatus?.monthlyLimitExceeded) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ Free tier limits have been exceeded. Consider upgrading your plan.
                    </p>
                  </div>
                )}

                {/* Total Requests Card */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-8 text-white">
                  <h3 className="text-lg font-medium mb-2">Total Requests</h3>
                  <p className="text-5xl font-bold mb-2">
                    {formatNumber(summary?.totalRequests || usageData?.localUsage?.totalRequests || usageData?.cloudUsage?.totalRequests)}
                  </p>
                  <p className="text-sm text-blue-100">
                    {usageData?.cloudUsage ? 'Data from Google Cloud Monitoring' : 'Data from local tracking'}
                  </p>
                  <p className="text-xs text-blue-200 mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            )}

            {/* Detailed Usage Tab */}
            {activeTab === 'detailed' && (
              <div className="space-y-6">
                {/* Date Filter */}
                {availableDates.length > 0 && (
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
                    <select
                      value={selectedDate || ''}
                      onChange={(e) => setSelectedDate(e.target.value || null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Dates</option>
                      {availableDates.map((date) => (
                        <option key={date} value={date}>
                          {formatDate(date)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Usage Breakdown */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {selectedDate ? 'Hourly Breakdown' : timeRange === '1h' || timeRange === '1d' ? 'Hourly Breakdown' : 'Daily Breakdown'}
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredData && selectedDate ? (
                      // Show hourly breakdown for selected date
                      Object.entries(filteredData.hourlyCounts || {}).map(([hour, count]) => (
                        <div key={hour} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{formatDateTime(hour)}</span>
                          <span className="text-sm font-semibold text-gray-900">{formatNumber(count as number)} requests</span>
                        </div>
                      ))
                    ) : usageData?.localUsage?.requestsByDate ? (
                      // Show daily breakdown
                      Object.entries(usageData.localUsage.requestsByDate)
                        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                        .map(([date, data]) => (
                          <div key={date} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{formatDate(date)}</span>
                            <span className="text-sm font-semibold text-gray-900">{formatNumber(data.count)} requests</span>
                          </div>
                        ))
                    ) : usageData?.cloudUsage?.dailyUsage ? (
                      // Show cloud usage daily breakdown
                      Object.entries(usageData.cloudUsage.dailyUsage)
                        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                        .map(([date, count]) => (
                          <div key={date} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{formatDate(date)}</span>
                            <span className="text-sm font-semibold text-gray-900">{formatNumber(count)} requests</span>
                          </div>
                        ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No usage data available</p>
                    )}
                  </div>
                </div>

                {/* Recent API Calls */}
                {usageData?.localUsage?.recentCalls && usageData.localUsage.recentCalls.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recent API Calls</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {usageData.localUsage.recentCalls.slice(0, 20).map((call, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {call.timestamp ? formatDateTime(call.timestamp) : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {call.model || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {call.tokens?.totalTokens 
                                  ? formatNumber(call.tokens.totalTokens)
                                  : call.tokens?.promptTokens && call.tokens?.completionTokens
                                  ? `${formatNumber(call.tokens.promptTokens)} + ${formatNumber(call.tokens.completionTokens)}`
                                  : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                {/* Billing Information */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Billing Information</h3>
                  <div className="space-y-4">
                    {billing?.hasBilling ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Billing Account:</p>
                        <p className="text-lg font-semibold text-gray-900">{billing.billingAccountName || 'N/A'}</p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">{billing?.message || 'No billing account linked. You are using the free tier.'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Free Tier Limits */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Free Tier Limits</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Daily Limit</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatNumber(usageData?.freeTierInfo?.dailyLimit || 1500)} requests/day
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Monthly Limit</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatNumber(usageData?.freeTierInfo?.monthlyLimit || 50000)} requests/month
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Rate Limit</span>
                      <span className="text-lg font-semibold text-gray-900">15 requests/minute</span>
                    </div>
                  </div>
                </div>

                {/* External Link */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-2">
                    For detailed billing information, visit:
                  </p>
                  <a
                    href="https://aistudio.google.com/u/0/usage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Google AI Studio Usage Page
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default UsageTracking

