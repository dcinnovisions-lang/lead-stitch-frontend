// Decision Maker Redux types
import type { DecisionMaker } from '../api/businessRequirement.types'

export interface DecisionMakersState {
  decisionMakers: DecisionMaker[]
  loading: boolean
  error: string | null
}

export interface CreateDecisionMakerPayload {
  requirementId: number
  roleTitle: string
  priority?: 'high' | 'medium' | 'low' | null
}

export interface UpdateDecisionMakerPayload {
  id: number
  roleTitle: string
  priority?: 'high' | 'medium' | 'low' | null
}

