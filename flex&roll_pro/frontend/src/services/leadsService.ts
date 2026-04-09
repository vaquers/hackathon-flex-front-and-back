import { API_CONFIG } from '@/api/config'
import { apiClient } from '@/api/client'
import * as mock from '@/mocks/adapter'
import type { Lead } from '@/types'
import type { LeadFilters } from '@/types/api'

export const leadsService = {
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
    // TODO: Integrate with Bitrix24 CRM API
    return apiClient.post(`/leads/${id}/add-to-crm`)
  },
}
