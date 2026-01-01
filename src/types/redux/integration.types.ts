// Integration Redux types
import type { LinkedInCredentials } from '../api/integration.types'

export interface IntegrationsState {
  linkedInCredentials: LinkedInCredentials | null
  loading: boolean
  saving: boolean
  error: string | null
}

export interface SaveLinkedInCredentialsPayload {
  email: string
  password: string
}

export interface LinkedInCredentialsResponse {
  exists: boolean
  credentials?: LinkedInCredentials
}

