// Campaign API types

export interface Campaign {
  id: string | number
  name: string
  description?: string
  templateId?: number
  template_id?: number | string
  requirementId?: number
  requirement_id?: number
  status?: 'draft' | 'sent' | 'scheduled' | 'completed' | 'sending' | 'paused' | 'cancelled'
  subject?: string
  scheduledAt?: string
  scheduled_at?: string
  sentAt?: string
  sent_at?: string
  started_at?: string
  completed_at?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  recipientCount?: number
  total_recipients?: number
  sentCount?: number
  sent_count?: number
  openedCount?: number
  opened_count?: number
  clickedCount?: number
  clicked_count?: number
  replied_count?: number
  bounced_count?: number
  unsubscribed_count?: number
  smtp_credential_id?: number | string
  body_html?: string
  body_text?: string
  variables?: Record<string, string>
}

export interface CampaignRecipient {
  id: number
  campaignId: number
  profileId: number
  email: string
  name?: string
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'delivered' | 'replied'
  sentAt?: string
  sent_at?: string
  delivered_at?: string
  openedAt?: string
  opened_at?: string
  clickedAt?: string
  clicked_at?: string
  replied_at?: string
  bounced_at?: string
  error?: string
  error_message?: string
}

export interface CreateCampaignData {
  name: string
  templateId: number
  requirementId?: number
  subject?: string
  scheduledAt?: string
  variables?: Record<string, string>
}

export interface UpdateCampaignData {
  name?: string
  subject?: string
  scheduledAt?: string
  status?: string
  variables?: Record<string, string>
}

