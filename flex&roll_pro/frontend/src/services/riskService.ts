import { API_CONFIG } from '@/api/config'
import { apiClient } from '@/api/client'
import * as mock from '@/mocks/adapter'
import type { RiskItem } from '@/types'
import type { RiskFilters } from '@/types/api'

export const riskService = {
  getRisks(filters?: RiskFilters): Promise<RiskItem[]> {
    if (API_CONFIG.useMock) return mock.mockGetRisks(filters)
    return apiClient.get('/risks', { params: filters })
  },
}
