import { API_CONFIG } from '@/api/config'
import { apiClient } from '@/api/client'
import * as mock from '@/mocks/adapter'
import type { Client, AiClientSummary, CommunicationEvent, CallSummary, CallQualityReview, AiNextAction, RelatedDocument } from '@/types'

export const clientService = {
  getClient(id: string): Promise<Client> {
    if (API_CONFIG.useMock) return mock.mockGetClient(id)
    return apiClient.get(`/clients/${id}`)
  },

  getAiSummary(clientId: string): Promise<AiClientSummary> {
    if (API_CONFIG.useMock) return mock.mockGetAiSummary(clientId)
    return apiClient.get(`/clients/${clientId}/ai-summary`)
  },

  getCommunications(clientId: string): Promise<CommunicationEvent[]> {
    if (API_CONFIG.useMock) return mock.mockGetCommunications(clientId)
    return apiClient.get(`/clients/${clientId}/communications`)
  },

  getCallSummary(eventId: string): Promise<CallSummary> {
    if (API_CONFIG.useMock) return mock.mockGetCallSummary(eventId)
    return apiClient.get(`/calls/${eventId}/summary`)
  },

  getCallQuality(eventId: string): Promise<CallQualityReview> {
    if (API_CONFIG.useMock) return mock.mockGetCallQuality(eventId)
    return apiClient.get(`/calls/${eventId}/quality`)
  },

  getAiNextAction(clientId: string): Promise<AiNextAction> {
    if (API_CONFIG.useMock) return mock.mockGetAiNextAction(clientId)
    return apiClient.get(`/clients/${clientId}/next-action`)
  },

  getRelatedDocuments(clientId: string): Promise<RelatedDocument[]> {
    if (API_CONFIG.useMock) return mock.mockGetRelatedDocuments(clientId)
    return apiClient.get(`/clients/${clientId}/documents`)
  },
}
