import { clsx } from 'clsx'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={clsx('flex gap-0', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 -mb-px flex items-center gap-1.5',
            activeTab === tab.id
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-muted hover:text-ink-secondary hover:border-edge'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={clsx(
                'text-xs rounded-full px-1.5 py-0.5 font-medium',
                activeTab === tab.id
                  ? 'bg-accent-faint text-accent-text'
                  : 'bg-surface-hover text-ink-muted'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
