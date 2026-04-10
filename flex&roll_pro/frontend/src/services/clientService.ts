import { API_CONFIG } from '@/api/config'
import { apiClient } from '@/api/client'
import * as mock from '@/mocks/adapter'
import type {
  AiClientSummary,
  AiNextAction,
  BitrixBrief,
  BitrixCallDetail,
  BitrixCallListItem,
  BitrixConversationSummary,
  BitrixTempAssignment,
  CallQualityReview,
  CallSummary,
  Client,
  CommunicationEvent,
  RelatedDocument,
} from '@/types'

type RawRecord = Record<string, any>

function isPresentationMockClientId(id: string): boolean {
  return /^c-\d+$/.test(id)
}

function isPresentationMockEventId(id: string): boolean {
  return /^ev-\d+$/.test(id)
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toStringValue(value: unknown, fallback = '—'): string {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item : typeof item === 'number' || typeof item === 'boolean' ? String(item) : null))
    .filter((item): item is string => Boolean(item && item.trim()))
}

function toAttachmentArray(value: unknown): Array<{ name: string; url: string }> {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as RawRecord
      const name = toStringValue(record.name, '')
      const url = toStringValue(record.url, '')
      if (!name || !url) return null
      return { name, url }
    })
    .filter((item): item is { name: string; url: string } => Boolean(item))
}

function mapClient(raw: RawRecord): Client {
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? 'Контакт',
    company: raw.company ?? raw.name ?? 'Клиент',
    segment: raw.segment ?? 'mid',
    segmentLabel: raw.segmentLabel ?? raw.segment_label ?? 'Bitrix bridge',
    isVip: Boolean(raw.isVip ?? raw.is_vip),
    managerId: raw.managerId ?? raw.manager_id ?? 'bridge',
    managerName: raw.managerName ?? raw.manager_name ?? 'Backend Антона',
    phone: raw.phone ?? undefined,
    email: raw.email ?? undefined,
    dealId: raw.dealId ?? raw.deal_id ?? String(raw.id ?? ''),
    dealAmount: toNumber(raw.dealAmount ?? raw.deal_amount, 0),
    dealCurrency: raw.dealCurrency ?? raw.deal_currency ?? 'RUB',
    dealStage: raw.dealStage ?? raw.deal_stage ?? 'qualification',
    dealStageLabel: raw.dealStageLabel ?? raw.deal_stage_label ?? 'Bitrix bridge',
    riskScore: toNumber(raw.riskScore ?? raw.risk_score, 0),
    riskLevel: raw.riskLevel ?? raw.risk_level ?? 'low',
    riskReason: raw.riskReason ?? raw.risk_reason ?? 'Нет дополнительных сигналов риска',
    sentiment: raw.sentiment ?? 'neutral',
    lastContactAt: raw.lastContactAt ?? raw.last_contact_at ?? new Date().toISOString(),
    daysSinceContact: toNumber(raw.daysSinceContact ?? raw.days_since_contact, 0),
    product: raw.product ?? '—',
    expectedVolume: raw.expectedVolume ?? raw.expected_volume ?? '—',
    city: raw.city ?? '—',
    inn: raw.inn ?? undefined,
    bridgeContactId: raw.bridgeContactId ?? raw.bridge_contact_id ?? null,
    bridgeChatId: raw.bridgeChatId ?? raw.bridge_chat_id ?? null,
    bridgeConnected: raw.bridgeConnected ?? raw.bridge_connected ?? false,
  }
}

