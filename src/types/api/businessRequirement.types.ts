// Business Requirement API types

export interface BusinessRequirement {
  id: number | string
  // Support both camelCase and snake_case (API returns snake_case)
  requirementText?: string
  requirement_text?: string
  // At least one of requirementText or requirement_text should be present
  industry?: string
  productService?: string
  product_service?: string
  targetLocation?: string
  target_location?: string
  targetMarket?: string
  target_market?: string
  operationName?: string
  operation_name?: string
  status?: 'open' | 'in_progress' | 'closed' | 'scraping'
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  decisionMakers?: DecisionMaker[]
  decision_makers_finalized_at?: string
  decisionMakersFinalizedAt?: string
}

export interface DecisionMaker {
  id: number
  requirementId?: number
  requirement_id?: number
  suggestionId?: string
  suggestion_id?: string
  roleTitle?: string
  role_title?: string
  priority?: 'high' | 'medium' | 'low' | number
  finalized?: boolean
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  reasoning?: string
  industry_relevance?: string
  industryRelevance?: string
  confidence?: number
  api_source?: string
  apiSource?: string
  suggestion?: {
    id: string
    suggestion_text: string
    created_at?: string
  }
}

export interface CreateRequirementData {
  requirementText: string
  industry?: string
  productService?: string
  targetLocation?: string
  targetMarket?: string
  operationName?: string
}

export interface CreateDecisionMakerData {
  requirementId: number
  roleTitle: string
  priority?: 'high' | 'medium' | 'low'
}

