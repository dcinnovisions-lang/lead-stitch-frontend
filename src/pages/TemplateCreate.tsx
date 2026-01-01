import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { getTemplateById, createTemplate, updateTemplate, clearCurrentTemplate, clearError } from '../store/slices/templatesSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'

interface TemplateFormData {
  name: string
  subject: string
  body_html: string
  body_text: string
  is_default: boolean
}

interface TemplateVariables {
  firstName: string
  lastName: string
  company: string
  position: string
  email: string
}

function TemplateCreate() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const dispatch = useAppDispatch()
  const isEdit = !!id

  // Redux state
  const { currentTemplate, loading, saving, error } = useAppSelector((state: RootState) => state.templates)
  
  // Local UI state
  const [previewMode, setPreviewMode] = useState<boolean>(false)
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    subject: '',
    body_html: '',
    body_text: '',
    is_default: false,
  })
  const [variables, setVariables] = useState<TemplateVariables>({
    firstName: 'John',
    lastName: 'Doe',
    company: 'Acme Inc',
    position: 'CEO',
    email: 'john.doe@acme.com',
  })

  useEffect(() => {
    if (isEdit && id) {
      // Handle both string (UUID) and number IDs
      const templateId = isNaN(Number(id)) ? id : Number(id)
      dispatch(getTemplateById(templateId))
    }
    
    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentTemplate())
    }
  }, [id, isEdit, dispatch])

  // Sync form data when template loads
  useEffect(() => {
    if (currentTemplate && isEdit) {
      setFormData({
        name: currentTemplate.name || '',
        subject: currentTemplate.subject || '',
        body_html: currentTemplate.body_html || '',
        body_text: currentTemplate.body_text || '',
        is_default: currentTemplate.is_default || false,
      })
      if (currentTemplate.variables) {
        if (typeof currentTemplate.variables === 'object' && !Array.isArray(currentTemplate.variables)) {
          setVariables(prev => ({ ...prev, ...(currentTemplate.variables as Record<string, string>) }))
        }
      }
    }
  }, [currentTemplate, isEdit])

  // Clear error when component unmounts or error changes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('body_html') as HTMLTextAreaElement | null
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = formData.body_html
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      const newText = before + `{{${variable}}}` + after
      setFormData(prev => ({ ...prev, body_html: newText }))
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
      }, 0)
    }
  }

  const getPreviewHTML = (): string => {
    let html = formData.body_html || ''
    Object.keys(variables).forEach((key: keyof TemplateVariables) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      html = html.replace(regex, variables[key])
    })
    return html
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formData.name || !formData.subject || !formData.body_html) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const templateData = {
        ...formData,
        variables: Object.keys(variables).reduce((acc: Record<string, string | null>, key) => {
          acc[key] = variables[key as keyof TemplateVariables] ? 'string' : null
          return acc
        }, {}),
      }

      let result
      if (isEdit && id) {
        const templateId = isNaN(Number(id)) ? id : Number(id)
        result = await dispatch(updateTemplate({ id: templateId, data: templateData }))
      } else {
        result = await dispatch(createTemplate(templateData))
      }

      if (createTemplate.fulfilled.match(result) || updateTemplate.fulfilled.match(result)) {
        navigate('/templates')
      } else {
        const errorMessage = typeof result.payload === 'string' ? result.payload : 'Failed to save template'
        alert(errorMessage)
      }
    } catch (error: unknown) {
      console.error('Error saving template:', error)
      const errorObj = error as { message?: string }
      alert(errorObj.message || 'Failed to save template')
    }
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/templates')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Templates
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {isEdit ? 'Edit Template' : 'Create New Template'}
              </h1>
              <p className="text-lg text-gray-600">Design a reusable email template for your campaigns</p>
            </div>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </button>
          </div>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Product Introduction Email"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_default" className="text-sm font-medium text-gray-700">
                  Set as default template
                </label>
              </div>
            </div>
          </div>

          {previewMode ? (
            /* Preview Mode */
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Preview</h2>
              <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Subject:</p>
                  <p className="text-lg text-gray-900">
                    {formData.subject.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                      const varKey = key as keyof TemplateVariables
                      return variables[varKey] || match
                    })}
                  </p>
                </div>
                <div className="border-t border-gray-300 pt-4">
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: getPreviewHTML() }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Email Content */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Email Content</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject Line <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., Exciting opportunity for {{company}}"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Email Body (HTML) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        {['firstName', 'lastName', 'company', 'position', 'email'].map(variable => (
                          <button
                            key={variable}
                            type="button"
                            onClick={() => insertVariable(variable)}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 font-mono"
                          >
                            {`{{${variable}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      id="body_html"
                      value={formData.body_html}
                      onChange={(e) => setFormData(prev => ({ ...prev, body_html: e.target.value }))}
                      placeholder="Enter your email content in HTML format. Use the buttons above to insert variables."
                      rows={16}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-mono text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Variable Preview */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Variable Preview Values</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Set sample values to preview how variables will be replaced in your template
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(variables).map((key) => {
                    const varKey = key as keyof TemplateVariables
                    return (
                      <div key={key}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </label>
                        <input
                          type="text"
                          value={variables[varKey]}
                          onChange={(e) => setVariables(prev => ({ ...prev, [varKey]: e.target.value }))}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/templates')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default TemplateCreate


