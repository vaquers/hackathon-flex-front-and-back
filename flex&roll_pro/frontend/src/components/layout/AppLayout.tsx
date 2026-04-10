import { Link, Outlet, useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Sidebar } from './Sidebar'

const SECTION_META = [
  {
    match: (pathname: string) => pathname === '/',
    eyebrow: 'Control room',
    title: 'Сегодня',
    description: 'Сигналы, приоритеты и быстрый обзор клиентской базы.',
  },
  {
    match: (pathname: string) => pathname.startsWith('/risks'),
    eyebrow: 'Risk radar',
    title: 'Риски',
    description: 'Клиенты и сделки, которые требуют внимания прямо сейчас.',
  },
  {
    match: (pathname: string) => pathname.startsWith('/search'),
    eyebrow: 'Search desk',
    title: 'Поиск',
    description: 'Точечный поиск по клиентам, сделкам и коммуникациям.',
  },
  {
    match: (pathname: string) => pathname.startsWith('/leads'),
    eyebrow: 'Client cockpit',
    title: 'Лиды и клиенты',
    description: 'Новые возможности и рабочая база компаний в одном потоке.',
  },
  {
    match: (pathname: string) => pathname.startsWith('/clients/'),
    eyebrow: 'Client cockpit',
    title: 'Карточка клиента',
    description: 'AI-инструменты, коммуникации и контекст по конкретной компании.',
  },
  {
    match: (pathname: string) => pathname.startsWith('/analytics'),
    eyebrow: 'Insight board',
    title: 'Аналитика',
    description: 'Тренды, эффективность и сигнал по всей воронке.',
  },
]

export function AppLayout() {
  const location = useLocation()
  const section =
    SECTION_META.find((item) => item.match(location.pathname)) ?? SECTION_META[0]

  return (
    <div className="relative flex h-screen overflow-hidden font-sans">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-24 h-72 w-72 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute right-[-140px] top-10 h-[420px] w-[420px] rounded-full bg-blue-50/80 blur-3xl" />
        <div className="absolute bottom-[-180px] left-[24%] h-[360px] w-[360px] rounded-full bg-white/60 blur-3xl" />
      </div>
      <Sidebar />
      <main className="relative z-10 flex-1 overflow-hidden px-4 py-4 pl-0">
        <div className="flex h-full flex-col gap-4 rounded-[42px] border border-white/45 bg-white/10 p-3 shadow-panel backdrop-blur-[10px]">
          <div className="rounded-full border border-white/70 bg-white/78 px-5 py-4 shadow-panel-soft backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ink-muted">
                  {section.eyebrow}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <h1 className="font-display text-[18px] text-ink">{section.title}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                    <Sparkles size={10} />
                    AI
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-xs text-ink-muted">{section.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-edge bg-white/88 px-3 py-1.5 text-[11px] text-ink-muted shadow-panel-soft">
                  Bitrix-connected workspace
                </span>
                <Link
                  to="/leads"
                  className="inline-flex items-center rounded-full bg-white px-3.5 py-1.5 text-[11px] font-medium text-ink shadow-panel-soft transition-transform duration-150 hover:-translate-y-0.5"
                >
                  Открыть базу клиентов
                </Link>
              </div>
            </div>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto p-6"
            style={{
              background:
                'linear-gradient(180deg, rgba(194,205,232,0.76) 0%, rgba(186,199,228,0.72) 100%)',
              borderRadius: '38px',
              boxShadow:
                'inset 0 1px 0 rgba(247,250,255,0.45), 0 18px 36px rgba(124,145,187,0.12)',
            }}
          >
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
