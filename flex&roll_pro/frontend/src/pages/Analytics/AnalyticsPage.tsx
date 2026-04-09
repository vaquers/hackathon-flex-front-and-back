import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import { analyticsService } from '@/services/analyticsService'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { ScoreBar } from '@/components/ui/ScoreBar'
import { SkeletonPage } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { formatRub } from '@/utils/format'
import { clsx } from 'clsx'

type AnalyticsTab = 'kpi' | 'dynamics' | 'quality' | 'losses'

const TABS = [
  { id: 'kpi',      label: 'KPI сотрудников' },
  { id: 'dynamics', label: 'Динамика' },
  { id: 'quality',  label: 'Качество коммуникаций' },
  { id: 'losses',   label: 'Причины потерь' },
]

const PERIODS = [
  { id: 'week',    label: 'Неделя' },
  { id: 'month',   label: 'Месяц' },
  { id: 'quarter', label: 'Квартал' },
  { id: 'year',    label: 'Год' },
]

const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed']

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('kpi')
  const [period, setPeriod]       = useState('quarter')

  const overviewQ = useQuery({
    queryKey: ['analytics-overview', period],
    queryFn: () => analyticsService.getOverview({ period: period as 'week' | 'month' | 'quarter' | 'year' }),
  })

  const isLoading = overviewQ.isLoading
  if (isLoading) return <SkeletonPage />
  if (overviewQ.isError) return <ErrorState />

  const overview = overviewQ.data!

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-ink text-lg leading-tight">Аналитика</h1>
          <p className="text-xs text-ink-muted mt-0.5">Executive Dashboard · {overview.period}</p>
        </div>
        <div className="flex gap-0.5 bg-surface-card rounded-xl p-1 shadow-card">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={clsx(
                'text-xs px-3 py-1.5 rounded-lg transition-colors font-medium',
                period === p.id
                  ? 'bg-accent text-white'
                  : 'text-ink-muted hover:text-ink-secondary'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
        <OverviewStat label="Выручка"         value={formatRub(overview.totalRevenue)}  color="emerald" />
        <OverviewStat label="Всего сделок"    value={overview.totalDeals.toString()} />
        <OverviewStat label="Закрыто"         value={overview.wonDeals.toString()}       color="emerald" />
        <OverviewStat label="Потеряно"        value={overview.lostDeals.toString()}      color="red" />
        <OverviewStat label="Ср. цикл"        value={`${overview.avgDealCycle} дн.`} />
        <OverviewStat label="Ср. ответ"       value={`${Math.floor(overview.avgResponseTime / 60)}ч ${overview.avgResponseTime % 60}м`} />
        <OverviewStat label="Кач. звонков"    value={`${overview.avgCallQuality}/100`}   color="accent" />
      </div>

      {/* Tabs */}
      <div className="bg-surface-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 pt-4 border-b border-edge">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={(id) => setActiveTab(id as AnalyticsTab)} />
        </div>

        <div className="p-6">
          {activeTab === 'kpi'      && <KpiTab period={period} />}
          {activeTab === 'dynamics' && <DynamicsTab period={period} />}
          {activeTab === 'quality'  && <QualityTab period={period} />}
          {activeTab === 'losses'   && <LossesTab period={period} />}
        </div>
      </div>
    </div>
  )
}

