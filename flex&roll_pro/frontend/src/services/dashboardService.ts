import { API_CONFIG } from '@/api/config'
import { apiClient } from '@/api/client'
import * as mock from '@/mocks/adapter'
import type { DashboardSummary, PriorityDeal, IncomingRequest, VipAlert, SentimentItem } from '@/types'

// ─── Dashboard Service ───────────────────────────────────────────────────────
// All dashboard data access goes through here.
// Switch between mock and real API by toggling API_CONFIG.useMock.

export const dashboardService = {
  getSummary(): Promise<DashboardSummary> {
    if (API_CONFIG.useMock) return mock.mockGetDashboardSummary()
    return apiClient.get('/dashboard/summary')
  },

  getPriorityDeals(): Promise<PriorityDeal[]> {
    if (API_CONFIG.useMock) return mock.mockGetPriorityDeals()
    return apiClient.get('/dashboard/priority-deals')
  },

  getIncomingRequests(): Promise<IncomingRequest[]> {
    if (API_CONFIG.useMock) return mock.mockGetIncomingRequests()
    return apiClient.get('/dashboard/incoming')
  },

  getVipAlerts(): Promise<VipAlert[]> {
    if (API_CONFIG.useMock) return mock.mockGetVipAlerts()
    return apiClient.get('/dashboard/vip-alerts')
  },

  getSentimentFeed(): Promise<SentimentItem[]> {
    if (API_CONFIG.useMock) return mock.mockGetSentimentFeed()
    return apiClient.get('/dashboard/sentiment-feed')
  },

  confirmRouting(requestId: string, assigneeId: string): Promise<void> {
    if (API_CONFIG.useMock) return mock.mockConfirmRouting(requestId, assigneeId)
    return apiClient.post(`/dashboard/incoming/${requestId}/confirm`, { assignee_id: assigneeId })
  },
}
