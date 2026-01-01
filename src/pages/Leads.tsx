import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import api from '../config/api'
import type { BusinessRequirement } from '../types/api/businessRequirement.types'
import type { Lead } from '../types/api/lead.types'
import type { LinkedInProfile } from '../types/api/profile.types'
import type { ModalConfig } from '../utils/modal'

interface LeadFormData {
  requirementId: string
  firstName: string
  lastName: string
  title: string
  profession: string
  company_name: string
  location: string
  email: string
  decision_maker_role: string
  profile_url: string
}

function Leads() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requirementIdParam = searchParams.get('requirementId')
  
  const [requirements, setRequirements] = useState<BusinessRequirement[]>([])
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [selectedRequirementId, setSelectedRequirementId] = useState<string>(requirementIdParam || 'all')
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedLeads, setSelectedLeads] = useState<number[]>([])
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [newLead, setNewLead] = useState<LeadFormData>({
    requirementId: '',
    firstName: '',
    lastName: '',
    title: '',
    profession: '',
    company_name: '',
    location: '',
    email: '',
    decision_maker_role: '',
    profile_url: '',
  })
  const [modal, setModal] = useState<ModalConfig | null>(null)

  useEffect(() => {
    fetchRequirements()
  }, [])

  useEffect(() => {
    if (selectedRequirementId === 'all') {
      fetchAllLeads()
    } else if (selectedRequirementId) {
      fetchLeadsByRequirement()
    }
  }, [selectedRequirementId])

  // Also update selectedRequirementId when URL param changes
  useEffect(() => {
    if (requirementIdParam && requirementIdParam !== selectedRequirementId) {
      setSelectedRequirementId(requirementIdParam)
    } else if (!requirementIdParam && selectedRequirementId !== 'all') {
      // If no param in URL but we have a selection, reset to 'all'
      setSelectedRequirementId('all')
    }
  }, [requirementIdParam, selectedRequirementId])

  const fetchRequirements = async () => {
    try {
      const response = await api.get<BusinessRequirement[]>('/business-requirements')
      console.log('All requirements response:', response.data)
      // Show all requirements, not just closed ones
      // Filter to show requirements that have leads (status can be 'closed', 'scraping', etc.)
      const allRequirements = response.data || []
      console.log('Requirements count:', allRequirements.length)
      setRequirements(allRequirements)
    } catch (error: unknown) {
      console.error('Error fetching requirements:', error)
      setRequirements([])
    }
  }

  const fetchAllLeads = async () => {
    try {
      setLoading(true)
      const response = await api.get<Lead[]>('/leads/all')
      console.log('All leads response:', response.data)
      setAllLeads(response.data || [])
    } catch (error) {
      console.error('Error fetching all leads:', error)
      setAllLeads([])
      setModal({
        title: 'Error',
        message: 'Failed to load leads. Please refresh the page and try again.',
        type: 'error',
        showCancel: false,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLeadsByRequirement = async () => {
    try {
      setLoading(true)
      // Use /profiles endpoint with requirementId query parameter for better filtering
      const response = await api.get<LinkedInProfile[]>(`/profiles?requirementId=${selectedRequirementId}`)
      console.log('Profiles response for requirement:', response.data)
      console.log('Selected requirement ID:', selectedRequirementId)
      
      // Transform profiles to leads format for consistency
      const leadsData: Lead[] = (response.data || []).map((profile: LinkedInProfile) => ({
        id: profile.id,
        name: profile.name || profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        title: profile.title || profile.profession || profile.headline || '',
        profession: profile.profession || '',
        location: profile.location || '',
        company_name: profile.company_name || profile.company || '',
        decision_maker_role: profile.decision_maker_role || '',
        profile_url: profile.profile_url || profile.linkedinUrl || '',
        scraped_at: profile.scraped_at || profile.scrapedAt || '',
        email: profile.email || null,
        email_verified: profile.email_verified || false,
        requirement_id: profile.business_requirement_id || profile.requirement_id || profile.requirementId || selectedRequirementId,
        requirement_name: profile.business_requirement?.operation_name || null,
      }))
      
      console.log(`Total leads found for requirement ${selectedRequirementId}:`, leadsData.length)
      
      setAllLeads(leadsData)
    } catch (error) {
      console.error('Error fetching leads by requirement:', error)
      setAllLeads([])
      setModal({
        title: 'Error',
        message: 'Failed to load leads. Please refresh the page and try again.',
        type: 'error',
        showCancel: false,
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  const selectAllLeads = () => {
    const allSelected = filteredLeads.every(lead => selectedLeads.includes(lead.id))
    if (allSelected) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id))
    }
  }

  // Helper function to split name into first and last name
  const splitName = (name) => {
    if (!name || typeof name !== 'string') {
      return { firstName: '', lastName: '' }
    }
    const trimmedName = name.trim()
    if (!trimmedName) {
      return { firstName: '', lastName: '' }
    }
    const parts = trimmedName.split(/\s+/).filter(p => p.length > 0)
    if (parts.length === 0) {
      return { firstName: '', lastName: '' }
    }
    const firstName = parts[0] || ''
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : ''
    return { firstName, lastName }
  }

  const handleEdit = (lead: Lead) => {
    const nameToSplit = lead?.name || ''
    const { firstName, lastName } = splitName(nameToSplit)
    
    const leadWithSplitName = {
      ...lead,
      firstName: firstName || '',
      lastName: lastName || '',
    }
    
    setEditingLead(leadWithSplitName)
    setShowAddModal(true)
  }

  const handleDelete = async (leadId: number) => {
    setModal({
      title: 'Delete Lead',
      message: 'Are you sure you want to delete this lead? This action cannot be undone.',
      type: 'warning',
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await api.delete(`/leads/${leadId}`)
          setModal({
            title: 'Deleted',
            message: 'Lead deleted successfully.',
            type: 'success',
            showCancel: false,
          })
          if (selectedRequirementId === 'all') {
            fetchAllLeads()
          } else {
            fetchLeadsByRequirement()
          }
        } catch (error: unknown) {
          console.error('Error deleting lead:', error)
          setModal({
            title: 'Error',
            message: 'Failed to delete lead. Please try again.',
            type: 'error',
            showCancel: false,
          })
        }
      },
    })
  }

  const handleSave = async () => {
    try {
      if (editingLead) {
        const fullName = `${(editingLead.firstName || '').trim()} ${(editingLead.lastName || '').trim()}`.trim()
        
        await api.put(`/leads/${editingLead.id}`, {
          firstName: editingLead.firstName,
          lastName: editingLead.lastName,
          name: fullName || editingLead.name,
          title: editingLead.title,
          profession: editingLead.profession,
          company_name: editingLead.company_name,
          location: editingLead.location,
          email: editingLead.email,
          decision_maker_role: editingLead.decision_maker_role,
        })
        setModal({
          title: 'Updated',
          message: 'Lead updated successfully.',
          type: 'success',
          showCancel: false,
        })
      } else {
        const fullName = `${(newLead.firstName || '').trim()} ${(newLead.lastName || '').trim()}`.trim()
        await api.post('/leads', {
          ...newLead,
          name: fullName,
        })
        setModal({
          title: 'Created',
          message: 'Lead created successfully.',
          type: 'success',
          showCancel: false,
        })
      }
      setShowAddModal(false)
      setEditingLead(null)
      setNewLead({
        requirementId: '',
        firstName: '',
        lastName: '',
        title: '',
        profession: '',
        company_name: '',
        location: '',
        email: '',
        decision_maker_role: '',
        profile_url: '',
      })
      if (selectedRequirementId === 'all') {
        fetchAllLeads()
      } else {
        fetchLeadsByRequirement()
      }
    } catch (error: unknown) {
      console.error('Error saving lead:', error)
      const axiosError = error as { response?: { data?: { error?: string; message?: string } }; message?: string }
      const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || 'Failed to save lead. Please try again.'
      setModal({
        title: 'Error',
        message: errorMessage,
        type: 'error',
        showCancel: false,
      })
    }
  }

  const handleCreateCampaign = () => {
    if (selectedLeads.length === 0) {
      setModal({
        title: 'No Leads Selected',
        message: 'Please select at least one lead to create a campaign.',
        type: 'warning',
        showCancel: false,
      })
      return
    }
    navigate('/campaigns/create', { state: { selectedLeads } })
  }

  // Group leads by requirement name (only when showing all requirements)
  interface RequirementGroup {
    requirement_id: string | number
    requirement_name: string
    leads: Lead[]
  }
  
  const leadsByRequirement: Record<string | number, RequirementGroup> = selectedRequirementId === 'all' 
    ? allLeads.reduce<Record<string | number, RequirementGroup>>((acc, lead) => {
        const requirementName = lead.requirement_name || 'Unknown Requirement'
        const requirementId = lead.requirement_id || 'unknown'
        
        // Use requirement_id as key to handle multiple requirements with same name
        if (!acc[requirementId]) {
          acc[requirementId] = {
            requirement_id: requirementId,
            requirement_name: requirementName,
            leads: []
          }
        }
        acc[requirementId].leads.push(lead)
        return acc
      }, {})
    : {
        // When filtering by specific requirement, create a single group
        [selectedRequirementId]: {
          requirement_id: selectedRequirementId,
          requirement_name: requirements.find(r => r.id === selectedRequirementId || String(r.id) === String(selectedRequirementId))?.operation_name || requirements.find(r => r.id === selectedRequirementId || String(r.id) === String(selectedRequirementId))?.operationName || 'Selected Requirement',
          leads: allLeads
        }
      }

  const filteredLeads = allLeads

  const selectedRequirement = requirements.find(req => 
    req.id === selectedRequirementId || 
    String(req.id) === String(selectedRequirementId) ||
    (typeof selectedRequirementId === 'string' && !isNaN(Number(selectedRequirementId)) && req.id === parseInt(selectedRequirementId, 10))
  )

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads</h1>
          <p className="text-gray-600">Manage your enriched leads from completed requirements</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedLeads.length > 0 && (
            <button
              onClick={handleCreateCampaign}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
            >
              Create Campaign ({selectedLeads.length})
            </button>
          )}
        </div>
      </div>

      {/* Requirement Selector */}
      <div className="mb-6 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Select Requirement:</label>
          <select
            value={selectedRequirementId}
            onChange={(e) => {
              setSelectedRequirementId(e.target.value)
              setSelectedLeads([])
              // Update URL if requirement is selected
              if (e.target.value === 'all') {
                navigate('/leads', { replace: true })
              } else {
                navigate(`/leads?requirementId=${e.target.value}`, { replace: true })
              }
            }}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Requirements</option>
            {requirements.map((req) => (
              <option key={req.id} value={req.id}>
                {req.operation_name || 'Untitled Requirement'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
          <p className="text-gray-600 mb-6">
            {selectedRequirementId === 'all' 
              ? 'Complete a requirement (scrape LinkedIn profiles and enrich with emails) to see leads here.'
              : 'No leads found for this requirement.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Total Count Display */}
          {filteredLeads.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">
                Showing <strong>{filteredLeads.length}</strong> {filteredLeads.length === 1 ? 'lead' : 'leads'}
                {selectedRequirementId !== 'all' && ` for selected requirement`}
              </p>
            </div>
          )}
          
          {/* Leads Cards - Grouped by Requirement */}
          {Object.values(leadsByRequirement).map((requirementGroup) => (
            <div key={requirementGroup.requirement_id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {requirementGroup.requirement_name} ({requirementGroup.leads.length} {requirementGroup.leads.length === 1 ? 'lead' : 'leads'})
                </h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requirementGroup.leads.map((lead) => {
                    return (
                      <div
                        key={lead.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => toggleLeadSelection(lead.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                              {lead.title && (
                                <p className="text-sm text-gray-600 mt-1">{lead.title}</p>
                              )}
                              {lead.company_name && (
                                <p className="text-sm text-gray-500 mt-1">{lead.company_name}</p>
                              )}
                            </div>
                          </div>
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          {lead.location && (
                            <div className="flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {lead.location}
                            </div>
                          )}
                          {lead.email ? (
                            <div className="flex items-center text-sm text-green-600">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {lead.email}
                              {lead.email_verified && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Verified</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center text-sm text-gray-400">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              No email
                            </div>
                          )}
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {lead.decision_maker_role}
                          </span>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => navigate(`/profile/${lead.id}${selectedRequirementId !== 'all' ? `?requirementId=${selectedRequirementId}` : ''}`)}
                            className="w-full px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLead ? 'Edit Lead' : 'Add New Lead'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={editingLead?.firstName ?? newLead.firstName ?? ''}
                    onChange={(e) => {
                      if (editingLead) {
                        setEditingLead({ ...editingLead, firstName: e.target.value })
                      } else {
                        setNewLead({ ...newLead, firstName: e.target.value })
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={editingLead?.lastName ?? newLead.lastName ?? ''}
                    onChange={(e) => {
                      if (editingLead) {
                        setEditingLead({ ...editingLead, lastName: e.target.value })
                      } else {
                        setNewLead({ ...newLead, lastName: e.target.value })
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingLead?.title || newLead.title}
                    onChange={(e) => {
                      if (editingLead) {
                        setEditingLead({ ...editingLead, title: e.target.value })
                      } else {
                        setNewLead({ ...newLead, title: e.target.value })
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={editingLead?.company_name || newLead.company_name}
                    onChange={(e) => {
                      if (editingLead) {
                        setEditingLead({ ...editingLead, company_name: e.target.value })
                      } else {
                        setNewLead({ ...newLead, company_name: e.target.value })
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editingLead?.location || newLead.location}
                    onChange={(e) => {
                      if (editingLead) {
                        setEditingLead({ ...editingLead, location: e.target.value })
                      } else {
                        setNewLead({ ...newLead, location: e.target.value })
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingLead?.email || newLead.email}
                    onChange={(e) => {
                      if (editingLead) {
                        setEditingLead({ ...editingLead, email: e.target.value })
                      } else {
                        setNewLead({ ...newLead, email: e.target.value })
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role (Decision Maker)</label>
                  <input
                    type="text"
                    value={editingLead?.decision_maker_role || newLead.decision_maker_role}
                    onChange={(e) => {
                      if (editingLead) {
                        setEditingLead({ ...editingLead, decision_maker_role: e.target.value })
                      } else {
                        setNewLead({ ...newLead, decision_maker_role: e.target.value })
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {!editingLead && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requirement</label>
                    <select
                      value={newLead.requirementId}
                      onChange={(e) => setNewLead({ ...newLead, requirementId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Requirement</option>
                      {requirements.map((req) => (
                        <option key={req.id} value={req.id}>
                          {req.operation_name || 'Untitled Requirement'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingLead(null)
                  setNewLead({
                    requirementId: '',
                    firstName: '',
                    lastName: '',
                    title: '',
                    profession: '',
                    company_name: '',
                    location: '',
                    email: '',
                    decision_maker_role: '',
                    profile_url: '',
                  })
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal */}
      {modal && (
        <Modal
          isOpen={true}
          onClose={() => setModal(null)}
          title={modal.title}
          message={modal.message}
          type={modal.type || 'info'}
          onConfirm={() => {
            if (modal.onConfirm) {
              modal.onConfirm()
            }
            setModal(null)
          }}
          onCancel={() => {
            if (modal.onCancel) {
              modal.onCancel()
            }
            setModal(null)
          }}
          confirmText={modal.confirmText || 'OK'}
          cancelText={modal.cancelText || 'Cancel'}
          showCancel={modal.showCancel || false}
        />
      )}
    </Layout>
  )
}

export default Leads
