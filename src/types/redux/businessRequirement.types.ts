// Business Requirement Redux types
import type { BusinessRequirement, DecisionMaker } from '../api/businessRequirement.types'

export interface BusinessRequirementState {
  currentRequirement: BusinessRequirement | null
  requirements: BusinessRequirement[]
  decisionMakers: DecisionMaker[]
  loading: boolean
  identifying: boolean
  error: string | null
}

export interface IdentifyDecisionMakersResponse {
  decisionMakers: DecisionMaker[]
}

