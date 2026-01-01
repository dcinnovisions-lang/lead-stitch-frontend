import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getTickets, setFilters, clearError } from '../store/slices/ticketsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'
import type { TicketStatus, TicketPriority, TicketCategory } from '../types/api/ticket.types'

function Tickets() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  
  // Redux state
  const { tickets, pagination, filters, loading, error } = useAppSelector((state: RootState) => state.tickets)
  
  useEffect(() => {
    dispatch(getTickets({
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
    }))
  }, [pagination.page, filters, dispatch])

  // Clear error when component unmounts or error changes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  const handleFilterChange = (key: string, value: string | undefined) => {
    const filterUpdate: Record<string, string | undefined> = { [key]: value }
    dispatch(setFilters(filterUpdate))
    // Reset to first page when filters change
    dispatch(getTickets({
      page: 1,
      limit: pagination.limit,
      ...filters,
      ...filterUpdate,
    }))
  }

  const handlePageChange = (newPage: number) => {
    dispatch(getTickets({
      page: newPage,
      limit: pagination.limit,
      ...filters,
    }))
  }

  const getStatusColor = (status: TicketStatus): string => {
    const colors: Record<TicketStatus, string> = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      waiting_customer: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || colors.open
  }

  const getPriorityColor = (priority: TicketPriority): string => {
    const colors: Record<TicketPriority, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    }
    return colors[priority] || colors.medium
  }


  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-600 mt-2">Manage and track your support requests</p>
          </div>
          <button
            onClick={() => navigate('/tickets/new')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Ticket
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-xl px-6 py-4 flex items-center justify-between">
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

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search tickets..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_customer">Waiting Customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="feature_request">Feature Request</option>
              <option value="bug">Bug</option>
              <option value="bug_report">Bug Report</option>
              <option value="account">Account</option>
              <option value="other">Other</option>
            </select>
            <select
              value={filters.priority || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600 mb-6">Create your first support ticket to get started</p>
            <button
              onClick={() => navigate('/tickets/new')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Create New Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="bg-white rounded-xl shadow border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
                        {ticket.ticket_number && <p className="text-sm text-gray-500">#{ticket.ticket_number}</p>}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status as TicketStatus)}`}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority as TicketPriority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500 capitalize">
                        {ticket.category.replace('_', ' ')}
                      </span>
                      {ticket.attachments && Array.isArray(ticket.attachments) && ticket.attachments.length > 0 && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {ticket.attachments.length} attachment{ticket.attachments.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-500">
                      {new Date(ticket.created_at || ticket.createdAt || '').toLocaleDateString()}
                    </p>
                    {ticket.assignee && (
                      <p className="text-xs text-gray-400 mt-1">
                        Assigned to {ticket.assignee.first_name || ticket.assignee.firstName || ticket.assignee.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Tickets

