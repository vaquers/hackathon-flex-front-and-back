import { apiClient } from '@/api/client'
import { API_CONFIG } from '@/api/config'
import type { BitrixDealsSyncResult, BitrixTeamMember } from '@/types'

type RawRecord = Record<string, any>

function mapTeamMember(raw: RawRecord): BitrixTeamMember {
  return {
    id: raw.id,
    bitrixUserId: raw.bitrixUserId ?? raw.bitrix_user_id,
    name: raw.name,
    role: raw.role,
    experienceText: raw.experienceText ?? raw.experience_text ?? '',
    rating: raw.rating ?? 0,
  }
}

function mapDealsSyncResult(raw: RawRecord): BitrixDealsSyncResult {
  return {
    status: raw.status ?? 'unknown',
    deals: (raw.deals ?? []).map((item: RawRecord) => ({
      dealId: item.dealId ?? item.deal_id,
      contact: item.contact ?? 'Контакт',
      title: item.title ?? undefined,
      stage: item.stage ?? undefined,
      probability: item.probability ?? undefined,
      opportunity: item.opportunity ?? undefined,
      error: item.error ?? undefined,
    })),
  }
}

export const bitrixService = {
  syncDeals(): Promise<BitrixDealsSyncResult> {
    if (API_CONFIG.useMock) {
      return Promise.resolve({ status: 'mock', deals: [] })
    }
    return apiClient.post<RawRecord>('/bitrix/deals/sync').then(mapDealsSyncResult)
  },

  getTeam(): Promise<BitrixTeamMember[]> {
    if (API_CONFIG.useMock) {
      return Promise.resolve([])
    }
    return apiClient.get<RawRecord[]>('/bitrix/team').then((items) => items.map(mapTeamMember))
  },
}
