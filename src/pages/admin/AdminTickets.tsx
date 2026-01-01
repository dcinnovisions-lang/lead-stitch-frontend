import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import api from '../../config/api'
import type { Ticket, TicketStatus, TicketPriority } from '../../types/api/ticket.types'
import type { AxiosError } from 'axios'

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface TicketFilters {
  search: string
  status: string
  category: string
  priority: string
  assigned_to: string
}

interface TicketsResponse {
  tickets: Ticket[]
  pagination: Pagination
}

interface TicketStats {
  total?: number
  open?: number
  in_progress?: number
  closed?: number
  [key: string]: unknown
}

function AdminTickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [filters, setFilters] = useState<TicketFilters>({ 
    search: '', 
    status: '', 
    category: '', 
    priority: '',
    assigned_to: ''
  })

  useEffect(() => {
    fetchData()
  }, [pagination.page, filters])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [ticketsRes, statsRes] = await Promise.all([
        api.get<TicketsResponse>('/admin/tickets', {
          params: {
            page: pagination.page,
            limit: pagination.limit,
            ...filters,
          }
        }),
        api.get<TicketStats>('/admin/tickets/stats')
      ])
      setTickets(ticketsRes.data.tickets)
      setPagination(prev => ({ ...prev, ...ticketsRes.data.pagination }))
      setStats(statsRes.data)
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>
      console.error('Error fetching tickets:', axiosError)
    } finally {
      setLoading(false)
    }
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
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Ticket Management</h1>
          <p className="text-gray-600 mt-2">Manage and monitor all support tickets</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Open</p>
              <p className="text-3xl font-bold text-blue-600">{stats.open}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.in_progress}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Unassigned</p>
              <p className="text-3xl font-bold text-red-600">{stats.unassigned}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search tickets..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="feature_request">Feature Request</option>
              <option value="bug_report">Bug Report</option>
              <option value="account">Account</option>
              <option value="other">Other</option>
            </select>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <select
              value={filters.assigned_to}
              onChange={(e) => setFilters({ ...filters, assigned_to: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No tickets found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ticket.subject}</div>
                        {ticket.ticket_number && <div className="text-sm text-gray-500">#{ticket.ticket_number}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{(ticket as any).creator?.email || 'N/A'}</div>
                      <div className="text-sm text-gray-500">
                        {(ticket as any).creator?.first_name || (ticket as any).creator?.firstName} {(ticket as any).creator?.last_name || (ticket as any).creator?.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status as TicketStatus)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority as TicketPriority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.assignee ? (ticket.assignee as any).email : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ticket.created_at || ticket.createdAt || '').toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminTickets

