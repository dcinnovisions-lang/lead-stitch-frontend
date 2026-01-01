// Profile Redux types
import type { LinkedInProfile, ScrapingJob, ScrapingStatus } from '../api/profile.types'

export interface ProfilesState {
  profiles: LinkedInProfile[]
  currentProfile: LinkedInProfile | null
  loading: boolean
  error: string | null
  scrapingJob: ScrapingJob | null
  scrapingStatus: ScrapingStatus | null
  filters: {
    search: string
    role: string
    location: string
  }
}

export interface StartScrapingPayload {
  requirementId: number
}

export interface ScrapingStatusResponse extends ScrapingStatus {
  profiles?: LinkedInProfile[]
}

export interface EnrichEmailsResponse {
  profiles: LinkedInProfile[]
}

