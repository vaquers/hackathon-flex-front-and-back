import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div
          className="min-h-full p-5"
          style={{
            background: 'linear-gradient(180deg, rgba(194,205,232,0.82) 0%, rgba(186,199,228,0.76) 100%)',
            borderRadius: '47px 0 0 47px',
            boxShadow: 'inset 0 1px 0 rgba(247,250,255,0.45), 0 18px 36px rgba(124,145,187,0.12)',
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}
