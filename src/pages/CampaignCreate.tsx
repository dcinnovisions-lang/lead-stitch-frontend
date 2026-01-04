import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../config/api'
import type { EmailTemplate } from '../types/api/template.types'
import type { SMTPCredential } from '../types/api/integration.types'

interface LeadInRequirement {
  id: number
  name?: string
  firstName?: string
  lastName?: string
  title?: string
  profession?: string
  company_name?: string
  company?: string
  location?: string
  decision_maker_role?: string
  profile_url?: string
  email?: string | null
  email_verified?: boolean
}

interface RequirementWithLeads {
  requirement_id: number
  requirement_name?: string
  requirement_text?: string
  industry?: string
  target_location?: string
  total_leads?: number
  leads_with_email?: number
  leads: LeadInRequirement[]
}

interface CampaignFormData {
  name: string
  description: string
  template_id: string
  smtp_credential_id: string
  subject: string
  body_html: string
  body_text: string
  scheduled_at: string
  status: string
}

interface TouchedFields {
  name: boolean
  subject: boolean
  body_html: boolean
  smtp_credential_id: boolean
}

interface FormErrors {
  name: string
  subject: string
  body_html: string
  smtp_credential_id: string
}

function CampaignCreate() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id

  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [smtpCredentials, setSmtpCredentials] = useState<SMTPCredential[]>([])
  const [requirements, setRequirements] = useState<RequirementWithLeads[]>([])
  const [selectedRequirementId, setSelectedRequirementId] = useState<string>('')
  const [selectedLeads, setSelectedLeads] = useState<number[]>([])
  const [leadEmails, setLeadEmails] = useState<Record<number, string>>({})
  const [showLeadSelector, setShowLeadSelector] = useState<boolean>(false)
  
  // Validation state
  const [touched, setTouched] = useState<TouchedFields>({
    name: false,
    subject: false,
    body_html: false,
    smtp_credential_id: false,
  })
  const [errors, setErrors] = useState<FormErrors>({
    name: '',
    subject: '',
    body_html: '',
    smtp_credential_id: '',
  })

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    template_id: '',
    smtp_credential_id: '',
    subject: '',
    body_html: '',
    body_text: '',
    scheduled_at: '',
    status: 'draft',
  })

  useEffect(() => {
    fetchTemplates()
    fetchSMTPCredentials()
    fetchLeads()
    if (isEdit) {
      fetchCampaign()
    }
  }, [id])

  useEffect(() => {
    if (!isEdit) return
    if (selectedRequirementId) return
    if (requirements.length === 0) return
    if (selectedLeads.length === 0) return

    const matchingRequirement = requirements.find(req =>
      Array.isArray(req.leads) && req.leads.some(lead => selectedLeads.includes(lead.id))
    )

    if (matchingRequirement) {
      setSelectedRequirementId(String(matchingRequirement.requirement_id))
      setShowLeadSelector(true)

      setLeadEmails(prev => {
        const updated = { ...prev }
        matchingRequirement.leads.forEach(lead => {
          if (selectedLeads.includes(lead.id)) {
            const email = prev[lead.id] || lead.email
            if (email) {
              updated[lead.id] = email
            }
          }
        })
        return updated
      })
    }
  }, [isEdit, requirements, selectedLeads, selectedRequirementId])

  // Auto-populate emails for selected leads when leads data changes
  useEffect(() => {
    if (selectedRequirementId && requirements.length > 0 && selectedLeads.length > 0) {
      const requirement = requirements.find(r => {
        const reqId = String(r.requirement_id || '')
        const selectedId = String(selectedRequirementId || '')
        return reqId === selectedId
      })
      if (requirement && requirement.leads) {
        setLeadEmails(prevEmails => {
          const newEmails = { ...prevEmails }
          let hasUpdates = false
          
          requirement.leads.forEach(lead => {
            // Only update if lead is selected and email exists and not already set in state
            if (selectedLeads.includes(lead.id) && lead.email && newEmails[lead.id] === undefined) {
              newEmails[lead.id] = lead.email
              hasUpdates = true
            }
          })
          
          return hasUpdates ? newEmails : prevEmails
        })
      }
    }
  }, [selectedRequirementId, requirements, selectedLeads])

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/email/templates')
      setTemplates(response.data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const fetchSMTPCredentials = async () => {
    try {
      const response = await api.get('/email/smtp')
      // Handle different response structures
      const data = response.data
      if (Array.isArray(data)) {
        setSmtpCredentials(data)
      } else if (data && Array.isArray(data.credentials)) {
        setSmtpCredentials(data.credentials)
      } else if (data && data.success && Array.isArray(data.data)) {
        setSmtpCredentials(data.data)
      } else {
        console.warn('Unexpected SMTP credentials response format:', data)
        setSmtpCredentials([])
      }
    } catch (error) {
      console.error('Error fetching SMTP credentials:', error)
      setSmtpCredentials([])
    }
  }

  const fetchLeads = async () => {
    try {
      // Fetch all leads instead of grouped endpoint (which only returns closed requirements)
      const response = await api.get('/leads/all')
      const allLeads = response.data || []
      
      // Group leads by requirement
      const requirementsMap = new Map()
      
      allLeads.forEach(lead => {
        const reqId = lead.requirement_id
        const reqName = lead.requirement_name || 'Unknown Requirement'
        
        if (!reqId) return // Skip leads without requirement_id
        
        if (!requirementsMap.has(reqId)) {
          requirementsMap.set(reqId, {
            requirement_id: reqId,
            requirement_name: reqName,
            requirement_text: lead.requirement_text || '',
            industry: lead.industry || '',
            target_location: lead.target_location || '',
            leads: []
          })
        }
        
        requirementsMap.get(reqId).leads.push({
          id: lead.id,
          name: lead.name,
          title: lead.title,
          profession: lead.profession,
          company_name: lead.company_name,
          location: lead.location,
          decision_maker_role: lead.decision_maker_role,
          profile_url: lead.profile_url,
          email: lead.email || null,
          email_verified: lead.email_verified || false
        })
      })
      
      // Convert map to array and calculate stats
      const requirementsArray = Array.from(requirementsMap.values()).map(req => ({
        ...req,
        total_leads: req.leads.length,
        leads_with_email: req.leads.filter(l => l.email).length
      }))
      
      setRequirements(requirementsArray)
      
      // If there's only one requirement, auto-select it
      if (requirementsArray.length === 1) {
        setSelectedRequirementId(String(requirementsArray[0].requirement_id))
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      setRequirements([])
    }
  }

  const fetchCampaign = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/campaigns/${id}`)
      const campaign = response.data
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        template_id: campaign.template_id || '',
        smtp_credential_id: campaign.smtp_credential_id || '',
        subject: campaign.subject || '',
        body_html: campaign.body_html || '',
        body_text: campaign.body_text || '',
        scheduled_at: campaign.scheduled_at ? new Date(campaign.scheduled_at).toISOString().slice(0, 16) : '',
        status: campaign.status || 'draft',
      })
      // Fetch campaign recipients
      const recipientsResponse = await api.get(`/campaigns/${id}/recipients`)
      const recipientIds = recipientsResponse.data?.map(r => r.lead_id) || []
      setSelectedLeads(recipientIds)
      
      // Initialize emails from recipients
      const emails = {}
      recipientsResponse.data?.forEach(r => {
        if (r.email) {
          emails[r.lead_id] = r.email
        }
      })
      setLeadEmails(emails)
    } catch (error) {
      console.error('Error fetching campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setFormData(prev => ({
        ...prev,
        template_id: templateId,
        subject: prev.subject || template.subject,
        body_html: prev.body_html || template.body_html || template.body || '',
        body_text: prev.body_text || template.body_text || template.body || '',
      }))
    }
  }

  const handleLeadToggle = (leadId) => {
    const lead = getCurrentLeads().find(l => l.id === leadId)
    // Don't allow selecting leads without emails
    if (!lead || !lead.email) {
      return
    }
    
    setSelectedLeads(prev => {
      const isSelected = prev.includes(leadId)
      if (isSelected) {
        return prev.filter(id => id !== leadId)
      } else {
        // When selecting, initialize email if not already set
        if (lead.email && leadEmails[leadId] === undefined) {
          // Only set if not already in state (undefined means not set yet)
          setLeadEmails(prevEmails => ({
            ...prevEmails,
            [leadId]: lead.email
          }))
        }
        return [...prev, leadId]
      }
    })
  }

  const handleSelectAll = () => {
    const currentLeads = getCurrentLeads()
    // Only select leads that have emails
    const leadsWithEmail = currentLeads.filter(lead => lead.email)
    const allSelected = leadsWithEmail.length > 0 && leadsWithEmail.every(lead => selectedLeads.includes(lead.id))
    
    if (allSelected) {
      // Deselect all current leads
      setSelectedLeads(prev => prev.filter(id => !currentLeads.some(l => l.id === id)))
    } else {
      // Select only leads with emails
      const newEmails = {}
      leadsWithEmail.forEach(lead => {
        if (lead.email && !leadEmails[lead.id]) {
          newEmails[lead.id] = lead.email
        }
      })
      if (Object.keys(newEmails).length > 0) {
        setLeadEmails(prev => ({ ...prev, ...newEmails }))
      }
      // Add only leads with emails to selection
      const leadsWithEmailIds = leadsWithEmail.map(l => l.id)
      setSelectedLeads(prev => {
        const otherLeads = prev.filter(id => !currentLeads.some(l => l.id === id))
        return [...otherLeads, ...leadsWithEmailIds]
      })
    }
  }

  const getCurrentLeads = () => {
    if (!selectedRequirementId) return []
    // Handle both UUID (string) and number comparison
    const requirement = requirements.find(r => {
      const reqId = String(r.requirement_id || '')
      const selectedId = String(selectedRequirementId || '')
      return reqId === selectedId
    })
    return requirement?.leads || []
  }


  // Split name into first and last name
  const splitName = (name) => {
    if (!name) return { firstName: '', lastName: '' }
    const parts = name.trim().split(' ')
    const firstName = parts[0] || ''
    const lastName = parts.slice(1).join(' ') || ''
    return { firstName, lastName }
  }

  // Validation functions
  const validateField = (field, value) => {
    let error = ''
    switch (field) {
      case 'name':
        if (!value || !value.trim()) {
          error = 'Please fill out this field'
        }
        break
      case 'subject':
        if (!value || !value.trim()) {
          error = 'Please fill out this field'
        }
        break
      case 'body_html':
        if (!value || !value.trim()) {
          error = 'Please fill out this field'
        }
        break
      case 'smtp_credential_id':
        if (!value || !value.trim()) {
          error = 'Please select an SMTP account'
        }
        break
      default:
        break
    }
    setErrors(prev => ({ ...prev, [field]: error }))
    return !error
  }

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateField(field, formData[field])
  }

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (touched[field]) {
      validateField(field, value)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Mark all required fields as touched
    setTouched({
      name: true,
      subject: true,
      body_html: true,
      smtp_credential_id: true,
    })
    
    // Validate all required fields
    const isNameValid = validateField('name', formData.name)
    const isSubjectValid = validateField('subject', formData.subject)
    const isBodyValid = validateField('body_html', formData.body_html)
    const isSmtpValid = validateField('smtp_credential_id', formData.smtp_credential_id)
    
    if (!isNameValid || !isSubjectValid || !isBodyValid || !isSmtpValid) {
      return
    }
    if (selectedLeads.length === 0) {
      alert('Please select at least one recipient')
      return
    }

    // Validate emails for selected leads
    const missingEmails = []
    selectedLeads.forEach(leadId => {
      const lead = getCurrentLeads().find(l => l.id === leadId)
      const email = leadEmails[leadId] || lead?.email
      if (!email || email.trim() === '') {
        const name = lead?.name || 'Unknown'
        missingEmails.push(name)
      }
    })

    if (missingEmails.length > 0) {
      alert(`Please add email addresses for: ${missingEmails.join(', ')}`)
      return
    }

    try {
      console.log('🚀 Starting campaign creation...')
      console.log('📝 Form data:', formData)
      console.log('👥 Selected leads:', selectedLeads)
      console.log('📧 Lead emails:', leadEmails)
      
      setSaving(true)
      // Prepare recipient data with emails
      const recipientData = selectedLeads.map(leadId => {
        const lead = getCurrentLeads().find(l => l.id === leadId)
        const email = leadEmails[leadId] || lead?.email || ''
        console.log(`📧 Lead ${leadId}: email from state=${leadEmails[leadId]}, email from lead=${lead?.email}, final=${email}`)
        return {
          id: leadId,
          email: email.trim()
        }
      })

      console.log('📋 Recipient data prepared:', recipientData)
      console.log('📧 Final leadEmails state:', leadEmails)

      const campaignData = {
        ...formData,
        scheduled_at: formData.scheduled_at || null,
        recipient_ids: selectedLeads,
        recipient_emails: recipientData.reduce((acc, r) => {
          acc[r.id] = r.email
          return acc
        }, {}),
      }
      
      console.log('📤 Sending campaign data to API:', {
        ...campaignData,
        recipient_emails: Object.keys(campaignData.recipient_emails).length + ' emails'
      })

      let response
      if (isEdit) {
        response = await api.put(`/campaigns/${id}`, campaignData)
      } else {
        response = await api.post('/campaigns', campaignData)
      }

      console.log('✅ Campaign creation response:', response)
      console.log('📦 Response data:', response.data)
      
      if (response.data) {
        console.log('✅ Campaign created successfully with ID:', response.data.id)
        const successMessage = isEdit
          ? 'Campaign updated. Send it from the Campaigns dashboard when you are ready.'
          : 'Campaign saved as draft. Send it from the Campaigns dashboard when you are ready.'
        alert(successMessage)
        navigate('/campaigns', {
          state: {
            toast: successMessage,
            highlightId: response.data.id,
          },
        })
      } else {
        console.warn('⚠️ No data in response:', response)
      }
    } catch (error) {
      console.error('Error saving campaign:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save campaign'
      const errorDetail = error.response?.data?.detail || ''
      alert(`Failed to save campaign: ${errorMessage}${errorDetail ? `\n\nDetails: ${errorDetail}` : ''}`)
    } finally {
      setSaving(false)
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/campaigns')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Campaigns
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isEdit ? 'Edit Campaign' : 'Create New Campaign'}
          </h1>
          <p className="text-lg text-gray-600">Set up your email campaign and reach out to your leads</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="e.g., Q1 Product Launch Campaign"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 text-gray-900 transition-all duration-200 ${
                    touched.name && errors.name
                      ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {touched.name && errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this campaign..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Email Template</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Template (Optional)</label>
                <select
                  value={formData.template_id}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Start from scratch</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

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
                  onChange={(e) => handleFieldChange('subject', e.target.value)}
                  onBlur={() => handleBlur('subject')}
                  placeholder="e.g., Exciting opportunity for your business"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 text-gray-900 transition-all duration-200 ${
                    touched.subject && errors.subject
                      ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {touched.subject && errors.subject && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.subject}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Body (HTML) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.body_html}
                  onChange={(e) => handleFieldChange('body_html', e.target.value)}
                  onBlur={() => handleBlur('body_html')}
                  placeholder="Enter your email content in HTML format. Use {{firstName}}, {{lastName}}, {{company}} for personalization."
                  rows={12}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 text-gray-900 font-mono text-sm transition-all duration-200 ${
                    touched.body_html && errors.body_html
                      ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {touched.body_html && errors.body_html && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.body_html}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Available variables: {'{{firstName}}'}, {'{{lastName}}'}, {'{{company}}'}, {'{{position}}'}, {'{{email}}'}
                </p>
              </div>
            </div>
          </div>

          {/* Recipients */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Recipients</h2>
                <p className="text-sm text-gray-600">
                  {selectedLeads.length > 0 
                    ? `${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} selected`
                    : 'Select leads from a requirement to add to your campaign'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (showLeadSelector) {
                    // When hiding, clear selection
                    setSelectedRequirementId('')
                    setSelectedLeads([])
                    setLeadEmails({})
                  }
                  setShowLeadSelector(!showLeadSelector)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {showLeadSelector ? 'Hide' : 'Select'} Leads
              </button>
            </div>

            {showLeadSelector && (
              <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                {/* Requirement Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Requirement <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedRequirementId}
                      onChange={(e) => {
                        const newRequirementId = e.target.value
                        setSelectedRequirementId(newRequirementId)
                        setSelectedLeads([]) // Clear selection when changing requirement
                        setLeadEmails({}) // Clear emails
                        
                        // Pre-populate emails from leads when requirement is selected
                        if (newRequirementId) {
                          const requirement = requirements.find(r => {
                            const reqId = String(r.requirement_id || '')
                            const selectedId = String(newRequirementId || '')
                            return reqId === selectedId
                          })
                          if (requirement && requirement.leads) {
                            const emails = {}
                            requirement.leads.forEach(lead => {
                              // Pre-populate email if it exists in lead data
                              if (lead.email) {
                                emails[lead.id] = lead.email
                              }
                            })
                            setLeadEmails(emails)
                          }
                        }
                      }}
                      className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white appearance-none"
                    >
                    <option value="">-- Select a requirement --</option>
                    {requirements.map(req => (
                      <option key={req.requirement_id} value={String(req.requirement_id)}>
                        {req.requirement_name || 'Untitled Requirement'} ({req.total_leads} leads, {req.leads_with_email} with email)
                      </option>
                    ))}
                    </select>
                    {/* Cancel/Clear Icon */}
                    {selectedRequirementId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRequirementId('')
                          setSelectedLeads([])
                          setLeadEmails({})
                        }}
                        className="absolute right-10 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Clear selection"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {/* Dropdown Arrow Icon */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {selectedRequirementId && (
                    <p className="mt-2 text-sm text-gray-600">
                      {requirements.find(r => {
                        const reqId = String(r.requirement_id || '')
                        const selectedId = String(selectedRequirementId || '')
                        return reqId === selectedId
                      })?.requirement_text?.substring(0, 100)}...
                    </p>
                  )}
                </div>

                {/* Leads Cards - Two Row Layout */}
                {selectedRequirementId && getCurrentLeads().length > 0 && (() => {
                  const currentRequirement = requirements.find(r => {
                    const reqId = String(r.requirement_id || '')
                    const selectedId = String(selectedRequirementId || '')
                    return reqId === selectedId
                  })
                  const requirementName = currentRequirement?.requirement_name || 'Selected Requirement'
                  // Count only selected leads from current requirement
                  const selectedCount = getCurrentLeads().filter(lead => 
                    selectedLeads.includes(lead.id)
                  ).length
                  
                  return (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Leads - {requirementName}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-sm text-gray-600">
                                {getCurrentLeads().length} lead{getCurrentLeads().length > 1 ? 's' : ''} available
                              </p>
                              {selectedCount > 0 && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                  Selected: {selectedCount}
                                </span>
                              )}
                            </div>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(() => {
                                const leadsWithEmail = getCurrentLeads().filter(lead => lead.email)
                                return leadsWithEmail.length > 0 && leadsWithEmail.every(lead => selectedLeads.includes(lead.id))
                              })()}
                              onChange={handleSelectAll}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Select All</span>
                          </label>
                        </div>
                      </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 gap-4">
                        {getCurrentLeads().map((lead) => {
                          const { firstName, lastName } = splitName(lead.name)
                          const hasEmail = !!lead.email
                          const isSelected = selectedLeads.includes(lead.id)
                          // Get email from state first, then from lead data, then empty string
                          const email = leadEmails[lead.id] !== undefined 
                            ? leadEmails[lead.id] 
                            : (lead.email || '')
                          
                          return (
                            <div
                              key={lead.id}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (hasEmail) {
                                  handleLeadToggle(lead.id)
                                }
                              }}
                              className={`border-2 rounded-xl p-4 transition-all relative ${
                                !hasEmail 
                                  ? 'opacity-60 blur-[0.5px] cursor-not-allowed border-gray-200 bg-gray-50' 
                                  : isSelected 
                                  ? 'border-blue-500 bg-blue-50 shadow-md cursor-pointer' 
                                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm cursor-pointer'
                              }`}
                            >
                              {/* Email Not Available Badge - Right corner */}
                              {!hasEmail && (
                                <div className="absolute top-3 right-3 z-10">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-orange-700 whitespace-nowrap">
                                      Email Not Available - Cannot Select This Lead
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* First Row: Checkbox, Name, Company, Title */}
                              <div className={`grid grid-cols-12 gap-4 mb-4 ${!hasEmail ? 'mt-8' : ''}`}>
                                {/* Checkbox - Only show if lead has email */}
                                {hasEmail ? (
                                  <div className="col-span-1 flex items-start pt-1" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleLeadToggle(lead.id)}
                                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                  </div>
                                ) : (
                                  <div className="col-span-1 flex items-start pt-1">
                                    <div className="w-5 h-5 border-2 border-gray-300 rounded bg-gray-100"></div>
                                  </div>
                                )}
                                
                                {/* Name and Basic Info */}
                                <div className="col-span-11">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Name */}
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                                      <div className="text-sm font-medium text-gray-900">
                                        {firstName} {lastName}
                                      </div>
                                    </div>
                                    
                                    {/* Company */}
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-500 mb-1">Company</label>
                                      <div className="text-sm text-gray-900">
                                        {lead.company_name || '-'}
                                      </div>
                                    </div>
                                    
                                    {/* Title */}
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
                                      <div className="text-sm text-gray-900">
                                        {lead.title || lead.profession || '-'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Second Row: Location and Email */}
                              <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-1"></div> {/* Spacer for checkbox */}
                                <div className="col-span-11">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Location */}
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-500 mb-1">Location</label>
                                      <div className="text-sm text-gray-600">
                                        {lead.location || '-'}
                                      </div>
                                    </div>
                                    
                                    {/* Email */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                                        Email <span className="text-red-500">*</span>
                                      </label>
                                      {email ? (
                                        // Email exists - show as read-only/disabled
                                        <div className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg bg-green-50 text-gray-700 flex items-center justify-between">
                                          <span className="flex-1">{email}</span>
                                          <span className="ml-2 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">
                                            Verified
                                          </span>
                                        </div>
                                      ) : hasEmail ? (
                                        // Lead has email but not in state - show as read-only
                                        <div className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                                          No email available
                                        </div>
                                      ) : (
                                        // No email - show as disabled, no editing allowed
                                        <div className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">
                                          No email available
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  )
                })()}

                {selectedRequirementId && getCurrentLeads().length === 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <p className="text-gray-600">No leads available for this requirement</p>
                  </div>
                )}

                {!selectedRequirementId && (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600">Please select a requirement to view leads</p>
                  </div>
                )}
              </div>
            )}

            {/* Selected Leads Summary */}
            {selectedLeads.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {selectedLeads.filter(id => {
                        const lead = getCurrentLeads().find(l => l.id === id)
                        const email = leadEmails[id] || lead?.email
                        return email && email.trim() !== ''
                      }).length} with email addresses
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLeads([])
                      setLeadEmails({})
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SMTP Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.smtp_credential_id}
                  onChange={(e) => handleFieldChange('smtp_credential_id', e.target.value)}
                  onBlur={() => handleBlur('smtp_credential_id')}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 text-gray-900 transition-all duration-200 ${
                    touched.smtp_credential_id && errors.smtp_credential_id
                      ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                >
                  <option value="">Select SMTP account</option>
                  {Array.isArray(smtpCredentials) && smtpCredentials.filter(c => c.is_verified).map(cred => (
                    <option key={cred.id} value={cred.id}>
                      {cred.display_name || cred.email} ({cred.provider})
                    </option>
                  ))}
                </select>
                {touched.smtp_credential_id && errors.smtp_credential_id && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.smtp_credential_id}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Leave empty to send immediately, or schedule for later
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/campaigns')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default CampaignCreate

