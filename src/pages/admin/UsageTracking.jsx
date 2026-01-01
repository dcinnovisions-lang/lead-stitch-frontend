import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../config/api'

function UsageTracking() {
  const [usageData, setUsageData] = useState(null)
  const [summary, setSummary] = useState(null)
  const [billing, setBilling] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false) // Separate state for manual refresh
  const [timeRange, setTimeRange] = useState('28d')
  const [activeTab, setActiveTab] = useState('summary')
  const [selectedDate, setSelectedDate] = useState(null) // For date-specific detailed view

  useEffect(() => {
    fetchUsageData(false) // false = auto-refresh, no loader
    // Auto-refresh interval removed - data will only load on mount or when timeRange changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  const fetchUsageData = async (showLoader = false) => {
    try {
      if (showLoader) {
        setRefreshing(true)
      } else if (!usageData && !summary) {
        setLoading(true)
      }

      const [summaryRes, usageRes, billingRes] = await Promise.all([
        api.get('/gemini-usage/summary'),
        api.get(`/gemini-usage?timeRange=${timeRange}`),
        api.get('/gemini-usage/billing').catch(() => ({ data: { success: false, error: 'Billing info not available' } }))
      ])
      setSummary(summaryRes.data)
      setUsageData(usageRes.data)
      setBilling(billingRes.data)
    } catch (error) {
      console.error('Error fetching usage data:', error)
      if (error.response?.status === 403) {
        alert('Admin access required')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatNumber = (num) => {
    if (!num && num !== 0) return 'N/A'
    return new Intl.NumberFormat().format(num)
  }

  const getUsagePercentage = (used, limit) => {
    if (!limit || limit === 0) return 0
    return Math.min(100, (used / limit) * 100)
  }

  if (loading && !usageData && !summary) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading usage data...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const freeTierStatus = usageData?.data?.freeTierStatus || summary?.data?.summary?.freeTierStatus || {}

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gemini API Usage Tracking</h1>
          <p className="text-gray-600 mt-2">Monitor API usage, free tier status, and billing information</p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1h">Last 1 hour</option>
            <option value="1d">Last 1 day</option>
            <option value="7d">Last 7 days</option>
            <option value="28d">Last 28 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={() => fetchUsageData(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {refreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('detailed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'detailed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Detailed Usage
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'billing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Billing
            </button>
          </nav>
        </div>

        {/* Loading Overlay - Only show on manual refresh */}
        {refreshing && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="text-gray-700 font-medium">Refreshing usage data...</p>
            </div>
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Show message if no data */}
            {!summary && !usageData && !loading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 text-yellow-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Usage Data Available</h3>
                <p className="text-sm text-yellow-700 mb-4">
                  Usage data will appear here once Gemini API calls are made through your application.
                </p>
                <button
                  onClick={() => fetchUsageData(true)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            )}

            {/* Usage Source Info */}
            {(summary || usageData) && (
              <div className={`p-4 rounded-lg border ${usageData?.data?.cloudUsage
                ? 'bg-blue-50 border-blue-200'
                : 'bg-yellow-50 border-yellow-200'
                }`}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium">
                    {usageData?.data?.cloudUsage
                      ? '✓ Using Google Cloud Monitoring (Most Accurate)'
                      : '⚠ Using Local Tracking (Only tracks API calls from this application)'}
                  </p>
                </div>
                {usageData?.data?.recommendation && (
                  <p className="text-xs text-gray-600 mt-2">{usageData.data.recommendation}</p>
                )}
              </div>
            )}

            {/* Show data cards only if we have data */}
            {(summary || usageData) && (
              <>
                {/* Free Tier Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Daily Usage */}
                  <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Daily Usage</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${freeTierStatus.dailyLimitExceeded
                        ? 'bg-red-100 text-red-800'
                        : freeTierStatus.dailyUsage > freeTierStatus.dailyLimit * 0.8
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                        }`}>
                        {freeTierStatus.dailyLimitExceeded ? 'Exceeded' : 'Active'}
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Used</span>
                        <span>{formatNumber(freeTierStatus.dailyUsage)} / {formatNumber(freeTierStatus.dailyLimit || 1500)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${freeTierStatus.dailyLimitExceeded
                            ? 'bg-red-500'
                            : freeTierStatus.dailyUsage > (freeTierStatus.dailyLimit || 1500) * 0.8
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            }`}
                          style={{
                            width: `${getUsagePercentage(freeTierStatus.dailyUsage, freeTierStatus.dailyLimit || 1500)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Remaining: <span className="font-semibold">{formatNumber(freeTierStatus.dailyRemaining)} requests</span>
                    </p>
                  </div>

                  {/* Monthly Usage */}
                  <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Monthly Usage</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${freeTierStatus.monthlyLimitExceeded
                        ? 'bg-red-100 text-red-800'
                        : freeTierStatus.monthlyUsage > freeTierStatus.monthlyLimit * 0.8
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                        }`}>
                        {freeTierStatus.monthlyLimitExceeded ? 'Exceeded' : 'Active'}
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Used</span>
                        <span>{formatNumber(freeTierStatus.monthlyUsage)} / {formatNumber(freeTierStatus.monthlyLimit || 50000)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${freeTierStatus.monthlyLimitExceeded
                            ? 'bg-red-500'
                            : freeTierStatus.monthlyUsage > (freeTierStatus.monthlyLimit || 50000) * 0.8
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            }`}
                          style={{
                            width: `${getUsagePercentage(freeTierStatus.monthlyUsage, freeTierStatus.monthlyLimit || 50000)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Remaining: <span className="font-semibold">{formatNumber(freeTierStatus.monthlyRemaining)} requests</span>
                    </p>
                  </div>
                </div>

                {/* Warning Messages */}
                {(freeTierStatus.dailyLimitExceeded || freeTierStatus.monthlyLimitExceeded) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h4 className="font-semibold text-red-900">Free Tier Limits Exceeded</h4>
                        <p className="text-sm text-red-700 mt-1">
                          {freeTierStatus.dailyLimitExceeded && 'Daily limit exceeded. '}
                          {freeTierStatus.monthlyLimitExceeded && 'Monthly limit exceeded. '}
                          Billing may apply. Check billing information tab for details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Requests */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Requests</h3>
                  <div className="text-4xl font-bold text-blue-600">
                    {formatNumber(usageData?.data?.cloudUsage?.totalRequests || usageData?.data?.localUsage?.totalRequests || summary?.data?.summary?.totalRequests || 0)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Source: {usageData?.data?.cloudUsage ? 'Google Cloud Monitoring' : 'Local Tracking'}
                  </p>
                  <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    This is realtime update
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Detailed Usage Tab */}
        {activeTab === 'detailed' && (
          <div className="space-y-6">
            {/* Show message if no data */}
            {!usageData && !loading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 text-yellow-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-600 mb-2">No usage data available</p>
                <p className="text-sm text-gray-500">Usage data will appear here once API calls are made.</p>
              </div>
            )}

            {/* Date Filter for Detailed View */}
            {usageData && (
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
                  <select
                    value={selectedDate || ''}
                    onChange={(e) => setSelectedDate(e.target.value || null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Dates</option>
                    {(() => {
                      // Get all available dates from usage data
                      const dates = new Set()
                      if (usageData?.data?.cloudUsage?.dailyUsage) {
                        Object.keys(usageData.data.cloudUsage.dailyUsage).forEach(date => dates.add(date))
                      }
                      if (usageData?.data?.localUsage?.requestsByDate) {
                        Object.keys(usageData.data.localUsage.requestsByDate).forEach(date => dates.add(date))
                      }
                      return Array.from(dates).sort((a, b) => new Date(b) - new Date(a))
                    })().map(date => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </option>
                    ))}
                  </select>
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>
            )}

            {usageData && (
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedDate
                    ? `Usage for ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                    : timeRange === '1h' || timeRange === '1d'
                      ? 'Hourly Usage Breakdown'
                      : 'Daily Usage Breakdown'}
                </h3>

                {/* Show hourly data for 1h and 1d ranges if available */}
                {(timeRange === '1h' || timeRange === '1d') && usageData?.data?.cloudUsage?.hourlyUsage ? (
                  <div className="space-y-2">
                    {Object.entries(usageData?.data?.cloudUsage?.hourlyUsage || {})
                      .sort(([a], [b]) => new Date(b) - new Date(a))
                      .map(([hour, count]) => (
                        <div key={hour} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">{new Date(hour).toLocaleString()}</span>
                          <span className="text-sm font-semibold text-gray-900">{formatNumber(count)} requests</span>
                        </div>
                      ))}
                  </div>
                ) : usageData?.data?.cloudUsage?.dailyUsage ? (
                  <div className="space-y-2">
                    {Object.entries(usageData?.data?.cloudUsage?.dailyUsage || {})
                      .filter(([date]) => !selectedDate || date === selectedDate)
                      .sort(([a], [b]) => new Date(b) - new Date(a))
                      .map(([date, count]) => (
                        <div key={date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          <span className="text-sm font-semibold text-gray-900">{formatNumber(count)} requests</span>
                        </div>
                      ))}
                    {selectedDate && Object.entries(usageData?.data?.cloudUsage?.dailyUsage || {}).filter(([date]) => date === selectedDate).length === 0 && (
                      <p className="text-gray-500 text-center py-4">No data available for the selected date.</p>
                    )}
                  </div>
                ) : (timeRange === '1h' || timeRange === '1d') && usageData?.data?.localUsage?.hourlyUsage ? (
                  <div className="space-y-2">
                    {Object.entries(usageData?.data?.localUsage?.hourlyUsage || {})
                      .sort(([a], [b]) => new Date(b) - new Date(a))
                      .map(([hour, count]) => (
                        <div key={hour} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">{new Date(hour).toLocaleString()}</span>
                          <span className="text-sm font-semibold text-gray-900">{formatNumber(count)} requests</span>
                        </div>
                      ))}
                  </div>
                ) : usageData?.data?.localUsage?.requestsByDate ? (
                  <div className="space-y-2">
                    {Object.entries(usageData?.data?.localUsage?.requestsByDate || {})
                      .filter(([date]) => !selectedDate || date === selectedDate)
                      .sort(([a], [b]) => new Date(b) - new Date(a))
                      .map(([date, data]) => (
                        <div key={date} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span className="text-sm font-semibold text-gray-900">{formatNumber(data.count)} requests</span>
                          </div>
                          {data.models && Object.keys(data.models).length > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              Models: {Object.entries(data.models).map(([model, count]) => `${model} (${count})`).join(', ')}
                            </div>
                          )}
                          {/* Show hourly breakdown if date is selected and hourly data exists */}
                          {selectedDate && date === selectedDate && data.hourlyCounts && Object.keys(data.hourlyCounts).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Hourly Breakdown:</p>
                              <div className="space-y-1">
                                {Object.entries(data.hourlyCounts)
                                  .sort(([a], [b]) => new Date(b) - new Date(a))
                                  .map(([hour, count]) => (
                                    <div key={hour} className="flex items-center justify-between text-xs">
                                      <span className="text-gray-600">{new Date(hour).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                      <span className="text-gray-800 font-medium">{formatNumber(count)} requests</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    {selectedDate && Object.entries(usageData?.data?.localUsage?.requestsByDate || {}).filter(([date]) => date === selectedDate).length === 0 && (
                      <p className="text-gray-500 text-center py-4">No data available for the selected date.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No usage data available for the selected time range.</p>
                )}

                {/* Recent API Calls (Local Tracking Only) */}
                {usageData?.data?.localUsage?.recentCalls && usageData?.data?.localUsage?.recentCalls.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent API Calls</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {usageData?.data?.localUsage?.recentCalls?.slice(0, 20).map((call, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {new Date(call.timestamp).toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">{call.model}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {call.tokens ? (
                                  call.tokens.totalTokens ? `${formatNumber(call.tokens.totalTokens)} total` :
                                    call.tokens.promptTokens && call.tokens.completionTokens
                                      ? `${formatNumber(call.tokens.promptTokens)} + ${formatNumber(call.tokens.completionTokens)}`
                                      : 'N/A'
                                ) : 'N/A'}
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
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Information</h3>
              {billing?.data?.hasBilling ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900">Billing Account Linked</p>
                    <p className="text-xs text-blue-700 mt-1">{billing.data.billingAccountName}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      {billing.data.message || 'Check Google Cloud Console for detailed billing information.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-green-900">Free Tier Active</p>
                        <p className="text-xs text-green-700 mt-1">
                          {billing?.data?.message || 'No billing account linked. You are using the free tier.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {(freeTierStatus.dailyLimitExceeded || freeTierStatus.monthlyLimitExceeded) && (
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800">
                        ⚠️ You have exceeded free tier limits. Billing may apply if you continue to exceed limits.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  For detailed billing information and cost breakdown, visit:
                </p>
                <a
                  href="https://aistudio.google.com/u/0/usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                >
                  Google AI Studio Usage Page →
                </a>
              </div>
            </div>

            {/* Free Tier Information */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Free Tier Limits</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Daily Limit</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(usageData?.data?.freeTierInfo?.dailyLimit || 1500)} requests/day
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Monthly Limit</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(usageData?.data?.freeTierInfo?.monthlyLimit || 50000)} requests/month
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Rate Limit</span>
                  <span className="text-sm font-semibold text-gray-900">15 requests/minute</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Note: Free tier limits may change. Check Google AI Studio for current limits.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default UsageTracking
