import type { EmployeeKpi, DynamicsDataPoint, CommunicationQuality, LostDealReason, LostDealsByStage, AnalyticsOverview } from '@/types'

export const MOCK_ANALYTICS_OVERVIEW: AnalyticsOverview = {
  period: 'Q1 2026',
  totalRevenue: 47800000,
  totalDeals: 124,
  wonDeals: 43,
  lostDeals: 28,
  avgDealCycle: 34,
  avgResponseTime: 135,
  avgCallQuality: 76,
}

export const MOCK_EMPLOYEE_KPI: EmployeeKpi[] = [
  {
    managerId: 'm-001',
    managerName: 'Дмитрий Соколов',
    avgResponseTimeMinutes: 95,
    activeDeals: 18,
    conversionRate: 24.5,
    workload: 82,
    followUpDiscipline: 91,
    avgDealCycleDays: 28,
    totalRevenue: 18400000,
    lostDeals: 5,
    callQualityScore: 84,
  },
  {
    managerId: 'm-002',
    managerName: 'Екатерина Новикова',
    avgResponseTimeMinutes: 140,
    activeDeals: 14,
    conversionRate: 19.2,
    workload: 68,
    followUpDiscipline: 78,
    avgDealCycleDays: 38,
    totalRevenue: 11200000,
    lostDeals: 8,
    callQualityScore: 72,
  },
  {
    managerId: 'm-003',
    managerName: 'Павел Волков',
    avgResponseTimeMinutes: 180,
    activeDeals: 11,
    conversionRate: 15.8,
    workload: 55,
    followUpDiscipline: 62,
    avgDealCycleDays: 42,
    totalRevenue: 7800000,
    lostDeals: 9,
    callQualityScore: 65,
  },
  {
    managerId: 'm-004',
    managerName: 'Игорь Лебедев',
    avgResponseTimeMinutes: 75,
    activeDeals: 22,
    conversionRate: 28.1,
    workload: 95,
    followUpDiscipline: 95,
    avgDealCycleDays: 25,
    totalRevenue: 22600000,
    lostDeals: 4,
    callQualityScore: 88,
  },
  {
    managerId: 'm-005',
    managerName: 'Анна Козлова',
    avgResponseTimeMinutes: 115,
    activeDeals: 9,
    conversionRate: 17.4,
    workload: 45,
    followUpDiscipline: 84,
    avgDealCycleDays: 35,
    totalRevenue: 5200000,
    lostDeals: 6,
    callQualityScore: 78,
  },
]

export const MOCK_DYNAMICS: DynamicsDataPoint[] = [
  { period: 'Окт 2025', conversionRate: 15.2, responseTimeMinutes: 185, workload: 70, callQualityScore: 68, dealsClosed: 8, dealsLost: 12, planFact: 78 },
  { period: 'Ноя 2025', conversionRate: 17.8, responseTimeMinutes: 172, workload: 74, callQualityScore: 71, dealsClosed: 11, dealsLost: 10, planFact: 84 },
  { period: 'Дек 2025', conversionRate: 19.1, responseTimeMinutes: 155, workload: 78, callQualityScore: 73, dealsClosed: 14, dealsLost: 9, planFact: 90 },
  { period: 'Янв 2026', conversionRate: 16.5, responseTimeMinutes: 168, workload: 65, callQualityScore: 70, dealsClosed: 10, dealsLost: 11, planFact: 82 },
  { period: 'Фев 2026', conversionRate: 20.3, responseTimeMinutes: 148, workload: 80, callQualityScore: 75, dealsClosed: 15, dealsLost: 8, planFact: 94 },
  { period: 'Мар 2026', conversionRate: 22.7, responseTimeMinutes: 132, workload: 85, callQualityScore: 78, dealsClosed: 18, dealsLost: 6, planFact: 102 },
  { period: 'Апр 2026', conversionRate: 21.4, responseTimeMinutes: 128, workload: 82, callQualityScore: 80, dealsClosed: 14, dealsLost: 7, planFact: 98 },
]

export const MOCK_COMMUNICATION_QUALITY: CommunicationQuality[] = [
  { managerId: 'm-001', managerName: 'Дмитрий Соколов', needIdentificationScore: 82, objectionHandlingScore: 78, nextStepFixationScore: 94, conversationRetentionScore: 80, avgCommunicationScore: 84, callsAnalyzed: 47 },
  { managerId: 'm-002', managerName: 'Екатерина Новикова', needIdentificationScore: 74, objectionHandlingScore: 68, nextStepFixationScore: 81, conversationRetentionScore: 72, avgCommunicationScore: 74, callsAnalyzed: 38 },
  { managerId: 'm-003', managerName: 'Павел Волков', needIdentificationScore: 62, objectionHandlingScore: 58, nextStepFixationScore: 70, conversationRetentionScore: 64, avgCommunicationScore: 64, callsAnalyzed: 29 },
  { managerId: 'm-004', managerName: 'Игорь Лебедев', needIdentificationScore: 91, objectionHandlingScore: 87, nextStepFixationScore: 96, conversationRetentionScore: 88, avgCommunicationScore: 90, callsAnalyzed: 62 },
  { managerId: 'm-005', managerName: 'Анна Козлова', needIdentificationScore: 78, objectionHandlingScore: 72, nextStepFixationScore: 85, conversationRetentionScore: 76, avgCommunicationScore: 78, callsAnalyzed: 31 },
]

export const MOCK_LOST_DEAL_REASONS: LostDealReason[] = [
  { reason: 'Долгий расчёт / потеря скорости', count: 9, percentage: 32, avgDealAmount: 780000, stages: ['qualification', 'proposal'] },
  { reason: 'Цена выше конкурента', count: 7, percentage: 25, avgDealAmount: 1100000, stages: ['proposal', 'negotiation'] },
  { reason: 'Задержка ответа менеджера', count: 5, percentage: 18, avgDealAmount: 540000, stages: ['new', 'qualification'] },
  { reason: 'Потеря контакта / клиент замолчал', count: 4, percentage: 14, avgDealAmount: 920000, stages: ['negotiation'] },
  { reason: 'Изменение потребности у клиента', count: 2, percentage: 7, avgDealAmount: 650000, stages: ['qualification', 'proposal'] },
  { reason: 'Прочие причины', count: 1, percentage: 4, avgDealAmount: 320000, stages: ['proposal'] },
]

export const MOCK_LOST_BY_STAGE: LostDealsByStage[] = [
  { stage: 'new', stageLabel: 'Новая', count: 3, totalAmount: 420000 },
  { stage: 'qualification', stageLabel: 'Квалификация', count: 5, totalAmount: 1800000 },
  { stage: 'proposal', stageLabel: 'КП отправлено', count: 12, totalAmount: 8400000 },
  { stage: 'negotiation', stageLabel: 'Переговоры', count: 8, totalAmount: 14200000 },
]
