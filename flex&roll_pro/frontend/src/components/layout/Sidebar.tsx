import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'

import calendarIcon from '@/assets/symbols/calendar.day.timeline.left.svg'
import flagIcon from '@/assets/symbols/flag.svg'
import searchIcon from '@/assets/symbols/magnifyingglass.svg'
import personIcon from '@/assets/symbols/person.crop.rectangle.stack.svg'
import chartIcon from '@/assets/symbols/chart.bar.svg'

const navItems = [
  { to: '/', label: 'Сегодня', icon: calendarIcon, exact: true },
  { to: '/risks', label: 'Риски', icon: flagIcon },
  { to: '/search', label: 'Поиск', icon: searchIcon },
  { to: '/leads', label: 'Лиды', icon: personIcon },
  { to: '/analytics', label: 'Аналитика', icon: chartIcon },
]

export function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 bg-sidebar-bg flex flex-col h-full border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <p className="font-display text-sidebar-text-active text-[13px] leading-tight tracking-tight">
              Flex&Roll
            </p>
            <p className="text-[10px] text-sidebar-text leading-tight mt-0.5">AI Workspace</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-sidebar-active text-accent'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
              )
            }
          >
            <img src={item.icon} alt="" className="w-[18px] h-[18px]" style={{ filter: 'invert(1) brightness(0.4)' }} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-[11px] font-bold text-accent flex-shrink-0">
            ДС
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-sidebar-text-active truncate leading-tight">
              Дмитрий Соколов
            </p>
            <p className="text-[10px] text-sidebar-text mt-0.5">Менеджер</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
