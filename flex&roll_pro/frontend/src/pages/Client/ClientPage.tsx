import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Phone, Mail, Zap, FileText,
  Phone as PhoneIcon, Mail as MailIcon, MessageSquare, StickyNote, GitBranch,
  CheckCircle, AlertCircle,
} from 'lucide-react'
import { clientService } from '@/services/clientService'
import { Badge, RiskBadge, SentimentBadge, VipBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ScoreBar, ScoreCircle } from '@/components/ui/ScoreBar'
import { ErrorState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatRub, formatDateTime, formatDate, formatDuration } from '@/utils/format'
import { clsx } from 'clsx'
import type { CommunicationEvent } from '@/types'

export function ClientPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const clientId = id && id !== 'undefined' ? id : null

  const clientQ    = useQuery({ queryKey: ['client', clientId],        queryFn: () => clientService.getClient(clientId!),          enabled: !!clientId })
  const summaryQ   = useQuery({ queryKey: ['ai-summary', clientId],    queryFn: () => clientService.getAiSummary(clientId!),       enabled: !!clientId })
  const commsQ     = useQuery({ queryKey: ['communications', clientId], queryFn: () => clientService.getCommunications(clientId!), enabled: !!clientId })
  const nextActionQ = useQuery({ queryKey: ['next-action', clientId],  queryFn: () => clientService.getAiNextAction(clientId!),    enabled: !!clientId })
  const docsQ      = useQuery({ queryKey: ['related-docs', clientId],  queryFn: () => clientService.getRelatedDocuments(clientId!), enabled: !!clientId })

  if (!clientId) {
    return <ErrorState message="Карточка клиента недоступна" onRetry={() => navigate('/')} />
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

  const client     = clientQ.data!
  const summary    = summaryQ.data
  const comms      = commsQ.data ?? []
  const nextAction = nextActionQ.data
  const docs       = docsQ.data ?? []

  return (
    <div className="animate-fade-in -m-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-surface-card border-b border-edge px-6 py-3.5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-ink-muted hover:text-ink p-1.5 rounded-xl hover:bg-surface-hover transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-ink text-[17px] truncate">{client.company}</h1>
              {client.isVip && <VipBadge />}
              <RiskBadge level={client.riskLevel} score={client.riskScore} />
              <SentimentBadge sentiment={client.sentiment} />
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              {client.name} · {client.managerName} · {client.dealStageLabel} · {formatRub(client.dealAmount)}/мес.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {client.phone && (
              <Button size="sm" variant="outline" icon={<Phone size={12} />}>{client.phone}</Button>
            )}
            {client.email && (
              <Button size="sm" variant="outline" icon={<Mail size={12} />}>Email</Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-4">

          {/* AI Client Summary */}
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
                  <SummaryRow label="Компания"  value={summary.company} />
                  <SummaryRow label="Сегмент"   value={summary.segment} />
                  <SummaryRow label="Продукт"   value={summary.product} />
                  <SummaryRow label="Объём"     value={summary.expectedVolume} />
                  <SummaryRow label="Стадия"    value={summary.dealStage} />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-ink-muted font-medium uppercase tracking-wide mb-1.5">Последние действия</p>
                    <ul className="space-y-1">
                      {summary.recentActions.map((a, i) => (
                        <li key={i} className="text-xs text-ink-secondary flex items-start gap-1.5">
                          <span className="text-accent flex-shrink-0 mt-0.5">·</span>
                          {a}
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
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-4 w-full" />)}
              </div>
            ) : null}
          </Card>

          {/* AI Next Action */}
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

          {/* Communications Timeline */}
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

        {/* Right sidebar */}
        <div className="space-y-4">
          <Card>
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">Информация</p>
            <div className="space-y-2.5">
              <SummaryRow label="Город"           value={client.city} />
              {client.inn && <SummaryRow label="ИНН" value={client.inn} />}
              <SummaryRow label="Сегмент"         value={client.segmentLabel} />
              <SummaryRow label="Продукт"         value={client.product} />
              <SummaryRow label="Объём"           value={client.expectedVolume} />
              <SummaryRow label="Сумма"           value={formatRub(client.dealAmount) + '/мес.'} />
              <SummaryRow label="Контакт"         value={formatDateTime(client.lastContactAt)} />
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
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-ink-muted flex-shrink-0 w-20">{label}</span>
      <span className="text-xs text-ink font-medium">{value}</span>
    </div>
  )
}

function CommEventRow({ event }: { event: CommunicationEvent }) {
  const icons: Record<string, React.ReactNode> = {
    call:          <PhoneIcon size={12} />,
    email:         <MailIcon size={12} />,
    messenger:     <MessageSquare size={12} />,
    note:          <StickyNote size={12} />,
    status_change: <GitBranch size={12} />,
  }

  const iconColors: Record<string, string> = {
    call:          'bg-blue-50 text-accent',
    email:         'bg-violet-50 text-violet-600',
    messenger:     'bg-emerald-50 text-risk-low',
    note:          'bg-amber-50 text-risk-medium',
    status_change: 'bg-slate-100 text-ink-secondary',
  }

  return (
    <div className={clsx('flex items-start gap-3 px-6 py-4', event.isImportant && 'bg-amber-50/40')}>
      <div className={clsx(
        'w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
        iconColors[event.type] ?? 'bg-slate-100 text-ink-secondary'
      )}>
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
            {event.attachments.map((att, i) => (
              <a key={i} href={att.url} className="text-xs text-accent hover:underline flex items-center gap-1">
                <FileText size={10} />{att.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CallQualityCard({ comms }: { comms: CommunicationEvent[] }) {
  const lastCall = comms.find((c) => c.type === 'call')

  const qualityQ = useQuery({
    queryKey: ['call-quality', lastCall?.id],
    queryFn:  () => clientService.getCallQuality(lastCall!.id),
    enabled:  !!lastCall,
  })

  const quality = qualityQ.data
  if (!quality && !qualityQ.isLoading) return null

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Zap size={11} className="text-accent" />
        </div>
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest flex-1">AI Оценка звонка</p>
        {quality && <ScoreCircle score={quality.overallScore} size="sm" />}
      </div>

      {qualityQ.isLoading && <Skeleton className="h-20 w-full" />}

      {quality && (
        <div className="space-y-2.5">
          <ScoreBar score={quality.needIdentificationScore}  label="Выявление потребности" />
          <ScoreBar score={quality.objectionHandlingScore}    label="Работа с возражениями" />
          <ScoreBar score={quality.nextStepFixedScore}        label="Фиксация следующего шага" />

          <div className="pt-3 border-t border-edge space-y-1.5">
            <p className="text-xs font-semibold text-risk-low flex items-center gap-1">
              <CheckCircle size={11} />Хорошо
            </p>
            {quality.doneWell.slice(0, 2).map((item, i) => (
              <p key={i} className="text-xs text-ink-secondary pl-3">· {item}</p>
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-risk-high flex items-center gap-1">
              <AlertCircle size={11} />Упущено
            </p>
            {quality.missed.slice(0, 2).map((item, i) => (
              <p key={i} className="text-xs text-ink-secondary pl-3">· {item}</p>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
