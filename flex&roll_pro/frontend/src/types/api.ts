// ─── API Response Wrappers ───────────────────────────────────────────────────
// Raw shapes returned by the backend. Components never consume these directly —
// mappers transform them into domain entities (see types/entities.ts).

export interface ApiResponse<T> {
  data: T
  meta?: {
    total?: number
    page?: number
    per_page?: number
    processing_time_ms?: number
  }
  errors?: Array<{ code: string; message: string }>
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number
    page: number
    per_page: number
    processing_time_ms?: number
  }
}

// ─── Query Params / Filters ─────────────────────────────────────────────────

export interface RiskFilters {
  managerId?: string
  stage?: string
  isVip?: boolean
  category?:
    | 'stalled'
    | 'post_proposal_silence'
    | 'long_calculation'
    | 'no_response'
    | 'high_churn'
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  showAll?: boolean
}

export interface AnalyticsFilters {
  period?: 'week' | 'month' | 'quarter' | 'year'
  managerId?: string
}

export interface SearchFilters {
  types?: Array<'calculation' | 'tech_doc' | 'past_order' | 'template' | 'proposal'>
  clientId?: string
  dateFrom?: string
  dateTo?: string
}

export interface LeadFilters {
  segment?: string
  triggerType?: string
  showSaved?: boolean
}
