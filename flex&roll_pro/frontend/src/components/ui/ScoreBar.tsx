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
  if (score >= 40) return 'bg-[#9a4e0a]'
  return 'bg-risk-high'
}

export function ScoreBar({ score, label, showValue = true, className }: ScoreBarProps) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {label && <span className="text-xs text-ink-secondary min-w-0 flex-1 truncate">{label}</span>}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="w-24 h-1 bg-edge rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-500', getScoreColor(score))}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
        {showValue && (
          <span className="text-xs font-semibold text-ink tabular-nums w-7 text-right">{score}</span>
        )}
      </div>
    </div>
  )
}

export function ScoreCircle({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeStyles = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' }
  const colors = score >= 80 ? 'bg-[#f0f9f4] text-risk-low border-[#c0e4d2]'
    : score >= 60 ? 'bg-[#fdf7ed] text-risk-medium border-[#f0d39e]'
    : score >= 40 ? 'bg-[#fff6ed] text-[#9a4e0a] border-[#f5d3aa]'
    : 'bg-[#fdf1f4] text-risk-high border-[#f0bcc8]'

  return (
    <div className={clsx('rounded-full border-2 flex items-center justify-center font-display font-bold', sizeStyles[size], colors)}>
      {score}
    </div>
  )
}
