import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { submitBusinessRequirement, identifyDecisionMakers, identifyIndustry, clearCurrentRequirement } from '../store/slices/businessRequirementSlice'
import { getDecisionMakers } from '../store/slices/decisionMakerSlice'
import Layout from '../components/Layout'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'
import type { CreateRequirementData } from '../types/api/businessRequirement.types'
import { showModal } from '../utils/modal'

interface LocationState {
    searchQuery?: string
}

function BusinessRequirement() {
    const prepopulatedFromDashboard = useRef(false)
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const requirementIdParam = searchParams.get('requirementId')
    const [formData, setFormData] = useState<CreateRequirementData>({
        requirementText: '',
        industry: '',
        productService: '',
        targetLocation: '',
        targetMarket: '',
        operationName: '',
    })

    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { loading, identifying, identifyingIndustry, industryError, industrySuggestions, currentRequirement } = useAppSelector(
        (state: RootState) => state.businessRequirement
    )
    // Use decision makers from decisionMakerSlice which includes suggestions from API
    const { decisionMakers } = useAppSelector((state: RootState) => state.decisionMakers)
    const { scrapingJob, scrapingStatus } = useAppSelector((state: RootState) => state.profiles)
    const decisionMakersRef = useRef<HTMLDivElement | null>(null)
    const [hasScrolled, setHasScrolled] = useState<boolean>(false)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const autoDetectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastAutoDetectedTextRef = useRef<string>('')
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
    const [industryInput, setIndustryInput] = useState<string>('')
    const [showMoreSuggestions, setShowMoreSuggestions] = useState<boolean>(false)
    const maxIndustries = 5
    const autoDetectEnabled = false // manual trigger preferred
    const [businessSuggestions, setBusinessSuggestions] = useState<Array<{ suggestion_text: string }>>([])
    const maxBusinessSuggestions = 5

    // Clear state when component mounts if creating a new requirement
    useEffect(() => {
        // On mount, if there's no requirementIdParam, clear everything for a fresh start
        // This ensures old decision makers don't persist when navigating back to create new requirement
        if (!requirementIdParam) {
            dispatch(clearCurrentRequirement())
            setFormData({
                requirementText: '',
                industry: '',
                productService: '',
                targetLocation: '',
                targetMarket: '',
                operationName: '',
            })
            lastAutoDetectedTextRef.current = '' // Reset auto-detection tracking
            setHasScrolled(false)
            setIsSubmitting(false)
            setSelectedIndustries([])
            setIndustryInput('')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Only run on mount

    // Single scroll effect - scroll once when decision makers are loaded after identification
    useEffect(() => {
        // Only scroll if:
        // 1. Not currently identifying
        // 2. Decision makers exist
        // 3. Current requirement exists
        // 4. We haven't scrolled yet for this requirement
        if (!identifying && decisionMakers.length > 0 && currentRequirement && !hasScrolled) {
            // Wait for DOM to update
            setTimeout(() => {
                if (decisionMakersRef.current) {
                    const element = decisionMakersRef.current
                    const elementPosition = element.getBoundingClientRect().top
                    const offsetPosition = elementPosition + window.pageYOffset - 120 // 120px offset for header

                    // Use window.scrollTo for more control
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    })

                    // Mark as scrolled to prevent multiple scrolls
                    setHasScrolled(true)
                }
            }, 800) // Single delay to ensure DOM is fully rendered
        }
    }, [identifying, decisionMakers, currentRequirement, hasScrolled])

    // Reset scroll flag when requirement changes
    useEffect(() => {
        if (currentRequirement) {
            setHasScrolled(false)
        }
    }, [currentRequirement?.id])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setFormData({ ...formData, [e.target.name]: newValue })
    }

    const handleIndustryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIndustryInput(e.target.value)
    }

    const handleAddIndustry = (industry: string) => {
        if (!industry.trim()) return
        const trimmed = industry.trim()
        if (selectedIndustries.length >= maxIndustries) {
            showModal({
                type: 'warning',
                title: 'Maximum Industries Reached',
                message: `You can only select up to ${maxIndustries} industries.`,
            })
            return
        }
        if (!selectedIndustries.includes(trimmed)) {
            const newIndustries = [...selectedIndustries, trimmed]
            setSelectedIndustries(newIndustries)
            setFormData({ ...formData, industry: newIndustries.join(', ') })
            setIndustryInput('')
        }
    }

    const handleRemoveIndustry = (industry: string) => {
        const newIndustries = selectedIndustries.filter(ind => ind !== industry)
        setSelectedIndustries(newIndustries)
        setFormData({ ...formData, industry: newIndustries.join(', ') })
    }

    const handleIndustryInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && industryInput.trim()) {
            e.preventDefault()
            handleAddIndustry(industryInput)
        } else if (e.key === 'Backspace' && !industryInput && selectedIndustries.length > 0) {
            handleRemoveIndustry(selectedIndustries[selectedIndustries.length - 1])
        }
    }

    // Display logic: Show first 7 if collapsed, all if expanded
    const maxInitialDisplay = 6
    const displayedSuggestions = showMoreSuggestions
        ? industrySuggestions
        : industrySuggestions.slice(0, maxInitialDisplay)

    // Show button if there are more than 6 suggestions
    const shouldShowToggle = industrySuggestions.length > maxInitialDisplay

    // Calculate if form is valid
    const isFormValid = (): boolean => {
        const trimmedText = formData.requirementText?.trim() || ''
        const trimmedOperationName = formData.operationName?.trim() || ''
        const trimmedTargetLocation = formData.targetLocation?.trim() || ''

        const isValid =
            trimmedText.length >= 10 &&
            trimmedOperationName.length > 0 &&
            trimmedTargetLocation.length > 0

        return isValid
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        e.stopPropagation()

        // JavaScript validation - prevent API call if invalid
        const trimmedText = formData.requirementText?.trim() || ''

        // Validation: Check if requirement text is empty
        if (!trimmedText || trimmedText.length === 0) {
            const textarea = document.getElementById('requirementText') as HTMLTextAreaElement | null
            if (textarea) {
                textarea.setCustomValidity('Please enter a business requirement. This field is required.')
                textarea.reportValidity()
                textarea.focus()
            } else {
                showModal({
                    type: 'error',
                    title: 'Validation Error',
                    message: 'Please enter a business requirement. This field is required.',
                })
            }
            return false
        }

        // Validation: Check minimum length
        if (trimmedText.length < 10) {
            const textarea = document.getElementById('requirementText') as HTMLTextAreaElement | null
            if (textarea) {
                textarea.setCustomValidity(`Business requirement must be at least 10 characters long. You entered ${trimmedText.length} characters.`)
                textarea.reportValidity()
                textarea.focus()
            } else {
                showModal({
                    type: 'error',
                    title: 'Validation Error',
                    message: `Business requirement must be at least 10 characters long. You entered ${trimmedText.length} characters.`,
                })
            }
            return false
        }

        // Validation: Check if operation name is empty
        const trimmedOperationName = formData.operationName?.trim() || ''
        if (!trimmedOperationName || trimmedOperationName.length === 0) {
            const input = document.getElementById('operationName') as HTMLInputElement | null
            if (input) {
                input.setCustomValidity('Please enter a business name. This field is required.')
                input.reportValidity()
                input.focus()
            } else {
                showModal({
                    type: 'error',
                    title: 'Validation Error',
                    message: 'Please enter a business name. This field is required.',
                })
            }
            return false
        }

        // Validation: Check if target location is empty
        const trimmedTargetLocation = formData.targetLocation?.trim() || ''
        if (!trimmedTargetLocation || trimmedTargetLocation.length === 0) {
            const input = document.getElementById('targetLocation') as HTMLInputElement | null
            if (input) {
                input.setCustomValidity('Please enter a target location. This field is required.')
                input.reportValidity()
                input.focus()
            } else {
                showModal({
                    type: 'error',
                    title: 'Validation Error',
                    message: 'Please enter a target location. This field is required.',
                })
            }
            return false
        }

        // Prevent double submission
        if (loading || identifying || isSubmitting) {
            return false
        }

        // Prevent submission if requirement already exists and decision makers are shown
        if (currentRequirement !== null && decisionMakers.length > 0) {
            return false
        }

        // Mark as submitting to prevent multiple clicks
        setIsSubmitting(true)

        // All validations passed - proceed with API call
        try {
            const result = await dispatch(submitBusinessRequirement(formData))

            if (submitBusinessRequirement.fulfilled.match(result)) {

                // Generate suggestions based on selected industries
                // For each selected industry, create a suggestion by appending the industry to requirement text
                const requirementText = formData.requirementText.trim()
                const generateSuggestionsFromIndustries = (): Array<{ suggestion_text: string; industry: string }> => {
                    // If industries are selected, create one suggestion per industry
                    if (selectedIndustries.length > 0) {
                        return selectedIndustries.slice(0, maxBusinessSuggestions).map(industry => {
                            // Simply append the industry to the requirement text
                            const suggestionText = `${requirementText} in ${industry} industry`

                            return {
                                suggestion_text: suggestionText,
                                industry: industry // Include the industry in the payload
                            }
                        })
                    }

                    // If no industries selected, use requirement text as single suggestion
                    return [{
                        suggestion_text: requirementText,
                        industry: formData.industry || '' // Use form's industry if available
                    }]
                }

                const suggestions = generateSuggestionsFromIndustries()

                // Automatically identify decision makers
                const identifyResult = await dispatch(identifyDecisionMakers({
                    requirementId: result.payload.id,
                    suggestions: suggestions
                }))
                if (identifyDecisionMakers.rejected.match(identifyResult)) {
                    console.error('❌ Failed to identify decision makers:', identifyResult.payload)
                    console.error('❌ Full error result:', identifyResult)
                    // Ensure error message is always a string
                    let errorMsg = 'Unknown error occurred'
                    if (identifyResult.payload) {
                        errorMsg = typeof identifyResult.payload === 'string'
                            ? identifyResult.payload
                            : String(identifyResult.payload)
                    }
                    showModal({
                        type: 'error',
                        title: 'Failed to Identify Decision Makers',
                        message: 'Failed to Identify Decision Makers'
                    })
                } else {
                    // Refresh decision makers list
                    dispatch(getDecisionMakers(String(result.payload.id)))
                    // Reset scroll flag to allow scrolling to new decision makers
                    setHasScrolled(false)
                }
                // Reset submitting flag after successful completion
                setIsSubmitting(false)
            } else if (submitBusinessRequirement.rejected.match(result)) {
                console.error('❌ Submit rejected:', result.payload)
                // Handle API error - ensure message is always a string
                let errorMsg = 'Failed to submit business requirement. Please try again.'
                if (result.payload) {
                    errorMsg = typeof result.payload === 'string'
                        ? result.payload
                        : String(result.payload)
                }
                setIsSubmitting(false)
                showModal({
                    type: 'error',
                    title: 'Submission Failed',
                    message: errorMsg,
                })
                return false
            }
        } catch (error) {
            console.error('❌ Submission error:', error)
            setIsSubmitting(false)
            // Ensure error message is always a string
            let errorMsg = 'An error occurred while submitting. Please check your connection and try again.'
            if (error instanceof Error) {
                errorMsg = error.message || errorMsg
            } else if (error) {
                errorMsg = typeof error === 'string' ? error : String(error)
            }
            showModal({
                type: 'error',
                title: 'Submission Error',
                message: errorMsg,
            })
            return false
        }

        return false
    }

    const handleIdentifyDecisionMakers = async () => {
        if (currentRequirement) {
            const requirementText = (currentRequirement.requirement_text || currentRequirement.requirementText || '').trim()

            // Generate suggestions based on selected industries
            const generateSuggestionsFromIndustries = (): Array<{ suggestion_text: string; industry: string }> => {
                // If industries are selected, create one suggestion per industry
                if (selectedIndustries.length > 0) {
                    return selectedIndustries.slice(0, maxBusinessSuggestions).map(industry => {
                        // Simply append the industry to the requirement text
                        const suggestionText = `${requirementText} in ${industry} industry`

                        return {
                            suggestion_text: suggestionText,
                            industry: industry // Include the industry in the payload
                        }
                    })
                }

                // If no industries selected, use requirement text as single suggestion
                return requirementText ? [{
                    suggestion_text: requirementText,
                    industry: currentRequirement.industry || '' // Use requirement's industry if available
                }] : []
            }

            const suggestions = generateSuggestionsFromIndustries()

            const identifyResult = await dispatch(identifyDecisionMakers({
                requirementId: currentRequirement.id,
                suggestions: suggestions
            }))

            // After identifying, fetch decision makers with suggestions from API
            if (identifyDecisionMakers.fulfilled.match(identifyResult)) {
                dispatch(getDecisionMakers(String(currentRequirement.id)))
            }
        }
    }

    const handleIdentifyIndustry = async () => {
        const trimmedText = formData.requirementText?.trim() || ''
        if (trimmedText.length < 10) {
            return
        }
        await dispatch(identifyIndustry(trimmedText))
    }



    // Clear form and decision makers ONLY when creating a NEW requirement
    // This happens when: no requirementIdParam AND no currentRequirement in Redux
    useEffect(() => {
        // Check if we're on the create new requirement page (not viewing/editing existing)
        const isCreatingNew = !requirementIdParam && !currentRequirement

        if (isCreatingNew) {
            // Clear form data for fresh start
            setFormData({
                requirementText: '',
                industry: '',
                productService: '',
                targetLocation: '',
                targetMarket: '',
                operationName: '',
            })
            lastAutoDetectedTextRef.current = '' // Reset auto-detection tracking
            // Clear decision makers from Redux state only when starting fresh
            // This ensures old decision makers don't show when creating a new requirement
            dispatch(clearCurrentRequirement())
            setHasScrolled(false)
            setIsSubmitting(false)
            setSelectedIndustries([])
            setIndustryInput('')
        }
    }, [requirementIdParam, currentRequirement, dispatch])

    // Pre-fill search query if provided and trigger industry identification
    useEffect(() => {
        const locationState = location.state as LocationState | null
        if (locationState?.searchQuery && !requirementIdParam && !currentRequirement) {
            setFormData(prev => {
                prepopulatedFromDashboard.current = true;
                return {
                    ...prev,
                    requirementText: locationState.searchQuery || ''
                };
            })
        }
    }, [location.state, requirementIdParam, currentRequirement])

    // Trigger industry identification after prepopulation
    useEffect(() => {
        if (prepopulatedFromDashboard.current && formData.requirementText.trim().length >= 10) {
            handleIdentifyIndustry();
            prepopulatedFromDashboard.current = false;
        }
    }, [formData.requirementText])

    // Auto-detect industry when requirement text has enough content
    useEffect(() => {
        if (!autoDetectEnabled) {
            return undefined
        }
        // Clear any existing timeout
        if (autoDetectTimeoutRef.current) {
            clearTimeout(autoDetectTimeoutRef.current)
        }

        // Only auto-detect if:
        // 1. Not currently detecting
        // 2. Not already submitted (no current requirement)
        // 3. Requirement text is at least 20 characters
        // 4. Industry field is empty
        // 5. This text hasn't been detected before (to avoid re-detection)
        const trimmedText = formData.requirementText?.trim() || ''
        const industryIsEmpty = !formData.industry || formData.industry.trim().length === 0
        const textIsLongEnough = trimmedText.length >= 20
        const hasNotBeenDetected = trimmedText !== lastAutoDetectedTextRef.current

        const shouldAutoDetect =
            !identifyingIndustry &&
            !currentRequirement &&
            textIsLongEnough &&
            industryIsEmpty &&
            hasNotBeenDetected

        if (shouldAutoDetect) {
            // Debounce: wait 1.5 seconds after user stops typing
            autoDetectTimeoutRef.current = setTimeout(async () => {
                // Double-check conditions haven't changed during the debounce period
                const currentText = formData.requirementText?.trim() || ''
                const currentIndustry = formData.industry?.trim() || ''

                if (
                    currentText.length >= 20 &&
                    (!currentIndustry || currentIndustry.length === 0) &&
                    !identifyingIndustry &&
                    !currentRequirement &&
                    currentText === trimmedText // Text hasn't changed during debounce
                ) {
                    lastAutoDetectedTextRef.current = currentText

                    try {
                        const result = await dispatch(identifyIndustry(currentText))
                        if (identifyIndustry.fulfilled.match(result)) {
                            const identifiedIndustry = result.payload.industry
                            if (identifiedIndustry) {
                                handleAddIndustry(identifiedIndustry)
                            }
                        }
                    } catch (error) {
                        console.error('Error auto-detecting industry:', error)
                        // Don't show alert for auto-detection failures - user can still manually enter
                        // Reset the ref so user can try again if they want
                        lastAutoDetectedTextRef.current = ''
                    }
                }
            }, 1500) // 1.5 second debounce
        }

        // Cleanup timeout on unmount or when dependencies change
        return () => {
            if (autoDetectTimeoutRef.current) {
                clearTimeout(autoDetectTimeoutRef.current)
            }
        }
    }, [formData.requirementText, formData.industry, identifyingIndustry, currentRequirement, dispatch])

    // Initialize industries from formData.industry if it exists
    useEffect(() => {
        if (formData.industry && selectedIndustries.length === 0) {
            const industries = formData.industry.split(',').map(ind => ind.trim()).filter(Boolean)
            if (industries.length > 0) {
                setSelectedIndustries(industries)
            }
        }
    }, []) // Only run once on mount

    // Load existing requirement if requirementId is provided
    useEffect(() => {
        if (requirementIdParam && String(currentRequirement?.id) !== requirementIdParam) {
            // Load decision makers for this requirement
            dispatch(getDecisionMakers(requirementIdParam))
        }
    }, [requirementIdParam, dispatch, currentRequirement])

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="card">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Business Requirement</h2>
                                <p className="text-gray-600">Describe your business needs to identify decision-makers</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="operationName" className="block text-sm font-medium text-gray-700 mb-2">
                                Business Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="operationName"
                                type="text"
                                name="operationName"
                                value={formData.operationName}
                                onChange={(e) => {
                                    handleChange(e)
                                    // Clear validation message when user types
                                    e.target.setCustomValidity('')
                                }}
                                required
                                className="input-field invalid:border-red-500 invalid:ring-red-500"
                                placeholder="e.g., Book Sales Netherlands Campaign"
                                onInvalid={(e) => {
                                    const target = e.target as HTMLInputElement
                                    const value = target.value?.trim() || ''
                                    if (!value) {
                                        target.setCustomValidity('Please enter a business name. This field is required.')
                                    } else {
                                        target.setCustomValidity('')
                                    }
                                }}
                            />
                            <p className="mt-1 text-xs text-gray-500">Give this requirement a memorable name</p>
                        </div>

                        <div>
                            <label htmlFor="requirementText" className="block text-sm font-medium text-gray-700 mb-2">
                                Business Requirement <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="requirementText"
                                name="requirementText"
                                value={formData.requirementText || ''}
                                onChange={(e) => {
                                    handleChange(e)
                                    // Clear validation message when user types
                                    e.target.setCustomValidity('')
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        const value = (e.target as HTMLTextAreaElement).value.trim();
                                        if (value.length >= 10) {
                                            e.preventDefault();
                                            handleIdentifyIndustry();
                                        }
                                    }
                                }}
                                required
                                minLength={10}
                                rows={5}
                                className="input-field resize-none invalid:border-red-500 invalid:ring-red-500"
                                placeholder="e.g., I am a book seller and I need to sell books across the Netherlands"
                                onInvalid={(e) => {
                                    const target = e.target as HTMLTextAreaElement
                                    const value = target.value?.trim() || ''
                                    if (!value) {
                                        target.setCustomValidity('Please enter a business requirement. This field is required.')
                                    } else if (value.length < 10) {
                                        target.setCustomValidity(`Business requirement must be at least 10 characters long. You entered ${value.length} characters.`)
                                    } else {
                                        target.setCustomValidity('')
                                    }
                                }}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Describe your business needs in detail (minimum 10 characters)
                                {formData.requirementText && (
                                    <span className={`ml-2 font-medium ${(formData.requirementText.trim().length < 10) ? 'text-red-500' : 'text-green-500'}`}>
                                        ({formData.requirementText.trim().length} characters)
                                    </span>
                                )}
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                                    Industry
                                </label>
                                {identifyingIndustry && (
                                    <span className="text-xs text-primary-600 font-normal flex items-center">
                                        <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Finding best match...
                                    </span>
                                )}
                            </div>

                            {/* Info box explaining auto-detection */}
                            {(
                                <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="flex-1">
                                            <p className="text-xs text-blue-900 font-medium mb-1">
                                                Get industry suggestions (optional)
                                            </p>
                                            <p className="text-xs text-blue-700">
                                                Enter your business description above, then click “Suggest industries” to pull the top matches. You can still type your own industry anytime.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Multi-select Industry Input with Button Inside */}
                            <div className="relative">
                                <div className="min-h-[48px] w-full px-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all duration-200 flex items-center gap-2 bg-white">
                                    {/* Container for chips and input - only takes needed space and wraps naturally */}
                                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                                        {/* Selected Industry Chips */}
                                        {selectedIndustries.map((industry) => (
                                            <span
                                                key={industry}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-600 text-white rounded-full text-sm font-medium flex-shrink-0"
                                            >
                                                {industry}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveIndustry(industry)}
                                                    className="ml-1 hover:bg-primary-700 rounded-full p-0.5 transition-colors flex-shrink-0"
                                                    aria-label={`Remove ${industry}`}
                                                >
                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </span>
                                        ))}

                                        {/* Input Field - only visible when not at max or when no chips */}
                                        {selectedIndustries.length < maxIndustries && (
                                            <input
                                                id="industry"
                                                type="text"
                                                value={industryInput}
                                                onChange={handleIndustryInputChange}
                                                onKeyDown={handleIndustryInputKeyDown}
                                                disabled={identifyingIndustry}
                                                className={`outline-none bg-transparent text-gray-900 placeholder-gray-400 disabled:opacity-50 ${selectedIndustries.length > 0 ? 'w-0 min-w-[120px]' : 'flex-1 min-w-[200px]'
                                                    }`}
                                                placeholder={selectedIndustries.length > 0 ? "" : "Add or select up to 5 industries..."}
                                            />
                                        )}
                                        {selectedIndustries.length >= maxIndustries && (
                                            <span className="text-xs text-gray-500 flex-shrink-0">Maximum {maxIndustries} industries selected</span>
                                        )}
                                    </div>

                                    {/* Suggest Industries Button Inside Input - fixed width, no wrap, reserves space */}
                                    <button
                                        type="button"
                                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0 ml-auto"
                                        disabled={identifyingIndustry || (formData.requirementText?.trim().length || 0) < 10}
                                        onClick={handleIdentifyIndustry}
                                    >
                                        {identifyingIndustry ? 'Finding...' : 'Suggest industries'}
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-gray-400">e.g., Books, Software</p>
                            </div>

                            {industryError && (
                                <p className="mt-1 text-xs text-amber-600">{industryError} — you can still type your own industry or retry.</p>
                            )}

                            {industrySuggestions.length > 0 && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-semibold text-gray-700">Top Suggestions:</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {displayedSuggestions.map((suggestion) => {
                                            const isSelected = selectedIndustries.includes(suggestion)
                                            return (
                                                <button
                                                    key={suggestion}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            handleRemoveIndustry(suggestion)
                                                        } else {
                                                            handleAddIndustry(suggestion)
                                                        }
                                                    }}
                                                    disabled={!isSelected && selectedIndustries.length >= maxIndustries}
                                                    className={`px-3 py-1.5 rounded-lg border text-sm transition ${isSelected
                                                        ? 'bg-primary-600 text-white border-primary-600'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                                        }`}
                                                >
                                                    {suggestion}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {shouldShowToggle && (
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setShowMoreSuggestions(!showMoreSuggestions)}
                                                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                            >
                                                {showMoreSuggestions ? 'Show less -' : 'Show more +'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="targetLocation" className="block text-sm font-medium text-gray-700 mb-2">
                                Target Location <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="targetLocation"
                                type="text"
                                name="targetLocation"
                                value={formData.targetLocation}
                                onChange={(e) => {
                                    // Only allow single location (no commas)
                                    const value = e.target.value
                                    // Remove commas if user tries to enter multiple locations
                                    const singleLocation = value.replace(/,/g, '').trim()
                                    setFormData({ ...formData, targetLocation: singleLocation })
                                    // Clear validation message when user types
                                    e.target.setCustomValidity('')
                                }}
                                required
                                className="input-field invalid:border-red-500 invalid:ring-red-500"
                                placeholder="e.g., Netherlands (single location only)"
                                onInvalid={(e) => {
                                    const target = e.target as HTMLInputElement
                                    const value = target.value?.trim() || ''
                                    if (!value) {
                                        target.setCustomValidity('Please enter a target location. This field is required.')
                                    } else {
                                        target.setCustomValidity('')
                                    }
                                }}
                            />
                            <p className="mt-1 text-xs text-gray-500">Enter one location only (e.g., Netherlands, Germany, United States)</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="productService" className="block text-sm font-medium text-gray-700 mb-2">
                                        Product/Service
                                    </label>
                                    <input
                                        id="productService"
                                        type="text"
                                        name="productService"
                                        value={formData.productService}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="e.g., Books, Software"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="targetMarket" className="block text-sm font-medium text-gray-700 mb-2">
                                    Target Market
                                </label>
                                <input
                                    id="targetMarket"
                                    type="text"
                                    name="targetMarket"
                                    value={formData.targetMarket}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="e.g., B2B, B2C"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={loading || identifying || isSubmitting || !isFormValid() || (currentRequirement !== null && decisionMakers.length > 0)}
                                title={!isFormValid() ? 'Please fill all required fields (Business Requirement, Business Name, and Target Location)' : ''}
                                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={(e) => {
                                    const trimmedText = formData.requirementText?.trim() || ''

                                    // Additional client-side check before form submission
                                    if (!trimmedText || trimmedText.length < 10) {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        const textarea = document.getElementById('requirementText') as HTMLTextAreaElement | null
                                        if (textarea) {
                                            if (!trimmedText) {
                                                textarea.setCustomValidity('Please enter a business requirement. This field is required.')
                                            } else {
                                                textarea.setCustomValidity(`Business requirement must be at least 10 characters long. You entered ${trimmedText.length} characters.`)
                                            }
                                            textarea.reportValidity()
                                            textarea.focus()
                                        } else {
                                            console.error('❌ Textarea element not found in button click!')
                                        }
                                        return false
                                    }
                                }}
                            >
                                {loading || identifying || isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {identifying ? 'Identifying Decision Makers...' : 'Submitting...'}
                                    </span>
                                ) : (currentRequirement !== null && decisionMakers.length > 0) ? (
                                    <>
                                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Decision Makers Identified
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Submit & Identify Decision Makers
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>

                    {/* Decision Makers Results */}
                    {currentRequirement && (
                        <div ref={decisionMakersRef} className="mt-8 pt-8 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Decision Makers Identified</h3>
                                    <p className="text-sm text-gray-600">AI-powered role identification based on your requirement</p>
                                </div>
                                {!identifying && decisionMakers.length === 0 && (
                                    <button
                                        onClick={handleIdentifyDecisionMakers}
                                        className="btn-secondary text-sm"
                                    >
                                        Identify Now
                                    </button>
                                )}
                            </div>

                            {identifying ? (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                                        <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                    <p className="text-gray-600">Analyzing your requirement and identifying decision makers...</p>
                                </div>
                            ) : decisionMakers.length > 0 ? (
                                <>
                                    {/* Group decision makers by suggestion */}
                                    {(() => {
                                        // Group decision makers by suggestion_id
                                        const groupedBySuggestion = decisionMakers.reduce((acc, dm) => {
                                            // Get suggestion data - check multiple possible property names
                                            const dmAny = dm as any
                                            const suggestion = dmAny.suggestion || dmAny.Suggestion || dmAny.suggestions || null

                                            const suggestionId = dm.suggestion_id || dm.suggestionId || suggestion?.id || 'no-suggestion'
                                            let suggestionText = suggestion?.suggestion_text || dmAny.suggestion?.suggestion_text || null

                                            // If still no suggestion text, try to get it from the suggestion object directly
                                            if (!suggestionText && suggestion) {
                                                suggestionText = suggestion.suggestion_text || suggestion.suggestionText || null
                                            }

                                            // Fallback to Unknown Suggestion
                                            if (!suggestionText) {
                                                suggestionText = 'Unknown Suggestion'
                                            }

                                            // Extract industry from suggestion text (e.g., "Find marketing directors in tech companies in SaaS industry" -> "SaaS")
                                            // Or get from decision maker's industry field (which is now saved correctly from UI)
                                            let extractedIndustry = null

                                            // First, try to get from decision maker's industry field (most reliable)
                                            const dmIndustry = (dm as any).industry
                                            if (dmIndustry) {
                                                // If industry contains comma, take first part (e.g., "SaaS, Software" -> "SaaS")
                                                // Otherwise use as-is
                                                extractedIndustry = dmIndustry.split(',')[0].trim()
                                            }

                                            // Fallback: Extract from suggestion text if not found in DM
                                            if (!extractedIndustry && suggestionText && suggestionText !== 'Unknown Suggestion') {
                                                // Pattern: match the last occurrence of "in [Industry] industry"
                                                // This handles cases like "Find X in Y in Z industry" where we want "Z"
                                                const allMatches = Array.from(suggestionText.matchAll(/in\s+([A-Za-z\s]+?)\s+industry/gi))
                                                if (allMatches.length > 0) {
                                                    // Get the last match (most specific industry)
                                                    const extracted = allMatches[allMatches.length - 1][1].trim()
                                                    // If it contains "in" (like "tech companies in SaaS"), extract just the last part
                                                    if (extracted.includes(' in ')) {
                                                        extractedIndustry = extracted.split(' in ').pop()?.trim() || extracted
                                                    } else {
                                                        extractedIndustry = extracted
                                                    }
                                                } else {
                                                    // Fallback: try to find industry name before "industry" at the end
                                                    const fallbackMatch = suggestionText.match(/\s+([A-Z][a-zA-Z\s]+?)\s+industry\s*$/i)
                                                    if (fallbackMatch && fallbackMatch[1]) {
                                                        extractedIndustry = fallbackMatch[1].trim()
                                                    }
                                                }
                                            }

                                            if (!acc[suggestionId]) {
                                                acc[suggestionId] = {
                                                    suggestionId: suggestionId,
                                                    suggestionText: suggestionText,
                                                    extractedIndustry: extractedIndustry,
                                                    decisionMakers: []
                                                }
                                            }
                                            acc[suggestionId].decisionMakers.push(dm)
                                            return acc
                                        }, {} as Record<string, { suggestionId: string; suggestionText: string; extractedIndustry: string | null; decisionMakers: typeof decisionMakers }>)

                                        return Object.values(groupedBySuggestion).map((group, groupIndex) => {
                                            // Get industry for display - prefer extracted industry, fallback to first DM's industry
                                            const displayIndustry = group.extractedIndustry ||
                                                (group.decisionMakers[0] as any)?.industry?.split(',')[0]?.trim() ||
                                                'Industry'

                                            return (
                                                <div key={group.suggestionId || groupIndex} className="mb-8">
                                                    {/* Suggestion Header */}
                                                    <div className="mb-4 pb-3 border-b-2 border-primary-200">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {displayIndustry} Industry
                                                        </h3>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {group.decisionMakers.length} decision maker{group.decisionMakers.length !== 1 ? 's' : ''} identified
                                                        </p>
                                                    </div>

                                                    {/* Decision Makers Grid for this suggestion */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                                        {group.decisionMakers.map((dm, index) => (
                                                            <div
                                                                key={dm.id || index}
                                                                className="p-4 bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-lg hover:shadow-md transition-shadow"
                                                            >
                                                                <div className="flex items-center space-x-3 mb-3">
                                                                    <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-semibold text-gray-900 truncate">{dm.roleTitle || dm.role_title || 'Untitled Role'}</h4>
                                                                        <p className="text-xs text-gray-500">Decision Maker</p>
                                                                    </div>
                                                                </div>
                                                                {/* Industry badge - show just the industry name (e.g., "SaaS") */}
                                                                {(() => {
                                                                    // Get industry for badge - prefer DM's industry, fallback to extracted
                                                                    const badgeIndustry = (dm as any).industry?.split(',')[0]?.trim() ||
                                                                        group.extractedIndustry ||
                                                                        null

                                                                    return badgeIndustry ? (
                                                                        <div className="mt-2">
                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                                </svg>
                                                                                {badgeIndustry}
                                                                            </span>
                                                                        </div>
                                                                    ) : null
                                                                })()}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    })()}

                                    {/* Manage Decision Makers Button */}
                                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-blue-900 mb-1">
                                                    Review and manage decision makers
                                                </p>
                                                <p className="text-xs text-blue-700">
                                                    You can add, edit, or remove decision makers before finalizing
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/decision-makers/${currentRequirement.id}`)}
                                                className="btn-primary"
                                            >
                                                Manage Decision Makers
                                            </button>
                                        </div>
                                    </div>

                                    {/* Scraping Status */}
                                    {scrapingJob && (scrapingStatus?.status === 'pending' || scrapingStatus?.status === 'in_progress') ? (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-semibold text-gray-900">Scraping LinkedIn Profiles...</h4>
                                                <span className="text-sm text-gray-600">{scrapingStatus?.progress || 0}%</span>
                                            </div>
                                            <div className="w-full bg-blue-200 rounded-full h-2.5 mb-2">
                                                <div
                                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${scrapingStatus?.progress || 0}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-sm text-gray-600">Finding profiles for {decisionMakers.length} decision maker roles...</p>
                                        </div>
                                    ) : scrapingStatus?.status === 'completed' ? (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-semibold text-gray-900">Scraping Completed!</h4>
                                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Found {scrapingStatus?.scrapedProfiles || 0} profiles. View them in the Leads section.
                                            </p>
                                            <button
                                                onClick={() => navigate(`/leads?requirementId=${currentRequirement.id}`)}
                                                className="btn-primary"
                                            >
                                                View Profiles
                                            </button>
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-gray-600 mb-4">No decision makers identified yet.</p>
                                    <button
                                        onClick={handleIdentifyDecisionMakers}
                                        className="btn-primary"
                                    >
                                        Identify Decision Makers
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}

export default BusinessRequirement
