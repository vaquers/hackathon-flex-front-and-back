import { clsx } from 'clsx'
import type { RiskLevel, SentimentLevel } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'risk-low' | 'risk-medium' | 'risk-high' | 'risk-critical' | 'vip' | 'sentiment-positive' | 'sentiment-neutral' | 'sentiment-negative' | 'sentiment-mixed' | 'stage' | 'urgency-low' | 'urgency-medium' | 'urgency-high' | 'urgency-critical' | 'outline'
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

const variantStyles: Record<string, string> = {
  default:              'bg-slate-100 text-ink-secondary',
  'risk-low':           'bg-emerald-50 text-risk-low',
  'risk-medium':        'bg-amber-50 text-risk-medium',
  'risk-high':          'bg-red-50 text-risk-high',
  'risk-critical':      'bg-red-100 text-risk-critical font-semibold',
  vip:                  'bg-blue-50 text-accent',
  'sentiment-positive': 'bg-emerald-50 text-risk-low',
  'sentiment-neutral':  'bg-slate-100 text-ink-muted',
  'sentiment-negative': 'bg-red-50 text-risk-high',
  'sentiment-mixed':    'bg-amber-50 text-risk-medium',
  stage:                'bg-blue-50 text-accent',
  'urgency-low':        'bg-slate-100 text-ink-muted',
  'urgency-medium':     'bg-amber-50 text-risk-medium',
  'urgency-high':       'bg-orange-50 text-orange-700',
  'urgency-critical':   'bg-red-100 text-risk-critical font-semibold',
  outline:              'bg-transparent text-ink-secondary border border-edge',
}

const dotColors: Record<string, string> = {
  'risk-low':           'bg-risk-low',
  'risk-medium':        'bg-risk-medium',
  'risk-high':          'bg-risk-high',
  'risk-critical':      'bg-risk-critical',
  'sentiment-positive': 'bg-risk-low',
  'sentiment-neutral':  'bg-ink-faint',
  'sentiment-negative': 'bg-risk-high',
  'sentiment-mixed':    'bg-risk-medium',
  'urgency-critical':   'bg-risk-critical',
  'urgency-high':       'bg-orange-700',
  default:              'bg-ink-faint',
}

export function Badge({ children, variant = 'default', size = 'sm', dot, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'tag-pill font-medium',
        size === 'sm' ? 'text-[11px]' : 'text-xs',
        variantStyles[variant],
        dot && 'tag-dot',
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-[6px] h-[6px] rounded-full flex-shrink-0',
            dotColors[variant] ?? dotColors.default
          )}
        />
      )}
      {children}
    </span>
  )
}

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const labels: Record<RiskLevel, string> = {
    low:      'Низкий',
    medium:   'Средний',
    high:     'Высокий',
    critical: 'Критический',
  }
  return (
    <Badge variant={`risk-${level}` as BadgeProps['variant']} dot>
      {labels[level]}{score !== undefined ? ` ${score}%` : ''}
    </Badge>
  )
}

export function SentimentBadge({ sentiment }: { sentiment: SentimentLevel }) {
  const labels: Record<SentimentLevel, string> = {
    positive: 'Позитивный',
    neutral:  'Нейтральный',
    negative: 'Негативный',
    mixed:    'Смешанный',
  }
  return (
    <Badge variant={`sentiment-${sentiment}` as BadgeProps['variant']} dot>
      {labels[sentiment]}
    </Badge>
  )
}

export function VipBadge() {
  return <Badge variant="vip">VIP</Badge>
}
