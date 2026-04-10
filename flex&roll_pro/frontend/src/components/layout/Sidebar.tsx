import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { Sparkles } from 'lucide-react'

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
    <aside className="relative z-10 flex-shrink-0 px-4 py-4" style={{ width: 300 }}>
      <div
        className="flex h-full flex-col rounded-[38px] border border-white/70 p-4 backdrop-blur-xl"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(249,252,255,0.92) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.96), inset 0 -10px 22px rgba(181,196,226,0.18), 0 18px 40px rgba(129,149,193,0.18)',
        }}
      >
        <div className="mb-5 rounded-[30px] border border-white/80 bg-white/80 px-4 py-4 shadow-panel-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--blue-2),var(--blue))] text-white shadow-btn">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-[17px] leading-none text-ink">Flex&Roll</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                AI cockpit для лидов, клиентской базы и Bitrix-инструментов.
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-2.5" aria-label="Главная навигация">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center justify-between rounded-full border px-4 py-3 transition-all duration-150',
                  isActive
                    ? 'border-transparent bg-[linear-gradient(135deg,var(--blue-2),var(--blue))] text-white shadow-btn'
                    : 'border-transparent bg-transparent text-ink-muted hover:border-white/70 hover:bg-white/70 hover:text-ink hover:shadow-panel-soft'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={clsx(
                        'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                        isActive ? 'bg-white/18' : 'bg-surface-inner'
                      )}
                    >
                      <img
                        src={item.icon}
                        alt=""
                        className="h-[18px] w-[18px]"
                        style={{
                          filter: isActive
                            ? 'brightness(0) saturate(100%) invert(100%)'
                            : 'brightness(0) saturate(100%) invert(9%) sepia(17%) saturate(1219%) hue-rotate(184deg) brightness(95%) contrast(89%)',
                        }}
                      />
                    </span>
                    <span className="truncate text-[15px] leading-none tracking-tight">{item.label}</span>
                  </span>

                  {item.count !== undefined && (
                    <span
                      className={clsx(
                        'min-w-[32px] rounded-full px-2.5 py-1 text-center text-[11px] font-medium',
                        isActive ? 'bg-white/16 text-white' : 'bg-white/85 text-ink-muted shadow-panel-soft'
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-[30px] bg-[linear-gradient(135deg,rgba(47,106,245,0.98),rgba(0,86,245,0.92))] p-4 text-white shadow-btn">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/72">
            Client cockpit
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Держи под рукой лиды, текущих клиентов и AI-надстройки для Bitrix.
          </p>
          <div className="mt-4 rounded-full bg-white/16 px-3 py-2 text-[11px] font-medium">
            Основной рабочий поток: раздел «Лиды»
          </div>
        </div>
      </div>
    </aside>
  )
}
