import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../config/api'
import type { LinkedInProfile } from '../types/api/profile.types'

interface LocationState {
  requirementId?: string
}

function ProfileDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [profile, setProfile] = useState<LinkedInProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [enriching, setEnriching] = useState<boolean>(false)
  const [showEditEmailModal, setShowEditEmailModal] = useState<boolean>(false)
  const [emailInput, setEmailInput] = useState<string>('')
  const [updatingEmail, setUpdatingEmail] = useState<boolean>(false)
  
  // Get requirementId from URL params or location state
  const locationState = location.state as LocationState | null
  const requirementId = searchParams.get('requirementId') || locationState?.requirementId

  useEffect(() => {
    fetchProfile()
  }, [id])

  const fetchProfile = async () => {
    if (!id) return
    try {
      const response = await api.get<LinkedInProfile>(`/profiles/${id}`)
      setProfile(response.data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrichEmail = async () => {
    if (!id) return
    setEnriching(true)
    try {
      await api.post('/profiles/enrich-emails', { profileIds: [parseInt(id)] })
      await fetchProfile()
      alert('Email enrichment completed!')
    } catch (error: unknown) {
      console.error('Error enriching email:', error)
      alert('Failed to enrich email')
    } finally {
      setEnriching(false)
    }
  }

  const handleEditEmail = () => {
    // Pre-fill with existing email if available
    const existingEmail = profile.email || (profile.emails && profile.emails.length > 0 ? profile.emails[0].email : '')
    setEmailInput(existingEmail)
    setShowEditEmailModal(true)
  }

  const handleSaveEmail = async () => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailInput || !emailRegex.test(emailInput)) {
      alert('Please enter a valid email address')
      return
    }

    setUpdatingEmail(true)
    try {
      await api.put(`/profiles/${id}/email`, { email: emailInput })
      await fetchProfile()
      setShowEditEmailModal(false)
      setEmailInput('')
      alert('Email address saved successfully!')
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      const errorMessage = axiosError.response?.data?.message || 'Failed to save email address'
      alert(errorMessage)
    } finally {
      setUpdatingEmail(false)
    }
  }

  const handleCloseModal = () => {
    setShowEditEmailModal(false)
    setEmailInput('')
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </Layout>
    )
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Profile not found</p>
          <button 
            onClick={() => navigate(requirementId ? `/profiles?requirementId=${requirementId}` : '/leads')} 
            className="btn-primary mt-4"
          >
            Back to Leads
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => {
            // If we came from profiles page with requirementId, go back there
            // Otherwise go to main leads page
            if (requirementId) {
              navigate(`/profiles?requirementId=${requirementId}`)
            } else {
              navigate('/leads')
            }
          }}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Leads
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-primary-100 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{profile.name || profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Unknown'}</h1>
                <p className="text-lg text-gray-600">{profile.title || profile.profession || profile.headline || ''}</p>
                {(profile.company_name || profile.company) && (
                  <p className="text-gray-500">{profile.company_name || profile.company || ''}</p>
                )}
              </div>
            </div>
            {!profile.email && (
              <button
                onClick={handleEnrichEmail}
                disabled={enriching}
                className="btn-primary"
              >
                {enriching ? 'Enriching...' : 'Get Email Address'}
              </button>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {profile.location && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <p className="text-gray-900">{profile.location}</p>
              </div>
            )}
            {profile.decision_maker_role && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Decision Maker Role</label>
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {profile.decision_maker_role}
                </span>
              </div>
            )}
            {(profile.profile_url || profile.linkedinUrl) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                <a
                  href={profile.profile_url || profile.linkedinUrl || ''}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 flex items-center"
                >
                  View on LinkedIn
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
            {(profile.scraped_at || profile.scrapedAt) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scraped On</label>
                <p className="text-gray-900">
                  {new Date(profile.scraped_at || profile.scrapedAt || '').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Email Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Email Address</h2>
              <button
                onClick={handleEditEmail}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>{profile.email || (profile.emails && profile.emails.length > 0) ? 'Edit Email' : 'Add Email'}</span>
              </button>
            </div>
            {profile.email || (profile.emails && profile.emails.length > 0) ? (
              <div className="space-y-3">
                {(profile.emails || [{ email: profile.email, is_verified: profile.email_verified }]).map((emailData, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">{emailData.email || profile.email}</p>
                        <p className="text-sm text-gray-500">Source: {emailData.source || 'apollo'}</p>
                      </div>
                    </div>
                    {emailData.is_verified && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Verified
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 mb-4">No email address found</p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={handleEnrichEmail}
                    disabled={enriching}
                    className="btn-primary"
                  >
                    {enriching ? 'Enriching...' : 'Enrich with Apollo.io'}
                  </button>
                  <span className="text-gray-400">or</span>
                  <button
                    onClick={handleEditEmail}
                    className="btn-secondary"
                  >
                    Add Manually
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Experience Section */}
          {profile.experience_details && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Experience</h2>
              <div className="space-y-4">
                {Array.isArray(profile.experience_details) ? (
                  profile.experience_details.map((exp, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900">{exp.title}</h3>
                      <p className="text-sm text-gray-600">{exp.company}</p>
                      {exp.duration && (
                        <p className="text-xs text-gray-500 mt-1">{exp.duration}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">{JSON.stringify(profile.experience_details)}</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-gray-200 pt-6 mt-6 flex space-x-4">
            <button
              onClick={() => navigate(`/campaigns/new?profileId=${profile.id}`)}
              className="btn-primary"
            >
              Add to Campaign
            </button>
            <button
              onClick={() => {
                if (requirementId) {
                  navigate(`/profiles?requirementId=${requirementId}`)
                } else {
                  navigate('/leads')
                }
              }}
              className="btn-secondary"
            >
              Back to Leads
            </button>
          </div>
        </div>
      </div>

      {/* Edit Email Modal */}
      {showEditEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {profile.email || (profile.emails && profile.emails.length > 0) ? 'Edit Email Address' : 'Add Email Address'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={updatingEmail}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="example@company.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                disabled={updatingEmail}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !updatingEmail) {
                    handleSaveEmail()
                  }
                }}
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter a valid email address to manually add or update the email for this profile.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                disabled={updatingEmail}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmail}
                disabled={updatingEmail || !emailInput}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {updatingEmail && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{updatingEmail ? 'Saving...' : 'Save Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default ProfileDetail

