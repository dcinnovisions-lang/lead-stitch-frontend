// Lead API types

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'

export interface Lead {
  id: number
  profileId?: number
  requirementId?: number
  requirement_id?: number | string
  requirement_name?: string | null
  email?: string | null
  email_verified?: boolean
  firstName?: string
  lastName?: string
  name?: string
  company?: string
  company_name?: string
  title?: string
  profession?: string
  location?: string
  decision_maker_role?: string
  profile_url?: string
  scraped_at?: string
  status?: LeadStatus
  notes?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

