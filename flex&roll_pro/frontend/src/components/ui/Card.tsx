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
    sm:   'p-4',
    md:   'p-5',
    lg:   'p-6',
  }
  return (
    <div
      className={clsx(
        'bg-surface-card rounded-2xl shadow-card',
        paddingStyles[padding],
        hover && 'hover:shadow-card-hover transition-shadow duration-200 cursor-pointer',
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
    <h3 className={clsx('font-display text-ink text-sm', className)}>
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
    default: 'bg-slate-100 text-ink-muted',
    red:     'bg-red-50 text-risk-high',
    amber:   'bg-amber-50 text-risk-medium',
    emerald: 'bg-emerald-50 text-risk-low',
    violet:  'bg-blue-50 text-accent',
    sky:     'bg-blue-50 text-accent',
  }

  return (
    <div
      className={clsx(
        'bg-surface-card rounded-2xl shadow-card p-5',
        onClick && 'hover:shadow-card-hover transition-shadow duration-200 cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-ink-muted font-medium mb-2 truncate">{label}</p>
          <p className="text-[28px] font-display text-ink leading-none">{value}</p>
          {subvalue && <p className="text-xs text-ink-muted mt-2">{subvalue}</p>}
          {trend && (
            <p className={clsx('text-xs mt-2 font-medium', trend.positive ? 'text-risk-low' : 'text-risk-high')}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 [&>svg]:w-5 [&>svg]:h-5', iconBg[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
