import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Plus, EyeOff, RefreshCw, Bookmark, BookmarkCheck, ChevronDown, TrendingUp } from 'lucide-react'
import { leadsService } from '@/services/leadsService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { clsx } from 'clsx'
import type { Lead } from '@/types'

const SEGMENT_FILTERS = [
  { id: '',           label: 'Все сегменты' },
  { id: 'enterprise', label: 'Крупный бизнес' },
  { id: 'mid',        label: 'Средний' },
  { id: 'small',      label: 'Малый' },
]

const TRIGGER_FILTERS = [
  { id: '',                 label: 'Все триггеры' },
  { id: 'activity_signal',  label: 'Сигналы активности' },
  { id: 'competitor_loss',  label: 'Потеря у конкурента' },
  { id: 'seasonal',         label: 'Сезонный' },
  { id: 'referral',         label: 'Реферал' },
]

function probabilityColor(p: number) {
  if (p >= 80) return 'text-risk-low'
  if (p >= 60) return 'text-risk-medium'
  return 'text-risk-high'
}

function probabilityBg(p: number) {
  if (p >= 80) return 'bg-risk-low'
  if (p >= 60) return 'bg-risk-medium'
  return 'bg-risk-high'
}

export function LeadsPage() {
  const qc = useQueryClient()
  const [segment, setSegment]     = useState('')
  const [trigger, setTrigger]     = useState('')
  const [showSaved, setShowSaved] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', segment, trigger, showSaved],
    queryFn: () => leadsService.getLeads({
      segment:     segment || undefined,
      triggerType: trigger || undefined,
      showSaved:   showSaved || undefined,
    }),
  })

  const saveMutation  = useMutation({ mutationFn: (id: string) => leadsService.saveLead(id),   onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }) })
  const hideMutation  = useMutation({ mutationFn: (id: string) => leadsService.hideLead(id),   onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }) })
  const addCrmMutation = useMutation({ mutationFn: (id: string) => leadsService.addToCrm(id) })

  const topLeads   = leads?.slice(0, 5) ?? []
  const otherLeads = leads?.slice(5) ?? []

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-semibold text-ink text-[20px] leading-tight">AI Лиды</h1>
          <p className="text-sm text-ink-muted mt-0.5">Компании с высокой вероятностью заказа сегодня</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-ink-muted bg-surface-card border border-edge rounded-lg px-3 py-1.5">
            <Sparkles size={10} className="text-accent" />
            Обновлено сегодня в 07:00
          </div>
          <Button variant="outline" size="sm" icon={<RefreshCw size={12} />}>Обновить</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 flex-wrap items-center mb-5">
        <select
          className="text-sm border border-edge rounded-lg px-3 py-1.5 text-ink bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-edge-focus"
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
        >
          {SEGMENT_FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        <select
          className="text-sm border border-edge rounded-lg px-3 py-1.5 text-ink bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-edge-focus"
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
        >
          {TRIGGER_FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        <button
          className={clsx(
            'text-sm px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5',
            showSaved
              ? 'bg-accent-faint border-accent-subtle text-accent-text font-medium'
              : 'border-edge text-ink-secondary bg-surface-card hover:bg-surface-hover'
          )}
          onClick={() => setShowSaved(!showSaved)}
        >
          <BookmarkCheck size={13} />
          Сохранённые
        </button>
        {leads && (
          <span className="ml-auto text-xs text-ink-muted">{leads.length} лидов</span>
        )}
      </div>

      {/* Top 5 */}
      {!showSaved && topLeads.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} className="text-risk-medium" />
            <h2 className="font-display font-semibold text-ink text-sm">Топ-5 на сегодня</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : topLeads.map((lead, index) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  rank={index + 1}
                  expanded={expandedId === lead.id}
                  onToggleExpand={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                  onSave={() => saveMutation.mutate(lead.id)}
                  onHide={() => hideMutation.mutate(lead.id)}
                  onAddCrm={() => addCrmMutation.mutate(lead.id)}
                  saving={saveMutation.isPending}
                  adding={addCrmMutation.isPending}
                />
              ))
            }
          </div>
        </div>
      )}

      {/* Other leads */}
      {otherLeads.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-ink-secondary text-sm mb-3">Остальные лиды</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {otherLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                expanded={expandedId === lead.id}
                onToggleExpand={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                onSave={() => saveMutation.mutate(lead.id)}
                onHide={() => hideMutation.mutate(lead.id)}
                onAddCrm={() => addCrmMutation.mutate(lead.id)}
                saving={saveMutation.isPending}
                adding={addCrmMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && leads?.length === 0 && (
        <EmptyState
          icon={<Sparkles />}
          title="Нет лидов"
          description="Попробуйте изменить фильтры или обновить список"
        />
      )}
    </div>
  )
}

