import { API_CONFIG } from '@/api/config'
import { apiClient } from '@/api/client'
import * as mock from '@/mocks/adapter'
import type { SearchResponse } from '@/types'
import type { SearchFilters } from '@/types/api'

export interface PopularDoc {
  id: string
  name: string
  type: string
  date: string
}

export const searchService = {
  search(query: string, filters?: SearchFilters): Promise<SearchResponse> {
    if (API_CONFIG.useMock) return mock.mockSearch(query, filters)
    return apiClient.get('/search', { params: { q: query, ...filters } })
  },

  getPopularDocs(): Promise<PopularDoc[]> {
    if (API_CONFIG.useMock) return mock.mockGetPopularDocs()
    return apiClient.get<PopularDoc[]>('/search/popular')
  },
}
