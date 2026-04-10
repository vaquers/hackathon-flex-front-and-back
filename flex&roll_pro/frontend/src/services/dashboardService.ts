import * as mock from '@/mocks/adapter'
import type { DashboardSummary, PriorityDeal, IncomingRequest, VipAlert, SentimentItem } from '@/types'

// ─── Dashboard Service ───────────────────────────────────────────────────────
// Presentation screen: intentionally stays on mock data for the demo flow.

export const dashboardService = {
  getSummary(): Promise<DashboardSummary> {
    return mock.mockGetDashboardSummary()
  },

  getPriorityDeals(): Promise<PriorityDeal[]> {
    return mock.mockGetPriorityDeals()
  },

  getIncomingRequests(): Promise<IncomingRequest[]> {
    return mock.mockGetIncomingRequests()
  },

  getVipAlerts(): Promise<VipAlert[]> {
    return mock.mockGetVipAlerts()
  },

  getSentimentFeed(): Promise<SentimentItem[]> {
    return mock.mockGetSentimentFeed()
  },

  confirmRouting(requestId: string, assigneeId: string): Promise<void> {
    return mock.mockConfirmRouting(requestId, assigneeId)
  },
}
