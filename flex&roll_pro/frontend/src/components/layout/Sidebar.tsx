import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { LayoutDashboard, AlertTriangle, Search, Sparkles, BarChart3, Zap } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Сегодня', icon: LayoutDashboard, exact: true },
  { to: '/risks', label: 'Риски', icon: AlertTriangle },
  { to: '/search', label: 'Поиск', icon: Search },
  { to: '/leads', label: 'Лиды', icon: Sparkles },
  { to: '/analytics', label: 'Аналитика', icon: BarChart3 },
]

export function Sidebar() {
  return (
    <aside className="w-52 flex-shrink-0 bg-sidebar-bg flex flex-col h-full border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-4 py-[18px] border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
            <Zap size={11} className="text-white" />
          </div>
          <div>
            <p className="font-display font-semibold text-sidebar-text-active text-[13px] leading-tight tracking-tight">
              Flex&Roll
            </p>
            <p className="text-[10px] text-sidebar-text leading-tight mt-0.5">AI Workspace</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-px">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] font-medium transition-all duration-150 relative',
                isActive
                  ? 'bg-sidebar-active text-sidebar-text-active'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-sidebar-accent rounded-r-full" />
                )}
                <item.icon
                  size={14}
                  className={clsx(
                    'flex-shrink-0',
                    isActive ? 'text-sidebar-text-active' : 'text-sidebar-text'
                  )}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-brand-800 flex items-center justify-center text-[10px] font-bold text-brand-200 flex-shrink-0">
            ДС
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-sidebar-text-active truncate leading-tight">
              Дмитрий Соколов
            </p>
            <p className="text-[10px] text-sidebar-text mt-0.5">Менеджер</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
          <span className="text-[10px] text-sidebar-text">Mock режим</span>
        </div>
      </div>
    </aside>
  )
}
