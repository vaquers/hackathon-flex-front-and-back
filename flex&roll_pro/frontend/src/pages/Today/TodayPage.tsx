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

import exclamationIcon from '@/assets/symbols/exclamationmark.triangle.svg'
import clockIcon from '@/assets/symbols/clock.svg'
import trayIcon from '@/assets/symbols/tray.and.arrow.down.svg'
import crownIcon from '@/assets/symbols/crown.svg'
import checkIcon from '@/assets/symbols/checkmark.square.svg'

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
  if (isLoading) return <SkeletonPage />
  if (summaryQ.isError) return <ErrorState message="Не удалось загрузить данные дашборда" onRetry={() => summaryQ.refetch()} />

  const summary      = summaryQ.data!
  const deals        = dealsQ.data ?? []
  const incoming     = incomingQ.data ?? []
  const vipAlerts    = vipQ.data ?? []
  const sentimentFeed = sentimentQ.data ?? []

  return (
    <div className="space-y-5 animate-fade-in max-w-[1400px]">
      {/* Summary Stats — matching reference layout */}
      <div className="bg-surface-card rounded-2xl shadow-card p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <StatBlock
            label="Сделки в риске"
            value={summary.dealsAtRisk}
            icon={exclamationIcon}
            color="red"
            onClick={() => navigate('/risks')}
          />
          <StatBlock
            label="Зависшие сделки"
            value={summary.stalledDeals}
            icon={clockIcon}
            color="amber"
            onClick={() => navigate('/risks?category=stalled')}
          />
          <StatBlock
            label="Входящих"
            value={summary.pendingIncoming}
            icon={trayIcon}
            color="blue"
          />
          <StatBlock
            label="VIP клиенты"
            value={summary.vipClients}
            icon={crownIcon}
            color="violet"
          />
          <StatBlock
            label="Follow-Up сегодня"
            value={summary.todayFollowUps}
            icon={checkIcon}
            color="green"
          />
        </div>
      </div>

      {/* VIP Clients — matching reference */}
      {vipAlerts.length > 0 && (
        <div className="bg-surface-card rounded-2xl shadow-card p-6">
          <h2 className="font-display text-ink text-[15px] mb-4">VIP Клиенты</h2>
          <div className="space-y-3">
            {vipAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-surface-inner rounded-2xl border border-edge p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-ink text-sm">{alert.clientName}</span>
                    <RiskBadge level={alert.severity} />
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed">{alert.alertMessage}</p>
                </div>
                <div className="text-right flex-shrink-0 mr-4">
                  <p className="text-xs text-ink-muted">Менеджер</p>
                  <p className="text-sm text-ink-secondary">{alert.managerName}</p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-shrink-0"
                  onClick={() => navigate(`/clients/${alert.clientId}`)}
                >
                  Смотреть
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Deals */}
      <div className="bg-surface-card rounded-2xl shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <h2 className="font-display text-ink text-[15px]">Приоритетные сделки</h2>
          <Button size="sm" variant="ghost" onClick={() => navigate('/risks')} icon={<ChevronRight size={13} />}>
            Все риски
          </Button>
        </div>
        <div className="divide-y divide-edge">
          {deals.map((deal) => (
            <PriorityDealRow key={deal.id} deal={deal} onClick={() => navigate(`/clients/${deal.clientId}`)} />
          ))}
        </div>
      </div>

      {/* Incoming Requests */}
      <div className="bg-surface-card rounded-2xl shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-ink text-[15px]">Входящие обращения</h2>
            {incoming.length > 0 && (
              <span className="text-xs bg-blue-50 text-accent font-semibold rounded-lg px-2 py-0.5">
                {incoming.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Zap size={10} className="text-accent" />
            AI-маршрутизация
          </div>
        </div>
        <div className="divide-y divide-edge">
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
        <div className="bg-surface-card rounded-2xl shadow-card">
          <div className="px-6 py-4 border-b border-edge">
            <h2 className="font-display text-ink text-[15px]">Изменения настроения клиентов</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            {sentimentFeed.map((item) => (
              <div
                key={item.clientId}
                className="rounded-2xl border border-edge p-4 hover:bg-surface-hover cursor-pointer transition-colors"
                onClick={() => navigate(`/clients/${item.clientId}`)}
              >
                <div className="flex items-center gap-2 mb-2">
                  {item.isVip && <VipBadge />}
                  <span className="font-medium text-ink text-xs truncate">{item.clientName}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <SentimentBadge sentiment={item.previousSentiment} />
                  {item.change === 'improved'
                    ? <TrendingUp size={12} className="text-risk-low" />
                    : item.change === 'worsened'
                    ? <TrendingDown size={12} className="text-risk-high" />
                    : <Minus size={12} className="text-ink-faint" />}
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
          <div className="p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge variant={`urgency-${selectedRequest.urgency}`} dot>
                  {urgencyLabel(selectedRequest.urgency)}
                </Badge>
                <Badge variant="default">{selectedRequest.clientType}</Badge>
              </div>
              <h3 className="font-display text-ink text-base">{selectedRequest.topic}</h3>
              <p className="text-sm text-ink-secondary mt-2">{selectedRequest.summary}</p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap size={12} className="text-accent" />
                <span className="text-xs font-semibold text-accent">AI Рекомендация</span>
              </div>
              <p className="text-sm font-medium text-ink">{selectedRequest.recommendedAssignee}</p>
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

function StatBlock({
  label, value, icon, color, onClick,
}: {
  label: string
  value: number
  icon: string
  color: 'red' | 'amber' | 'blue' | 'violet' | 'green'
  onClick?: () => void
}) {
  return (
    <div
      className={onClick ? 'cursor-pointer' : ''}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-ink-muted font-medium">{label}</span>
        <img src={icon} alt="" className="w-4 h-4" style={{ filter: 'invert(1) brightness(0.5)' }} />
      </div>
      <p className="text-[32px] font-display text-ink leading-none">{value}</p>
    </div>
  )
}

function PriorityDealRow({ deal, onClick }: { deal: PriorityDeal; onClick: () => void }) {
  return (
    <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-surface-hover transition-colors group">
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
    email:     <Mail size={14} />,
    phone:     <Phone size={14} />,
    web:       <MessageSquare size={14} />,
    messenger: <MessageSquare size={14} />,
  }[request.channel]

  return (
    <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-surface-hover transition-colors group">
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
        <p className="text-xs font-medium text-ink">{request.recommendedAssignee}</p>
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
