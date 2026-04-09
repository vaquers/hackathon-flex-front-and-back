import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Sparkles, RefreshCw, ChevronDown, ExternalLink,
  Target, Flame, Clock, BarChart3, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { leadsService } from '@/services/leadsService'
import { Button } from '@/components/ui/Button'
import { ScoreBar } from '@/components/ui/ScoreBar'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { clsx } from 'clsx'
import type { GeneratedLead, TopLeadsResponse } from '@/types'

const TIER_CONFIG = {
  hot:  { label: 'HOT',  color: 'bg-red-50 text-red-600', icon: Flame },
  warm: { label: 'WARM', color: 'bg-amber-50 text-amber-600', icon: Target },
  cold: { label: 'COLD', color: 'bg-blue-50 text-blue-600', icon: Clock },
} as const

const INDUSTRY_LABELS: Record<string, string> = {
  food: 'Пищевая промышленность',
  drinks: 'Напитки',
  cosmetics: 'Косметика',
  pharma: 'Фармацевтика',
  chemicals: 'Бытовая химия',
  pet: 'Зоотовары',
  fmcg: 'FMCG',
  manufacturing: 'Производство',
  retail: 'Розничная торговля',
  logistics: 'Логистика',
  services: 'Услуги',
  other: 'Другое',
  unknown: 'Не определено',
}

