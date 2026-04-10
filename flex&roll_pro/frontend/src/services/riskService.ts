import * as mock from '@/mocks/adapter'
import type { RiskItem } from '@/types'
import type { RiskFilters } from '@/types/api'

export const riskService = {
  getRisks(filters?: RiskFilters): Promise<RiskItem[]> {
    return mock.mockGetRisks(filters)
  },
}
