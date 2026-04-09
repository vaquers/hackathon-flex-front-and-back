import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Sparkles, RefreshCw, ChevronDown, ExternalLink, UserPlus,
  Target, Flame, Clock, BarChart3, AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react'
import { leadsService } from '@/services/leadsService'
import { Button } from '@/components/ui/Button'
import { ScoreBar } from '@/components/ui/ScoreBar'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { clsx } from 'clsx'
import type { GeneratedLead, TopLeadsResponse } from '@/types'

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
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery<TopLeadsResponse>({
    queryKey: ['generated-leads'],
    queryFn: () => leadsService.getTopLeads(),
    refetchInterval: (query) => {
      const status = query.state.data?.pipeline_status
      return status === 'running' ? 4000 : false
    },
  })

  const refreshMutation = useMutation({
    mutationFn: () => leadsService.refreshLeads(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['generated-leads'] })
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

  return (
    <div className="animate-fade-in max-w-[960px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-ink text-lg leading-tight">
              Lead Explorer
            </h1>
            <span className="text-[9px] font-bold uppercase tracking-widest text-accent bg-blue-50 px-2 py-0.5 rounded-md">AI</span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Автоматический поиск и скоринг компаний для холодного контакта
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.generated_at && !isRunning && (
            <div className="flex items-center gap-1.5 text-[11px] text-ink-muted bg-surface-card rounded-lg px-2.5 py-1.5 shadow-card border border-edge">
              {data.cache_stale ? (
                <AlertCircle size={10} className="text-risk-medium" />
              ) : (
                <CheckCircle2 size={10} className="text-risk-low" />
              )}
              {formatGeneratedAt(data.generated_at)}
            </div>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={<RefreshCw size={12} className={isRunning ? 'animate-spin' : ''} />}
            loading={refreshMutation.isPending}
            onClick={() => refreshMutation.mutate()}
            disabled={isRunning}
          >
            {isRunning ? 'Генерация...' : 'Найти лиды'}
          </Button>
        </div>
      </div>

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
    <div className="bg-surface-card rounded-2xl shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-accent text-[13px] font-display flex items-center justify-center flex-shrink-0 mt-0.5">
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
        <div className="bg-blue-50/70 rounded-lg p-2.5 mb-2">
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
