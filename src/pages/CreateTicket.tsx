import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { createTicket, clearError } from '../store/slices/ticketsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'
import type { TicketCategory, TicketPriority } from '../types/api/ticket.types'

interface TicketFormData {
  subject: string
  description: string
  category: TicketCategory
  priority: TicketPriority
}

interface FormErrors {
  subject?: string
  description?: string
  category?: string
  priority?: string
}

function CreateTicket() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state: RootState) => state.tickets)
  
  const [formData, setFormData] = useState<TicketFormData>({
    subject: '',
    description: '',
    category: 'other' as TicketCategory,
    priority: 'medium' as TicketPriority,
  })
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<FormErrors>({})

  // Clear error when component unmounts or error changes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length + files.length > 5) {
      alert('Maximum 5 files allowed')
      return
    }
    
    // Check file sizes (10MB each)
    const oversizedFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert('Some files exceed 10MB limit')
      return
    }

    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!validate()) return

    try {
      const result = await dispatch(createTicket({
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        attachments: files,
      }))

      if (createTicket.fulfilled.match(result)) {
        navigate(`/tickets/${result.payload.id}`)
      } else {
        alert(result.payload || 'Failed to create ticket. Please try again.')
      }
    } catch (error: any) {
      console.error('Error creating ticket:', error)
      alert(error?.message || 'Failed to create ticket. Please try again.')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
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
          <h1 className="text-3xl font-bold text-gray-900">Create Support Ticket</h1>
          <p className="text-gray-600 mt-2">Submit a new support request</p>
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

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow border border-gray-200 p-6">
          {/* Subject */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.subject ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Brief description of your issue"
            />
            {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="feature_request">Feature Request</option>
              <option value="bug">Bug Report</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Priority */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low - General inquiry</option>
              <option value="medium">Medium - Standard issue</option>
              <option value="high">High - Urgent issue</option>
              <option value="urgent">Urgent - Critical issue</option>
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={8}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Please provide detailed information about your issue..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* File Attachments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600">
                  Click to upload files or drag and drop
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Maximum 5 files, 10MB each (Images, PDFs, Documents)
                </span>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default CreateTicket

