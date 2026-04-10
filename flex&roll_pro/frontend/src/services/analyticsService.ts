import * as mock from '@/mocks/adapter'
import type { AnalyticsOverview, EmployeeKpi, DynamicsDataPoint, CommunicationQuality, LostDealReason, LostDealsByStage } from '@/types'
import type { AnalyticsFilters } from '@/types/api'

export const analyticsService = {
  getOverview(filters?: AnalyticsFilters): Promise<AnalyticsOverview> {
    return mock.mockGetAnalyticsOverview(filters)
  },

  getEmployeeKpi(filters?: AnalyticsFilters): Promise<EmployeeKpi[]> {
    return mock.mockGetEmployeeKpi(filters)
  },

  getDynamics(filters?: AnalyticsFilters): Promise<DynamicsDataPoint[]> {
    return mock.mockGetDynamics(filters)
  },

  getCommunicationQuality(filters?: AnalyticsFilters): Promise<CommunicationQuality[]> {
    return mock.mockGetCommunicationQuality(filters)
  },

  getLostDealReasons(filters?: AnalyticsFilters): Promise<LostDealReason[]> {
    return mock.mockGetLostDealReasons(filters)
  },

  getLostDealsByStage(filters?: AnalyticsFilters): Promise<LostDealsByStage[]> {
    return mock.mockGetLostDealsByStage(filters)
  },
}
