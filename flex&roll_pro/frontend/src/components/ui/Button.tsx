import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

const variantStyles = {
  primary:   'bg-accent text-white hover:bg-accent-hover active:bg-blue-800 shadow-sm',
  secondary: 'bg-surface-active text-ink hover:bg-edge',
  ghost:     'text-ink-secondary hover:bg-surface-hover hover:text-ink',
  danger:    'bg-red-50 text-risk-high hover:bg-red-100',
  outline:   'border border-edge text-ink-secondary hover:bg-surface-hover bg-surface-card',
}

const sizeStyles = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-sm px-5 py-2.5 gap-2',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
