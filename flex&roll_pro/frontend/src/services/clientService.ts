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

function mapClient(raw: RawRecord): Client {
  return {
    id: raw.id,
    name: raw.name,
    company: raw.company,
    segment: raw.segment,
    segmentLabel: raw.segmentLabel ?? raw.segment_label,
    isVip: raw.isVip ?? raw.is_vip,
    managerId: raw.managerId ?? raw.manager_id,
    managerName: raw.managerName ?? raw.manager_name,
    phone: raw.phone ?? undefined,
    email: raw.email ?? undefined,
    dealId: raw.dealId ?? raw.deal_id,
    dealAmount: raw.dealAmount ?? raw.deal_amount,
    dealCurrency: raw.dealCurrency ?? raw.deal_currency,
    dealStage: raw.dealStage ?? raw.deal_stage,
    dealStageLabel: raw.dealStageLabel ?? raw.deal_stage_label,
    riskScore: raw.riskScore ?? raw.risk_score,
    riskLevel: raw.riskLevel ?? raw.risk_level,
    riskReason: raw.riskReason ?? raw.risk_reason,
    sentiment: raw.sentiment,
    lastContactAt: raw.lastContactAt ?? raw.last_contact_at,
    daysSinceContact: raw.daysSinceContact ?? raw.days_since_contact,
    product: raw.product,
    expectedVolume: raw.expectedVolume ?? raw.expected_volume,
    city: raw.city,
    inn: raw.inn ?? undefined,
    bridgeContactId: raw.bridgeContactId ?? raw.bridge_contact_id ?? null,
    bridgeChatId: raw.bridgeChatId ?? raw.bridge_chat_id ?? null,
    bridgeConnected: raw.bridgeConnected ?? raw.bridge_connected ?? false,
  }
}

function mapAiSummary(raw: RawRecord): AiClientSummary {
  return {
    clientId: raw.clientId ?? raw.client_id,
    company: raw.company,
    segment: raw.segment,
    product: raw.product,
    expectedVolume: raw.expectedVolume ?? raw.expected_volume,
    recentActions: raw.recentActions ?? raw.recent_actions ?? [],
    dealStage: raw.dealStage ?? raw.deal_stage,
    riskScore: raw.riskScore ?? raw.risk_score,
    riskReason: raw.riskReason ?? raw.risk_reason,
    priority: raw.priority,
    priorityLabel: raw.priorityLabel ?? raw.priority_label,
    recommendedNextStep: raw.recommendedNextStep ?? raw.recommended_next_step,
    generatedAt: raw.generatedAt ?? raw.generated_at,
  }
}

function mapCommunication(raw: RawRecord): CommunicationEvent {
  return {
    id: raw.id,
    clientId: raw.clientId ?? raw.client_id,
    type: raw.type,
    typeLabel: raw.typeLabel ?? raw.type_label,
    title: raw.title,
    summary: raw.summary ?? undefined,
    body: raw.body ?? undefined,
    author: raw.author,
    authorId: raw.authorId ?? raw.author_id,
    happenedAt: raw.happenedAt ?? raw.happened_at,
    durationSeconds: raw.durationSeconds ?? raw.duration_seconds ?? undefined,
    sentiment: raw.sentiment ?? undefined,
    isImportant: raw.isImportant ?? raw.is_important ?? false,
    attachments: raw.attachments ?? [],
  }
}

function mapCallSummary(raw: RawRecord): CallSummary {
  return {
    id: raw.id,
    clientId: raw.clientId ?? raw.client_id,
    happenedAt: raw.happenedAt ?? raw.happened_at,
    durationSeconds: raw.durationSeconds ?? raw.duration_seconds,
    summary: raw.summary,
    agreements: raw.agreements ?? [],
    nextStep: raw.nextStep ?? raw.next_step,
    responsible: raw.responsible,
    sentiment: raw.sentiment,
    qualityScore: raw.qualityScore ?? raw.quality_score,
  }
}

function mapCallQuality(raw: RawRecord): CallQualityReview {
  return {
    callId: raw.callId ?? raw.call_id,
    doneWell: raw.doneWell ?? raw.done_well ?? [],
    missed: raw.missed ?? [],
    needIdentificationScore: raw.needIdentificationScore ?? raw.need_identification_score,
    objectionHandlingScore: raw.objectionHandlingScore ?? raw.objection_handling_score,
    nextStepFixedScore: raw.nextStepFixedScore ?? raw.next_step_fixed_score,
    overallScore: raw.overallScore ?? raw.overall_score,
    recommendations: raw.recommendations ?? [],
  }
}

function mapNextAction(raw: RawRecord): AiNextAction {
  return {
    clientId: raw.clientId ?? raw.client_id,
    action: raw.action,
    reason: raw.reason,
    urgency: raw.urgency,
    deadline: raw.deadline ?? undefined,
    type: raw.type,
  }
}

function mapRelatedDocument(raw: RawRecord): RelatedDocument {
  return {
    id: raw.id,
    type: raw.type,
    typeLabel: raw.typeLabel ?? raw.type_label,
    name: raw.name,
    relevance: raw.relevance,
    date: raw.date,
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
    callTips: raw.callTips ?? raw.call_tips ?? [],
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
    participants: (raw.participants ?? []).map((participant: RawRecord) => ({
      id: participant.id,
      name: participant.name,
      telegramId: participant.telegramId ?? participant.telegram_id ?? null,
      telegramUsername: participant.telegramUsername ?? participant.telegram_username ?? null,
    })),
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
    if (API_CONFIG.useMock) return mock.mockGetClient(id)
    return apiClient.get<RawRecord>(`/clients/${id}`).then(mapClient)
  },

  getAiSummary(clientId: string): Promise<AiClientSummary> {
    if (API_CONFIG.useMock) return mock.mockGetAiSummary(clientId)
    return apiClient.get<RawRecord>(`/clients/${clientId}/ai-summary`).then(mapAiSummary)
  },

  getCommunications(clientId: string): Promise<CommunicationEvent[]> {
    if (API_CONFIG.useMock) return mock.mockGetCommunications(clientId)
    return apiClient.get<RawRecord[]>(`/clients/${clientId}/communications`).then((items) => items.map(mapCommunication))
  },

  getCallSummary(eventId: string): Promise<CallSummary> {
    if (API_CONFIG.useMock) return mock.mockGetCallSummary(eventId)
    return apiClient.get<RawRecord>(`/calls/${eventId}/summary`).then(mapCallSummary)
  },

  getCallQuality(eventId: string): Promise<CallQualityReview> {
    if (API_CONFIG.useMock) return mock.mockGetCallQuality(eventId)
    return apiClient.get<RawRecord>(`/calls/${eventId}/quality`).then(mapCallQuality)
  },

  getAiNextAction(clientId: string): Promise<AiNextAction> {
    if (API_CONFIG.useMock) return mock.mockGetAiNextAction(clientId)
    return apiClient.get<RawRecord>(`/clients/${clientId}/next-action`).then(mapNextAction)
  },

  getRelatedDocuments(clientId: string): Promise<RelatedDocument[]> {
    if (API_CONFIG.useMock) return mock.mockGetRelatedDocuments(clientId)
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
