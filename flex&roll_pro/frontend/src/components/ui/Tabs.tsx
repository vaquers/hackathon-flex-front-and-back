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
    <div className={clsx('inline-flex gap-1.5 rounded-full border border-white/70 bg-white/78 p-1.5 shadow-panel-soft backdrop-blur-xl', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[12px] font-medium transition-all duration-150',
            activeTab === tab.id
              ? 'bg-[linear-gradient(135deg,var(--blue-2),var(--blue))] text-white shadow-btn'
              : 'text-ink-muted hover:bg-white/80 hover:text-ink-secondary'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={clsx(
                'text-[10px] rounded-full px-1.5 py-0.5 font-medium min-w-[18px] text-center',
                activeTab === tab.id
                  ? 'bg-white/18 text-white'
                  : 'bg-white text-ink-muted shadow-panel-soft'
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
