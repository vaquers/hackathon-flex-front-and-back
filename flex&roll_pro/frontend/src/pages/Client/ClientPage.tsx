import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle,
  FileText,
  GitBranch,
  Link2,
  Mail,
  Mail as MailIcon,
  MessageSquare,
  Phone,
  Phone as PhoneIcon,
  RefreshCw,
  Sparkles,
  StickyNote,
  UserCog,
  Users,
  Zap,
} from 'lucide-react'

import { SidePanel } from '@/components/ui/SidePanel'
import { clientService } from '@/services/clientService'
import { bitrixService } from '@/services/bitrixService'
import { Badge, RiskBadge, SentimentBadge, VipBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ScoreBar, ScoreCircle } from '@/components/ui/ScoreBar'
import { ErrorState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, formatDateTime, formatDuration, formatRub } from '@/utils/format'
import { clsx } from 'clsx'
import type { CommunicationEvent } from '@/types'

type PanelType = 'conversation-summary' | 'brief' | 'last-call' | 'temp-manager' | null

function normalizeName(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
}

function formatBridgeFieldLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatBridgeFieldValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (value && typeof value === 'object') return JSON.stringify(value, null, 2)
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export function ClientPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clientId = id && id !== 'undefined' ? id : null

  const [activePanel, setActivePanel] = useState<PanelType>(null)
  const [selectedTempManagerId, setSelectedTempManagerId] = useState<number | null>(null)

  const clientQ = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientService.getClient(clientId!),
    enabled: !!clientId,
  })
  const summaryQ = useQuery({
    queryKey: ['ai-summary', clientId],
    queryFn: () => clientService.getAiSummary(clientId!),
    enabled: !!clientId,
  })
  const commsQ = useQuery({
    queryKey: ['communications', clientId],
    queryFn: () => clientService.getCommunications(clientId!),
    enabled: !!clientId,
  })
  const nextActionQ = useQuery({
    queryKey: ['next-action', clientId],
    queryFn: () => clientService.getAiNextAction(clientId!),
    enabled: !!clientId,
  })
  const docsQ = useQuery({
    queryKey: ['related-docs', clientId],
    queryFn: () => clientService.getRelatedDocuments(clientId!),
    enabled: !!clientId,
  })

  const conversationSummaryMutation = useMutation({
    mutationFn: () => clientService.getBitrixConversationSummary(clientId!),
  })

  const briefMutation = useMutation({
    mutationFn: () => clientService.getBitrixBrief(clientId!),
  })

  const bitrixLastCallQ = useQuery({
    queryKey: ['bitrix-last-call', clientId],
    queryFn: () => clientService.getBitrixLastCall(clientId!),
    enabled: !!clientId && activePanel === 'last-call',
  })

  const bitrixTeamQ = useQuery({
    queryKey: ['bitrix-team'],
    queryFn: () => bitrixService.getTeam(),
    enabled: activePanel === 'temp-manager',
    staleTime: 5 * 60_000,
  })

  const tempManagersQ = useQuery({
    queryKey: ['bitrix-temp-managers', clientId],
    queryFn: () => clientService.getBitrixTempManagers(clientId!),
    enabled: !!clientId && activePanel === 'temp-manager',
  })

  const assignTempManagerMutation = useMutation({
    mutationFn: ({ originalManagerBitrixId, tempManagerBitrixId }: { originalManagerBitrixId: number; tempManagerBitrixId: number }) =>
      clientService.assignBitrixTempManager(clientId!, { originalManagerBitrixId, tempManagerBitrixId }),
    onSuccess: () => {
      setSelectedTempManagerId(null)
      queryClient.invalidateQueries({ queryKey: ['bitrix-temp-managers', clientId] })
    },
  })

  const removeTempManagerMutation = useMutation({
    mutationFn: (assignmentId: number) => clientService.removeBitrixTempManager(clientId!, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitrix-temp-managers', clientId] })
    },
  })

  if (!clientId) {
    return <ErrorState message="Карточка клиента недоступна" onRetry={() => navigate('/leads')} />
  }

  if (clientQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-36 col-span-2" />
          <Skeleton className="h-36" />
        </div>
      </div>
    )
  }

  if (clientQ.isError) {
    return <ErrorState message="Клиент не найден" onRetry={() => clientQ.refetch()} />
  }

  const client = clientQ.data!
  const summary = summaryQ.data
  const comms = commsQ.data ?? []
  const nextAction = nextActionQ.data
  const docs = docsQ.data ?? []
  const bitrixReady = Boolean(client.bridgeConnected)

  const originalBridgeManager = useMemo(() => {
    const team = bitrixTeamQ.data ?? []
    const targetName = normalizeName(client.managerName)
    return team.find((member) => normalizeName(member.name) === targetName) ?? null
  }, [bitrixTeamQ.data, client.managerName])

  const availableTempManagers = useMemo(() => {
    const team = bitrixTeamQ.data ?? []
    if (!originalBridgeManager) return team
    return team.filter((member) => member.bitrixUserId !== originalBridgeManager.bitrixUserId)
  }, [bitrixTeamQ.data, originalBridgeManager])

  const openPanel = (panel: Exclude<PanelType, null>) => {
    setActivePanel(panel)
    if (panel === 'conversation-summary' && !conversationSummaryMutation.isPending && !conversationSummaryMutation.data) {
      conversationSummaryMutation.mutate()
    }
    if (panel === 'brief' && !briefMutation.isPending && !briefMutation.data) {
      briefMutation.mutate()
    }
  }

  const handleAssignTempManager = () => {
    if (!originalBridgeManager || !selectedTempManagerId) return
    assignTempManagerMutation.mutate({
      originalManagerBitrixId: originalBridgeManager.bitrixUserId,
      tempManagerBitrixId: selectedTempManagerId,
    })
  }

  return (
    <div className="mx-auto max-w-[1260px] animate-fade-in space-y-5">
      <div className="glass-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/70 bg-white/60 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/leads')}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-ink-muted shadow-panel-soft transition-colors hover:text-ink"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-muted">
                Client cockpit
              </p>
              <p className="mt-1 text-sm text-ink-secondary">
                Карточка компании, AI-инструменты и контекст по сделке в одном месте.
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] text-ink-muted shadow-panel-soft">
              Менеджер: <span className="font-medium text-ink">{client.managerName}</span>
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] text-ink-muted shadow-panel-soft">
              Стадия: <span className="font-medium text-ink">{client.dealStageLabel}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[26px] leading-tight text-ink">{client.company}</h1>
              {client.isVip && <VipBadge />}
              <RiskBadge level={client.riskLevel} score={client.riskScore} />
              <SentimentBadge sentiment={client.sentiment} />
              {bitrixReady ? (
                <Badge variant="default" className="bg-emerald-50 text-risk-low border border-emerald-200">
                  <Link2 size={10} className="mr-1" />
                  Bitrix bridge
                </Badge>
              ) : (
                <Badge variant="outline">Не связан с bridge</Badge>
              )}
            </div>

            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {client.name} ведёт эту компанию в сегменте {client.segmentLabel.toLowerCase()}.
              {bitrixReady
                ? ' Контекст переписки, брифы и замена менеджера доступны прямо из карточки.'
                : ' После связки с bridge здесь автоматически заработают Bitrix-инструменты.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-ink-muted">
              <span className="rounded-full bg-white px-3 py-2 shadow-panel-soft">Контакт: {client.name}</span>
              <span className="rounded-full bg-white px-3 py-2 shadow-panel-soft">Последний контакт: {formatDateTime(client.lastContactAt)}</span>
              <span className="rounded-full bg-white px-3 py-2 shadow-panel-soft">{client.product}</span>
              <span className="rounded-full bg-white px-3 py-2 shadow-panel-soft">{client.expectedVolume}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[28px] bg-white px-4 py-4 shadow-panel-soft">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted">Сделка</p>
              <p className="mt-2 font-display text-[24px] leading-none text-ink">{formatRub(client.dealAmount)}</p>
              <p className="mt-2 text-xs text-ink-muted">{client.dealStageLabel}</p>
            </div>

            <div className="rounded-[28px] bg-white px-4 py-4 shadow-panel-soft">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted">Связь</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {client.phone && (
                  <Button size="sm" variant="outline" icon={<Phone size={12} />} className="flex-1">
                    {client.phone}
                  </Button>
                )}
                {client.email && (
                  <Button size="sm" variant="outline" icon={<Mail size={12} />} className="flex-1">
                    Email
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Bot size={11} className="text-accent" />
                  </div>
                  <h2 className="font-display text-ink text-sm">AI-инструменты клиента</h2>
                </div>
                <p className="text-xs text-ink-muted mt-1">
                  Быстрые действия поверх переписки, звонков и маршрутизации в самом Bitrix24
                </p>
              </div>
              <Badge variant={bitrixReady ? 'vip' : 'outline'}>
                {bitrixReady ? 'Готово к работе' : 'Нужна связка с bridge'}
              </Badge>
            </div>

            {!bitrixReady && (
              <div className="bg-amber-50 rounded-2xl p-3 mb-4 border border-amber-200">
                <p className="text-xs text-ink-secondary">
                  Для Bitrix-инструментов у клиента должен быть найден контакт в backend Антона. После подключения bridge кнопки заработают без отдельной донастройки фронта.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ToolActionButton
                icon={<MessageSquare size={14} />}
                title="Summary переписки"
                description="Собрать краткую выжимку по всей переписке клиента"
                onClick={() => openPanel('conversation-summary')}
                disabled={!bitrixReady}
              />
              <ToolActionButton
                icon={<Sparkles size={14} />}
                title="E-brief"
                description="Подготовка менеджера к следующему звонку"
                onClick={() => openPanel('brief')}
                disabled={!bitrixReady}
              />
              <ToolActionButton
                icon={<PhoneIcon size={14} />}
                title="Summary последнего звонка"
                description="Показать резюме, транскрипт и AI review последнего звонка"
                onClick={() => openPanel('last-call')}
                disabled={!bitrixReady}
              />
              <ToolActionButton
                icon={<UserCog size={14} />}
                title="Замена сотрудника"
                description="Временно передать клиента другому менеджеру"
                onClick={() => openPanel('temp-manager')}
                disabled={!bitrixReady}
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Zap size={11} className="text-accent" />
              </div>
              <h2 className="font-display text-ink text-sm">AI Client Summary</h2>
              {summaryQ.isLoading && <Skeleton className="h-3 w-20 ml-auto" />}
              {summary && (
                <span className="text-xs text-ink-muted ml-auto">{formatDate(summary.generatedAt)}</span>
              )}
            </div>

            {summary ? (
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <SummaryRow label="Компания" value={summary.company} />
                  <SummaryRow label="Сегмент" value={summary.segment} />
                  <SummaryRow label="Продукт" value={summary.product} />
                  <SummaryRow label="Объём" value={summary.expectedVolume} />
                  <SummaryRow label="Стадия" value={summary.dealStage} />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-ink-muted font-medium uppercase tracking-wide mb-1.5">Последние действия</p>
                    <ul className="space-y-1">
                      {summary.recentActions.map((action, index) => (
                        <li key={index} className="text-xs text-ink-secondary flex items-start gap-1.5">
                          <span className="text-accent flex-shrink-0 mt-0.5">·</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-muted font-medium uppercase tracking-wide mb-1.5">Риск ухода</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={clsx(
                            'h-full rounded-full',
                            summary.riskScore >= 70 ? 'bg-risk-high'
                              : summary.riskScore >= 40 ? 'bg-risk-medium'
                                : 'bg-risk-low'
                          )}
                          style={{ width: `${summary.riskScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-ink tabular-nums">{summary.riskScore}%</span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">{summary.riskReason}</p>
                  </div>
                </div>
              </div>
            ) : summaryQ.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((index) => <Skeleton key={index} className="h-4 w-full" />)}
              </div>
            ) : null}
          </Card>

          {nextAction && (
            <Card>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap size={14} className="text-risk-medium" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[11px] font-semibold text-risk-medium uppercase tracking-widest">AI Next Action</p>
                    <Badge variant={`urgency-${nextAction.urgency}`}>
                      {nextAction.urgency === 'critical' ? 'Срочно' : nextAction.urgency === 'high' ? 'Высокая' : 'Обычная'}
                    </Badge>
                    {nextAction.deadline && (
                      <span className="text-xs text-ink-muted">до {formatDate(nextAction.deadline)}</span>
                    )}
                  </div>
                  <p className="font-medium text-ink text-sm">{nextAction.action}</p>
                  <p className="text-sm text-ink-secondary mt-1">{nextAction.reason}</p>
                </div>
                <Button size="sm" variant="primary" className="flex-shrink-0">Выполнить</Button>
              </div>
            </Card>
          )}

          <Card padding="none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
              <h2 className="font-display text-ink text-sm">Лента коммуникаций</h2>
              <span className="text-xs text-ink-muted">{comms.length} событий</span>
            </div>
            <div className="divide-y divide-edge">
              {comms.map((event) => (
                <CommEventRow key={event.id} event={event} />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">Информация</p>
            <div className="space-y-2.5">
              <SummaryRow label="Город" value={client.city} />
              {client.inn && <SummaryRow label="ИНН" value={client.inn} />}
              <SummaryRow label="Сегмент" value={client.segmentLabel} />
              <SummaryRow label="Продукт" value={client.product} />
              <SummaryRow label="Объём" value={client.expectedVolume} />
              <SummaryRow label="Сумма" value={formatRub(client.dealAmount) + '/мес.'} />
              <SummaryRow label="Контакт" value={formatDateTime(client.lastContactAt)} />
            </div>
          </Card>

          <CallQualityCard comms={comms} />

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={13} className="text-ink-muted" />
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Документы</p>
            </div>
            {docs.length === 0 ? (
              <p className="text-xs text-ink-muted text-center py-4">Нет связанных документов</p>
            ) : (
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-2 p-2.5 rounded-xl hover:bg-surface-hover cursor-pointer transition-colors"
                  >
                    <Badge variant="stage" size="sm">{doc.typeLabel}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink line-clamp-2">{doc.name}</p>
                      <p className="text-xs text-ink-muted">{formatDate(doc.date)}</p>
                    </div>
                    <span className="text-xs text-ink-muted flex-shrink-0">{doc.relevance}%</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <SidePanel
        open={!!activePanel}
        onClose={() => setActivePanel(null)}
        title={
          activePanel === 'conversation-summary' ? 'Summary переписки'
            : activePanel === 'brief' ? 'E-brief'
              : activePanel === 'last-call' ? 'Summary последнего звонка'
                : activePanel === 'temp-manager' ? 'Замена сотрудника'
                  : undefined
        }
        width="lg"
      >
        {activePanel === 'conversation-summary' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-muted">Переписка клиента в Bitrix24</p>
              <Button
                size="sm"
                variant="outline"
                icon={<RefreshCw size={12} className={conversationSummaryMutation.isPending ? 'animate-spin' : ''} />}
                loading={conversationSummaryMutation.isPending}
                onClick={() => conversationSummaryMutation.mutate()}
              >
                Обновить
              </Button>
            </div>
            {conversationSummaryMutation.isPending && <Skeleton className="h-40 w-full" />}
            {conversationSummaryMutation.isError && (
              <PanelError message={conversationSummaryMutation.error.message} />
            )}
            {conversationSummaryMutation.data && (
              <>
                <Card className="bg-blue-50/60 border border-blue-100">
                  <p className="text-sm leading-relaxed text-ink-secondary whitespace-pre-line">
                    {conversationSummaryMutation.data.summary}
                  </p>
                </Card>
                {Object.keys(conversationSummaryMutation.data.data).length > 0 && (
                  <Card>
                    <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">Структурированные поля</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(conversationSummaryMutation.data.data).map(([key, value]) => (
                        <div key={key} className="rounded-2xl border border-edge px-4 py-3">
                          <p className="text-[11px] text-ink-muted mb-1">{formatBridgeFieldLabel(key)}</p>
                          <p className="text-sm text-ink whitespace-pre-wrap">{formatBridgeFieldValue(value)}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {activePanel === 'brief' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-muted">Подготовка к следующему контакту</p>
              <Button
                size="sm"
                variant="outline"
                icon={<RefreshCw size={12} className={briefMutation.isPending ? 'animate-spin' : ''} />}
                loading={briefMutation.isPending}
                onClick={() => briefMutation.mutate()}
              >
                Обновить
              </Button>
            </div>
            {briefMutation.isPending && <Skeleton className="h-40 w-full" />}
            {briefMutation.isError && (
              <PanelError message={briefMutation.error.message} />
            )}
            {briefMutation.data && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoMetric label="Компания" value={briefMutation.data.company} />
                  <InfoMetric label="Сегмент" value={briefMutation.data.segment} />
                  <InfoMetric label="Тираж" value={briefMutation.data.circulation} />
                  <InfoMetric label="Материал" value={briefMutation.data.material} />
                  <InfoMetric label="Последняя стадия" value={briefMutation.data.lastStage} />
                  <InfoMetric label="Риск оттока" value={briefMutation.data.churnRisk} />
                  <InfoMetric label="Приоритет" value={briefMutation.data.priority} />
                </div>
                <Card>
                  <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">Советы на звонок</p>
                  <div className="space-y-2">
                    {briefMutation.data.callTips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2 rounded-2xl bg-surface-inner px-4 py-3">
                        <span className="text-accent mt-0.5">{index + 1}.</span>
                        <p className="text-sm text-ink-secondary">{tip}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {activePanel === 'last-call' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-muted">Последний звонок по клиенту</p>
              <Button
                size="sm"
                variant="outline"
                icon={<RefreshCw size={12} className={bitrixLastCallQ.isFetching ? 'animate-spin' : ''} />}
                onClick={() => bitrixLastCallQ.refetch()}
              >
                Обновить
              </Button>
            </div>
            {bitrixLastCallQ.isLoading && <Skeleton className="h-40 w-full" />}
            {bitrixLastCallQ.isError && (
              <PanelError message={bitrixLastCallQ.error.message} />
            )}
            {bitrixLastCallQ.data && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoMetric label="Call ID" value={bitrixLastCallQ.data.callId} />
                  <InfoMetric label="Начало" value={bitrixLastCallQ.data.startedAtFormatted ?? (bitrixLastCallQ.data.startedAt ? formatDateTime(bitrixLastCallQ.data.startedAt) : '—')} />
                  <InfoMetric label="Окончание" value={bitrixLastCallQ.data.finishedAtFormatted ?? (bitrixLastCallQ.data.finishedAt ? formatDateTime(bitrixLastCallQ.data.finishedAt) : '—')} />
                  <InfoMetric label="Участники" value={String(bitrixLastCallQ.data.participants.length)} />
                </div>

                {bitrixLastCallQ.data.summaryText && (
                  <Card className="bg-blue-50/60 border border-blue-100">
                    <p className="text-[11px] font-semibold text-accent uppercase tracking-widest mb-2">Summary</p>
                    <p className="text-sm text-ink-secondary whitespace-pre-line leading-relaxed">
                      {bitrixLastCallQ.data.summaryText}
                    </p>
                  </Card>
                )}

                {bitrixLastCallQ.data.aiReview && (
                  <Card>
                    <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">AI review</p>
                    {typeof bitrixLastCallQ.data.aiReview === 'string' ? (
                      <p className="text-sm text-ink-secondary whitespace-pre-line">{bitrixLastCallQ.data.aiReview}</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(bitrixLastCallQ.data.aiReview).map(([key, value]) => (
                          <InfoMetric key={key} label={formatBridgeFieldLabel(key)} value={formatBridgeFieldValue(value)} />
                        ))}
                      </div>
                    )}
                  </Card>
                )}

                {bitrixLastCallQ.data.transcriptText && (
                  <Card>
                    <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">Транскрипт</p>
                    <div className="max-h-[280px] overflow-y-auto rounded-2xl bg-surface-inner px-4 py-3">
                      <p className="text-sm text-ink-secondary whitespace-pre-line leading-relaxed">
                        {bitrixLastCallQ.data.transcriptText}
                      </p>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {activePanel === 'temp-manager' && (
          <div className="p-6 space-y-4">
            <Card className="bg-surface-inner">
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2">Текущий менеджер</p>
              <p className="text-sm font-medium text-ink">{client.managerName}</p>
              {originalBridgeManager ? (
                <p className="text-xs text-ink-muted mt-1">Bitrix user ID: {originalBridgeManager.bitrixUserId}</p>
              ) : (
                <p className="text-xs text-risk-high mt-1">
                  Не удалось сопоставить текущего менеджера с командой backend Антона. Попроси Антона зарегистрировать сотрудника в `/employees/team`.
                </p>
              )}
            </Card>

            {(bitrixTeamQ.isLoading || tempManagersQ.isLoading) && <Skeleton className="h-40 w-full" />}

            {(bitrixTeamQ.isError || tempManagersQ.isError) && (
              <PanelError message={bitrixTeamQ.error?.message ?? tempManagersQ.error?.message ?? 'Не удалось загрузить данные по замене сотрудников'} />
            )}

            {!bitrixTeamQ.isLoading && !bitrixTeamQ.isError && (
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={14} className="text-accent" />
                  <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Кого назначить временно</p>
                </div>
                <div className="space-y-2">
                  {availableTempManagers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedTempManagerId(member.bitrixUserId)}
                      className={clsx(
                        'w-full rounded-2xl border px-4 py-3 text-left transition-colors',
                        selectedTempManagerId === member.bitrixUserId
                          ? 'border-accent bg-blue-50'
                          : 'border-edge hover:bg-surface-hover'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-ink">{member.name}</p>
                          <p className="text-xs text-ink-muted mt-1">{member.role} · рейтинг {member.rating}/10</p>
                        </div>
                        {selectedTempManagerId === member.bitrixUserId && (
                          <CheckCircle size={16} className="text-accent flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    variant="primary"
                    loading={assignTempManagerMutation.isPending}
                    disabled={!originalBridgeManager || !selectedTempManagerId}
                    onClick={handleAssignTempManager}
                  >
                    Назначить временно
                  </Button>
                </div>
                {assignTempManagerMutation.isError && (
                  <p className="text-xs text-risk-high mt-3">{assignTempManagerMutation.error.message}</p>
                )}
              </Card>
            )}

            <Card>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">Активные замены</p>
              {tempManagersQ.data && tempManagersQ.data.length > 0 ? (
                <div className="space-y-2">
                  {tempManagersQ.data.map((assignment) => (
                    <div key={assignment.assignmentId} className="rounded-2xl border border-edge px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {assignment.originalManager.name ?? 'Основной менеджер'} → {assignment.tempManager.name ?? 'Временный менеджер'}
                          </p>
                          <p className="text-xs text-ink-muted mt-1">
                            Создано: {assignment.createdAt ? formatDateTime(assignment.createdAt) : '—'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          loading={removeTempManagerMutation.isPending && removeTempManagerMutation.variables === assignment.assignmentId}
                          onClick={() => removeTempManagerMutation.mutate(assignment.assignmentId)}
                        >
                          Снять
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-muted">Активных замен пока нет</p>
              )}
            </Card>
          </div>
        )}
      </SidePanel>
    </div>
  )
}

function ToolActionButton({
  icon,
  title,
  description,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'group rounded-[28px] border border-white/70 bg-white/82 px-4 py-4 text-left shadow-panel-soft transition-all duration-150',
        'hover:-translate-y-0.5 hover:bg-white hover:shadow-panel disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-accent">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 shadow-panel-soft">
            {icon}
          </span>
          <span className="text-sm font-medium text-ink">{title}</span>
        </div>
        <span className="text-sm text-ink-muted transition-colors group-hover:text-accent">↗</span>
      </div>
      <p className="text-xs text-ink-muted leading-relaxed">{description}</p>
    </button>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white px-4 py-3 shadow-panel-soft">
      <span className="block text-[11px] text-ink-muted">{label}</span>
      <span className="mt-1 block text-sm font-medium text-ink">{value}</span>
    </div>
  )
}

function InfoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/84 px-4 py-3 shadow-panel-soft">
      <p className="text-[11px] text-ink-muted mb-1">{label}</p>
      <p className="text-sm text-ink">{value}</p>
    </div>
  )
}

function PanelError({ message }: { message: string }) {
  return (
    <Card className="bg-red-50/90 border border-red-200 shadow-panel-soft">
      <div className="flex items-start gap-2">
        <AlertCircle size={14} className="text-risk-high mt-0.5 flex-shrink-0" />
        <p className="text-sm text-risk-high">{message}</p>
      </div>
    </Card>
  )
}

function CommEventRow({ event }: { event: CommunicationEvent }) {
  const icons: Record<string, React.ReactNode> = {
    call: <PhoneIcon size={12} />,
    email: <MailIcon size={12} />,
    messenger: <MessageSquare size={12} />,
    note: <StickyNote size={12} />,
    status_change: <GitBranch size={12} />,
  }

  const iconColors: Record<string, string> = {
    call: 'bg-blue-50 text-accent',
    email: 'bg-violet-50 text-violet-600',
    messenger: 'bg-emerald-50 text-risk-low',
    note: 'bg-amber-50 text-risk-medium',
    status_change: 'bg-slate-100 text-ink-secondary',
  }

  return (
    <div className={clsx('flex items-start gap-3 px-6 py-4', event.isImportant && 'bg-amber-50/30')}>
      <div
        className={clsx(
          'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl shadow-panel-soft',
          iconColors[event.type] ?? 'bg-slate-100 text-ink-secondary'
        )}
      >
        {icons[event.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-ink">{event.title}</span>
          {event.isImportant && <Badge variant="urgency-high">Важно</Badge>}
          {event.durationSeconds && (
            <span className="text-xs text-ink-muted">{formatDuration(event.durationSeconds)}</span>
          )}
        </div>
        {(event.summary || event.body) && (
          <p className="text-xs text-ink-secondary leading-relaxed">{event.summary ?? event.body}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-ink-muted">{event.author}</span>
          <span className="text-xs text-ink-faint">·</span>
          <span className="text-xs text-ink-muted">{formatDateTime(event.happenedAt)}</span>
          {event.sentiment && (
            <>
              <span className="text-xs text-ink-faint">·</span>
              <SentimentBadge sentiment={event.sentiment} />
            </>
          )}
        </div>
        {event.attachments && event.attachments.length > 0 && (
          <div className="flex gap-2 mt-2">
            {event.attachments.map((attachment, index) => (
              <a key={index} href={attachment.url} className="text-xs text-accent hover:underline flex items-center gap-1">
                <FileText size={10} />{attachment.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CallQualityCard({ comms }: { comms: CommunicationEvent[] }) {
  const lastCall = comms.find((item) => item.type === 'call')

  const qualityQ = useQuery({
    queryKey: ['call-quality', lastCall?.id],
    queryFn: () => clientService.getCallQuality(lastCall!.id),
    enabled: !!lastCall,
  })

  const quality = qualityQ.data
  if (!quality && !qualityQ.isLoading) return null

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 shadow-panel-soft">
          <Zap size={11} className="text-accent" />
        </div>
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest flex-1">AI Оценка звонка</p>
        {quality && <ScoreCircle score={quality.overallScore} size="sm" />}
      </div>

      {qualityQ.isLoading && <Skeleton className="h-20 w-full" />}

      {quality && (
        <div className="space-y-2.5">
          <ScoreBar score={quality.needIdentificationScore} label="Выявление потребности" />
          <ScoreBar score={quality.objectionHandlingScore} label="Работа с возражениями" />
          <ScoreBar score={quality.nextStepFixedScore} label="Фиксация следующего шага" />

          <div className="pt-3 border-t border-edge space-y-1.5">
            <p className="text-xs font-semibold text-risk-low flex items-center gap-1">
              <CheckCircle size={11} />Хорошо
            </p>
            {quality.doneWell.slice(0, 2).map((item, index) => (
              <p key={index} className="text-xs text-ink-secondary pl-3">· {item}</p>
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-risk-high flex items-center gap-1">
              <AlertCircle size={11} />Упущено
            </p>
            {quality.missed.slice(0, 2).map((item, index) => (
              <p key={index} className="text-xs text-ink-secondary pl-3">· {item}</p>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
