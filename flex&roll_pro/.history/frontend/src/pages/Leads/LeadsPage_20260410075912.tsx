import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Sparkles, RefreshCw, ChevronDown, ExternalLink, UserPlus,
  Target, Flame, Clock, BarChart3, AlertCircle, CheckCircle2, Loader2, Building2, Link2,
} from 'lucide-react'
import { leadsService } from '@/services/leadsService'
import { clientService } from '@/services/clientService'
import { bitrixService } from '@/services/bitrixService'
import { Button } from '@/components/ui/Button'
import { ScoreBar } from '@/components/ui/ScoreBar'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { Badge, RiskBadge, SentimentBadge, VipBadge } from '@/components/ui/Badge'
import { formatDaysAgo, formatDateTime, formatRub } from '@/utils/format'
import { clsx } from 'clsx'
import type { BitrixDealsSyncResult, Client, GeneratedLead, TopLeadsResponse } from '@/types'

const TIER_CONFIG = {
  hot:  { label: 'HOT',  color: 'bg-red-50 text-red-600 border border-red-200', icon: Flame },
  warm: { label: 'WARM', color: 'bg-amber-50 text-amber-600 border border-amber-200', icon: Target },
  cold: { label: 'COLD', color: 'bg-blue-50 text-blue-600 border border-blue-200', icon: Clock },
} as const

const INDUSTRY_LABELS: Record<string, string> = {
  food: 'Пищевая',
  drinks: 'Напитки',
  cosmetics: 'Косметика',
  pharma: 'Фарма',
  chemicals: 'Быт. химия',
  pet: 'Зоотовары',
  fmcg: 'FMCG',
  manufacturing: 'Производство',
  retail: 'Розница',
  logistics: 'Логистика',
  services: 'Услуги',
  other: 'Другое',
  unknown: 'Не определено',
}

