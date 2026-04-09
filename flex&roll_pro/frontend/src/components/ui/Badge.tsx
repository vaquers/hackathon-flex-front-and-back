import { clsx } from 'clsx'
import type { RiskLevel, SentimentLevel } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'risk-low' | 'risk-medium' | 'risk-high' | 'risk-critical' | 'vip' | 'sentiment-positive' | 'sentiment-neutral' | 'sentiment-negative' | 'sentiment-mixed' | 'stage' | 'urgency-low' | 'urgency-medium' | 'urgency-high' | 'urgency-critical' | 'outline'
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

// Desaturated, refined semantic colors
const variantStyles: Record<string, string> = {
  default:              'bg-surface-hover text-ink-secondary border border-edge',
  'risk-low':           'bg-[#f0f9f4] text-risk-low border border-[#c0e4d2]',
  'risk-medium':        'bg-[#fdf7ed] text-risk-medium border border-[#f0d39e]',
  'risk-high':          'bg-[#fdf1f4] text-risk-high border border-[#f0bcc8]',
  'risk-critical':      'bg-[#f9e8ed] text-risk-critical border border-[#e8a2b5] font-semibold',
  vip:                  'bg-[#f2edfd] text-[#4a34a8] border border-[#d0c4f4]',
  'sentiment-positive': 'bg-[#f0f9f4] text-risk-low border border-[#c0e4d2]',
  'sentiment-neutral':  'bg-surface-hover text-ink-muted border border-edge',
  'sentiment-negative': 'bg-[#fdf1f4] text-risk-high border border-[#f0bcc8]',
  'sentiment-mixed':    'bg-[#fdf7ed] text-risk-medium border border-[#f0d39e]',
  stage:                'bg-accent-faint text-accent-text border border-accent-subtle',
  'urgency-low':        'bg-surface-hover text-ink-muted border border-edge',
  'urgency-medium':     'bg-[#fdf7ed] text-risk-medium border border-[#f0d39e]',
  'urgency-high':       'bg-[#fff6ed] text-[#9a4e0a] border border-[#f5d3aa]',
  'urgency-critical':   'bg-[#f9e8ed] text-risk-critical border border-[#e8a2b5] font-semibold',
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
  'urgency-high':       'bg-[#9a4e0a]',
  default:              'bg-ink-faint',
}

export function Badge({ children, variant = 'default', size = 'sm', dot, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            dotColors[variant] ?? dotColors.default
          )}
        />
      )}
      {children}
    </span>
  )
}

// ─── Convenience helpers ─────────────────────────────────────────────────────

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
