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
    <aside className="py-5 pl-0 pr-0 flex-shrink-0" style={{ width: 260 }}>
      <nav
        className="flex flex-col gap-2 h-full mx-4 px-6 py-7 rounded-3xl"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.985) 0%, rgba(252,253,255,0.96) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.96), inset 0 -10px 22px rgba(181,196,226,0.18), 0 18px 40px rgba(129,149,193,0.18)',
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              clsx(
                'flex items-center justify-between py-2 transition-colors duration-150',
                isActive
                  ? 'text-accent'
                  : 'text-ink-muted hover:text-ink'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex items-center gap-2.5">
                  <img
                    src={item.icon}
                    alt=""
                    className="w-5 h-5"
                    style={{
                      filter: isActive
                        ? 'brightness(0) saturate(100%) invert(19%) sepia(99%) saturate(5562%) hue-rotate(220deg) brightness(97%) contrast(106%)'
                        : 'brightness(0) saturate(100%) invert(9%) sepia(17%) saturate(1219%) hue-rotate(184deg) brightness(95%) contrast(89%)',
                    }}
                  />
                  <span className="text-[18px] leading-none tracking-display">{item.label}</span>
                </span>
                {item.count !== undefined && (
                  <span className="text-[15px] leading-none tracking-tight opacity-90">{item.count}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
