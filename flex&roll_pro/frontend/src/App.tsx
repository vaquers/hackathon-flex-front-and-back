import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppLayout } from '@/components/layout/AppLayout'
import { TodayPage } from '@/pages/Today/TodayPage'
import { RisksPage } from '@/pages/Risks/RisksPage'
import { SearchPage } from '@/pages/Search/SearchPage'
import { LeadsPage } from '@/pages/Leads/LeadsPage'
import { AnalyticsPage } from '@/pages/Analytics/AnalyticsPage'
import { ClientPage } from '@/pages/Client/ClientPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,      // 30s — data considered fresh
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<TodayPage />} />
            <Route path="risks" element={<RisksPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="clients/:id" element={<ClientPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
