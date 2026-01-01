import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import api from '../config/api'
import { enrichWithEmails } from '../store/slices/profilesSlice'
import { useAppDispatch } from '../store/hooks'
import type { BusinessRequirement } from '../types/api/businessRequirement.types'
import type { Profile } from '../types/api/profile.types'
import type { ModalConfig } from '../utils/modal'
import { AxiosError } from 'axios'
import { getErrorMessage, formatErrorDisplay, isErrorRetryable, getAllErrors } from '../utils/errorFormatter'

const statusStyles: Record<string, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
}

interface ScrapingStatus {
  status: 'pending' | 'in_progress' | 'processing' | 'running' | 'completed' | 'failed' | string
  progress?: number
  profiles?: Profile[]
  message?: string
  currentRole?: string
  profilesScraped?: number
  totalRoles?: number
  rolesCompleted?: number
  error?: string
  // Step tracking information
  current_step?: string
  step_details?: {
    step: string
    message: string
    progress: number
  }
  login_status?: 'pending' | 'success' | 'failed' | 'challenge_required'
  login_attempt?: number
  login_max_attempts?: number
  error_details?: {
    has_errors?: boolean
    errors?: Array<{
      error_code?: string
      user_message?: string
      category?: string
      retry?: boolean
      actionable?: boolean
    }>
    primary_error?: {
      error_code?: string
      user_message?: string
      category?: string
      retry?: boolean
      actionable?: boolean
    }
  }
}

function RequirementDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const [requirement, setRequirement] = useState<BusinessRequirement | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [scrapingStatus, setScrapingStatus] = useState<ScrapingStatus | null>(null)
  const [scrapingJobId, setScrapingJobId] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState<boolean>(false)
  const [startingScrape, setStartingScrape] = useState<boolean>(false)
  const [scrapingInProgress, setScrapingInProgress] = useState<boolean>(false)
  const [enrichingEmails, setEnrichingEmails] = useState<boolean>(false)
  const [modal, setModal] = useState<ModalConfig | null>(null)
  const prevLocationRef = useRef<string>(location.pathname)

  const fetchRequirement = async () => {
    try {
      setRefreshing(true)
      if (!id) return
      const [requirementRes, profilesRes] = await Promise.all([
        api.get<BusinessRequirement>(`/business-requirements/${id}`),
        api.get<Profile[]>(`/profiles?requirementId=${id}`),
      ])

      setRequirement(requirementRes.data)
      setProfiles(Array.isArray(profilesRes.data) ? profilesRes.data : [])
      setError(null)
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      console.error('Failed to load requirement detail:', err)
      setError(axiosError.response?.data?.message || 'Unable to load requirement.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Automatically enrich emails after scraping completes
  const autoEnrichEmails = useCallback(async () => {
    if (!id) return
    
    try {
      // Wait a moment for profiles to be saved
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Fetch latest profiles to get the scraped ones
      const profilesRes = await api.get<Profile[]>(`/profiles?requirementId=${id}`)
      const latestProfiles = Array.isArray(profilesRes.data) ? profilesRes.data : []
      
      // Get profiles without emails
      const profilesWithoutEmails = latestProfiles.filter(profile => !profile.email || !profile.email.trim())
      
      if (profilesWithoutEmails.length === 0) {
        // All profiles already have emails
        return
      }
      
      // Get profile IDs for enrichment
      const profileIds = profilesWithoutEmails.map(profile => profile.id).filter((id): id is number => typeof id === 'number')
      
      if (profileIds.length === 0) {
        return
      }
      
      // Start enrichment
      setEnrichingEmails(true)
      console.log(`Auto-enriching ${profileIds.length} profiles with Apollo.io...`)
      
      // Call enrichment API
      const result = await dispatch(enrichWithEmails(profileIds))
      
      if (enrichWithEmails.fulfilled.match(result)) {
        // Refresh profiles after enrichment - fetch directly
        const [requirementRes, profilesRes] = await Promise.all([
          api.get<BusinessRequirement>(`/business-requirements/${id}`),
          api.get<Profile[]>(`/profiles?requirementId=${id}`),
        ])
        setRequirement(requirementRes.data)
        setProfiles(Array.isArray(profilesRes.data) ? profilesRes.data : [])
        console.log(`Successfully enriched ${profileIds.length} profiles with emails`)
      } else {
        console.error('Failed to auto-enrich emails:', result.payload)
      }
    } catch (error) {
      console.error('Error auto-enriching emails:', error)
    } finally {
      setEnrichingEmails(false)
    }
  }, [id, dispatch])

  // Restore scraping state from localStorage on page load
  useEffect(() => {
    const storedJobId = localStorage.getItem(`scraping_job_${id}`)
    if (storedJobId) {
      console.log('Restoring scraping state from localStorage:', storedJobId)
      setScrapingJobId(storedJobId)
      setScrapingInProgress(true)
      
      // Immediately check job status
      const checkJobStatus = async () => {
        try {
          const response = await api.get(`/profiles/scraping-status/${storedJobId}`)
          const status = response.data
          setScrapingStatus(status)
          
          // If job is already completed or failed, clear the state
          if (status.status === 'completed') {
            setScrapingInProgress(false)
            localStorage.removeItem(`scraping_job_${id}`)
            // Refresh data to show updated profiles
            await fetchRequirement()
            // Trigger auto-enrichment if scraping was already completed
            setTimeout(async () => {
              try {
                await autoEnrichEmails()
              } catch (err) {
                console.error('Auto-enrich error:', err)
              }
            }, 3000)
          } else if (status.status === 'failed') {
            setScrapingInProgress(false)
            localStorage.removeItem(`scraping_job_${id}`)
            // Refresh data to show updated profiles
            await fetchRequirement()
          }
        } catch (err) {
          console.error('Error checking job status on load:', err)
          // If job not found, clear the state
          if (err.response?.status === 404) {
            setScrapingInProgress(false)
            localStorage.removeItem(`scraping_job_${id}`)
          }
        }
      }
      
      checkJobStatus()
    }
  }, [id])

  useEffect(() => {
    fetchRequirement()
  }, [id])

  // Refresh when navigating back to this page (e.g., from decision makers page)
  useEffect(() => {
    if (prevLocationRef.current !== location.pathname && location.pathname === `/requirements/${id}`) {
      // User navigated back to this page, refresh data
      fetchRequirement()
      prevLocationRef.current = location.pathname
    }
  }, [location.pathname, id])

  // Poll for scraping status if job is active
  useEffect(() => {
    let pollInterval = null

    // Only poll if we have a job ID and job is not completed or failed
    const shouldPoll = scrapingJobId && 
      scrapingStatus?.status !== 'completed' && 
      scrapingStatus?.status !== 'failed' &&
      (scrapingInProgress || !scrapingStatus?.status || scrapingStatus?.status === 'processing' || scrapingStatus?.status === 'running' || scrapingStatus?.status === 'pending')

    if (shouldPoll) {
      setIsPolling(true)
      
      const pollStatus = async () => {
        try {
          const response = await api.get(`/profiles/scraping-status/${scrapingJobId}`)
          const status = response.data
          
          // Debug logging to see what we're receiving
          console.log('[Scraping Status] Received status:', {
            status: status.status,
            current_step: status.current_step || status.currentStep,
            step_details: status.step_details || status.stepDetails,
            login_status: status.login_status || status.loginStatus,
            login_attempt: status.login_attempt || status.loginAttempt,
            current_role: status.currentRole || status.current_role,
            profiles_scraped: status.profilesScraped || status.profiles_scraped
          })
          
          // Always update status to get latest step information
          setScrapingStatus(status)

          // If completed, stop polling and refresh data
          if (status.status === 'completed') {
            console.log('[Scraping Status] Job completed, stopping polling and refreshing data')
            setIsPolling(false)
            setScrapingInProgress(false)
            // Keep status in state briefly to show completion, then clear
            setTimeout(() => {
              setScrapingJobId(null)
              setScrapingStatus(null)
            }, 2000)
            // Refresh requirement and profiles immediately
            await fetchRequirement()
            // Clear job ID from localStorage
            localStorage.removeItem(`scraping_job_${id}`)
            
            // Wait a bit for profiles to be fully saved, then auto-enrich
            setTimeout(async () => {
              try {
                await autoEnrichEmails()
              } catch (err) {
                console.error('Auto-enrich error:', err)
              }
            }, 3000)
          } else if (status.status === 'failed') {
            // If failed, stop polling but keep state so button can show retry
            console.log('[Scraping Status] Job failed, stopping polling')
            setIsPolling(false)
            setScrapingInProgress(false)
            // Update scraping status with error details
            setScrapingStatus(status)
            // Refresh data to show current state
            await fetchRequirement()
          }
        } catch (err) {
          console.error('Error polling scraping status:', err)
          const errorDisplay = formatErrorDisplay(err)
          
          // Set error status with structured error details
          setScrapingStatus({
            status: 'failed',
            error: errorDisplay.message,
            error_details: {
              has_errors: true,
              primary_error: {
                error_code: errorDisplay.code || undefined,
                user_message: errorDisplay.message,
                category: errorDisplay.category || undefined,
                retry: errorDisplay.retryable,
                actionable: errorDisplay.actionable,
              },
            },
          })
          
          setIsPolling(false)
          setScrapingInProgress(false)
        }
      }

      // Poll immediately, then every 2 seconds for real-time updates
      pollStatus()
      pollInterval = setInterval(pollStatus, 2000)
    } else {
      setIsPolling(false)
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [scrapingJobId, scrapingStatus?.status, scrapingInProgress, id])

  // Check if there's an active scraping job in localStorage
  useEffect(() => {
    const storedJobId = localStorage.getItem(`scraping_job_${id}`)
    if (storedJobId) {
      setScrapingJobId(storedJobId)
    }
  }, [id])

  const hasDecisionMakers = requirement?.decisionMakers?.length > 0
  const scrapedProfiles = profiles.length
  const profilesWithEmail = profiles.filter((profile) => !!profile.email).length

  // Check if scraping is complete but emails weren't enriched yet (on page load)
  useEffect(() => {
    const isScraping = scrapingStatus?.status === 'processing' || scrapingStatus?.status === 'running' || scrapingStatus?.status === 'pending' || scrapingStatus?.status === 'in_progress'
    if (scrapedProfiles > 0 && profilesWithEmail === 0 && !enrichingEmails && !scrapingInProgress && !isScraping) {
      // Scraping was completed but enrichment hasn't happened yet
      console.log('Scraping completed but emails not enriched. Starting auto-enrichment...')
      setTimeout(async () => {
        try {
          await autoEnrichEmails()
        } catch (err) {
          console.error('Auto-enrich error:', err)
        }
      }, 2000)
    }
  }, [scrapedProfiles, profilesWithEmail, enrichingEmails, scrapingInProgress, requirement?.status, id])

  const executeScraping = useCallback(async () => {
    if (!requirement || !hasDecisionMakers) {
      return
    }

    setStartingScrape(true)
    try {
      // 1) Get decision maker roles
      const roleTitles = requirement.decisionMakers
        .map(dm => dm.role_title)
        .filter(Boolean)

      if (roleTitles.length === 0) {
        setModal({
          title: 'No Decision Makers',
          message: 'No decision maker roles found. Please add decision makers first.',
          type: 'warning',
          showCancel: false,
          confirmText: 'OK',
          onConfirm: () => setModal(null),
        })
        setStartingScrape(false)
        return
      }

      // 2) Start profile search with Apollo.io (no credentials needed)
      const scrapeResponse = await api.post('/profiles/scrape', {
        requirementId: id,
      })

      // 3) Store job ID for status polling and immediately show search status
      if (scrapeResponse.data?.jobId) {
        localStorage.setItem(`scraping_job_${id}`, scrapeResponse.data.jobId)
        setScrapingJobId(scrapeResponse.data.jobId)
        // Immediately set search in progress state
        setScrapingInProgress(true)
        setScrapingStatus({
          status: 'pending',
          message: 'Profile search job queued...',
        })
      }

      // Show success modal
      setModal({
        title: 'Profile Search Started Successfully!',
        message: `Apollo.io profile search has been initiated for ${roleTitles.length} role(s). The process is running in the background and may take several minutes. You will receive an email notification when it completes.`,
        type: 'success',
        showCancel: false,
        confirmText: 'OK',
        onConfirm: () => {
          setModal(null)
        },
      })
    } catch (scrapingError) {
      console.error('Error starting profile search:', scrapingError)
      
      // Use structured error formatting
      const errorDisplay = formatErrorDisplay(scrapingError)
      const errorMsg = getErrorMessage(scrapingError)
      
      if (scrapingError.response?.data?.requiresApiKey) {
        setModal({
          title: 'Apollo.io API Key Required',
          message: 'Apollo.io API key is not configured. Please set APOLLO_API_KEY in your environment variables.',
          type: 'warning',
          showCancel: false,
          confirmText: 'OK',
          onConfirm: () => setModal(null),
        })
      } else {
        // Show detailed error message with category info
        const allErrors = getAllErrors(scrapingError)
        const errorDetailsMessage = allErrors.length > 1 
          ? `Multiple issues detected:\n${allErrors.map((e, i) => `${i + 1}. ${e.user_message || e.message}`).join('\n')}`
          : errorMsg
        
        setModal({
          title: errorDisplay.category === 'AUTH_ERROR' ? 'Authentication Error' :
                 errorDisplay.category === 'RATE_LIMIT_ERROR' ? 'Rate Limit Exceeded' :
                 errorDisplay.category === 'SYSTEM_ERROR' ? 'System Error' :
                 errorDisplay.category === 'NETWORK_ERROR' ? 'Network Error' :
                 'Profile Search Failed',
          message: errorDetailsMessage,
          type: 'error',
          showCancel: false,
          confirmText: errorDisplay.retryable ? 'Retry' : 'OK',
          onConfirm: () => {
            setModal(null)
            if (errorDisplay.retryable) {
              // Automatically retry if retryable
              setTimeout(() => executeScraping(), 1000)
            }
          },
        })
      }
    } finally {
      setStartingScrape(false)
    }
  }, [requirement, hasDecisionMakers, id, navigate])

  const handleStartScraping = useCallback(async () => {
    if (!requirement || !hasDecisionMakers) {
      setModal({
        title: 'Decision Makers Required',
        message: 'Please ensure decision makers are identified and finalized before starting profile search.',
        type: 'warning',
        showCancel: false,
      })
      return
    }

    // Show confirmation modal first
    const roleTitles = requirement.decisionMakers
      .map(dm => dm.role_title || dm.roleTitle)
      .filter(Boolean) as string[]
    
    setModal({
      title: 'Search Profiles with Apollo.io?',
      message: (
        <div className="text-left">
          <p className="mb-3">
            You're about to search for profiles using Apollo.io for <strong>{roleTitles.length}</strong> decision maker role(s):
          </p>
          <ul className="list-decimal list-inside mb-3 space-y-1 text-gray-700">
            {roleTitles.map((role, idx) => (
              <li key={idx}>{role}</li>
            ))}
          </ul>
          <p className="text-sm text-gray-600">
            This process may take several minutes. You can track the progress on this page.
          </p>
        </div>
      ),
      type: 'info',
      showCancel: true,
      confirmText: 'Search with Apollo.io',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setModal(null)
        await executeScraping()
      },
      onCancel: () => setModal(null),
    })
  }, [requirement, hasDecisionMakers, executeScraping])

  const journeySteps = useMemo(() => {
    return [
      {
        id: 'requirement',
        title: 'Requirement Captured',
        description: 'Business context prepared and saved.',
        complete: !!requirement,
      },
      {
        id: 'decision-makers',
        title: 'Decision Makers',
        description: hasDecisionMakers
          ? `${requirement.decisionMakers.length} roles identified.`
          : 'Waiting for AI/Manual identification.',
        complete: hasDecisionMakers,
      },
      {
        id: 'scraping',
        title: 'Profile Search',
        description: scrapedProfiles
          ? `${scrapedProfiles} profiles found via Apollo.io.`
          : scrapingStatus?.status === 'processing' || scrapingStatus?.status === 'running' || scrapingStatus?.status === 'pending' || scrapingStatus?.status === 'in_progress'
            ? scrapingStatus.currentRole 
              ? `Searching for: ${scrapingStatus.currentRole} (${scrapingStatus.profilesScraped || 0} profiles found so far...)`
              : `Searching profiles... (${scrapingStatus.profilesScraped || 0} profiles found so far)`
            : scrapingStatus?.status === 'completed' || scrapedProfiles > 0
            ? 'Profile search completed.'
            : 'Search for profiles using Apollo.io database.',
        complete: scrapedProfiles > 0,
      },
      {
        id: 'emails',
        title: 'Emails Enriched',
        description: enrichingEmails
          ? 'Automatically enriching emails with Apollo.io...'
          : profilesWithEmail
          ? `${profilesWithEmail} profiles now have contact emails.`
          : scrapedProfiles > 0
          ? 'Email enrichment will start automatically after profile search completes.'
          : 'Run Apollo.io enrichment to unlock verified emails.',
        complete: profilesWithEmail > 0,
      },
      {
        id: 'campaign',
        title: 'Campaign Ready',
        description: profilesWithEmail
          ? 'Launch your email outreach with these contacts.'
          : 'Complete email enrichment to unlock campaigns.',
        complete: profilesWithEmail > 0,
      },
    ]
  }, [requirement, hasDecisionMakers, scrapedProfiles, profilesWithEmail])

  const statusBadge = useMemo(() => {
    if (!hasDecisionMakers) {
      return { label: 'Awaiting Decision Makers', tone: 'warning' }
    }
    if (!scrapedProfiles) {
      const isScraping = scrapingStatus?.status === 'processing' || scrapingStatus?.status === 'running' || scrapingStatus?.status === 'pending'
      return isScraping
        ? { 
            label: scrapingStatus.currentRole 
              ? `Searching: ${scrapingStatus.currentRole}` 
              : 'Searching Profiles', 
            tone: 'info' 
          }
        : requirement?.status === 'scraping'
        ? { label: 'Searching Profiles', tone: 'info' }
        : { label: 'Ready to Search', tone: 'info' }
    }
    if (!profilesWithEmail) {
      return { label: 'Profiles Found', tone: 'info' }
    }
    return { label: 'Campaign Ready', tone: 'success' }
  }, [requirement, hasDecisionMakers, scrapedProfiles, profilesWithEmail, scrapingStatus])

  const primaryAction = useMemo(() => {
    if (!requirement) return null
    if (!hasDecisionMakers) {
      return {
        label: 'Identify Decision Makers',
        cta: 'Go to Decision Maker Workflow',
        onClick: () => navigate(`/decision-makers/${requirement.id}`),
        bg: 'from-sky-500 to-blue-600',
        description: 'Use AI suggestions or add roles manually before searching.',
      }
    }
    if (!scrapedProfiles) {
      // Check if decision makers are finalized by checking the requirement's finalized timestamp
      const areFinalized = requirement?.decision_makers_finalized_at || requirement?.decisionMakersFinalizedAt
      
      if (!areFinalized && requirement?.decisionMakers?.length > 0) {
        return {
          label: 'Finalize Decision Makers First',
          cta: 'Go to Finalize',
          onClick: () => navigate(`/decision-makers/${requirement.id}`),
          bg: 'from-amber-500 to-orange-600',
          description: 'Please finalize your decision makers before starting profile search.',
        }
      }
      
      // If no decision makers, show identify message
      if (!hasDecisionMakers) {
        return {
          label: 'Identify Decision Makers',
          cta: 'Go to Decision Maker Workflow',
          onClick: () => navigate(`/decision-makers/${requirement.id}`),
          bg: 'from-sky-500 to-blue-600',
          description: 'Use AI suggestions or add roles manually before searching.',
        }
      }
      
      const isScraping = scrapingInProgress || scrapingStatus?.status === 'processing' || scrapingStatus?.status === 'running' || scrapingStatus?.status === 'pending'
      const isFailed = scrapingStatus?.status === 'failed'
      
      // Hide button completely when scraping is in progress
      // Only show it if scraping failed or not started
      if (isScraping && !isFailed) {
        return null // Don't show button when scraping is active
      }
      
      return {
        label: isFailed ? 'Retry Profile Search' : 'Search Profiles with Apollo.io',
        cta: isFailed ? 'Retry Search' : 'Search with Apollo.io',
        onClick: handleStartScraping,
        bg: isFailed ? 'from-orange-600 to-red-600' : 'from-blue-600 to-indigo-600',
        description: isFailed ? 'Previous search attempt failed. Click to retry.' : 'Search for profiles using Apollo.io database for your decision makers.',
        disabled: startingScrape,
      }
    }
    if (!profilesWithEmail) {
      // Show automatic enrichment status if enriching is in progress
      if (enrichingEmails) {
        return {
          label: 'Enriching Emails Automatically',
          cta: 'Enriching with Apollo.io...',
          onClick: () => {},
          bg: 'from-indigo-600 to-violet-600',
          description: 'Email enrichment is running automatically. Please wait...',
          disabled: true,
        }
      }
      // If profiles are scraped but enrichment hasn't started yet, show that it will happen automatically
      if (scrapedProfiles > 0) {
        return {
          label: 'Email Enrichment Starting',
          cta: 'Auto-enriching with Apollo.io...',
          onClick: () => {},
          bg: 'from-indigo-600 to-violet-600',
          description: 'Email enrichment will start automatically. Please wait a moment...',
          disabled: true,
        }
      }
      // Fallback: Manual enrichment button (shouldn't normally show if auto-enrich works)
      return {
        label: 'Enrich with Apollo.io',
        cta: 'Find Verified Emails',
        onClick: () => navigate(`/profiles?requirementId=${requirement.id}`),
        bg: 'from-indigo-600 to-violet-600',
        description: 'Jump into the Profiles workspace to run Apollo enrichment.',
      }
    }
    return {
      label: 'Launch Campaign',
      cta: 'Create Email Campaign',
      onClick: () =>
        navigate('/campaigns/new', {
          state: { requirementId: requirement.id, leadSource: 'linkedin' },
        }),
      bg: 'from-emerald-500 to-green-600',
      description: 'All contacts have emails—convert them into a tailored outreach.',
    }
  }, [requirement, hasDecisionMakers, scrapedProfiles, profilesWithEmail, scrapingInProgress, scrapingStatus, enrichingEmails, navigate, handleStartScraping])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Loading requirement...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-16">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Unable to open requirement</h2>
            <p className="text-sm mb-6">{error}</p>
            <button
              onClick={fetchRequirement}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/requirements')}
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Requirements
          </button>
          <button
            onClick={fetchRequirement}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg
              className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm uppercase tracking-wide text-blue-500 font-semibold">Requirement Journey</p>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">
                {requirement?.operation_name || 'Untitled Requirement'}
              </h1>
              <p className="text-gray-600 mt-2 max-w-3xl">{requirement?.requirement_text}</p>
            </div>
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${statusStyles[statusBadge.tone]}`}
            >
              <span className="h-2 w-2 rounded-full bg-current mr-2"></span>
              {statusBadge.label}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-4">
              <p className="text-sm text-blue-600 font-medium">Decision Makers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{requirement?.decisionMakers?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">roles aligned with Gemini/OpenAI</p>
            </div>
            <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 rounded-2xl p-4">
              <p className="text-sm text-sky-600 font-medium">Profiles Found</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{scrapedProfiles}</p>
              <p className="text-xs text-gray-500 mt-1">from LinkedIn module</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-4">
              <p className="text-sm text-indigo-600 font-medium">Emails Found</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{profilesWithEmail}</p>
              <p className="text-xs text-gray-500 mt-1">via Apollo.io enrichment</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-4">
              <p className="text-sm text-emerald-600 font-medium">Next Step</p>
              <p className="text-base font-semibold text-gray-900 mt-2">{primaryAction?.label}</p>
              <p className="text-xs text-gray-500 mt-1">{primaryAction?.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-semibold text-blue-500 uppercase tracking-wide">Journey</p>
                  <h2 className="text-xl font-bold text-gray-900">From requirement to campaign</h2>
                </div>
              </div>
              <div className="space-y-6">
                {journeySteps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold ${
                          step.complete
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {index + 1}
                      </div>
                      {index < journeySteps.length - 1 && (
                        <div
                          className={`w-px h-12 ${
                            journeySteps[index + 1].complete ? 'bg-blue-400' : 'bg-gray-200'
                          }`}
                        ></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-500">{step.complete ? 'Completed' : 'Pending'}</p>
                      <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-semibold text-blue-500 uppercase tracking-wide">Decision Makers</p>
                  <h2 className="text-xl font-bold text-gray-900">AI-recommended roles</h2>
                </div>
                {hasDecisionMakers && (
                  <button
                    onClick={() => navigate(`/decision-makers/${id}`)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Manage
                  </button>
                )}
              </div>
              {hasDecisionMakers ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requirement.decisionMakers.map((dm) => (
                    <div key={dm.id} className="border border-gray-100 rounded-2xl p-4 bg-gradient-to-br from-white to-blue-50/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-blue-500">Priority {dm.priority}</span>
                        {dm.confidence && (
                          <span className="text-xs text-gray-500">{Math.round(dm.confidence * 100)}% match</span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">{dm.role_title}</p>
                      {dm.industry_relevance && (
                        <span className="inline-flex items-center px-2 py-0.5 mt-2 rounded-full text-xs bg-blue-100 text-blue-700">
                          {dm.industry_relevance} relevance
                        </span>
                      )}
                      {dm.reasoning && <p className="text-sm text-gray-600 mt-3">{dm.reasoning}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-500 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium">No decision makers yet</p>
                  <p className="text-sm text-gray-500 mt-1">Start the AI workflow to pinpoint the right roles.</p>
                  <button
                    onClick={() => navigate(`/decision-makers/${id}`)}
                    className="btn-primary mt-4"
                  >
                    Identify Decision Makers
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            {/* Scraping Progress Card with Step-by-Step Display */}
            {/* Show progress card only when actively scraping, not when completed */}
            {(scrapingInProgress || 
              (scrapingStatus?.status && 
               scrapingStatus.status !== 'completed' && 
               scrapingStatus.status !== 'failed' && 
               (scrapingStatus.status === 'processing' || scrapingStatus.status === 'running' || scrapingStatus.status === 'pending'))) && (() => {
              // Handle both camelCase and snake_case from backend
              const currentStep = scrapingStatus?.current_step || scrapingStatus?.currentStep || 'pending'
              const stepDetails = scrapingStatus?.step_details || scrapingStatus?.stepDetails || { step: 'pending', message: 'Initializing...', progress: 0 }
              const loginStatus = scrapingStatus?.login_status || scrapingStatus?.loginStatus || 'pending'
              const loginAttempt = scrapingStatus?.login_attempt || scrapingStatus?.loginAttempt || 0
              const loginMaxAttempts = scrapingStatus?.login_max_attempts || scrapingStatus?.loginMaxAttempts || 3
              const currentRole = scrapingStatus?.currentRole || scrapingStatus?.current_role || null
              const profilesScraped = scrapingStatus?.profilesScraped || scrapingStatus?.profiles_scraped || 0
              const rolesCompleted = scrapingStatus?.rolesCompleted || scrapingStatus?.roles_completed || 0
              const totalRoles = scrapingStatus?.totalRoles || scrapingStatus?.total_roles || 0
              
              // Debug: Log current state (only in development)
              if (process.env.NODE_ENV === 'development') {
                console.log('[UI] Current scraping state:', {
                  currentStep,
                  stepDetails,
                  loginStatus,
                  loginAttempt,
                  currentRole,
                  profilesScraped,
                  fullStatus: scrapingStatus
                })
              }
              
              // If we don't have step info but job is running, show default "processing" state
              const hasStepInfo = currentStep !== 'pending' || stepDetails?.message !== 'Initializing...' || scrapingStatus?.status === 'processing'
              
              // Define steps for visual display with better state detection
              // Show "pending" as "initializing" if job is actually running
              // If current_step is 'completed', all steps should be completed
              const effectiveStep = currentStep === 'completed' 
                ? 'completed'
                : (currentStep === 'pending' && (scrapingStatus?.status === 'processing' || scrapingStatus?.status === 'running')) 
                  ? 'initializing' 
                  : currentStep
              
              const steps = [
                { 
                  id: 'initializing', 
                  label: 'Initializing Browser', 
                  icon: '🔧',
                  active: effectiveStep !== 'completed' && (effectiveStep === 'initializing' || effectiveStep === 'browser_ready' || (effectiveStep === 'pending' && hasStepInfo)),
                  completed: effectiveStep === 'completed' || ['browser_ready', 'logging_in', 'login_success', 'scraping', 'completed'].includes(effectiveStep),
                  message: (effectiveStep === 'initializing' || effectiveStep === 'browser_ready') ? (stepDetails.message || 'Initializing browser...') : null
                },
                { 
                  id: 'logging_in', 
                  label: 'Logging in to LinkedIn', 
                  icon: '🔐',
                  active: effectiveStep !== 'completed' && effectiveStep === 'logging_in',
                  completed: effectiveStep === 'completed' || ['login_success', 'scraping', 'completed'].includes(effectiveStep),
                  failed: loginStatus === 'failed' || loginStatus === 'challenge_required',
                  message: effectiveStep === 'logging_in' ? (stepDetails.message || `Logging in... (Attempt ${loginAttempt}/${loginMaxAttempts})`) : null
                },
                { 
                  id: 'login_success', 
                  label: 'Login Successful', 
                  icon: '✅',
                  active: effectiveStep !== 'completed' && effectiveStep === 'login_success',
                  completed: effectiveStep === 'completed' || ['scraping', 'completed'].includes(effectiveStep),
                  message: effectiveStep === 'login_success' ? (stepDetails.message || 'Login successful! Starting scraping...') : null
                },
                { 
                  id: 'scraping', 
                  label: 'Scraping Profiles', 
                  icon: '🔍',
                  active: effectiveStep !== 'completed' && effectiveStep === 'scraping',
                  completed: effectiveStep === 'completed',
                  message: effectiveStep === 'scraping' ? (stepDetails.message || (currentRole ? `Scraping: ${currentRole}` : 'Scraping profiles...')) : null
                }
              ]
              
              // Get the active step's message
              const activeStep = steps.find(s => s.active)
              const getStepMessage = () => {
                // Use active step's message if available
                if (activeStep?.message) return activeStep.message
                // Fallback to stepDetails message
                if (stepDetails?.message && stepDetails.message !== 'Initializing...' && stepDetails.message !== 'Job queued') {
                  return stepDetails.message
                }
                // Default messages based on effective step
                if (effectiveStep === 'logging_in' && loginStatus === 'pending') {
                  return `Logging in to LinkedIn... (Attempt ${loginAttempt}/${loginMaxAttempts})`
                }
                if (effectiveStep === 'login_success') {
                  return 'Login successful! Starting scraping...'
                }
                if (effectiveStep === 'scraping' && currentRole) {
                  return `Scraping role: ${currentRole}`
                }
                if (effectiveStep === 'scraping') {
                  return 'Scraping LinkedIn profiles...'
                }
                if (effectiveStep === 'initializing' || effectiveStep === 'browser_ready') {
                  return stepDetails?.message || 'Initializing browser...'
                }
                // If we have a status but no step info, show generic message
                if (scrapingStatus?.status === 'processing' || scrapingStatus?.status === 'running') {
                  return 'Processing scraping job...'
                }
                return stepDetails?.message || 'Preparing to start...'
              }
              
              return (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl text-white p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-sm uppercase tracking-wide font-semibold text-blue-100">Scraping Progress</p>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                  
                  {/* Step-by-Step Progress */}
                  <div className="space-y-3 mb-6 relative">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex items-start gap-3 relative">
                        {/* Step Indicator */}
                        <div className="flex flex-col items-center">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                            step.completed 
                              ? 'bg-green-500 text-white shadow-lg' 
                              : step.active 
                              ? 'bg-white text-blue-600 animate-pulse shadow-lg scale-110' 
                              : step.failed
                              ? 'bg-red-500 text-white shadow-lg'
                              : 'bg-white/20 text-white/50'
                          }`}>
                            {step.completed ? '✓' : step.failed ? '✕' : step.icon}
                          </div>
                          {/* Connector Line */}
                          {index < steps.length - 1 && (
                            <div className={`w-0.5 h-12 mt-2 transition-all duration-300 ${
                              step.completed ? 'bg-green-400' : 'bg-white/20'
                            }`}></div>
                          )}
                        </div>
                        
                        {/* Step Content */}
                        <div className="flex-1 pt-1">
                          <p className={`text-sm font-semibold mb-1 ${
                            step.active ? 'text-white' : step.completed ? 'text-green-200' : step.failed ? 'text-red-200' : 'text-white/60'
                          }`}>
                            {step.label}
                            {step.active && step.id === 'logging_in' && loginStatus === 'pending' && loginAttempt > 0 && (
                              <span className="ml-2 text-xs font-normal">(Attempt {loginAttempt}/{loginMaxAttempts})</span>
                            )}
                            {step.failed && (
                              <span className="ml-2 text-xs text-red-200 font-normal">Failed</span>
                            )}
                          </p>
                          {step.active && step.message && (
                            <p className="text-xs text-blue-100 mt-1 animate-pulse">{step.message}</p>
                          )}
                          {step.completed && !step.active && (
                            <p className="text-xs text-green-200 mt-1">Completed</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Current Activity Message - Always show when active */}
                  {activeStep && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20">
                      <p className="text-xs font-semibold text-blue-100 uppercase tracking-wide mb-1">Current Activity</p>
                      <p className="text-base font-medium text-white">{getStepMessage()}</p>
                    </div>
                  )}
                  
                  {/* Progress Bar */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-100">Profiles Found</span>
                      <span className="font-bold text-white">{profilesScraped}</span>
                    </div>
                    {totalRoles > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-100">Roles Completed</span>
                        <span className="font-bold text-white">{rolesCompleted} / {totalRoles}</span>
                      </div>
                    )}
                    <div className="w-full bg-blue-500/30 rounded-full h-3 mt-3 overflow-hidden">
                      <div 
                        className="bg-white h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                        style={{ width: `${stepDetails?.progress || scrapingStatus?.progress || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-100 mt-2 text-center font-medium">
                      {stepDetails?.progress || scrapingStatus?.progress || 0}% Complete
                    </p>
                  </div>
                  
                  {/* Login Status Messages */}
                  {loginStatus === 'failed' && currentStep !== 'completed' && (
                    <div className="mt-4 bg-red-500/20 border border-red-400/30 rounded-lg p-3 animate-in slide-in-from-top-2">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm text-red-100 font-medium">Login Failed</p>
                          <p className="text-xs text-red-200 mt-1">Please check your LinkedIn credentials and try again.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {loginStatus === 'challenge_required' && currentStep !== 'completed' && (
                    <div className="mt-4 bg-orange-500/20 border border-orange-400/30 rounded-lg p-3 animate-in slide-in-from-top-2">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-orange-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="text-sm text-orange-100 font-medium">Verification Required</p>
                          <p className="text-xs text-orange-200 mt-1">LinkedIn requires additional verification. Please login manually first.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-blue-500/30">
                    <p className="text-xs text-blue-100 text-center">
                      This may take a few minutes. You will receive an email notification when it completes.
                    </p>
                  </div>
                </div>
              )
            })()}

            {/* Scraping Failure Card */}
            {scrapingStatus?.status === 'failed' && (() => {
              const errorDisplay = scrapingStatus?.error_details 
                ? formatErrorDisplay({ response: { data: scrapingStatus.error_details } })
                : { message: scrapingStatus?.error || 'An error occurred while scraping LinkedIn profiles.', retryable: true, icon: '⚠️', color: 'text-red-100' }
              
              const primaryMessage = scrapingStatus?.error_details?.primary_error?.user_message 
                || scrapingStatus?.error_details?.errors?.[0]?.user_message
                || scrapingStatus?.error
                || 'An error occurred while scraping LinkedIn profiles.'
              
              const allErrors = scrapingStatus?.error_details?.errors || []
              
              return (
                <div className="bg-gradient-to-br from-red-600 to-orange-600 rounded-3xl text-white p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm uppercase tracking-wide font-semibold text-red-100">Scraping Failed</p>
                    {scrapingStatus?.error_details?.primary_error?.error_code && (
                      <span className="text-xs bg-red-500/50 px-2 py-1 rounded">
                        {scrapingStatus.error_details.primary_error.error_code}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold mt-2 flex items-center gap-2">
                    <span>{errorDisplay.icon || '⚠️'}</span>
                    LinkedIn Scraping Failed
                  </h2>
                  
                  <div className="mt-4 space-y-3">
                    <p className="text-red-100 text-sm font-medium">
                      {primaryMessage}
                    </p>
                    
                    {allErrors.length > 1 && (
                      <div className="bg-red-500/20 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-semibold text-red-100">Additional Issues:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-red-100">
                          {allErrors.slice(1).map((error, idx) => (
                            <li key={idx}>{error.user_message || error.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {scrapingStatus?.error_details?.primary_error?.details && (
                      <div className="bg-red-500/10 rounded-lg p-2">
                        <p className="text-xs text-red-200">
                          {scrapingStatus.error_details.primary_error.details}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-red-500/30">
                    <p className="text-xs text-red-100 text-center">
                      {errorDisplay.retryable !== false 
                        ? 'You can retry the scraping by clicking the button below.'
                        : 'This error may require manual intervention. Please check your LinkedIn credentials or contact support.'}
                    </p>
                  </div>
                </div>
              )
            })()}

            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl text-white p-6 shadow-lg">
              <p className="text-sm uppercase tracking-wide font-semibold text-blue-100">Next Step</p>
              <h2 className="text-2xl font-bold mt-2">{primaryAction?.label}</h2>
              <p className="text-blue-100 text-sm mt-2 leading-relaxed">{primaryAction?.description}</p>

              {/* Only render CTA button when an action is available and not scraping */}
              {primaryAction && primaryAction.onClick && primaryAction.cta && (
                <button
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled || startingScrape}
                  className={`mt-6 w-full inline-flex items-center justify-center px-4 py-3 bg-white/15 backdrop-blur rounded-2xl font-semibold transition ${
                    primaryAction.disabled || startingScrape
                      ? 'opacity-50 cursor-not-allowed blur-sm'
                      : 'hover:bg-white/25'
                  }`}
                >
                  {startingScrape ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Starting...
                    </>
                  ) : (
                    <>
                      {primaryAction.cta}
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-semibold text-blue-500 uppercase tracking-wide">Scraped Profiles</p>
                  <h2 className="text-xl font-bold text-gray-900">Latest contacts</h2>
                </div>
                {scrapedProfiles > 0 && (
                  <button
                    onClick={() => navigate(`/profiles?requirementId=${id}`)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View Full List
                  </button>
                )}
              </div>
              {scrapedProfiles === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-600">No LinkedIn profiles yet.</p>
                  <p className="text-sm text-gray-500 mt-1">Launch a scrape to populate this area.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="border border-gray-100 rounded-2xl p-4 hover:border-blue-200 transition cursor-pointer" onClick={() => navigate(`/profile/${profile.id}`)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{profile.name}</p>
                          <p className="text-sm text-gray-600">{profile.title || profile.profession}</p>
                          <p className="text-sm text-gray-500">{profile.company_name}</p>
                        </div>
                        <div className="text-right">
                          {profile.email ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              Email ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              Email pending
                            </span>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {profile.decision_maker_role || 'Role'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
              <p className="text-sm font-semibold text-blue-500 uppercase tracking-wide">Requirement metadata</p>
              <div className="mt-4 space-y-4 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Industry</span>
                  <span className="font-semibold">{requirement?.industry || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Product / Service</span>
                  <span className="font-semibold">{requirement?.product_service || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Target Location</span>
                  <span className="font-semibold">{requirement?.target_location || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Target Market</span>
                  <span className="font-semibold">{requirement?.target_market || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="font-semibold">
                    {requirement?.created_at ? new Date(requirement.created_at).toLocaleString() : '—'}
                  </span>
                </div>
                {requirement?.updated_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Updated</span>
                    <span className="font-semibold">
                      {new Date(requirement.updated_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for confirmations and messages */}
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
            if (!modal.onConfirm) {
              setModal(null)
            }
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

export default RequirementDetail


