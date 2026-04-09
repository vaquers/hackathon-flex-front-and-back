// ─── Core Domain Entities ───────────────────────────────────────────────────
// These types represent the canonical shape of data in the application.
// Backend responses are MAPPED into these types via mappers — do not use raw API
// responses directly in UI components.

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type SentimentLevel = 'positive' | 'neutral' | 'negative' | 'mixed'
export type DealStage =
  | 'new'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'stalled'

export type ClientSegment = 'enterprise' | 'mid' | 'small' | 'startup'
export type CommunicationType = 'call' | 'email' | 'messenger' | 'note' | 'status_change'
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical'

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardSummary {
  dealsAtRisk: number
  stalledDeals: number
  pendingIncoming: number
  vipClients: number
  todayFollowUps: number
  avgResponseTime: string
  weeklyConversionRate: number
}

export interface PriorityDeal {
  id: string
  clientName: string
  clientId: string
  stage: DealStage
  stageLabel: string
  riskScore: number
  riskLevel: RiskLevel
  riskReason: string
  aiNextAction: string
  lastContactAt: string
  managerId: string
  managerName: string
  amount: number
  currency: string
  isVip: boolean
  sentiment: SentimentLevel
  daysSinceContact: number
}

export interface IncomingRequest {
  id: string
  clientName: string
  clientId: string | null
  topic: string
  summary: string
  urgency: UrgencyLevel
  clientType: string
  complexity: 'simple' | 'medium' | 'complex'
  recommendedAssignee: string
  recommendedAssigneeId: string
  recommendationReason: string
  receivedAt: string
  channel: 'email' | 'phone' | 'web' | 'messenger'
  isNew: boolean
}

export interface VipAlert {
  id: string
  clientId: string
  clientName: string
  alertType: 'no_contact' | 'sentiment_drop' | 'stalled' | 'competitor_mention'
  alertMessage: string
  severity: RiskLevel
  detectedAt: string
  managerName: string
}

export interface SentimentItem {
  clientId: string
  clientName: string
  previousSentiment: SentimentLevel
  currentSentiment: SentimentLevel
  change: 'improved' | 'worsened' | 'stable'
  reason: string
  detectedAt: string
  isVip: boolean
}

// ─── Client / Deal ──────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  company: string
  segment: ClientSegment
  segmentLabel: string
  isVip: boolean
  managerId: string
  managerName: string
  phone?: string
  email?: string
  dealId: string
  dealAmount: number
  dealCurrency: string
  dealStage: DealStage
  dealStageLabel: string
  riskScore: number
  riskLevel: RiskLevel
  riskReason: string
  sentiment: SentimentLevel
  lastContactAt: string
  daysSinceContact: number
  product: string
  expectedVolume: string
  city: string
  inn?: string
}

export interface AiClientSummary {
  clientId: string
  company: string
  segment: string
  product: string
  expectedVolume: string
  recentActions: string[]
  dealStage: string
  riskScore: number
  riskReason: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  priorityLabel: string
  recommendedNextStep: string
  generatedAt: string
}

export interface CommunicationEvent {
  id: string
  clientId: string
  type: CommunicationType
  typeLabel: string
  title: string
  summary?: string
  body?: string
  author: string
  authorId: string
  happenedAt: string
  durationSeconds?: number
  sentiment?: SentimentLevel
  isImportant?: boolean
  attachments?: { name: string; url: string }[]
}

export interface CallSummary {
  id: string
  clientId: string
  happenedAt: string
  durationSeconds: number
  summary: string
  agreements: string[]
  nextStep: string
  responsible: string
  sentiment: SentimentLevel
  qualityScore: number
}

export interface CallQualityReview {
  callId: string
  doneWell: string[]
  missed: string[]
  needIdentificationScore: number
  objectionHandlingScore: number
  nextStepFixedScore: number
  overallScore: number
  recommendations: string[]
}

export interface AiNextAction {
  clientId: string
  action: string
  reason: string
  urgency: UrgencyLevel
  deadline?: string
  type: 'call' | 'email' | 'meeting' | 'proposal' | 'internal'
}

export interface RelatedDocument {
  id: string
  type: 'calculation' | 'tech_doc' | 'past_order' | 'template' | 'proposal'
  typeLabel: string
  name: string
  relevance: number
  date: string
  clientName?: string
  url?: string
}

// ─── Risks ──────────────────────────────────────────────────────────────────

export interface RiskItem {
  id: string
  clientId: string
  clientName: string
  managerId: string
  managerName: string
  dealStage: DealStage
  dealStageLabel: string
  daysSinceActivity: number
  riskReason: string
  riskScore: number
  riskLevel: RiskLevel
  sentiment: SentimentLevel
  aiNextAction: string
  isVip: boolean
  status: 'active' | 'in_progress' | 'resolved'
  amount: number
  currency: string
  riskCategory:
    | 'stalled'
    | 'post_proposal_silence'
    | 'long_calculation'
    | 'no_response'
    | 'high_churn'
}

// ─── Analytics ──────────────────────────────────────────────────────────────

export interface EmployeeKpi {
  managerId: string
  managerName: string
  avatar?: string
  avgResponseTimeMinutes: number
  activeDeals: number
  conversionRate: number
  workload: number
  followUpDiscipline: number
  avgDealCycleDays: number
  totalRevenue: number
  lostDeals: number
  callQualityScore: number
}

export interface DynamicsDataPoint {
  period: string
  conversionRate: number
  responseTimeMinutes: number
  workload: number
  callQualityScore: number
  dealsClosed: number
  dealsLost: number
  planFact: number
}

export interface CommunicationQuality {
  managerId: string
  managerName: string
  needIdentificationScore: number
  objectionHandlingScore: number
  nextStepFixationScore: number
  conversationRetentionScore: number
  avgCommunicationScore: number
  callsAnalyzed: number
}

export interface LostDealReason {
  reason: string
  count: number
  percentage: number
  avgDealAmount: number
  stages: string[]
}

export interface LostDealsByStage {
  stage: string
  stageLabel: string
  count: number
  totalAmount: number
}

export interface AnalyticsOverview {
  period: string
  totalRevenue: number
  totalDeals: number
  wonDeals: number
  lostDeals: number
  avgDealCycle: number
  avgResponseTime: number
  avgCallQuality: number
}

// ─── Search ─────────────────────────────────────────────────────────────────

export interface SearchResult {
  id: string
  type: 'calculation' | 'tech_doc' | 'past_order' | 'template' | 'proposal'
  typeLabel: string
  name: string
  aiAnswer: string
  relevantFragment: string
  clientName?: string
  orderId?: string
  date: string
  relevanceScore: number
  tags: string[]
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  total: number
  processingTime: number
  suggestedFilters: string[]
}

// ─── Leads ──────────────────────────────────────────────────────────────────

export interface Lead {
  id: string
  companyName: string
  inn?: string
  city: string
  segment: ClientSegment
  segmentLabel: string
  triggerReason: string
  triggerType: 'new_company' | 'competitor_loss' | 'seasonal' | 'activity_signal' | 'referral'
  orderProbability: number
  expectedProduct: string
  expectedVolume: string
  contactPerson?: string
  contactPhone?: string
  isSaved: boolean
  isHidden: boolean
  generatedAt: string
  aiInsight: string
}

// ─── Shared ─────────────────────────────────────────────────────────────────

export interface Manager {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'manager' | 'senior_manager' | 'team_lead' | 'director'
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}
