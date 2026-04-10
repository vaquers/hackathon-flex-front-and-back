import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  AlertTriangle, Clock, Inbox, Crown,
  ChevronRight, Phone, Mail, MessageSquare, Zap, TrendingUp, TrendingDown, Minus,
  Check, UserPlus, ExternalLink, Flag,
} from 'lucide-react'
import { dashboardService } from '@/services/dashboardService'
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
  if (isLoading) return <SkeletonPage />
  if (summaryQ.isError) return <ErrorState message="Не удалось загрузить данные дашборда" onRetry={() => summaryQ.refetch()} />

  const summary      = summaryQ.data!
  const deals        = dealsQ.data ?? []
  const incoming     = incomingQ.data ?? []
  const vipAlerts    = vipQ.data ?? []
  const sentimentFeed = sentimentQ.data ?? []

  return (
    <div className="space-y-4 animate-fade-in max-w-[1200px]">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <StatBlock
            label="Сделки в риске"
            value={summary.dealsAtRisk}
            icon={<AlertTriangle size={22} strokeWidth={2.2} />}
            onClick={() => navigate('/risks')}
          />
          <StatBlock
            label="Зависшие сделки"
            value={summary.stalledDeals}
            icon={<Clock size={22} strokeWidth={2.2} />}
            onClick={() => navigate('/risks?category=stalled')}
          />
          <StatBlock
            label="Входящих"
            value={summary.pendingIncoming}
            icon={<Inbox size={22} strokeWidth={2.2} />}
          />
          <StatBlock
            label="VIP клиенты"
            value={summary.vipClients}
            icon={<Crown size={22} strokeWidth={2.2} />}
          />
          <StatBlock
            label="Follow-Up сегодня"
            value={summary.todayFollowUps}
            icon={<Clock size={22} strokeWidth={2.2} />}
          />
      </div>

      {/* VIP Clients */}
      {vipAlerts.length > 0 && (
        <section
          className="rounded-[46px] px-10 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_24px_48px_rgba(129,149,193,0.16)]"
          style={{
            background: 'linear-gradient(180deg, rgba(191,203,231,0.72) 0%, rgba(187,199,228,0.68) 100%)',
          }}
        >
          <h2 className="font-display text-[28px] leading-none tracking-[-0.06em] text-[#0c1018]">VIP Клиенты</h2>
          <div className="mt-8 space-y-9">
            {vipAlerts.map((alert) => (
              <VipClientRow
                key={alert.id}
                clientName={alert.clientName}
                severity={alert.severity}
                managerName={alert.managerName}
                message={alert.alertMessage}
                onOpen={() => navigate(`/clients/${alert.clientId}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Priority Deals */}
      <div>
        <div className="mb-2 flex items-center justify-between px-2 py-1.5">
          <h2 className="font-display text-ink text-[14px]">Приоритетные сделки</h2>
          <Button size="sm" variant="ghost" onClick={() => navigate('/risks')} icon={<ChevronRight size={13} />}>
            Все риски
          </Button>
        </div>
        <div className="space-y-2.5">
          {deals.map((deal) => (
            <PriorityDealRow key={deal.id} deal={deal} onClick={() => navigate(`/clients/${deal.clientId}`)} />
          ))}
        </div>
      </div>

      {/* Incoming Requests */}
      <div>
        <div className="mb-2 flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-ink text-[14px]">Входящие обращения</h2>
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
        <div className="space-y-2.5">
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
        <div>
          <div className="mb-2 px-2 py-1.5">
            <h2 className="font-display text-ink text-[14px]">Изменения настроения</h2>
          </div>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {sentimentFeed.map((item) => (
              <div
                key={item.clientId}
                className="glass-panel p-4 hover:bg-surface-hover cursor-pointer transition-colors"
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
  label, value, icon, onClick,
}: {
  label: string
  value: number
  icon: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      className={onClick ? 'cursor-pointer group' : ''}
      onClick={onClick}
    >
      <div
        className="flex min-h-[114px] flex-col rounded-[30px] border border-white/85 px-7 pb-4 pt-5 shadow-[0_18px_36px_rgba(133,149,184,0.18)] transition-all duration-200"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,248,250,0.96) 100%)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-[15px] leading-[1.15] tracking-[-0.05em] text-[#111111]">
            {label}
          </p>
          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center text-accent transition-transform duration-200 group-hover:scale-105">
            {icon}
          </span>
        </div>

        <div className="mt-auto flex justify-center pt-4">
          <p className="font-display text-[34px] leading-none tracking-[-0.07em] text-[#05070b]">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

function VipClientRow({
  clientName,
  severity,
  managerName,
  message,
  onOpen,
}: {
  clientName: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  managerName: string
  message: string
  onOpen: () => void
}) {
  const severityConfig = {
    low: { label: 'Низкий', color: '#10b981' },
    medium: { label: 'Средний', color: '#ff8a1e' },
    high: { label: 'Высокий', color: '#ff4343' },
    critical: { label: 'Критический', color: '#d11f1f' },
  } as const

  const currentSeverity = severityConfig[severity]

  return (
    <div
      className="rounded-[42px] border border-white/86 px-8 py-8 shadow-[0_26px_56px_rgba(122,143,187,0.18)]"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)',
      }}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div
          className="min-w-0 flex-1 rounded-[30px] px-5 py-5"
          style={{ background: 'rgba(214, 219, 225, 0.62)' }}
        >
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_230px] xl:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="truncate font-display text-[20px] leading-tight tracking-[-0.055em] text-[#0d1018]">
                  {clientName}
                </p>
                <span
                  className="inline-flex items-center gap-1.5 text-[18px] font-medium tracking-[-0.05em]"
                  style={{ color: currentSeverity.color }}
                >
                  <Flag size={15} strokeWidth={2.2} />
                  {currentSeverity.label}
                </span>
              </div>
              <div className="mt-4 h-px w-full bg-[rgba(129,139,155,0.28)]" />
              <p className="mt-4 text-[16px] leading-[1.35] tracking-[-0.045em] text-[#7e848c]">
                {message}
              </p>
            </div>

            <div className="min-w-0 xl:pl-4">
              <p className="font-display text-[20px] leading-tight tracking-[-0.05em] text-[#0d1018]">
                Менеджер
              </p>
              <div className="mt-4 h-px w-full bg-[rgba(129,139,155,0.28)]" />
              <p className="mt-4 truncate text-[16px] leading-[1.35] tracking-[-0.045em] text-[#7e848c]">
                {managerName}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpen}
          className="flex h-[56px] min-w-[172px] items-center justify-center self-center rounded-full bg-[linear-gradient(180deg,#2471ff_0%,#0056f5_100%)] px-7 text-[17px] font-medium tracking-[-0.045em] text-white shadow-[0_16px_32px_rgba(0,86,245,0.28)] transition-transform duration-150 hover:-translate-y-0.5"
        >
          Смотреть
        </button>
      </div>
    </div>
  )
}

function PriorityDealRow({ deal, onClick }: { deal: PriorityDeal; onClick: () => void }) {
  return (
    <div className="glass-panel flex items-center gap-4 px-6 py-4 transition-colors group">
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
    <div className="glass-panel flex items-center gap-4 px-6 py-4 transition-colors group">
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
