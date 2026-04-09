import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, hover, onClick, padding = 'md' }: CardProps) {
  const paddingStyles = {
    none: '',
    sm:   'p-3',
    md:   'p-5',
    lg:   'p-6',
  }
  return (
    <div
      className={clsx(
        'bg-surface-card rounded-xl border border-edge shadow-card',
        paddingStyles[padding],
        hover && 'hover:border-ink-faint transition-colors duration-150 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={clsx('font-display font-semibold text-ink text-sm', className)}>
      {children}
    </h3>
  )
}

export function StatCard({
  label,
  value,
  subvalue,
  icon,
  trend,
  color = 'default',
  onClick,
}: {
  label: string
  value: string | number
  subvalue?: string
  icon?: React.ReactNode
  trend?: { value: number; positive: boolean }
  color?: 'default' | 'red' | 'amber' | 'emerald' | 'violet' | 'sky'
  onClick?: () => void
}) {
  const iconBg: Record<string, string> = {
    default: 'bg-surface-hover text-ink-muted',
    red:     'bg-[#fdf1f4] text-risk-high',
    amber:   'bg-[#fdf7ed] text-risk-medium',
    emerald: 'bg-[#f0f9f4] text-risk-low',
    violet:  'bg-[#f2edfd] text-[#4a34a8]',
    sky:     'bg-accent-faint text-accent',
  }

  return (
    <div
      className={clsx(
        'bg-surface-card rounded-xl border border-edge shadow-card p-4',
        onClick && 'hover:border-ink-faint transition-colors duration-150 cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-ink-muted font-medium mb-1.5 truncate">{label}</p>
          <p className="text-[22px] font-display font-bold text-ink leading-none">{value}</p>
          {subvalue && <p className="text-xs text-ink-muted mt-1.5">{subvalue}</p>}
          {trend && (
            <p className={clsx('text-xs mt-1.5 font-medium', trend.positive ? 'text-risk-low' : 'text-risk-high')}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4', iconBg[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