function mapAiSummary(raw: RawRecord): AiClientSummary {
  return {
    clientId: String(raw.clientId ?? raw.client_id ?? ''),
    company: toStringValue(raw.company),
    segment: toStringValue(raw.segment),
    product: toStringValue(raw.product),
    expectedVolume: toStringValue(raw.expectedVolume ?? raw.expected_volume),
    recentActions: toStringArray(raw.recentActions ?? raw.recent_actions),
    dealStage: toStringValue(raw.dealStage ?? raw.deal_stage),
    riskScore: toNumber(raw.riskScore ?? raw.risk_score, 0),
    riskReason: toStringValue(raw.riskReason ?? raw.risk_reason),
    priority: raw.priority ?? 'medium',
    priorityLabel: toStringValue(raw.priorityLabel ?? raw.priority_label),
    recommendedNextStep: toStringValue(raw.recommendedNextStep ?? raw.recommended_next_step),
    generatedAt: toStringValue(raw.generatedAt ?? raw.generated_at, new Date().toISOString()),
  }
}

function mapCommunication(raw: RawRecord): CommunicationEvent {
  return {
    id: String(raw.id ?? ''),
    clientId: String(raw.clientId ?? raw.client_id ?? ''),
    type: raw.type ?? 'note',
    typeLabel: toStringValue(raw.typeLabel ?? raw.type_label, 'Событие'),
    title: toStringValue(raw.title, 'Событие'),
    summary: raw.summary ? String(raw.summary) : undefined,
    body: raw.body ? String(raw.body) : undefined,
    author: toStringValue(raw.author, 'Система'),
    authorId: String(raw.authorId ?? raw.author_id ?? 'system'),
    happenedAt: toStringValue(raw.happenedAt ?? raw.happened_at, new Date().toISOString()),
    durationSeconds: toNumber(raw.durationSeconds ?? raw.duration_seconds, 0) || undefined,
    sentiment: raw.sentiment ?? undefined,
    isImportant: raw.isImportant ?? raw.is_important ?? false,
    attachments: toAttachmentArray(raw.attachments),
  }
}

function mapCallSummary(raw: RawRecord): CallSummary {
  return {
    id: String(raw.id ?? ''),
    clientId: String(raw.clientId ?? raw.client_id ?? ''),
    happenedAt: toStringValue(raw.happenedAt ?? raw.happened_at, new Date().toISOString()),
    durationSeconds: toNumber(raw.durationSeconds ?? raw.duration_seconds, 0),
    summary: toStringValue(raw.summary),
    agreements: toStringArray(raw.agreements),
    nextStep: toStringValue(raw.nextStep ?? raw.next_step),
    responsible: toStringValue(raw.responsible),
    sentiment: raw.sentiment,
    qualityScore: toNumber(raw.qualityScore ?? raw.quality_score, 0),
  }
}

function mapCallQuality(raw: RawRecord): CallQualityReview {
  return {
    callId: String(raw.callId ?? raw.call_id ?? ''),
    doneWell: toStringArray(raw.doneWell ?? raw.done_well),
    missed: toStringArray(raw.missed),
    needIdentificationScore: toNumber(raw.needIdentificationScore ?? raw.need_identification_score, 0),
    objectionHandlingScore: toNumber(raw.objectionHandlingScore ?? raw.objection_handling_score, 0),
    nextStepFixedScore: toNumber(raw.nextStepFixedScore ?? raw.next_step_fixed_score, 0),
    overallScore: toNumber(raw.overallScore ?? raw.overall_score, 0),
    recommendations: toStringArray(raw.recommendations),
  }
}

function mapNextAction(raw: RawRecord): AiNextAction {
  return {
    clientId: String(raw.clientId ?? raw.client_id ?? ''),
    action: toStringValue(raw.action),
    reason: toStringValue(raw.reason),
    urgency: raw.urgency ?? 'medium',
    deadline: raw.deadline ?? undefined,
    type: raw.type ?? 'internal',
  }
}

function mapRelatedDocument(raw: RawRecord): RelatedDocument {
  return {
    id: String(raw.id ?? ''),
    type: raw.type ?? 'proposal',
    typeLabel: toStringValue(raw.typeLabel ?? raw.type_label, 'Документ'),
    name: toStringValue(raw.name, 'Документ'),
    relevance: toNumber(raw.relevance, 0),
    date: toStringValue(raw.date, new Date().toISOString()),
    clientName: raw.clientName ?? raw.client_name ?? undefined,
    url: raw.url ?? undefined,
  }
}

