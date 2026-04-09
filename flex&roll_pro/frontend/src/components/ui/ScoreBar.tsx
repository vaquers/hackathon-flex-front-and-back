import { clsx } from 'clsx'

interface ScoreBarProps {
  score: number
  label?: string
  showValue?: boolean
  className?: string
}

function getScoreColor(score: number) {
  if (score >= 80) return 'bg-risk-low'
  if (score >= 60) return 'bg-risk-medium'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-risk-high'
}

export function ScoreBar({ score, label, showValue = true, className }: ScoreBarProps) {
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      {label && <span className="text-[11px] text-ink-secondary min-w-0 flex-1 truncate">{label}</span>}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="progress-bar w-24">
          <span
            className={getScoreColor(score)}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
        {showValue && (
          <span className="text-[11px] font-semibold text-ink tabular-nums w-7 text-right">{score}</span>
        )}
      </div>
    </div>
  )
}

export function ScoreCircle({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeStyles = { sm: 'w-8 h-8 text-[11px]', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' }
  const colors = score >= 80 ? 'bg-emerald-50 text-risk-low border-emerald-200'
    : score >= 60 ? 'bg-amber-50 text-risk-medium border-amber-200'
    : score >= 40 ? 'bg-orange-50 text-orange-700 border-orange-200'
    : 'bg-red-50 text-risk-high border-red-200'

  return (
    <div className={clsx('rounded-full border-2 flex items-center justify-center font-display', sizeStyles[size], colors)}>
      {score}
    </div>
  )
}
