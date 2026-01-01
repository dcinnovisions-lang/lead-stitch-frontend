// Profile API types

export interface ProfileEmail {
  email: string
  is_verified?: boolean
  source?: string
}

export interface ExperienceDetail {
  title?: string
  company?: string
  duration?: string
}

export interface BusinessRequirementReference {
  operation_name?: string
  id?: number | string
}

export interface LinkedInProfile {
  id: number
  requirementId?: number
  requirement_id?: number
  business_requirement_id?: number | string
  firstName?: string
  lastName?: string
  fullName?: string
  name?: string
  headline?: string
  title?: string
  profession?: string
  location?: string
  email?: string
  email_verified?: boolean
  emails?: ProfileEmail[]
  linkedinUrl?: string
  profile_url?: string
  profileImageUrl?: string
  company?: string
  company_name?: string
  position?: string
  decision_maker_role?: string
  experience?: string
  experience_details?: ExperienceDetail[] | string
  education?: string
  skills?: string[]
  scrapedAt?: string
  scraped_at?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  business_requirement?: BusinessRequirementReference
}

// Alias for backward compatibility
export type Profile = LinkedInProfile

export interface ScrapingJob {
  id: string
  requirementId: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress?: number
  totalProfiles?: number
  scrapedProfiles?: number
  startedAt?: string
  completedAt?: string
  error?: string
}

export interface ScrapingStatus {
  jobId: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress: number
  totalProfiles?: number
  scrapedProfiles?: number
  message?: string
}

