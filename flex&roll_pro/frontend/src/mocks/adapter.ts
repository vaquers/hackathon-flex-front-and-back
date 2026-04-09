import { API_CONFIG } from '@/api/config'
import type {
  DashboardSummary, PriorityDeal, IncomingRequest, VipAlert, SentimentItem,
  Client, AiClientSummary, CommunicationEvent, CallSummary, CallQualityReview, AiNextAction, RelatedDocument,
  RiskItem, AnalyticsOverview, EmployeeKpi, DynamicsDataPoint, CommunicationQuality, LostDealReason, LostDealsByStage,
  SearchResponse, Lead,
} from '@/types'

import {
  MOCK_DASHBOARD_SUMMARY, MOCK_PRIORITY_DEALS, MOCK_INCOMING_REQUESTS, MOCK_VIP_ALERTS, MOCK_SENTIMENT_FEED,
} from './data/dashboard'
import {
  MOCK_CLIENTS, MOCK_AI_SUMMARIES, MOCK_COMMUNICATIONS, MOCK_CALL_SUMMARIES, MOCK_CALL_QUALITY, MOCK_NEXT_ACTIONS, MOCK_RELATED_DOCS,
} from './data/clients'
import { MOCK_RISKS } from './data/risks'
import {
  MOCK_ANALYTICS_OVERVIEW, MOCK_EMPLOYEE_KPI, MOCK_DYNAMICS, MOCK_COMMUNICATION_QUALITY, MOCK_LOST_DEAL_REASONS, MOCK_LOST_BY_STAGE,
} from './data/analytics'
import { MOCK_SEARCH_RESULTS, MOCK_POPULAR_DOCS } from './data/search'
import { MOCK_LEADS } from './data/leads'
import type { RiskFilters, AnalyticsFilters, SearchFilters, LeadFilters } from '@/types/api'

// ─── Mock Adapter ────────────────────────────────────────────────────────────
// Simulates the API with realistic mock data and artificial delay.
// All methods mirror the real service signatures exactly.

function delay(ms?: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms ?? API_CONFIG.mockDelayMs))
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function mockGetDashboardSummary(): Promise<DashboardSummary> {
  await delay()
  return MOCK_DASHBOARD_SUMMARY
}

export async function mockGetPriorityDeals(): Promise<PriorityDeal[]> {
  await delay()
  return MOCK_PRIORITY_DEALS
}

export async function mockGetIncomingRequests(): Promise<IncomingRequest[]> {
  await delay()
  return MOCK_INCOMING_REQUESTS
}

export async function mockGetVipAlerts(): Promise<VipAlert[]> {
  await delay()
  return MOCK_VIP_ALERTS
}

