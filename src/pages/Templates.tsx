import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getTemplates, deleteTemplate, clearError } from '../store/slices/templatesSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'

function Templates() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  
  // Redux state
  const { templates, loading, error } = useAppSelector((state: RootState) => state.templates)
  
  // Local UI state
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    dispatch(getTemplates())
  }, [dispatch])

  // Clear error when component unmounts or error changes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  const handleDelete = async (templateId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (deletingId) return
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      setDeletingId(templateId)
      const result = await dispatch(deleteTemplate(templateId))
      if (deleteTemplate.rejected.match(result)) {
        alert(result.payload || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.subject && template.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Email Templates</h1>
              <p className="text-lg text-gray-600">Create and manage reusable email templates for your campaigns</p>
            </div>
            <button
              onClick={() => navigate('/templates/new')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Template
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
              placeholder="Search templates..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No templates found' : 'No templates yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first email template to speed up campaign creation'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/templates/new')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Template
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => navigate(`/templates/${template.id}/edit`)}
                className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all p-6 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                      {template.name}
                    </h3>
                    {template.is_default && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                        Default
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDelete(template.id, e)}
                    disabled={deletingId === template.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Subject:</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{template.subject}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Preview:</p>
                  <div
                    className="text-sm text-gray-600 line-clamp-3 border border-gray-200 rounded-lg p-3 bg-gray-50"
                    dangerouslySetInnerHTML={{ __html: template.body_html?.substring(0, 200) + '...' || '' }}
                  />
                </div>

                {template.variables && Object.keys(template.variables).length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Variables:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(template.variables).slice(0, 5).map(variable => (
                        <span
                          key={variable}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono border border-blue-200"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                      {Object.keys(template.variables).length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{Object.keys(template.variables).length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Created {formatDate(template.created_at)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/templates/${template.id}/edit`)
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Edit →
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

export default Templates


