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
    <div className={clsx('flex flex-col items-center justify-center py-14 px-6 text-center', className)}>
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-accent mb-4 [&>svg]:w-5 [&>svg]:h-5">
          {icon}
        </div>
      )}
      <p className="font-display text-ink text-sm mb-1">{title}</p>
      {description && <p className="text-[12px] text-ink-muted max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-risk-high/50 mb-4">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5h.01" />
        </svg>
      </div>
      <p className="font-display text-ink text-sm mb-1">Не удалось загрузить данные</p>
      <p className="text-[12px] text-ink-muted mb-5">{message ?? 'Проверьте соединение и попробуйте снова'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary text-[12px] px-5 py-2.5"
        >
          Повторить
        </button>
      )}
    </div>
  )
}
