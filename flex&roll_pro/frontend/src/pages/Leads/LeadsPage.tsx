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
    <div className="mx-auto max-w-[1220px] animate-fade-in space-y-4">
      <div className="glass-panel px-5 py-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
                Client cockpit
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-medium text-ink-muted shadow-panel-soft">
                SpaceHack workspace
              </span>
            </div>
            <h1 className="mt-3 font-display text-[26px] leading-tight text-ink">
              Лиды и текущие клиенты в одном рабочем потоке
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Здесь собраны новые потенциальные компании и действующая база клиентов. Можно синхронизировать сделки, быстро найти клиента и открыть AI-инструменты без переходов между разными разделами.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row xl:flex-col xl:min-w-[240px]">
            <Button
              variant="outline"
              size="md"
              icon={<RefreshCw size={12} className={syncDealsMutation.isPending ? 'animate-spin' : ''} />}
              loading={syncDealsMutation.isPending}
              onClick={() => syncDealsMutation.mutate()}
              className="justify-center"
            >
              Обновить сделки
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<RefreshCw size={12} className={isRunning ? 'animate-spin' : ''} />}
              loading={refreshMutation.isPending}
              onClick={() => refreshMutation.mutate()}
              disabled={isRunning || activeTab === 'clients'}
              className="justify-center"
            >
              {isRunning ? 'Генерация...' : 'Найти лиды'}
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-2 text-[11px] text-ink-muted shadow-panel-soft">
            Компаний в базе: <span className="font-semibold text-ink">{clients.length}</span>
          </span>
          <span className="rounded-full bg-white px-3 py-2 text-[11px] text-ink-muted shadow-panel-soft">
            Связано с bridge: <span className="font-semibold text-ink">{connectedClients}</span>
          </span>
          {activeTab === 'prospects' && data?.generated_at && !isRunning && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] text-ink-muted shadow-panel-soft">
              {data.cache_stale ? (
                <AlertCircle size={10} className="text-risk-medium" />
              ) : (
                <CheckCircle2 size={10} className="text-risk-low" />
              )}
              Обновлено {formatGeneratedAt(data.generated_at)}
            </span>
          )}
          {activeTab === 'prospects' && isRunning && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-2 text-[11px] text-accent shadow-panel-soft">
              <Loader2 size={10} className="animate-spin" />
              AI-генерация в процессе
            </span>
          )}
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'prospects', label: 'Новые потенциальные', count: leads.length || undefined },
          { id: 'clients', label: 'Текущие клиенты', count: clients.length || undefined },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as 'prospects' | 'clients')}
        className="mb-4"
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
          <div className="glass-panel p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-muted">
                  Current clients
                </p>
                <p className="mt-1 text-sm text-ink-secondary">
                  Рабочая база компаний с быстрым доступом в карточку клиента и Bitrix-инструменты.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-ink-muted">
                  <span className="rounded-full bg-surface-inner px-3 py-2 border border-edge">
                  Компаний: {clients.length}
                  </span>
                  <span className="rounded-full bg-surface-inner px-3 py-2 border border-edge">
                  Связано с Bitrix bridge: {connectedClients}
                  </span>
                </div>
              </div>

              <div className="w-full xl:w-[420px]">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-muted">
                  Быстрый поиск
                </label>
                <input
                  value={clientSearch}
                  onChange={(event) => setClientSearch(event.target.value)}
                  placeholder="Поиск по компании, контакту или менеджеру"
                  className="w-full rounded-full border border-white/70 bg-white/88 px-4 py-3 text-sm text-ink placeholder:text-ink-muted shadow-panel-soft focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
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
              title="Не удалось загрузить текущих клиентов"
              description={clientsQ.error.message}
            />
          )}

          {!clientsQ.isLoading && !clientsQ.isError && filteredClients.length === 0 && (
            <EmptyState
              icon={<Building2 />}
              title="Клиенты не найдены"
              description={clientSearch ? 'Попробуйте изменить поисковый запрос' : 'В базе пока нет текущих клиентов'}
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
        <div className="bg-surface-card rounded-2xl shadow-card p-4 mb-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <Loader2 size={14} className="text-accent animate-spin" />
            <span className="text-sm font-medium text-accent">Генерация лидов</span>
            {candidates > 0 && (
              <span className="text-xs text-ink-muted ml-auto">
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
          <span className="bg-surface-card rounded-lg px-2.5 py-1.5 shadow-card border border-edge">
            📊 {data.total_candidates} кандидатов
          </span>
          <span className="bg-surface-card rounded-lg px-2.5 py-1.5 shadow-card border border-edge">
            ✅ {data.total_scored} оценено
          </span>
          <span className="bg-surface-card rounded-lg px-2.5 py-1.5 shadow-card border border-edge">
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
        <div className="bg-surface-card rounded-2xl shadow-card p-10 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-accent" />
          </div>
          <h3 className="font-display text-ink text-[15px] mb-1">Запустите поиск лидов</h3>
          <p className="text-xs text-ink-muted mb-4 max-w-sm mx-auto">
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
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-[13px] font-display text-accent shadow-panel-soft">
            {rank}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display text-ink text-[14px] leading-tight">
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

          <div className="flex-shrink-0 rounded-[22px] bg-white px-3 py-2 text-right shadow-panel-soft">
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
        <div className="mb-2 rounded-[20px] border border-white/70 bg-blue-50/70 p-3 shadow-panel-soft">
          <div className="flex items-center gap-1 mb-0.5">
            <Sparkles size={10} className="text-accent" />
            <span className="text-[10px] font-semibold text-accent">Почему рекомендуем</span>
          </div>
          <p className="text-[11px] text-ink-secondary leading-relaxed">{lead.why_recommended}</p>
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
                  Источник
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-edge/50 px-4 pb-3 pt-3">
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
            <p className="font-display text-ink text-[15px] leading-tight">{client.company}</p>
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
          <p className="text-xs text-ink-muted mb-2">
            {client.name} · {client.managerName} · {client.dealStageLabel}
          </p>
          <p className="text-sm text-ink-secondary leading-relaxed">{client.riskReason}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-ink-muted">
            <span className="rounded-full bg-surface-inner px-3 py-2 border border-edge">
              {formatRub(client.dealAmount)}/мес.
            </span>
            <span className="rounded-full bg-surface-inner px-3 py-2 border border-edge">
              {client.segmentLabel}
            </span>
            <span className="rounded-full bg-surface-inner px-3 py-2 border border-edge">
              Контакт: {formatDateTime(client.lastContactAt)}
            </span>
            <span className="rounded-full bg-surface-inner px-3 py-2 border border-edge">
              {formatDaysAgo(client.daysSinceContact)}
            </span>
          </div>
        </div>
        <div className="flex flex-row md:flex-col items-start md:items-end gap-2 md:text-right">
          <div className="rounded-[22px] bg-white px-4 py-3 shadow-panel-soft">
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
        <span className="text-xs text-ink-muted">
          Успешно: {successCount}
        </span>
        {errorCount > 0 && (
          <span className="text-xs text-risk-high">
            Ошибок: {errorCount}
          </span>
        )}
      </div>
      <p className="text-xs text-ink-muted">
        Backend Антона вернул {result.deals.length} записей. Новые данные можно сразу открыть в разделе текущих клиентов.
      </p>
    </div>
  )
}