function mapBitrixConversationSummary(raw: RawRecord): BitrixConversationSummary {
  return {
    contactId: raw.contactId ?? raw.contact_id,
    contactName: raw.contactName ?? raw.contact_name,
    summary: raw.summary ?? '',
    data: raw.data ?? {},
  }
}

function mapBitrixBrief(raw: RawRecord): BitrixBrief {
  return {
    company: raw.company ?? 'Клиент',
    segment: raw.segment ?? '—',
    circulation: raw.circulation ?? raw.volume ?? '—',
    material: raw.material ?? '—',
    lastStage: raw.lastStage ?? raw.last_stage ?? '—',
    churnRisk: raw.churnRisk ?? raw.churn_risk ?? '—',
    priority: raw.priority ?? '—',
    callTips: toStringArray(raw.callTips ?? raw.call_tips),
  }
}

function mapBitrixCall(raw: RawRecord): BitrixCallListItem {
  return {
    id: raw.id,
    callId: raw.callId ?? raw.call_id,
    chatTitle: raw.chatTitle ?? raw.chat_title,
    startedAt: raw.startedAt ?? raw.started_at ?? null,
    finishedAt: raw.finishedAt ?? raw.finished_at ?? null,
    startedAtFormatted: raw.startedAtFormatted ?? raw.started_at_formatted,
    finishedAtFormatted: raw.finishedAtFormatted ?? raw.finished_at_formatted,
    createdAt: raw.createdAt ?? raw.created_at,
    hasTranscript: raw.hasTranscript ?? raw.has_transcript ?? false,
    hasSummary: raw.hasSummary ?? raw.has_summary ?? false,
    hasAiReview: raw.hasAiReview ?? raw.has_ai_review ?? false,
  }
}

function mapBitrixCallDetail(raw: RawRecord): BitrixCallDetail {
  return {
    ...mapBitrixCall(raw),
    transcriptText: raw.transcriptText ?? raw.transcript_text ?? null,
    summaryText: raw.summaryText ?? raw.summary_text ?? null,
    aiReview: raw.aiReview ?? raw.ai_review ?? null,
    participants: Array.isArray(raw.participants)
      ? raw.participants
          .filter((participant: unknown): participant is RawRecord => Boolean(participant && typeof participant === 'object'))
          .map((participant) => ({
            id: participant.id ?? '',
            name: toStringValue(participant.name, 'Участник'),
            telegramId: participant.telegramId ?? participant.telegram_id ?? null,
            telegramUsername: participant.telegramUsername ?? participant.telegram_username ?? null,
          }))
      : [],
  }
}

function mapTempAssignment(raw: RawRecord): BitrixTempAssignment {
  return {
    assignmentId: raw.assignmentId ?? raw.assignment_id,
    dialogId: raw.dialogId ?? raw.dialog_id,
    createdAt: raw.createdAt ?? raw.created_at,
    originalManager: {
      bitrixUserId: raw.originalManager?.bitrixUserId ?? raw.originalManager?.bitrix_user_id ?? raw.original_manager_bitrix_id,
      name: raw.originalManager?.name ?? null,
    },
    tempManager: {
      bitrixUserId: raw.tempManager?.bitrixUserId ?? raw.tempManager?.bitrix_user_id ?? raw.temp_manager_bitrix_id,
      name: raw.tempManager?.name ?? null,
    },
  }
}