const SCORING_LABELS: Record<string, string> = {
  product_packaging_fit: 'Соответствие упаковке',
  labeling_need: 'Потребность в этикетках',
  newness_signal: 'Сигнал новизны',
  urgency_signal: 'Срочность',
  data_quality: 'Качество данных',
  sales_readiness: 'Готовность к продаже',
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

export function LeadsPage() {
  const qc = useQueryClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery<TopLeadsResponse>({
    queryKey: ['generated-leads'],
    queryFn: () => leadsService.getTopLeads(),
    refetchInterval: (query) => {
      const status = query.state.data?.pipeline_status
      return status === 'running' ? 5000 : false
    },
  })

  const refreshMutation = useMutation({
    mutationFn: () => leadsService.refreshLeads(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['generated-leads'] })
    },
  })

  const leads = data?.leads ?? []
  const isRunning = data?.pipeline_status === 'running'
  const hasError = data?.pipeline_status === 'error'

  return (
    <div className="animate-fade-in max-w-[1000px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-ink text-xl leading-tight">
            Lead Generator
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Топ-5 компаний для холодного контакта сегодня
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data?.generated_at && (
            <div className="flex items-center gap-1.5 text-xs text-ink-muted bg-surface-card rounded-xl px-3 py-2 shadow-card">
              {data.cache_stale ? (
                <AlertCircle size={11} className="text-risk-medium" />
              ) : (
                <CheckCircle2 size={11} className="text-risk-low" />
              )}
              {formatGeneratedAt(data.generated_at)}
            </div>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={<RefreshCw size={13} className={isRunning ? 'animate-spin' : ''} />}
            loading={refreshMutation.isPending}
            onClick={() => refreshMutation.mutate()}
            disabled={isRunning}
          >
            {isRunning ? 'Генерация...' : 'Обновить'}
          </Button>
        </div>
      </div>

      {/* Pipeline status */}
      {isRunning && (
        <div className="bg-blue-50 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <RefreshCw size={14} className="text-accent animate-spin" />
          <span className="text-sm text-accent">
            Идёт генерация лидов... Обработано {data?.total_scored ?? 0} из {data?.total_candidates ?? '?'} кандидатов
          </span>
        </div>
      )}

      {hasError && data?.error_message && (
        <div className="bg-red-50 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <AlertCircle size={14} className="text-risk-high" />
          <span className="text-sm text-risk-high">Ошибка: {data.error_message}</span>
        </div>
      )}

      {/* Stats */}
      {data && data.total_candidates > 0 && (
        <div className="flex gap-3 mb-5 text-xs text-ink-muted">
          <span className="bg-surface-card rounded-xl px-3 py-2 shadow-card">
            Кандидатов: {data.total_candidates}
          </span>
          <span className="bg-surface-card rounded-xl px-3 py-2 shadow-card">
            Оценено: {data.total_scored}
          </span>
          <span className="bg-surface-card rounded-xl px-3 py-2 shadow-card">
            Показано: {leads.length}
          </span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4">
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
        <EmptyState
          icon={<Sparkles />}
          title="Нет сгенерированных лидов"
          description="Нажмите «Обновить», чтобы запустить генерацию"
        />
      )}

      {/* Lead cards */}
      {leads.length > 0 && (
        <div className="space-y-4">
          {leads.map((lead, index) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              rank={index + 1}
              expanded={expandedId === lead.id}
              onToggleExpand={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
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
}: {
  lead: GeneratedLead
  rank: number
  expanded: boolean
  onToggleExpand: () => void
}) {
  const tier = TIER_CONFIG[lead.priority_tier] ?? TIER_CONFIG.cold
  const TierIcon = tier.icon

  return (
    <div className="bg-surface-card rounded-2xl shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-4 mb-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-accent text-sm font-display flex items-center justify-center flex-shrink-0 mt-0.5">
            {rank}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display text-ink text-[15px] leading-tight">
              {lead.company_name}
            </p>
            {lead.normalized_name !== lead.company_name && (
              <p className="text-xs text-ink-muted mt-0.5">{lead.normalized_name}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase', tier.color)}>
                <TierIcon size={9} className="inline mr-0.5 -mt-px" />
                {tier.label}
              </span>
              <span className="text-xs text-ink-muted">
                {INDUSTRY_LABELS[lead.industry] ?? lead.industry}
              </span>
              {lead.product_category && (
                <>
                  <span className="text-ink-faint">·</span>
                  <span className="text-xs text-ink-muted">{lead.product_category}</span>
                </>
              )}
              {lead.registration_date && (
                <>
                  <span className="text-ink-faint">·</span>
                  <span className="text-xs text-ink-muted">Рег. {formatDate(lead.registration_date)}</span>
                </>
              )}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className={clsx(
              'text-[24px] font-display leading-none',
              lead.score >= 70 ? 'text-risk-low' :
              lead.score >= 45 ? 'text-risk-medium' :
              'text-risk-high'
            )}>
              {Math.round(lead.score)}
            </p>
            <p className="text-[10px] text-ink-muted mt-0.5">score</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
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
          <p className="text-xs text-ink-secondary leading-relaxed mb-3">{lead.company_summary}</p>
        )}
        <div className="bg-blue-50 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-1 mb-1">
            <Sparkles size={11} className="text-accent" />
            <span className="text-xs font-semibold text-accent">Почему рекомендуем</span>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">{lead.why_recommended}</p>
        </div>

        {lead.outreach_angle && (
          <div className="text-xs text-ink-secondary mb-1">
            <span className="font-medium text-ink">Угол захода: </span>
            {lead.outreach_angle}
          </div>
        )}
        {lead.suggested_pitch && (
          <div className="text-xs text-ink-secondary">
            <span className="font-medium text-ink">Питч: </span>
            <em>{lead.suggested_pitch}</em>
          </div>
        )}

        {/* Expanded */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-edge space-y-4 animate-fade-in">
            {lead.sales_brief && (
              <div>
                <p className="text-xs font-medium text-ink mb-1">Бриф для менеджера</p>
                <p className="text-xs text-ink-secondary leading-relaxed">{lead.sales_brief}</p>
              </div>
            )}

            {lead.scoring_breakdown && (
              <div>
                <p className="text-xs font-medium text-ink mb-2">
                  <BarChart3 size={11} className="inline mr-1 -mt-px" />
                  Разбор скоринга
                </p>
                <div className="space-y-2">
                  {Object.entries(lead.scoring_breakdown).map(([key, factor]) => {
                    if (!factor) return null
                    return (
                      <div key={key}>
                        <ScoreBar
                          score={factor.score}
                          label={SCORING_LABELS[key] ?? key}
                          showValue
                        />
                        {factor.explanation && (
                          <p className="text-[10px] text-ink-muted mt-0.5 leading-snug">
                            {factor.explanation}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-ink-muted">
              <span>Уверенность: <strong className="text-ink">{Math.round(lead.confidence_score)}/100</strong></span>
              <span>Источник: {lead.source_name}</span>
            </div>

            {lead.source_url && (
              <a
                href={lead.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <ExternalLink size={10} />
                Открыть в источнике
              </a>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center">
        <button
          className="ml-auto text-xs text-ink-muted hover:text-ink flex items-center gap-1 p-2 rounded-xl hover:bg-surface-hover transition-colors"
          onClick={onToggleExpand}
        >
          {expanded ? 'Свернуть' : 'Подробнее'}
          <ChevronDown size={11} className={clsx('transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>
    </div>
  )
}
