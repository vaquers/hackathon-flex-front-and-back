import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  AlertTriangle, Clock, Inbox, Star, CheckSquare,
  ChevronRight, Phone, Mail, MessageSquare, Zap, TrendingUp, TrendingDown, Minus,
  Check, UserPlus, ExternalLink,
} from 'lucide-react'
import { dashboardService } from '@/services/dashboardService'
import { StatCard } from '@/components/ui/Card'
import { Badge, RiskBadge, SentimentBadge, VipBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkeletonPage } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { SidePanel } from '@/components/ui/SidePanel'
import type { IncomingRequest, PriorityDeal } from '@/types'
import { formatRub, formatDaysAgo, formatDateTime, urgencyLabel } from '@/utils/format'

export function TodayPage() {
  const navigate = useNavigate()
  const [selectedRequest, setSelectedRequest] = useState<IncomingRequest | null>(null)

  const summaryQ  = useQuery({ queryKey: ['dashboard-summary'], queryFn: () => dashboardService.getSummary() })
  const dealsQ    = useQuery({ queryKey: ['priority-deals'],    queryFn: () => dashboardService.getPriorityDeals() })
  const incomingQ = useQuery({ queryKey: ['incoming-requests'], queryFn: () => dashboardService.getIncomingRequests() })
  const vipQ      = useQuery({ queryKey: ['vip-alerts'],        queryFn: () => dashboardService.getVipAlerts() })
  const sentimentQ = useQuery({ queryKey: ['sentiment-feed'],   queryFn: () => dashboardService.getSentimentFeed() })

  const confirmMutation = useMutation({
    mutationFn: ({ requestId, assigneeId }: { requestId: string; assigneeId: string }) =>
      dashboardService.confirmRouting(requestId, assigneeId),
    onSuccess: () => setSelectedRequest(null),
  })

  const isLoading = summaryQ.isLoading || dealsQ.isLoading || incomingQ.isLoading
  if (isLoading) return <div className="p-6"><SkeletonPage /></div>
  if (summaryQ.isError) return <div className="p-6"><ErrorState message="Не удалось загрузить данные дашборда" onRetry={() => summaryQ.refetch()} /></div>

  const summary      = summaryQ.data!
  const deals        = dealsQ.data ?? []
  const incoming     = incomingQ.data ?? []
  const vipAlerts    = vipQ.data ?? []
  const sentimentFeed = sentimentQ.data ?? []

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-semibold text-ink text-[20px] leading-tight">Сегодня</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-muted bg-surface-card border border-edge rounded-lg px-3 py-1.5">
          <Zap size={11} className="text-accent" />
          AI-режим активен
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Сделки в риске"
          value={summary.dealsAtRisk}
          color="red"
          icon={<AlertTriangle size={16} />}
          onClick={() => navigate('/risks')}
        />
        <StatCard
          label="Зависшие сделки"
          value={summary.stalledDeals}
          color="amber"
          icon={<Clock size={16} />}
          onClick={() => navigate('/risks?category=stalled')}
        />
        <StatCard
          label="Входящих"
          value={summary.pendingIncoming}
          subvalue="требуют маршрутизации"
          color="sky"
          icon={<Inbox size={16} />}
        />
        <StatCard
          label="VIP клиенты"
          value={summary.vipClients}
          color="violet"
          icon={<Star size={16} />}
        />
        <StatCard
          label="Follow-up сегодня"
          value={summary.todayFollowUps}
          subvalue={`Конверсия: ${summary.weeklyConversionRate}%`}
          color="emerald"
          icon={<CheckSquare size={16} />}
        />
      </div>

      {/* VIP Alerts */}
      {vipAlerts.length > 0 && (
        <div className="bg-[#f2edfd] border border-[#d0c4f4] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={12} className="text-[#4a34a8]" />
            <h2 className="font-display font-semibold text-[#37268a] text-xs uppercase tracking-widest">
              VIP Alerts
            </h2>
          </div>
          <div className="space-y-2">
            {vipAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between gap-4 bg-surface-card rounded-lg p-3 border border-[#d0c4f4]/60"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-ink text-sm">{alert.clientName}</span>
                    <RiskBadge level={alert.severity} />
                  </div>
                  <p className="text-xs text-ink-secondary">{alert.alertMessage}</p>
                  <p className="text-xs text-ink-muted mt-1">Менеджер: {alert.managerName}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/clients/${alert.clientId}`)}
                >
                  Открыть
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Deals */}
      <div className="bg-surface-card rounded-xl border border-edge shadow-card">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge-soft">
          <h2 className="font-display font-semibold text-ink text-sm">Приоритетные сделки</h2>
          <Button size="sm" variant="ghost" onClick={() => navigate('/risks')} icon={<ChevronRight size={13} />}>
            Все риски
          </Button>
        </div>
        <div className="divide-y divide-edge-soft">
          {deals.map((deal) => (
            <PriorityDealRow key={deal.id} deal={deal} onClick={() => navigate(`/clients/${deal.clientId}`)} />
          ))}
        </div>
      </div>

      {/* AI Routing / Incoming Requests */}
      <div className="bg-surface-card rounded-xl border border-edge shadow-card">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge-soft">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-semibold text-ink text-sm">Входящие обращения</h2>
            {incoming.length > 0 && (
              <span className="text-xs bg-accent-faint text-accent-text font-semibold rounded-full px-2 py-0.5">
                {incoming.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Zap size={10} className="text-accent" />
            AI-маршрутизация
          </div>
        </div>
        <div className="divide-y divide-edge-soft">
          {incoming.map((req) => (
            <IncomingRequestRow
              key={req.id}
              request={req}
              onOpen={() => setSelectedRequest(req)}
              onConfirm={() => confirmMutation.mutate({ requestId: req.id, assigneeId: req.recommendedAssigneeId })}
              confirming={confirmMutation.isPending}
            />
          ))}
        </div>
      </div>

      {/* Sentiment Feed */}
      {sentimentFeed.length > 0 && (
        <div className="bg-surface-card rounded-xl border border-edge shadow-card">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-edge-soft">
            <h2 className="font-display font-semibold text-ink text-sm">Изменения настроения клиентов</h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {sentimentFeed.map((item) => (
              <div
                key={item.clientId}
                className="rounded-lg border border-edge p-3 hover:bg-surface-hover cursor-pointer transition-colors"
                onClick={() => navigate(`/clients/${item.clientId}`)}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {item.isVip && <VipBadge />}
                  <span className="font-medium text-ink text-xs truncate">{item.clientName}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <SentimentBadge sentiment={item.previousSentiment} />
                  {item.change === 'improved'
                    ? <TrendingUp size={11} className="text-risk-low" />
                    : item.change === 'worsened'
                    ? <TrendingDown size={11} className="text-risk-high" />
                    : <Minus size={11} className="text-ink-faint" />}
                  <SentimentBadge sentiment={item.currentSentiment} />
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming Request Side Panel */}
      <SidePanel
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Детали обращения"
        width="md"
      >
        {selectedRequest && (
          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant={`urgency-${selectedRequest.urgency}`} dot>
                  {urgencyLabel(selectedRequest.urgency)}
                </Badge>
                <Badge variant="default">{selectedRequest.clientType}</Badge>
              </div>
              <h3 className="font-display font-semibold text-ink">{selectedRequest.topic}</h3>
              <p className="text-sm text-ink-secondary mt-2">{selectedRequest.summary}</p>
            </div>

            <div className="bg-accent-faint border border-accent-subtle rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap size={11} className="text-accent" />
                <span className="text-xs font-semibold text-accent-text">AI Рекомендация</span>
              </div>
              <p className="text-sm font-medium text-ink">→ {selectedRequest.recommendedAssignee}</p>
              <p className="text-xs text-ink-secondary mt-1">{selectedRequest.recommendationReason}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                icon={<Check size={14} />}
                loading={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate({ requestId: selectedRequest.id, assigneeId: selectedRequest.recommendedAssigneeId })}
              >
                Подтвердить назначение
              </Button>
              <Button variant="outline" icon={<UserPlus size={14} />}>
                Назначить себе
              </Button>
              {selectedRequest.clientId && (
                <Button variant="ghost" icon={<ExternalLink size={14} />} onClick={() => navigate(`/clients/${selectedRequest.clientId}`)}>
                  Открыть клиента
                </Button>
              )}
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PriorityDealRow({ deal, onClick }: { deal: PriorityDeal; onClick: () => void }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-surface-hover transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-medium text-ink text-sm truncate">{deal.clientName}</span>
          {deal.isVip && <VipBadge />}
        </div>
        <p className="text-xs text-ink-muted truncate">{deal.riskReason}</p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right hidden md:block">
          <p className="text-xs font-semibold text-ink">{formatRub(deal.amount)}</p>
          <p className="text-xs text-ink-muted">{deal.stageLabel}</p>
        </div>
        <Badge variant="stage" className="hidden lg:inline-flex">{deal.managerName}</Badge>
        <RiskBadge level={deal.riskLevel} score={deal.riskScore} />
        <SentimentBadge sentiment={deal.sentiment} />
      </div>

      <div className="flex-shrink-0 hidden xl:block max-w-[220px]">
        <div className="flex items-start gap-1.5">
          <Zap size={10} className="text-accent flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">{deal.aiNextAction}</p>
        </div>
      </div>

      <div className="text-xs text-ink-muted flex-shrink-0 hidden lg:block text-right">
        <p>{formatDaysAgo(deal.daysSinceContact)}</p>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={onClick}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        Открыть
      </Button>
    </div>
  )
}

function IncomingRequestRow({
  request,
  onOpen,
  onConfirm,
  confirming,
}: {
  request: IncomingRequest
  onOpen: () => void
  onConfirm: () => void
  confirming: boolean
}) {
  const channelIcon = {
    email:     <Mail size={13} />,
    phone:     <Phone size={13} />,
    web:       <MessageSquare size={13} />,
    messenger: <MessageSquare size={13} />,
  }[request.channel]

  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-surface-hover transition-colors group">
      <div className="flex-shrink-0 text-ink-muted">{channelIcon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-medium text-ink text-sm">{request.clientName}</span>
          <Badge variant={`urgency-${request.urgency}`} dot>{urgencyLabel(request.urgency)}</Badge>
          {request.isNew && <Badge variant="stage">Новое</Badge>}
        </div>
        <p className="text-xs text-ink-muted truncate">{request.topic}</p>
      </div>

      <div className="flex-shrink-0 hidden md:block text-right">
        <p className="text-xs font-medium text-ink">→ {request.recommendedAssignee}</p>
        <p className="text-xs text-ink-muted">AI рекомендация</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button size="sm" variant="ghost" onClick={onOpen}>Детали</Button>
        <Button size="sm" variant="primary" loading={confirming} onClick={onConfirm} icon={<Check size={12} />}>
          Принять
        </Button>
      </div>
    </div>
  )
}
