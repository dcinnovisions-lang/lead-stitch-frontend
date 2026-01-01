import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getTicketById, addComment, closeTicket, clearCurrentTicket, clearError } from '../store/slices/ticketsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'
import type { TicketStatus, TicketPriority } from '../types/api/ticket.types'

// Get API base URL for file downloads
const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function TicketDetail() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { currentTicket, loading, submitting, error } = useAppSelector((state: RootState) => state.tickets)
  
  // Local UI state
  const [comment, setComment] = useState<string>('')
  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    if (id) {
      const ticketId = isNaN(Number(id)) ? id : Number(id)
      dispatch(getTicketById(ticketId))
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentTicket())
    }
  }, [id, dispatch])

  // Clear error when component unmounts or error changes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

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
      const ticketId = isNaN(Number(id)) ? id : Number(id)
      const result = await dispatch(addComment({
        ticketId,
        comment: comment.trim(),
        attachments: files,
      }))

      if (addComment.fulfilled.match(result)) {
        setComment('')
        setFiles([])
        // Refresh ticket to get updated data
        await dispatch(getTicketById(ticketId))
      } else {
        alert(result.payload || 'Failed to add comment')
      }
    } catch (error: unknown) {
      console.error('Error adding comment:', error)
      alert('Failed to add comment')
    }
  }

  const handleCloseTicket = async () => {
    if (!id || !confirm('Are you sure you want to close this ticket?')) return

    try {
      const ticketId = isNaN(Number(id)) ? id : Number(id)
      const result = await dispatch(closeTicket(ticketId))
      if (closeTicket.fulfilled.match(result)) {
        // Refresh ticket to get updated data
        await dispatch(getTicketById(ticketId))
      } else {
        alert(result.payload || 'Failed to close ticket')
      }
    } catch (error: unknown) {
      console.error('Error closing ticket:', error)
      alert('Failed to close ticket')
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
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!currentTicket) {
    if (error) {
      return (
        <Layout>
          <div className="max-w-5xl mx-auto p-6">
            <div className="text-center py-20">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => {
                  dispatch(clearError())
                  navigate('/tickets')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Tickets
              </button>
            </div>
          </div>
        </Layout>
      )
    }
    return null
  }

  const ticket = currentTicket

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6">
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

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/tickets')}
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
            {ticket.status !== 'closed' && (
              <button
                onClick={handleCloseTicket}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close Ticket
              </button>
            )}
          </div>
        </div>

        {/* Ticket Info */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(ticket.status as TicketStatus)}`}>
                {ticket.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Priority</p>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(ticket.priority as TicketPriority)}`}>
                {ticket.priority.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Category</p>
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
            <div>
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

          {ticket.assignee && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Assigned to: <span className="font-medium text-gray-900">
                  {ticket.assignee.first_name || ticket.assignee.firstName} {ticket.assignee.last_name || ticket.assignee.lastName} ({ticket.assignee.email})
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Comments</h2>

          {ticket.comments && ticket.comments.length > 0 ? (
            <div className="space-y-4">
              {ticket.comments
                .filter(comment => !comment.is_internal) // Only show user-visible comments
                .map((comment) => (
                <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {comment.user 
                          ? (comment.user.first_name || comment.user.firstName) && (comment.user.last_name || comment.user.lastName)
                              ? `${comment.user.first_name || comment.user.firstName} ${comment.user.last_name || comment.user.lastName}`
                              : comment.user.email || 'Support Team'
                          : 'Support Team'}
                      </span>
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
      </div>
    </Layout>
  )
}

export default TicketDetail