function KpiTab({ period }: { period: string }) {
  const { data: kpi, isLoading } = useQuery({
    queryKey: ['employee-kpi', period],
    queryFn: () => analyticsService.getEmployeeKpi({ period: period as 'week' | 'month' | 'quarter' | 'year' }),
  })

  if (isLoading) return <SkeletonPage />

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-edge">
            {['Менеджер', 'Время ответа', 'Активных сделок', 'Конверсия', 'Нагрузка', 'Follow-up', 'Цикл сделки', 'Выручка', 'AI Score'].map((h) => (
              <th key={h} className="text-left text-[11px] font-medium text-ink-muted uppercase tracking-wide pb-3 pr-4 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-edge">
          {kpi?.map((emp) => (
            <tr key={emp.managerId} className="hover:bg-surface-hover transition-colors">
              <td className="py-3.5 pr-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {emp.managerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-ink">{emp.managerName}</span>
                </div>
              </td>
              <td className="py-3.5 pr-4">
                <span className={clsx(
                  'text-sm font-medium',
                  emp.avgResponseTimeMinutes <= 90  ? 'text-risk-low'
                  : emp.avgResponseTimeMinutes <= 150 ? 'text-risk-medium'
                  : 'text-risk-high'
                )}>
                  {Math.floor(emp.avgResponseTimeMinutes / 60)}ч {emp.avgResponseTimeMinutes % 60}м
                </span>
              </td>
              <td className="py-3.5 pr-4">
                <span className="text-sm text-ink-secondary">{emp.activeDeals}</span>
              </td>
              <td className="py-3.5 pr-4">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${emp.conversionRate * 3}%` }} />
                  </div>
                  <span className="text-sm font-medium text-ink">{emp.conversionRate}%</span>
                </div>
              </td>
              <td className="py-3.5 pr-4">
                <WorkloadBar value={emp.workload} />
              </td>
              <td className="py-3.5 pr-4">
                <span className={clsx(
                  'text-sm font-medium',
                  emp.followUpDiscipline >= 85 ? 'text-risk-low'
                  : emp.followUpDiscipline >= 70 ? 'text-risk-medium'
                  : 'text-risk-high'
                )}>
                  {emp.followUpDiscipline}%
                </span>
              </td>
              <td className="py-3.5 pr-4">
                <span className="text-sm text-ink-secondary">{emp.avgDealCycleDays} дн.</span>
              </td>
              <td className="py-3.5 pr-4">
                <span className="text-sm font-semibold text-ink">{formatRub(emp.totalRevenue)}</span>
              </td>
              <td className="py-3.5">
                <QualityChip score={emp.callQualityScore} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DynamicsTab({ period }: { period: string }) {
  const { data: dynamics, isLoading } = useQuery({
    queryKey: ['dynamics', period],
    queryFn: () => analyticsService.getDynamics({ period: period as 'week' | 'month' | 'quarter' | 'year' }),
  })

  if (isLoading) return <SkeletonPage />

  const tooltipStyle = { fontSize: 12, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Card>
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-4">Конверсия %</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dynamics} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="conversionRate" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Конверсия" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-4">Время ответа (мин)</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dynamics} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="responseTimeMinutes" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} name="Время ответа" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-4">Сделки: закрыто / потеряно</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dynamics} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="dealsClosed" fill="#16a34a" name="Закрыто"  radius={[4, 4, 0, 0]} />
            <Bar dataKey="dealsLost"   fill="#fca5a5" name="Потеряно" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-4">Качество звонков</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dynamics} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[50, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="callQualityScore" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} name="Качество" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

function QualityTab({ period }: { period: string }) {
  const { data: quality, isLoading } = useQuery({
    queryKey: ['comm-quality', period],
    queryFn: () => analyticsService.getCommunicationQuality({ period: period as 'week' | 'month' | 'quarter' | 'year' }),
  })

  if (isLoading) return <SkeletonPage />

  const radarData = [
    { metric: 'Выявление потребности', ...Object.fromEntries((quality ?? []).map((q) => [q.managerName.split(' ')[1], q.needIdentificationScore])) },
    { metric: 'Работа с возражениями', ...Object.fromEntries((quality ?? []).map((q) => [q.managerName.split(' ')[1], q.objectionHandlingScore])) },
    { metric: 'Фиксация шага',         ...Object.fromEntries((quality ?? []).map((q) => [q.managerName.split(' ')[1], q.nextStepFixationScore])) },
    { metric: 'Удержание разговора',   ...Object.fromEntries((quality ?? []).map((q) => [q.managerName.split(' ')[1], q.conversationRetentionScore])) },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-ink mb-1">Сравнение по критериям</h3>
        {quality?.map((emp) => (
          <div key={emp.managerId} className="p-4 bg-surface-inner rounded-2xl border border-edge">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-ink">{emp.managerName}</span>
              <QualityChip score={emp.avgCommunicationScore} />
            </div>
            <div className="space-y-2">
              <ScoreBar score={emp.needIdentificationScore}  label="Выявление потребности" />
              <ScoreBar score={emp.objectionHandlingScore}    label="Работа с возражениями" />
              <ScoreBar score={emp.nextStepFixationScore}     label="Фиксация следующего шага" />
              <ScoreBar score={emp.conversationRetentionScore} label="Удержание разговора" />
            </div>
            <p className="text-xs text-ink-muted mt-2">{emp.callsAnalyzed} звонков проанализировано</p>
          </div>
        ))}
      </div>
      <Card>
        <h3 className="text-sm font-semibold text-ink mb-4">Средний балл (радар)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            {quality?.map((emp, i) => (
              <Radar
                key={emp.managerId}
                name={emp.managerName.split(' ')[1]}
                dataKey={emp.managerName.split(' ')[1]}
                stroke={CHART_COLORS[i]}
                fill={CHART_COLORS[i]}
                fillOpacity={0.08}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

function LossesTab({ period }: { period: string }) {
  const reasonsQ = useQuery({
    queryKey: ['lost-reasons', period],
    queryFn: () => analyticsService.getLostDealReasons({ period: period as 'week' | 'month' | 'quarter' | 'year' }),
  })
  const stagesQ = useQuery({
    queryKey: ['lost-by-stage', period],
    queryFn: () => analyticsService.getLostDealsByStage({ period: period as 'week' | 'month' | 'quarter' | 'year' }),
  })

  if (reasonsQ.isLoading || stagesQ.isLoading) return <SkeletonPage />

  const reasons = reasonsQ.data ?? []
  const stages  = stagesQ.data ?? []

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <h3 className="text-sm font-semibold text-ink mb-4">Потери по стадиям воронки</h3>
          <div className="space-y-3">
            {stages.map((stage, i) => {
              const maxCount = Math.max(...stages.map(s => s.count))
              return (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink-secondary">{stage.stageLabel}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-risk-high font-medium">{stage.count} сделок</span>
                      <span className="text-xs text-ink-muted">{formatRub(stage.totalAmount)}</span>
                    </div>
                  </div>
                  <div className="h-6 bg-surface-inner rounded-xl overflow-hidden">
                    <div
                      className="h-full rounded-xl flex items-center justify-end pr-2 transition-all duration-700"
                      style={{
                        width: `${(stage.count / maxCount) * 100}%`,
                        backgroundColor: CHART_COLORS[i] ?? '#cbd5e1',
                        opacity: 0.7,
                      }}
                    >
                      <span className="text-[10px] text-white font-medium">{stage.count}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-ink mb-4">Причины потерь</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={reasons}
                dataKey="count"
                nameKey="reason"
                cx="50%" cy="50%"
                outerRadius={70}
                label={({ percentage }) => `${percentage}%`}
                labelLine={false}
              >
                {reasons.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {reasons.map((r, i) => (
              <div key={r.reason} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-xs text-ink-secondary flex-1">{r.reason}</span>
                <span className="text-xs font-medium text-ink">{r.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="bg-blue-50 rounded-2xl p-5">
        <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">AI Инсайты</p>
        <ul className="space-y-2">
          <li className="text-xs text-ink-secondary">· Главная причина потерь — долгий расчёт (32%). Введите KPI «расчёт за 48 часов» для снижения на ~15%</li>
          <li className="text-xs text-ink-secondary">· Большинство потерь происходит на стадии «КП отправлено». Рекомендуется автоматический follow-up через 5 дней</li>
          <li className="text-xs text-ink-secondary">· Павел Волков имеет самый длинный цикл ответа (180 мин) — рекомендуется коучинг по работе с входящими</li>
        </ul>
      </div>
    </div>
  )
}

// ─── Micro-components ────────────────────────────────────────────────────────

function OverviewStat({ label, value, color }: { label: string; value: string; color?: 'emerald' | 'red' | 'accent' }) {
  const colorStyles: Record<string, string> = {
    emerald: 'text-risk-low',
    red:     'text-risk-high',
    accent:  'text-accent',
  }
  return (
    <div className="bg-surface-card rounded-xl shadow-card p-3 text-center">
      <p className="text-[10px] text-ink-muted mb-0.5 truncate">{label}</p>
      <p className={clsx('font-display text-[14px]', color ? colorStyles[color] : 'text-ink')}>
        {value}
      </p>
    </div>
  )
}

function WorkloadBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full',
            value >= 90 ? 'bg-risk-high' : value >= 70 ? 'bg-risk-medium' : 'bg-risk-low'
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-ink-secondary">{value}%</span>
    </div>
  )
}

function QualityChip({ score }: { score: number }) {
  const color = score >= 80
    ? 'bg-emerald-50 text-risk-low'
    : score >= 65
    ? 'bg-amber-50 text-risk-medium'
    : 'bg-red-50 text-risk-high'
  return <span className={clsx('text-xs font-bold px-2.5 py-1 rounded-lg', color)}>{score}</span>
}
