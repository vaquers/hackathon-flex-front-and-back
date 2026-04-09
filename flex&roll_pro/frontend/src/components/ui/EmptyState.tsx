import { clsx } from 'clsx'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && (
        <div className="text-ink-faint mb-4 [&>svg]:w-10 [&>svg]:h-10">
          {icon}
        </div>
      )}
      <p className="font-display text-ink-secondary text-sm mb-1">{title}</p>
      {description && <p className="text-xs text-ink-muted max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="text-risk-high/30 mb-3">
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5h.01" />
        </svg>
      </div>
      <p className="font-medium text-ink text-sm mb-1">Не удалось загрузить данные</p>
      <p className="text-xs text-ink-muted mb-5">{message ?? 'Проверьте соединение и попробуйте снова'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-accent hover:text-accent-hover font-medium px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          Повторить
        </button>
      )}
    </div>
  )
}
