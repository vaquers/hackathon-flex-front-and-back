import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'

import calendarIcon from '@/assets/symbols/calendar.day.timeline.left.svg'
import flagIcon from '@/assets/symbols/flag.svg'
import searchIcon from '@/assets/symbols/magnifyingglass.svg'
import personIcon from '@/assets/symbols/person.crop.rectangle.stack.svg'
import chartIcon from '@/assets/symbols/chart.bar.svg'

const navItems = [
  { to: '/', label: 'Сегодня', icon: calendarIcon, exact: true, count: 3 },
  { to: '/risks', label: 'Риски', icon: flagIcon, count: 7 },
  { to: '/search', label: 'Поиск', icon: searchIcon },
  { to: '/leads', label: 'Лиды', icon: personIcon, count: 67 },
  { to: '/analytics', label: 'Аналитика', icon: chartIcon },
]

export function Sidebar() {
  return (
    <aside className="py-5 flex-shrink-0" style={{ width: 260 }}>
      <nav className="flex flex-col h-full mx-4 px-5 py-6 glass-panel">
        {/* Brand */}
        <div className="mb-6 px-1">
          <p className="font-display text-[15px] text-ink tracking-display leading-none">Flex&Roll</p>
          <p className="text-[10px] text-ink-muted mt-1 tracking-tight">AI Assistant</p>
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between py-2.5 px-3 rounded-xl transition-all duration-150',
                  isActive
                    ? 'text-accent bg-blue-50'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-hover'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-2.5">
                    <img
                      src={item.icon}
                      alt=""
                      className="w-[18px] h-[18px]"
                      style={{
                        filter: isActive
                          ? 'brightness(0) saturate(100%) invert(19%) sepia(99%) saturate(5562%) hue-rotate(220deg) brightness(97%) contrast(106%)'
                          : 'brightness(0) saturate(100%) invert(9%) sepia(17%) saturate(1219%) hue-rotate(184deg) brightness(95%) contrast(89%)',
                      }}
                    />
                    <span className="text-[15px] leading-none tracking-display">{item.label}</span>
                  </span>
                  {item.count !== undefined && (
                    <span className={clsx(
                      'text-[12px] leading-none tracking-tight font-medium min-w-[22px] text-center rounded-full px-1.5 py-0.5',
                      isActive ? 'bg-accent/10 text-accent' : 'text-ink-muted'
                    )}>
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  )
}
