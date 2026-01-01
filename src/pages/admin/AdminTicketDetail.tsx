import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import api from '../../config/api'
import { useAppSelector } from '../../store/hooks'
import { RootState } from '../../types/redux/rootState.types'
import type { Ticket, TicketStatus, TicketPriority } from '../../types/api/ticket.types'
import type { User } from '../../types/api/auth.types'
import type { AxiosError } from 'axios'

// Get API base URL for file downloads
const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface TicketResponse {
  ticket: Ticket
}

interface AdminsResponse {
  admins: User[]
}

interface AdminsResponse {  
  users?: User[]
  admins?: User[]
}

function AdminTicketDetail() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { user } = useAppSelector((state: RootState) => state.auth)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comment, setComment] = useState<string>('')
  const [isInternal, setIsInternal] = useState<boolean>(false)
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [admins, setAdmins] = useState<User[]>([])
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false)
  const [selectedAdmin, setSelectedAdmin] = useState<string>('')
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false)
  const [newStatus, setNewStatus] = useState<TicketStatus>('open')
  const [statusMessage, setStatusMessage] = useState<string>('')

  useEffect(() => {
    fetchTicket()
    fetchAdmins()
  }, [id])

  const fetchTicket = async () => {
    try {
      setLoading(true)
      if (!id) return
      const response = await api.get<TicketResponse>(`/admin/tickets/${id}`)
      setTicket(response.data.ticket)
      if ((response.data.ticket as any).assigned_to) {
        setSelectedAdmin(String((response.data.ticket as any).assigned_to))
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>
      console.error('Error fetching ticket:', axiosError)
      alert('Failed to load ticket')
      navigate('/admin/tickets')
    } finally {
      setLoading(false)
    }
  }

  const fetchAdmins = async () => {
    try {
      const response = await api.get<AdminsResponse>('/admin/users', { params: { role: 'admin' } })
      setAdmins(response.data.users || response.data.admins || [])
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>
      console.error('Error fetching admins:', axiosError)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : []
    if (selectedFiles.length + files.length > 5) {
      alert('Maximum 5 files allowed')
      return
    }
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmitComment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!id || (!comment.trim() && files.length === 0)) return

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append('comment', comment)
      formData.append('is_internal', String(isInternal))
      files.forEach((file) => {
        formData.append('attachments', file)
      })

      await api.post(`/admin/tickets/${id}/comment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setComment('')
      setIsInternal(false)
      setFiles([])
      fetchTicket() // Refresh ticket to get new comment
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>
      console.error('Error adding comment:', axiosError)
      alert('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChangeClick = (currentStatus: TicketStatus) => {
    setNewStatus(currentStatus)
    setStatusMessage('')
    setShowStatusModal(true)
  }

  const handleStatusChangeConfirm = async () => {
    if (!id) return
    try {
      await api.put(`/admin/tickets/${id}`, {
        status: newStatus,
        message: statusMessage.trim() || null
      })
      setShowStatusModal(false)
      setStatusMessage('')
      fetchTicket()
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>
      console.error('Error updating status:', axiosError)
      alert('Failed to update status')
    }
  }

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!id) return
    try {
      await api.put(`/admin/tickets/${id}`, { priority: newPriority })
      fetchTicket()
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>
      console.error('Error updating priority:', axiosError)
      alert('Failed to update priority')
    }
  }

  const handleAssignTicket = async () => {
    if (!id) return
    try {
      await api.post(`/admin/tickets/${id}/assign`, {
        assigned_to: selectedAdmin || null
      })
      setShowAssignModal(false)
      fetchTicket()
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>
      console.error('Error assigning ticket:', axiosError)
      alert('Failed to assign ticket')
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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

  if (!ticket) {
    return null
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/tickets')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tickets
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{ticket.subject}</h1>
              {ticket.ticket_number && <p className="text-gray-600 mt-2">#{ticket.ticket_number}</p>}
            </div>
          </div>
        </div>

        {/* Ticket Info */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Status</p>
              <button
                onClick={() => handleStatusChangeClick(ticket.status as TicketStatus)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg border-2 border-transparent hover:border-blue-300 ${getStatusColor(ticket.status as TicketStatus)} flex items-center gap-2`}
              >
                <span>{ticket.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Priority</p>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                className={`px-3 py-2 text-sm font-semibold rounded-full border-0 ${getPriorityColor(ticket.priority as TicketPriority)}`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Category</p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {ticket.category.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Description</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {ticket.attachments && Array.isArray(ticket.attachments) && ticket.attachments.length > 0 && 
           typeof ticket.attachments[0] !== 'string' && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Attachments</h3>
              <div className="space-y-2">
                {(ticket.attachments as Array<{ id: number; file_name: string; file_size: number }>).map((attachment) => (
                  <a
                    key={attachment.id}
                    href={`${API_BASE_URL}/tickets/attachments/${attachment.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-900">{attachment.file_name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{formatFileSize(attachment.file_size)}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Created by</p>
                <p className="text-sm font-medium text-gray-900">
                  {((ticket as any).creator?.first_name || (ticket as any).creator?.firstName || '')} {((ticket as any).creator?.last_name || (ticket as any).creator?.lastName || '')} ({(ticket as any).creator?.email || 'Unknown'})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Assigned to</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {ticket.assignee ? `${(ticket.assignee as any).first_name || (ticket.assignee as any).firstName || ''} ${(ticket.assignee as any).last_name || (ticket.assignee as any).lastName || ''} (${(ticket.assignee as any).email || 'Unknown'})` : 'Unassigned'}
                  </p>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {ticket.assignee ? 'Reassign' : 'Assign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Comments</h2>

          {ticket.comments && ticket.comments.length > 0 ? (
            <div className="space-y-4">
              {ticket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`border-l-4 pl-4 py-2 ${comment.is_internal ? 'border-purple-500 bg-purple-50' : 'border-blue-500'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {comment.user 
                          ? ((comment.user as any).first_name || (comment.user as any).firstName) && ((comment.user as any).last_name || (comment.user as any).lastName)
                              ? `${(comment.user as any).first_name || (comment.user as any).firstName} ${(comment.user as any).last_name || (comment.user as any).lastName}`
                              : comment.user.email || 'Support Team'
                          : 'Support Team'}
                      </span>
                      {comment.is_internal && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                          Internal Note
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.created_at || comment.createdAt || '').toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.comment || comment.content}</p>
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {comment.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={`${API_BASE_URL}/tickets/attachments/${attachment.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {attachment.file_name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No comments yet</p>
          )}
        </div>

        {/* Add Comment Form */}
        {ticket.status !== 'closed' && (
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Comment</h2>
            <form onSubmit={handleSubmitComment}>
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Internal note (only visible to admins)</span>
                </label>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                placeholder="Type your comment here..."
              />

              <div className="mb-4">
                <input
                  type="file"
                  id="comment-files"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                />
                <label
                  htmlFor="comment-files"
                  className="inline-block px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  Attach Files
                </label>
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-900">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || (!comment.trim() && files.length === 0)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Add Comment'}
              </button>
            </form>
          </div>
        )}

        {/* Status Change Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Change Ticket Status</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_customer">Waiting for Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to User <span className="text-gray-500 text-xs font-normal">(Optional - will be sent via email)</span>
                </label>
                <textarea
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a message to explain the status change to the user. This will be visible to them and sent via email."
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Tip: Adding a message helps users understand what happened and what to expect next.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowStatusModal(false)
                    setStatusMessage('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusChangeConfirm}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Assign Ticket</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Admin
                </label>
                <select
                  value={selectedAdmin}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Unassigned</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.firstName || (admin as any).first_name || ''} {admin.lastName || (admin as any).last_name || ''} ({admin.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTicket}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminTicketDetail

