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
    <div className={clsx('flex gap-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'px-3.5 py-2 text-[12px] font-medium rounded-xl transition-colors duration-150 flex items-center gap-1.5',
            activeTab === tab.id
              ? 'bg-blue-50 text-accent'
              : 'text-ink-muted hover:text-ink-secondary hover:bg-surface-hover'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={clsx(
                'text-[10px] rounded-full px-1.5 py-0.5 font-medium min-w-[18px] text-center',
                activeTab === tab.id
                  ? 'bg-accent/10 text-accent'
                  : 'bg-slate-100 text-ink-muted'
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
