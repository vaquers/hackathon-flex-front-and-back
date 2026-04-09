import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="flex h-screen bg-surface-bg overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