export const clientService = {
  listClients(): Promise<Client[]> {
    if (API_CONFIG.useMock) return mock.mockListClients()
    return apiClient.get<RawRecord[]>('/clients').then((items) => items.map(mapClient))
  },

  getClient(id: string): Promise<Client> {
    if (API_CONFIG.useMock || isPresentationMockClientId(id)) return mock.mockGetClient(id)
    return apiClient.get<RawRecord>(`/clients/${id}`).then(mapClient)
  },

  getAiSummary(clientId: string): Promise<AiClientSummary> {
    if (API_CONFIG.useMock || isPresentationMockClientId(clientId)) return mock.mockGetAiSummary(clientId)
    return apiClient.get<RawRecord>(`/clients/${clientId}/ai-summary`).then(mapAiSummary)
  },

  getCommunications(clientId: string): Promise<CommunicationEvent[]> {
    if (API_CONFIG.useMock || isPresentationMockClientId(clientId)) return mock.mockGetCommunications(clientId)
    return apiClient.get<RawRecord[]>(`/clients/${clientId}/communications`).then((items) => items.map(mapCommunication))
  },

  getCallSummary(eventId: string): Promise<CallSummary> {
    if (API_CONFIG.useMock || isPresentationMockEventId(eventId)) return mock.mockGetCallSummary(eventId)
    return apiClient.get<RawRecord>(`/calls/${eventId}/summary`).then(mapCallSummary)
  },

  getCallQuality(eventId: string): Promise<CallQualityReview> {
    if (API_CONFIG.useMock || isPresentationMockEventId(eventId)) return mock.mockGetCallQuality(eventId)
    return apiClient.get<RawRecord>(`/calls/${eventId}/quality`).then(mapCallQuality)
  },

  getAiNextAction(clientId: string): Promise<AiNextAction> {
    if (API_CONFIG.useMock || isPresentationMockClientId(clientId)) return mock.mockGetAiNextAction(clientId)
    return apiClient.get<RawRecord>(`/clients/${clientId}/next-action`).then(mapNextAction)
  },

  getRelatedDocuments(clientId: string): Promise<RelatedDocument[]> {
    if (API_CONFIG.useMock || isPresentationMockClientId(clientId)) return mock.mockGetRelatedDocuments(clientId)
    return apiClient.get<RawRecord[]>(`/clients/${clientId}/documents`).then((items) => items.map(mapRelatedDocument))
  },

  getBitrixConversationSummary(clientId: string): Promise<BitrixConversationSummary> {
    return apiClient.post<RawRecord>(`/clients/${clientId}/bitrix/conversation-summary`).then(mapBitrixConversationSummary)
  },

  getBitrixBrief(clientId: string): Promise<BitrixBrief> {
    return apiClient.post<RawRecord>(`/clients/${clientId}/bitrix/brief`).then(mapBitrixBrief)
  },

  getBitrixCalls(clientId: string): Promise<BitrixCallListItem[]> {
    return apiClient.get<RawRecord>(`/clients/${clientId}/bitrix/calls`).then((payload) =>
      (payload.calls ?? []).map(mapBitrixCall)
    )
  },

  getBitrixLastCall(clientId: string): Promise<BitrixCallDetail> {
    return apiClient.get<RawRecord>(`/clients/${clientId}/bitrix/last-call`).then(mapBitrixCallDetail)
  },

  getBitrixTempManagers(clientId: string): Promise<BitrixTempAssignment[]> {
    return apiClient.get<RawRecord[]>(`/clients/${clientId}/bitrix/temp-managers`).then((items) => items.map(mapTempAssignment))
  },

  assignBitrixTempManager(clientId: string, payload: { originalManagerBitrixId: number; tempManagerBitrixId: number }) {
    return apiClient.post<RawRecord>(`/clients/${clientId}/bitrix/temp-manager`, {
      original_manager_bitrix_id: payload.originalManagerBitrixId,
      temp_manager_bitrix_id: payload.tempManagerBitrixId,
    }).then(mapTempAssignment)
  },

  removeBitrixTempManager(clientId: string, assignmentId: number) {
    return apiClient.delete<RawRecord>(`/clients/${clientId}/bitrix/temp-manager/${assignmentId}`).then((payload) => ({
      assignmentId: payload.assignmentId ?? payload.assignment_id ?? assignmentId,
      status: payload.status ?? 'deactivated',
    }))
  },
}
