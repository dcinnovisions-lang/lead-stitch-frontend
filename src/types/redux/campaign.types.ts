// Campaign Redux types
import type { Campaign, CampaignRecipient } from '../api/campaign.types'

export interface CampaignsState {
  campaigns: Campaign[]
  currentCampaign: Campaign | null
  recipients: CampaignRecipient[]
  loading: boolean
  sending: boolean
  error: string | null
}

export interface GetRecipientsResponse {
  campaignId: number
  recipients: CampaignRecipient[]
}