export async function mockGetSentimentFeed(): Promise<SentimentItem[]> {
  await delay()
  return MOCK_SENTIMENT_FEED
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export async function mockGetClient(id: string): Promise<Client> {
  await delay()
  const client = MOCK_CLIENTS.find((c) => c.id === id)
  if (!client) throw new Error('Клиент не найден')
  return client
}

export async function mockGetAiSummary(clientId: string): Promise<AiClientSummary> {
  await delay()
  const summary = MOCK_AI_SUMMARIES[clientId]
  if (!summary) throw new Error('AI Summary не найден')
  return summary
}

export async function mockGetCommunications(clientId: string): Promise<CommunicationEvent[]> {
  await delay()
  return MOCK_COMMUNICATIONS[clientId] ?? []
}

export async function mockGetCallSummary(eventId: string): Promise<CallSummary> {
  await delay()
  const summary = MOCK_CALL_SUMMARIES[eventId]
  if (!summary) throw new Error('Резюме звонка не найдено')
  return summary
}

export async function mockGetCallQuality(eventId: string): Promise<CallQualityReview> {
  await delay()
  const review = MOCK_CALL_QUALITY[eventId]
  if (!review) throw new Error('Оценка звонка не найдена')
  return review
}

export async function mockGetAiNextAction(clientId: string): Promise<AiNextAction> {
  await delay()
  const action = MOCK_NEXT_ACTIONS[clientId]
  if (!action) throw new Error('AI Next Action не найден')
  return action
}

export async function mockGetRelatedDocuments(clientId: string): Promise<RelatedDocument[]> {
  await delay()
  return MOCK_RELATED_DOCS[clientId] ?? []
}

// ─── Risks ───────────────────────────────────────────────────────────────────

export async function mockGetRisks(filters?: RiskFilters): Promise<RiskItem[]> {
  await delay()
  let items = [...MOCK_RISKS]
  if (filters?.riskLevel) items = items.filter((r) => r.riskLevel === filters.riskLevel)
  if (filters?.managerId) items = items.filter((r) => r.managerId === filters.managerId)
  if (filters?.isVip) items = items.filter((r) => r.isVip)
  if (filters?.category) items = items.filter((r) => r.riskCategory === filters.category)
  return items.sort((a, b) => b.riskScore - a.riskScore)
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function mockGetAnalyticsOverview(_filters?: AnalyticsFilters): Promise<AnalyticsOverview> {
  await delay()
  return MOCK_ANALYTICS_OVERVIEW
}

export async function mockGetEmployeeKpi(_filters?: AnalyticsFilters): Promise<EmployeeKpi[]> {
  await delay()
  return MOCK_EMPLOYEE_KPI
}

export async function mockGetDynamics(_filters?: AnalyticsFilters): Promise<DynamicsDataPoint[]> {
  await delay()
  return MOCK_DYNAMICS
}

export async function mockGetCommunicationQuality(_filters?: AnalyticsFilters): Promise<CommunicationQuality[]> {
  await delay()
  return MOCK_COMMUNICATION_QUALITY
}

export async function mockGetLostDealReasons(_filters?: AnalyticsFilters): Promise<LostDealReason[]> {
  await delay()
  return MOCK_LOST_DEAL_REASONS
}

export async function mockGetLostDealsByStage(_filters?: AnalyticsFilters): Promise<LostDealsByStage[]> {
  await delay()
  return MOCK_LOST_BY_STAGE
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function mockSearch(query: string, _filters?: SearchFilters): Promise<SearchResponse> {
  await delay(600) // Simulate RAG processing
  const results = query.trim()
    ? MOCK_SEARCH_RESULTS.filter((r) =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.aiAnswer.toLowerCase().includes(query.toLowerCase()) ||
        r.tags.some((t) => t.includes(query.toLowerCase()))
      )
    : MOCK_SEARCH_RESULTS
  return {
    query,
    results,
    total: results.length,
    processingTime: 612,
    suggestedFilters: ['Расчёты', 'КП', 'Техдокументы'],
  }
}

export async function mockGetPopularDocs() {
  await delay(200)
  return MOCK_POPULAR_DOCS
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export async function mockGetLeads(filters?: LeadFilters): Promise<Lead[]> {
  await delay()
  let items = MOCK_LEADS.filter((l) => !l.isHidden)
  if (filters?.segment) items = items.filter((l) => l.segment === filters.segment)
  if (filters?.triggerType) items = items.filter((l) => l.triggerType === filters.triggerType)
  if (filters?.showSaved) items = items.filter((l) => l.isSaved)
  return items.sort((a, b) => b.orderProbability - a.orderProbability)
}

export async function mockSaveLead(id: string): Promise<void> {
  await delay(200)
  const lead = MOCK_LEADS.find((l) => l.id === id)
  if (lead) lead.isSaved = true
}

export async function mockHideLead(id: string): Promise<void> {
  await delay(200)
  const lead = MOCK_LEADS.find((l) => l.id === id)
  if (lead) lead.isHidden = true
}

// ─── Incoming Requests Actions ────────────────────────────────────────────────

export async function mockConfirmRouting(requestId: string, _assigneeId: string): Promise<void> {
  await delay(300)
  console.log('[MOCK] Routing confirmed:', requestId)
}
