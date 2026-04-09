import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Filter, ExternalLink, Zap } from 'lucide-react'
import { riskService } from '@/services/riskService'
import { Badge, RiskBadge, SentimentBadge, VipBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { SidePanel } from '@/components/ui/SidePanel'
import type { RiskItem } from '@/types'
import { formatRub, formatDaysAgo } from '@/utils/format'
import { clsx } from 'clsx'

type TabId = 'all' | 'stalled' | 'post_proposal_silence' | 'long_calculation' | 'no_response' | 'high_churn'

const TABS = [
  { id: 'all',                    label: 'Все риски' },
  { id: 'stalled',                label: 'Зависшие' },
  { id: 'post_proposal_silence',  label: 'После КП молчание' },
  { id: 'long_calculation',       label: 'Долгий расчёт' },
  { id: 'no_response',            label: 'Без ответа' },
  { id: 'high_churn',             label: 'Высокий риск ухода' },
] as const

const MANAGERS = [
  { id: '',      label: 'Все менеджеры' },
  { id: 'm-001', label: 'Д. Соколов' },
  { id: 'm-002', label: 'Е. Новикова' },
  { id: 'm-003', label: 'П. Волков' },
  { id: 'm-004', label: 'И. Лебедев' },
]

export function RisksPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab]   = useState<TabId>('all')
  const [managerId, setManagerId]   = useState('')
  const [vipOnly, setVipOnly]       = useState(false)
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null)

  const { data: risks, isLoading, isError, refetch } = useQuery({
    queryKey: ['risks', activeTab, managerId, vipOnly],
    queryFn: () => riskService.getRisks({
      category:  activeTab !== 'all' ? activeTab as RiskItem['riskCategory'] : undefined,
      managerId: managerId || undefined,
      isVip:     vipOnly || undefined,
    }),
  })

  const tabsWithCount = TABS.map((t) => ({
    ...t,
    count: t.id === 'all'
      ? risks?.length
      : risks?.filter((r) => r.riskCategory === t.id).length,
  }))

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-ink text-lg leading-tight">Риски</h1>
          <p className="text-xs text-ink-muted mt-0.5">Зависшие сделки и клиенты в зоне риска</p>
        </div>
        {risks && risks.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle size={14} className="text-risk-high" />
            <span className="font-semibold text-risk-high">{risks.length}</span>
            <span className="text-ink-muted">активных рисков</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Filter size={12} />
          <span>Фильтры:</span>
        </div>
        <select
          className="text-sm border border-edge rounded-xl px-3 py-2 text-ink bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
        >
          {MANAGERS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <button
          className={clsx(
            'text-sm px-3 py-2 rounded-xl transition-colors',
            vipOnly
              ? 'bg-blue-50 text-accent font-medium'
              : 'border border-edge text-ink-secondary bg-surface-card hover:bg-surface-hover'
          )}
          onClick={() => setVipOnly(!vipOnly)}
        >
          VIP
        </button>
      </div>

      {/* Table card */}
      <div className="bg-surface-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 pt-4 border-b border-edge">
          <Tabs
            tabs={tabsWithCount.map((t) => ({ id: t.id, label: t.label, count: t.count }))}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as TabId)}
          />
        </div>

        <div className="p-5">
          {isLoading && <SkeletonTable rows={6} />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && risks && risks.length === 0 && (
            <EmptyState
              icon={<AlertTriangle />}
              title="Нет рисковых сделок"
              description="При текущих фильтрах рисков не найдено"
            />
          )}
          {!isLoading && risks && risks.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-edge">
                    {['Клиент', 'Менеджер', 'Стадия', 'Без движения', 'Причина риска', 'Риск', 'Настроение', 'AI Действие', ''].map((h) => (
                      <th key={h} className="text-left text-[11px] font-medium text-ink-muted uppercase tracking-wide pb-3 pr-4 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge">
                  {risks.map((risk) => (
                    <RiskRow
                      key={risk.id}
                      risk={risk}
                      onPreview={() => setSelectedRisk(risk)}
                      onOpen={() => navigate(`/clients/${risk.clientId}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Side Panel */}
      <SidePanel
        open={!!selectedRisk}
        onClose={() => setSelectedRisk(null)}
        title="Превью сделки"
        width="md"
      >
        {selectedRisk && (
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {selectedRisk.isVip && <VipBadge />}
                  <RiskBadge level={selectedRisk.riskLevel} score={selectedRisk.riskScore} />
                </div>
                <h3 className="font-display text-ink text-lg">{selectedRisk.clientName}</h3>
                <p className="text-sm text-ink-muted">{selectedRisk.managerName} · {selectedRisk.dealStageLabel}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-ink">{formatRub(selectedRisk.amount)}</p>
                <SentimentBadge sentiment={selectedRisk.sentiment} />
              </div>
            </div>

            <div className="bg-red-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-risk-high mb-1">Причина риска</p>
              <p className="text-sm text-red-800">{selectedRisk.riskReason}</p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap size={12} className="text-accent" />
                <p className="text-xs font-semibold text-accent">AI рекомендация</p>
              </div>
              <p className="text-sm text-ink">{selectedRisk.aiNextAction}</p>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-secondary">Без движения</span>
              <span className="font-medium text-risk-high">{formatDaysAgo(selectedRisk.daysSinceActivity)}</span>
            </div>

            <Button
              variant="primary"
              className="w-full"
              icon={<ExternalLink size={14} />}
              onClick={() => navigate(`/clients/${selectedRisk.clientId}`)}
            >
              Открыть карточку клиента
            </Button>
          </div>
        )}
      </SidePanel>
    </div>
  )
}

function RiskRow({
  risk,
  onPreview,
  onOpen,
}: {
  risk: RiskItem
  onPreview: () => void
  onOpen: () => void
}) {
  return (
    <tr className="hover:bg-surface-hover transition-colors group">
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-ink text-sm">{risk.clientName}</span>
          {risk.isVip && <VipBadge />}
        </div>
      </td>
      <td className="py-3.5 pr-4">
        <span className="text-sm text-ink-secondary">{risk.managerName}</span>
      </td>
      <td className="py-3.5 pr-4">
        <Badge variant="stage">{risk.dealStageLabel}</Badge>
      </td>
      <td className="py-3.5 pr-4">
        <span className={clsx(
          'text-sm font-medium',
          risk.daysSinceActivity >= 14 ? 'text-risk-high'
          : risk.daysSinceActivity >= 7  ? 'text-risk-medium'
          : 'text-ink-secondary'
        )}>
          {formatDaysAgo(risk.daysSinceActivity)}
        </span>
      </td>
      <td className="py-3.5 pr-4 max-w-[200px]">
        <p className="text-xs text-ink-secondary line-clamp-2">{risk.riskReason}</p>
      </td>
      <td className="py-3.5 pr-4">
        <RiskBadge level={risk.riskLevel} score={risk.riskScore} />
      </td>
      <td className="py-3.5 pr-4">
        <SentimentBadge sentiment={risk.sentiment} />
      </td>
      <td className="py-3.5 pr-4 max-w-[200px]">
        <div className="flex items-start gap-1">
          <Zap size={10} className="text-accent flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-muted line-clamp-2">{risk.aiNextAction}</p>
        </div>
      </td>
      <td className="py-3.5">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={onPreview}>Превью</Button>
          <Button size="sm" variant="outline" onClick={onOpen} icon={<ExternalLink size={12} />}>
            Открыть
          </Button>
        </div>
      </td>
    </tr>
  )
}