const SCORING_LABELS: Record<string, string> = {
  product_packaging_fit: 'Упаковка',
  labeling_need: 'Этикетки',
  newness_signal: 'Новизна',
  urgency_signal: 'Срочность',
  data_quality: 'Данные',
  sales_readiness: 'Готовность',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatGeneratedAt(dateStr: string): string {
  if (!dateStr) return 'нет данных'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('ru-RU', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

const PIPELINE_STEPS = [
  { key: 'fetch', label: 'Сбор данных', icon: '📡' },
  { key: 'filter', label: 'Фильтрация', icon: '🔍' },
  { key: 'enrich', label: 'Обогащение', icon: '🧠' },
  { key: 'score', label: 'AI-скоринг', icon: '⚡' },
  { key: 'rank', label: 'Ранжирование', icon: '🏆' },
]

export function LeadsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'prospects' | 'clients'>('prospects')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [clientSearch, setClientSearch] = useState('')

  const { data, isLoading, error } = useQuery<TopLeadsResponse>({
    queryKey: ['generated-leads'],
    queryFn: () => leadsService.getTopLeads(),
    refetchInterval: (query) => {
      const status = query.state.data?.pipeline_status
      return status === 'running' ? 4000 : false
    },
  })

  const clientsQ = useQuery<Client[]>({
    queryKey: ['clients-list'],
    queryFn: () => clientService.listClients(),
    staleTime: 60_000,
  })

  const refreshMutation = useMutation({
    mutationFn: () => leadsService.refreshLeads(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['generated-leads'] })
    },
  })

  const syncDealsMutation = useMutation({
    mutationFn: () => bitrixService.syncDeals(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients-list'] })
    },
  })

  const addToCrmMutation = useMutation({
    mutationFn: (id: string) => leadsService.addToCrm(id),
  })

  const leads = data?.leads ?? []
  const isRunning = data?.pipeline_status === 'running'
  const hasError = data?.pipeline_status === 'error'

  // Estimate pipeline step based on progress
  const scored = data?.total_scored ?? 0
  const candidates = data?.total_candidates ?? 0
  const pipelineStep = !isRunning ? -1
    : candidates === 0 ? 0
    : scored === 0 ? 1
    : scored < 5 ? 2
    : scored < 10 ? 3
    : 4

  const clients = clientsQ.data ?? []
  const filteredClients = useMemo(() => {
    const needle = clientSearch.trim().toLowerCase()
    if (!needle) return clients
    return clients.filter((client) =>
      client.company.toLowerCase().includes(needle) ||
      client.name.toLowerCase().includes(needle) ||
      client.managerName.toLowerCase().includes(needle)
    )
  }, [clientSearch, clients])

  const connectedClients = clients.filter((client) => client.bridgeConnected).length

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display page-title">
              Лиды и клиенты
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-accent">AI</span>
          </div>
          <p className="page-subtitle">
            Новые потенциальные к��иенты и рабочая база текущих компаний в одном разделе
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'prospects' && data?.generated_at && !isRunning && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/80 border border-edge px-3 py-1.5 text-[11px] text-ink-muted shadow-input">
              {data.cache_stale ? (
                <AlertCircle size={10} className="text-risk-medium" />
              ) : (
                <CheckCircle2 size={10} className="text-risk-low" />
              )}
              {formatGeneratedAt(data.generated_at)}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={12} className={syncDealsMutation.isPending ? 'animate-spin' : ''} />}
            loading={syncDealsMutation.isPending}
            onClick={() => syncDealsMutation.mutate()}
          >
            Обновить сделки
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<RefreshCw size={12} className={isRunning ? 'animate-spin' : ''} />}
            loading={refreshMutation.isPending}
            onClick={() => refreshMutation.mutate()}
            disabled={isRunning || activeTab === 'clients'}
          >
            {isRunning ? 'Ге��ерация...' : 'Найти лиды'}
          </Button>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'prospects', label: 'Новые потенциальные', count: leads.length || undefined },
          { id: 'clients', label: 'Текущие кл��енты', count: clients.length || undefined },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as 'prospects' | 'clients')}
        className="mb-5"
      />

      {syncDealsMutation.isSuccess && (
        <SyncDealsBanner result={syncDealsMutation.data} />
      )}

      {syncDealsMutation.isError && (
        <div className="bg-red-50 rounded-xl p-3 mb-4 flex items-center gap-2 border border-red-200">
          <AlertCircle size={13} className="text-risk-high flex-shrink-0" />
          <span className="text-xs text-risk-high">{syncDealsMutation.error.message}</span>
        </div>
      )}

      {activeTab === 'clients' ? (
        <div className="space-y-4">
          <div className="glass-panel p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2 text-[11px] text-ink-muted">
                <span className="glass-inner rounded-full px-3 py-1.5">
                  Компаний: {clients.length}
                </span>
                <span className="glass-inner rounded-full px-3 py-1.5">
                  Связано с Bitrix bridge: {connectedClients}
                </span>
              </div>
              <input
                value={clientSearch}
                onChange={(event) => setClientSearch(event.target.value)}
                placeholder="Поиск по компании, контакту или менеджер��"
                className="input-base w-full md:w-[360px] rounded-xl"
              />
            </div>
          </div>

          {clientsQ.isLoading && (
            <div className="grid grid-cols-1 gap-3">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {clientsQ.isError && (
            <EmptyState
              icon={<AlertCircle />}
              title="Не удалось загрузить текущих кли��нтов"
              description={clientsQ.error.message}
            />
          )}

          {!clientsQ.isLoading && !clientsQ.isError && filteredClients.length === 0 && (
            <EmptyState
              icon={<Building2 />}
              title="Клиенты не найдены"
              description={clientSearch ? 'Попробуйте изменить поиск��вый запрос' : 'В базе пока нет текущих клиентов'}
            />
          )}

          {filteredClients.length > 0 && (
            <div className="space-y-3">
              {filteredClients.map((client) => (
                <CurrentClientCard
                  key={client.id}
                  client={client}
                  onOpen={() => navigate(`/clients/${client.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Pipeline progress */}
      {isRunning && (
        <div className="glass-panel p-4 mb-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <Loader2 size={14} className="text-accent animate-spin" />
            <span className="text-sm font-medium text-accent">Генерация лидов</span>
            {candidates > 0 && (
              <span className="text-[11px] text-ink-muted ml-auto">
                {scored} / {candidates} обработано
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.key} className="flex-1">
                <div className={clsx(
                  'h-1.5 rounded-full transition-all duration-500',
                  i <= pipelineStep ? 'bg-accent' : 'bg-slate-100'
                )} />
                <p className={clsx(
                  'text-[10px] mt-1.5 text-center font-medium',
                  i <= pipelineStep ? 'text-accent' : 'text-ink-muted'
                )}>
                  {step.icon} {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasError && data?.error_message && (
        <div className="bg-red-50 rounded-xl p-3 mb-4 flex items-center gap-2 border border-red-200">
          <AlertCircle size={13} className="text-risk-high flex-shrink-0" />
          <span className="text-xs text-risk-high">{data.error_message}</span>
        </div>
      )}

      {/* Stats pills */}
      {data && data.total_candidates > 0 && !isRunning && (
        <div className="flex gap-2 mb-4 text-[11px] text-ink-muted">
          <span className="glass-inner rounded-full px-3 py-1.5">
            📊 {data.total_candidates} кандидатов
          </span>
          <span className="glass-inner rounded-full px-3 py-1.5">
            ✅ {data.total_scored} оценено
          </span>
          <span className="glass-inner rounded-full px-3 py-1.5">
            🏆 Топ-{leads.length}
          </span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Error */}
      {error && !data && (
        <EmptyState
          icon={<AlertCircle />}
          title="Не удалось загрузить лиды"
          description={error.message || 'Проверьте подключение к backend'}
        />
      )}

      {/* Empty */}
      {!isLoading && !error && leads.length === 0 && !isRunning && (
        <div className="glass-panel p-10 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={22} className="text-accent" />
          </div>
          <h3 className="font-display text-ink text-sm mb-1">Запустите поиск лидов</h3>
          <p className="text-[12px] text-ink-muted mb-4 max-w-sm mx-auto">
            AI проанализирует реестр новых компаний, обогатит данные и покажет топ кандидатов для вашего бизнеса
          </p>
          <Button
            variant="primary"
            icon={<Sparkles size={13} />}
            onClick={() => refreshMutation.mutate()}
            loading={refreshMutation.isPending}
          >
            Начать поиск
          </Button>
        </div>
      )}

      {/* Lead cards */}
      {leads.length > 0 && (
        <div className="space-y-3">
          {leads.map((lead, index) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              rank={index + 1}
              expanded={expandedId === lead.id}
              onToggleExpand={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
              onAddToCrm={() => addToCrmMutation.mutate(lead.id)}
              addingToCrm={addToCrmMutation.isPending && addToCrmMutation.variables === lead.id}
            />
          ))}
        </div>
      )}
        </>
      )}
    </div>
  )
}


function LeadCard({
  lead,
  rank,
  expanded,
  onToggleExpand,
  onAddToCrm,
  addingToCrm,
}: {
  lead: GeneratedLead
  rank: number
  expanded: boolean
  onToggleExpand: () => void
  onAddToCrm: () => void
  addingToCrm: boolean
}) {
  const tier = TIER_CONFIG[lead.priority_tier] ?? TIER_CONFIG.cold
  const TierIcon = tier.icon

  return (
    <div className="glass-panel transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-accent text-[13px] font-display flex items-center justify-center flex-shrink-0 mt-0.5">
            {rank}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display text-ink text-sm leading-tight">
              {lead.company_name}
            </p>
            {lead.normalized_name !== lead.company_name && (
              <p className="text-[11px] text-ink-muted mt-0.5">{lead.normalized_name}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={clsx('text-[9px] font-bold px-1.5 py-px rounded uppercase', tier.color)}>
                <TierIcon size={8} className="inline mr-0.5 -mt-px" />
                {tier.label}
              </span>
              <span className="text-[11px] text-ink-muted">
                {INDUSTRY_LABELS[lead.industry] ?? lead.industry}
              </span>
              {lead.product_category && (
                <>
                  <span className="text-ink-faint text-[10px]">·</span>
                  <span className="text-[11px] text-ink-muted">{lead.product_category}</span>
                </>
              )}
              {lead.registration_date && (
                <>
                  <span className="text-ink-faint text-[10px]">·</span>
                  <span className="text-[11px] text-ink-muted">Рег. {formatDate(lead.registration_date)}</span>
                </>
              )}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className={clsx(
              'text-[22px] font-display leading-none',
              lead.score >= 70 ? 'text-risk-low' :
              lead.score >= 45 ? 'text-risk-medium' :
              'text-risk-high'
            )}>
              {Math.round(lead.score)}
            </p>
            <p className="text-[9px] text-ink-muted mt-0.5">score</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="h-1 bg-slate-100 rounded-full mb-3 overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500',
              lead.score >= 70 ? 'bg-risk-low' :
              lead.score >= 45 ? 'bg-risk-medium' :
              'bg-risk-high',
            )}
            style={{ width: `${Math.min(100, lead.score)}%`, opacity: 0.7 }}
          />
        </div>

        {/* Summary */}
        {lead.company_summary && (
          <p className="text-[11px] text-ink-secondary leading-relaxed mb-2 line-clamp-2">{lead.company_summary}</p>
        )}
        <div className="bg-accent rounded-xl p-3 mb-2">
          <div className="flex items-center gap-1 mb-0.5">
            <Sparkles size={10} className="text-white/70" />
            <span className="text-[10px] font-semibold text-white/70">Почему рекомендуем</span>
          </div>
          <p className="text-[11px] text-white leading-relaxed">{lead.why_recommended}</p>
        </div>

        {lead.outreach_angle && (
          <p className="text-[11px] text-ink-secondary mb-0.5">
            <span className="font-medium text-ink">Угол: </span>
            {lead.outreach_angle}
          </p>
        )}
        {lead.suggested_pitch && (
          <p className="text-[11px] text-ink-secondary">
            <span className="font-medium text-ink">Питч: </span>
            <em>{lead.suggested_pitch}</em>
          </p>
        )}

        {/* Expanded */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-edge space-y-3 animate-fade-in">
            {lead.sales_brief && (
              <div>
                <p className="text-[11px] font-medium text-ink mb-0.5">Бриф для менеджера</p>
                <p className="text-[11px] text-ink-secondary leading-relaxed">{lead.sales_brief}</p>
              </div>
            )}

            {lead.scoring_breakdown && (
              <div>
                <p className="text-[11px] font-medium text-ink mb-1.5">
                  <BarChart3 size={10} className="inline mr-1 -mt-px" />
                  Разбор скоринга
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {Object.entries(lead.scoring_breakdown).map(([key, factor]) => {
                    if (!factor) return null
                    return (
                      <ScoreBar
                        key={key}
                        score={factor.score}
                        label={SCORING_LABELS[key] ?? key}
                        showValue
                      />
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-[11px] text-ink-muted">
              <span>Уверенность: <strong className="text-ink">{Math.round(lead.confidence_score)}/100</strong></span>
              <span>Источник: {lead.source_name}</span>
              {lead.source_url && (
                <a
                  href={lead.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-accent hover:underline ml-auto"
                >
                  <ExternalLink size={9} />
                  Источ��ик
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center gap-2 border-t border-edge/50 pt-2">
        <Button
          size="sm"
          variant="primary"
          icon={<UserPlus size={11} />}
          onClick={onAddToCrm}
          loading={addingToCrm}
        >
          В CRM
        </Button>
        <button
          className="ml-auto text-[11px] text-ink-muted hover:text-ink flex items-center gap-1 p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
          onClick={onToggleExpand}
        >
          {expanded ? 'Свернуть' : 'Подробнее'}
          <ChevronDown size={10} className={clsx('transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>
    </div>
  )
}

function CurrentClientCard({
  client,
  onOpen,
}: {
  client: Client
  onOpen: () => void
}) {
  return (
    <div className="glass-panel transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="p-4 flex flex-col gap-3 md:flex-row md:items-start">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <p className="font-display text-ink text-sm leading-tight">{client.company}</p>
            {client.isVip && <VipBadge />}
            <RiskBadge level={client.riskLevel} score={client.riskScore} />
            <SentimentBadge sentiment={client.sentiment} />
            {client.bridgeConnected ? (
              <Badge variant="default" className="bg-emerald-50 text-risk-low border border-emerald-200">
                <Link2 size={10} className="mr-1" />
                Bridge
              </Badge>
            ) : (
              <Badge variant="default">Без bridge</Badge>
            )}
          </div>
          <p className="text-[11px] text-ink-muted mb-2">
            {client.name} · {client.managerName} · {client.dealStageLabel}
          </p>
          <p className="text-[12px] text-ink-secondary leading-relaxed">{client.riskReason}</p>
          <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-ink-muted">
            <span className="glass-inner rounded-full px-3 py-1.5">
              {formatRub(client.dealAmount)}/мес.
            </span>
            <span className="glass-inner rounded-full px-3 py-1.5">
              {client.segmentLabel}
            </span>
            <span className="glass-inner rounded-full px-3 py-1.5">
              Контакт: {formatDateTime(client.lastContactAt)}
            </span>
            <span className="glass-inner rounded-full px-3 py-1.5">
              {formatDaysAgo(client.daysSinceContact)}
            </span>
          </div>
        </div>
        <div className="flex flex-row md:flex-col items-start md:items-end gap-2 md:text-right">
          <div>
            <p className="text-[11px] text-ink-muted">Менеджер</p>
            <p className="text-sm font-medium text-ink">{client.managerName}</p>
          </div>
          <Button variant="primary" size="sm" onClick={onOpen}>
            Открыть клиента
          </Button>
        </div>
      </div>
    </div>
  )
}

function SyncDealsBanner({ result }: { result: BitrixDealsSyncResult }) {
  const successCount = result.deals.filter((deal) => !deal.error).length
  const errorCount = result.deals.filter((deal) => !!deal.error).length

  return (
    <div className="glass-panel p-4 mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <CheckCircle2 size={14} className="text-risk-low" />
        <span className="text-sm font-medium text-ink">Синхронизация сделок завершена</span>
        <span className="text-[11px] text-ink-muted">
          Успешно: {successCount}
        </span>
        {errorCount > 0 && (
          <span className="text-[11px] text-risk-high">
            Ошибок: {errorCount}
          </span>
        )}
      </div>
      <p className="text-[11px] text-ink-muted">
        Backend Антона вернул {result.deals.length} записей. Новые данные можно сразу открыть в разделе текущих клиентов.
      </p>
    </div>
  )
}
