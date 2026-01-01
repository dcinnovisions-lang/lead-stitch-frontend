import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getProfiles, enrichWithEmails } from '../store/slices/profilesSlice'
import Layout from '../components/Layout'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'

interface ProfileFilters {
  search: string
  role: string
  location: string
}

function Profiles() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requirementId = searchParams.get('requirementId')
  
  const { profiles, loading } = useAppSelector((state: RootState) => state.profiles)
  const [localFilters, setLocalFilters] = useState<ProfileFilters>({
    search: '',
    role: '',
    location: '',
  })
  const [selectedProfiles, setSelectedProfiles] = useState<number[]>([])
  const [enriching, setEnriching] = useState<boolean>(false)

  useEffect(() => {
    dispatch(getProfiles(requirementId))
  }, [dispatch, requirementId])

  const handleFilterChange = (key: keyof ProfileFilters, value: string) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    dispatch(getProfiles(requirementId))
  }

  const handleEnrichEmails = async () => {
    if (selectedProfiles.length === 0) {
      alert('Please select profiles to enrich')
      return
    }

    setEnriching(true)
    try {
      await dispatch(enrichWithEmails(selectedProfiles))
      alert('Email enrichment completed!')
      dispatch(getProfiles(requirementId))
    } catch (error: unknown) {
      console.error('Error enriching emails:', error)
      alert('Failed to enrich emails')
    } finally {
      setEnriching(false)
    }
  }

  const toggleProfileSelection = (profileId: number) => {
    setSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    )
  }

  const filteredProfiles = profiles.filter(profile => {
    const searchLower = localFilters.search.toLowerCase()
    const profileName = (profile.name || profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim()).toLowerCase()
    const profileTitle = (profile.title || profile.profession || profile.headline || '').toLowerCase()
    const profileCompany = (profile.company_name || profile.company || '').toLowerCase()
    
    if (localFilters.search && !profileName.includes(searchLower) &&
        !profileTitle.includes(searchLower) &&
        !profileCompany.includes(searchLower)) {
      return false
    }
    if (localFilters.role && profile.decision_maker_role !== localFilters.role) {
      return false
    }
    if (localFilters.location && !profile.location?.toLowerCase().includes(localFilters.location.toLowerCase())) {
      return false
    }
    return true
  })

  // Get unique roles and locations for filters
  const uniqueRoles = [...new Set(profiles.map(p => p.decision_maker_role).filter(Boolean))]
  const uniqueLocations = [...new Set(profiles.map(p => p.location).filter(Boolean))]

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads & Profiles</h1>
          <p className="text-gray-600">View and manage your scraped LinkedIn profiles</p>
        </div>
        {selectedProfiles.length > 0 && (
          <button
            onClick={handleEnrichEmails}
            disabled={enriching}
            className="btn-primary"
          >
            {enriching ? 'Enriching...' : `Enrich ${selectedProfiles.length} Profiles with Emails`}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by name, title, company..."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={localFilters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="input-field"
            >
              <option value="">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select
              value={localFilters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="input-field"
            >
              <option value="">All Locations</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setLocalFilters({ search: '', role: '', location: '' })
                dispatch(getProfiles(requirementId))
              }}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Profiles List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profiles...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No profiles found</h3>
          <p className="text-gray-600 mb-6">Start by creating a business requirement and scraping LinkedIn profiles.</p>
          <button
            onClick={() => navigate('/business-requirement')}
            className="btn-primary"
          >
            Create Requirement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/profile/${profile.id}${requirementId ? `?requirementId=${requirementId}` : ''}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={selectedProfiles.includes(profile.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleProfileSelection(profile.id)
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <h3 className="font-semibold text-gray-900">{profile.name || profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Unknown'}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{profile.title || profile.profession || profile.headline || ''}</p>
                  {(profile.company_name || profile.company) && (
                    <p className="text-sm text-gray-500">{profile.company_name || profile.company || ''}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {profile.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {profile.location}
                  </div>
                )}
                {profile.email ? (
                  <div className="flex items-center text-sm text-green-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {profile.email}
                    {profile.email_verified && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Verified</span>
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
                {profile.decision_maker_role && (
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {profile.decision_maker_role}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/profile/${profile.id}${requirementId ? `?requirementId=${requirementId}` : ''}`)
                }}
                className="w-full btn-secondary text-sm"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredProfiles.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-600">
          Showing {filteredProfiles.length} of {profiles.length} profiles
        </div>
      )}
    </Layout>
  )
}

export default Profiles

