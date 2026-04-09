import { API_CONFIG } from '@/api/config'
import { apiClient } from '@/api/client'
import * as mock from '@/mocks/adapter'
import type { Lead, TopLeadsResponse, PipelineStatus } from '@/types'
import type { LeadFilters } from '@/types/api'

export const leadsService = {
  // ── Real AI-generated leads ───────────────────────────────────────────────

  getTopLeads(): Promise<TopLeadsResponse> {
    return apiClient.get('/leads/top')
  },

  refreshLeads(): Promise<PipelineStatus> {
    return apiClient.post('/leads/refresh')
  },

  getPipelineStatus(): Promise<PipelineStatus> {
    return apiClient.get('/leads/status')
  },

  // ── Legacy mock leads ─────────────────────────────────────────────────────

  getLeads(filters?: LeadFilters): Promise<Lead[]> {
    if (API_CONFIG.useMock) return mock.mockGetLeads(filters)
    return apiClient.get('/leads', { params: filters })
  },

  saveLead(id: string): Promise<void> {
    if (API_CONFIG.useMock) return mock.mockSaveLead(id)
    return apiClient.post(`/leads/${id}/save`)
  },

  hideLead(id: string): Promise<void> {
    if (API_CONFIG.useMock) return mock.mockHideLead(id)
    return apiClient.post(`/leads/${id}/hide`)
  },

  addToCrm(id: string): Promise<void> {
    if (API_CONFIG.useMock) return new Promise((resolve) => setTimeout(resolve, 300))
    return apiClient.post(`/leads/${id}/add-to-crm`)
  },
}