function LeadCard({
  lead,
  rank,
  expanded,
  onToggleExpand,
  onSave,
  onHide,
  onAddCrm,
  saving,
  adding,
}: {
  lead: Lead
  rank?: number
  expanded: boolean
  onToggleExpand: () => void
  onSave: () => void
  onHide: () => void
  onAddCrm: () => void
  saving: boolean
  adding: boolean
}) {
  const triggerLabels: Record<Lead['triggerType'], string> = {
    new_company:     'Новая компания',
    competitor_loss: 'Уход от конкурента',
    seasonal:        'Сезонный спрос',
    activity_signal: 'Сигнал активности',
    referral:        'Реферал',
  }

  const triggerColors: Record<Lead['triggerType'], string> = {
    new_company:     'bg-accent-faint border-accent-subtle text-accent-text',
    competitor_loss: 'bg-[#fdf7ed] border-[#f0d39e] text-risk-medium',
    seasonal:        'bg-[#f0f9f4] border-[#c0e4d2] text-risk-low',
    activity_signal: 'bg-[#f2edfd] border-[#d0c4f4] text-[#4a34a8]',
    referral:        'bg-surface-hover border-edge text-ink-secondary',
  }

  return (
    <div className={clsx(
      'bg-surface-card rounded-xl border shadow-card flex flex-col transition-colors duration-150',
      lead.isSaved ? 'border-accent-subtle' : 'border-edge'
    )}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-2 mb-2.5">
          {rank && (
            <div className="w-5 h-5 rounded-full bg-[#fdf7ed] text-risk-medium text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {rank}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-ink text-sm leading-tight">{lead.companyName}</p>
            <p className="text-xs text-ink-muted">{lead.city} · {lead.segmentLabel}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={clsx('text-[20px] font-display font-bold leading-none', probabilityColor(lead.orderProbability))}>
              {lead.orderProbability}%
            </p>
            <p className="text-[10px] text-ink-muted mt-0.5">вероятность</p>
          </div>
        </div>

        {/* Probability bar */}
        <div className="h-1 bg-edge rounded-full mb-3 overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-500', probabilityBg(lead.orderProbability))}
            style={{ width: `${lead.orderProbability}%`, opacity: 0.7 }}
          />
        </div>

        {/* Trigger */}
        <div className={clsx('text-xs border rounded-lg px-2 py-1 mb-2 inline-flex items-center gap-1.5', triggerColors[lead.triggerType])}>
          <Sparkles size={9} />
          {triggerLabels[lead.triggerType]}
        </div>

        <p className="text-xs text-ink-secondary leading-relaxed mb-2 line-clamp-2">{lead.triggerReason}</p>

        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span>{lead.expectedProduct}</span>
          <span>·</span>
          <span>{lead.expectedVolume}</span>
        </div>

        {/* Expanded */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-edge-soft space-y-2 animate-fade-in">
            <div className="bg-accent-faint border border-accent-subtle rounded-lg p-2.5">
              <div className="flex items-center gap-1 mb-1">
                <Sparkles size={10} className="text-accent" />
                <span className="text-xs font-semibold text-accent-text">AI Инсайт</span>
              </div>
              <p className="text-xs text-ink-secondary">{lead.aiInsight}</p>
            </div>
            {lead.contactPerson && (
              <div>
                <p className="text-xs text-ink-muted mb-0.5">Контакт</p>
                <p className="text-xs font-medium text-ink">{lead.contactPerson}</p>
                {lead.contactPhone && <p className="text-xs text-ink-secondary">{lead.contactPhone}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="primary"
          icon={<Plus size={12} />}
          loading={adding}
          onClick={onAddCrm}
        >
          В CRM
        </Button>
        <button
          className="text-xs text-ink-muted hover:text-ink p-1.5 rounded-md hover:bg-surface-hover transition-colors"
          onClick={onSave}
          title={lead.isSaved ? 'Сохранено' : 'Сохранить'}
        >
          {lead.isSaved
            ? <BookmarkCheck size={14} className="text-accent" />
            : <Bookmark size={14} />}
        </button>
        <button
          className="text-xs text-ink-muted hover:text-ink p-1.5 rounded-md hover:bg-surface-hover transition-colors"
          onClick={onHide}
          title="Скрыть"
        >
          <EyeOff size={14} />
        </button>
        <button
          className="ml-auto text-xs text-ink-muted hover:text-ink-secondary flex items-center gap-1 p-1.5 rounded-md hover:bg-surface-hover transition-colors"
          onClick={onToggleExpand}
        >
          {expanded ? 'Свернуть' : 'Подробнее'}
          <ChevronDown size={11} className={clsx('transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>
    </div>
  )
}
