import { API_CONFIG } from '@/api/config'
import { apiClient } from '@/api/client'
import * as mock from '@/mocks/adapter'
import type { AnalyticsOverview, EmployeeKpi, DynamicsDataPoint, CommunicationQuality, LostDealReason, LostDealsByStage } from '@/types'
import type { AnalyticsFilters } from '@/types/api'

export const analyticsService = {
  getOverview(filters?: AnalyticsFilters): Promise<AnalyticsOverview> {
    if (API_CONFIG.useMock) return mock.mockGetAnalyticsOverview(filters)
    return apiClient.get('/analytics/overview', { params: filters })
  },

  getEmployeeKpi(filters?: AnalyticsFilters): Promise<EmployeeKpi[]> {
    if (API_CONFIG.useMock) return mock.mockGetEmployeeKpi(filters)
    return apiClient.get('/analytics/employee-kpi', { params: filters })
  },

  getDynamics(filters?: AnalyticsFilters): Promise<DynamicsDataPoint[]> {
    if (API_CONFIG.useMock) return mock.mockGetDynamics(filters)
    return apiClient.get('/analytics/dynamics', { params: filters })
  },

  getCommunicationQuality(filters?: AnalyticsFilters): Promise<CommunicationQuality[]> {
    if (API_CONFIG.useMock) return mock.mockGetCommunicationQuality(filters)
    return apiClient.get('/analytics/communication-quality', { params: filters })
  },

  getLostDealReasons(filters?: AnalyticsFilters): Promise<LostDealReason[]> {
    if (API_CONFIG.useMock) return mock.mockGetLostDealReasons(filters)
    return apiClient.get('/analytics/lost-reasons', { params: filters })
  },

  getLostDealsByStage(filters?: AnalyticsFilters): Promise<LostDealsByStage[]> {
    if (API_CONFIG.useMock) return mock.mockGetLostDealsByStage(filters)
    return apiClient.get('/analytics/lost-by-stage', { params: filters })
  },
}
