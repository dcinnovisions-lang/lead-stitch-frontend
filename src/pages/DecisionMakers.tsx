import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDecisionMakers, createDecisionMaker, updateDecisionMaker, deleteDecisionMaker, finalizeDecisionMakers } from '../store/slices/decisionMakerSlice'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import api from '../config/api'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'
import type { DecisionMaker } from '../types/api/businessRequirement.types'
import type { BusinessRequirement } from '../types/api/businessRequirement.types'
import type { ModalConfig } from '../utils/modal'

interface DecisionMakerForm {
  roleTitle: string
  industry: string
  priority: number
  reasoning: string
  industryRelevance: string
  confidence: number
}

function DecisionMakers() {
  const { requirementId } = useParams<{ requirementId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  
  const { decisionMakers, loading, error } = useAppSelector((state: RootState) => state.decisionMakers)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<DecisionMakerForm>({ roleTitle: '', industry: '', priority: 0, reasoning: '', industryRelevance: 'medium', confidence: 0.8 })
  const [newForm, setNewForm] = useState<DecisionMakerForm>({ roleTitle: '', industry: '', priority: 0, reasoning: '', industryRelevance: 'medium', confidence: 0.8 })
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [finalizing, setFinalizing] = useState<boolean>(false)
  const [requirement, setRequirement] = useState<BusinessRequirement | null>(null)
  const [modal, setModal] = useState<ModalConfig | null>(null)

  useEffect(() => {
    if (requirementId) {
      dispatch(getDecisionMakers(requirementId))
      // Fetch requirement details
      api.get<BusinessRequirement>(`/business-requirements/${requirementId}`)
        .then(res => setRequirement(res.data))
        .catch(err => console.error('Error fetching requirement:', err))
    }
  }, [dispatch, requirementId])

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newForm.roleTitle.trim()) return

    try {
      if (requirementId) {
        await dispatch(createDecisionMaker({
          requirementId: requirementId,
          roleTitle: newForm.roleTitle,
          industry: newForm.industry || undefined, // Send industry if provided
          priority: newForm.priority > 0 ? newForm.priority : null,
        }))
      }
      setNewForm({ roleTitle: '', industry: '', priority: 0, reasoning: '', industryRelevance: 'medium', confidence: 0.8 })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding decision maker:', error)
    }
  }

  const handleEdit = (dm: DecisionMaker) => {
    setEditingId(dm.id)
    const priorityValue = typeof dm.priority === 'string' 
      ? (dm.priority === 'high' ? 3 : dm.priority === 'medium' ? 2 : 1)
      : (dm.priority || 2)
    setEditForm({ 
      roleTitle: dm.roleTitle || dm.role_title || '', 
      industry: (dm as any).industry || '',
      priority: priorityValue,
      reasoning: dm.reasoning || '',
      industryRelevance: dm.industry_relevance || dm.industryRelevance || 'medium',
      confidence: dm.confidence || 0.8
    })
  }

  const handleUpdate = async (id: number) => {
    if (!editForm.roleTitle.trim()) return

    try {
      // Convert number priority to string format
      const priorityString: 'high' | 'medium' | 'low' = 
        editForm.priority >= 3 ? 'high' : 
        editForm.priority >= 2 ? 'medium' : 'low'
      
      await dispatch(updateDecisionMaker({ 
        id, 
        roleTitle: editForm.roleTitle,
        industry: editForm.industry || undefined, // Send industry if provided
        priority: priorityString
      }))
      setEditingId(null)
      setEditForm({ roleTitle: '', industry: '', priority: 0, reasoning: '', industryRelevance: 'medium', confidence: 0.8 })
    } catch (error) {
      console.error('Error updating decision maker:', error)
    }
  }

  const handleDelete = async (id: number) => {
    setModal({
      title: 'Delete Decision Maker',
      message: 'Are you sure you want to delete this decision maker? This action cannot be undone.',
      type: 'warning',
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await dispatch(deleteDecisionMaker(id))
          setModal({
            title: 'Deleted',
            message: 'Decision maker deleted successfully.',
            type: 'success',
            showCancel: false,
          })
        } catch (error) {
          console.error('Error deleting decision maker:', error)
          setModal({
            title: 'Error',
            message: 'Failed to delete decision maker. Please try again.',
            type: 'error',
            showCancel: false,
          })
        }
      },
    })
  }

  const handleFinalize = async () => {
    if (decisionMakers.length === 0) {
      setModal({
        title: 'No Decision Makers',
        message: 'Please add at least one decision maker before finalizing.',
        type: 'warning',
        showCancel: false,
      })
      return
    }

    // Finalize decision makers only (scraping will be triggered from RequirementDetail page)
    setFinalizing(true)
    try {
      if (!requirementId) return
      const result = await dispatch(finalizeDecisionMakers(requirementId))
      if (finalizeDecisionMakers.fulfilled.match(result)) {
        setModal({
          title: 'Decision Makers Finalized',
          message: `Successfully finalized ${decisionMakers.length} decision maker(s). You can now start scraping from the requirement detail page.`,
          type: 'success',
          showCancel: false,
          onConfirm: () => {
            // Navigate back to requirement detail page
            navigate(`/requirements/${requirementId}`)
          },
        })
      } else {
        setModal({
          title: 'Error',
          message: 'Failed to finalize decision makers. Please try again.',
          type: 'error',
          showCancel: false,
        })
      }
    } catch (error) {
      console.error('Error finalizing:', error)
      setModal({
        title: 'Error',
        message: 'Failed to finalize decision makers. Please try again.',
        type: 'error',
        showCancel: false,
      })
    } finally {
      setFinalizing(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({ roleTitle: '', industry: '', priority: 0, reasoning: '', industryRelevance: 'medium', confidence: 0.8 })
    setShowAddForm(false)
    setNewForm({ roleTitle: '', industry: '', priority: 0, reasoning: '', industryRelevance: 'medium', confidence: 0.8 })
  }

  const getRelevanceColor = (relevance: string | undefined): string => {
    switch (relevance?.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConfidenceColor = (confidence: number | undefined): string => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/requirements')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Requirements</span>
          </button>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Decision Makers</h1>
              {requirement && (
                <div className="space-y-2">
                  <p className="text-lg text-gray-600">{requirement.operation_name || 'Untitled Requirement'}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    {requirement.industry && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {requirement.industry}
                      </span>
                    )}
                    {requirement.target_location && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {requirement.target_location}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Add New Decision Maker */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Decision Maker</h2>
                <p className="text-sm text-gray-600 mt-1">Manually add a decision maker role</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  showAddForm
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-lg'
                }`}
              >
                {showAddForm ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New
                  </>
                )}
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="p-6 bg-gray-50">
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newForm.roleTitle}
                      onChange={(e) => setNewForm({ ...newForm, roleTitle: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., CEO, CTO, VP of Sales"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Industry {requirement?.industry && (
                        <span className="text-xs font-normal text-gray-500">(defaults to: {requirement.industry})</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={newForm.industry}
                      onChange={(e) => setNewForm({ ...newForm, industry: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder={requirement?.industry || "e.g., Software, Healthcare"}
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                      Leave empty to use requirement's industry ({requirement?.industry || 'None'})
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <input
                    type="number"
                    value={newForm.priority || ''}
                    onChange={(e) => setNewForm({ ...newForm, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Auto-assigned if empty"
                    min="0"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">Leave empty for automatic priority assignment</p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
                  >
                    Add Decision Maker
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCancel} 
                    className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Decision Makers List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Loading decision makers...</p>
            </div>
          </div>
        ) : decisionMakers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No decision makers yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Add decision makers manually or go back to identify them using AI
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
              >
                Add Decision Maker
              </button>
              <button
                onClick={() => navigate('/requirements')}
                className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Requirements
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Decision Makers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Stats Summary */}
              <div className="lg:col-span-2 mb-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Decision Makers</p>
                          <p className="text-2xl font-bold text-gray-900">{decisionMakers.length}</p>
                        </div>
                      </div>
                      {decisionMakers.filter(dm => (dm.api_source || dm.apiSource) === 'gemini' || (dm.api_source || dm.apiSource) === 'openai').length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">AI Identified</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {decisionMakers.filter(dm => (dm.api_source || dm.apiSource) === 'gemini' || (dm.api_source || dm.apiSource) === 'openai').length}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {decisionMakers.map((dm, index) => (
                <div
                  key={dm.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden group"
                >
                  {editingId === dm.id ? (
                    <div className="p-6 bg-blue-50/50">
                      <form className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Role Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editForm.roleTitle}
                            onChange={(e) => setEditForm({ ...editForm, roleTitle: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
                          <input
                            type="text"
                            value={editForm.industry}
                            onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            placeholder={requirement?.industry || "e.g., Software, Healthcare"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                          <input
                            type="number"
                            value={editForm.priority}
                            onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            min="0"
                          />
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => handleUpdate(dm.id)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="p-6 relative">
                      {/* Action Buttons - Top Right */}
                      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(dm)}
                          className="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(dm.id)}
                          className="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-start gap-4 pr-12">
                        {/* Number Badge */}
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-blue-50">
                          <span className="text-white font-bold text-lg">{index + 1}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Role Title */}
                          <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight pr-8">
                            {dm.roleTitle || dm.role_title || 'Untitled Role'}
                          </h3>

                          {/* Industry Badge (if specified) */}
                          {(dm as any).industry && (
                            <div className="mb-3">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {(dm as any).industry}
                              </span>
                            </div>
                          )}

                          {/* Tags Row */}
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Priority {dm.priority}
                            </span>
                            {(dm.api_source || dm.apiSource) && (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
                                (dm.api_source || dm.apiSource) === 'gemini' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                (dm.api_source || dm.apiSource) === 'openai' ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                                {(dm.api_source || dm.apiSource) === 'gemini' ? 'AI Identified (Gemini)' :
                                 (dm.api_source || dm.apiSource) === 'openai' ? 'AI Identified (OpenAI)' :
                                 'Manual Entry'}
                              </span>
                            )}
                            {(dm.industry_relevance || dm.industryRelevance) && (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${getRelevanceColor(dm.industry_relevance || dm.industryRelevance || '')}`}>
                                {(dm.industry_relevance || dm.industryRelevance || '').charAt(0).toUpperCase() + (dm.industry_relevance || dm.industryRelevance || '').slice(1)} Relevance
                              </span>
                            )}
                            {dm.confidence && (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${getConfidenceColor(dm.confidence)}`}>
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {(dm.confidence * 100).toFixed(0)}% Confidence
                              </span>
                            )}
                          </div>

                          {/* Reasoning/Description */}
                          {dm.reasoning && (
                            <div className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
                              <p className="text-sm text-gray-700 leading-relaxed">{dm.reasoning}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Finalize Section */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50/30 rounded-2xl border-2 border-blue-200 shadow-lg p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Ready to Finalize?</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Review your {decisionMakers.length} decision maker{decisionMakers.length !== 1 ? 's' : ''} and finalize them. You can start scraping from the requirement detail page.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-lg text-sm text-gray-700 border border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {decisionMakers.length} roles identified
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-lg text-sm text-gray-700 border border-gray-200">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Ready to finalize
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleFinalize}
                  disabled={finalizing || decisionMakers.length === 0}
                  className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {finalizing ? (
                    <span className="flex items-center gap-3">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Finalizing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Finalize Decision Makers
                    </span>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

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

export default DecisionMakers
