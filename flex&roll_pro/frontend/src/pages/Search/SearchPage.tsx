import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Sparkles, FileText, Package, File, BookOpen, Presentation, Clock, ExternalLink } from 'lucide-react'
import { searchService } from '@/services/searchService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/utils/format'
import type { SearchResult } from '@/types'

const DOC_TYPE_ICONS: Record<SearchResult['type'], React.ReactNode> = {
  calculation: <FileText size={14} />,
  tech_doc:    <BookOpen size={14} />,
  past_order:  <Package size={14} />,
  template:    <File size={14} />,
  proposal:    <Presentation size={14} />,
}

const DOC_TYPE_FILTERS = [
  { id: 'all',         label: 'Все типы' },
  { id: 'calculation', label: 'Расчёты' },
  { id: 'tech_doc',    label: 'Техдокументы' },
  { id: 'past_order',  label: 'Прошлые заказы' },
  { id: 'template',    label: 'Шаблоны' },
  { id: 'proposal',    label: 'КП' },
]

export function SearchPage() {
  const [query, setQuery]         = useState('')
  const [committed, setCommitted] = useState('')
  const [activeType, setActiveType] = useState('all')
  const inputRef = useRef<HTMLInputElement>(null)

  const searchQ = useQuery({
    queryKey: ['search', committed, activeType],
    queryFn: () => searchService.search(committed, activeType !== 'all' ? { types: [activeType as SearchResult['type']] } : undefined),
    enabled: committed.length >= 2,
  })

  const popularQ = useQuery({
    queryKey: ['popular-docs'],
    queryFn: () => searchService.getPopularDocs(),
  })

  const handleSearch = () => {
    if (query.trim().length >= 2) setCommitted(query.trim())
  }

  const results         = searchQ.data?.results ?? []
  const filteredResults = activeType === 'all' ? results : results.filter((r) => r.type === activeType)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display text-ink text-xl leading-tight">AI Поиск</h1>
        <p className="text-sm text-ink-muted mt-1">Поиск по расчётам, КП, техдокументам и прошлым заказам</p>
      </div>

      {/* Search Box */}
      <div className="bg-surface-card rounded-2xl shadow-card p-5 mb-5">
        <div className="flex gap-3 items-center">
          <div className="flex-1 flex items-center gap-2.5 bg-surface-inner border border-edge rounded-xl px-4 py-3">
            <Search size={15} className="text-ink-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink-muted text-sm"
              placeholder="Найти расчёт, КП, техданные, прошлый заказ, шаблон..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            loading={searchQ.isFetching}
            onClick={handleSearch}
            disabled={query.trim().length < 2}
            icon={<Sparkles size={13} />}
          >
            AI Поиск
          </Button>
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          {DOC_TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveType(f.id)}
              className={clsx(
                'text-xs px-3 py-1.5 rounded-xl transition-colors',
                activeType === f.id
                  ? 'bg-blue-50 text-accent font-medium'
                  : 'border border-edge text-ink-secondary bg-surface-card hover:bg-surface-hover'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {committed && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            {searchQ.isFetching ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              <>
                <p className="text-sm text-ink-secondary">
                  Найдено <span className="font-semibold text-ink">{filteredResults.length}</span> результатов
                  {searchQ.data?.processingTime && (
                    <span className="text-ink-muted"> · {searchQ.data.processingTime}мс</span>
                  )}
                </p>
                <div className="flex items-center gap-1 text-xs text-ink-muted">
                  <Sparkles size={10} className="text-accent" />
                  RAG обработка
                </div>
              </>
            )}
          </div>

          {searchQ.isFetching && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-card rounded-2xl p-5 space-y-2 shadow-card">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {!searchQ.isFetching && filteredResults.map((result) => (
              <SearchResultCard key={result.id} result={result} />
            ))}
          </div>
        </div>
      )}

      {/* No search yet */}
      {!committed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-surface-card rounded-2xl shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={13} className="text-ink-muted" />
              <h2 className="font-display text-ink text-sm">Часто используемые</h2>
            </div>
            {popularQ.isLoading && <Skeleton className="h-24 w-full" />}
            {popularQ.data && (
              <div className="space-y-1.5">
                {popularQ.data.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-surface-hover cursor-pointer transition-colors">
                    <span className="text-ink-muted">{DOC_TYPE_ICONS[doc.type as SearchResult['type']]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink truncate">{doc.name}</p>
                      <p className="text-xs text-ink-muted">{formatDate(doc.date)}</p>
                    </div>
                    <ExternalLink size={11} className="text-ink-faint" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface-card rounded-2xl shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={13} className="text-accent" />
              <h2 className="font-display text-ink text-sm">Примеры запросов</h2>
            </div>
            <div className="space-y-1">
              {[
                'Расчёт гофроящика B2 для ТехноПак',
                'Прошлый заказ мешков 25кг',
                'Шаблон КП для производства',
                'Влагостойкий картон ГОСТ',
                'Флексопечать крафт пакеты',
              ].map((hint) => (
                <button
                  key={hint}
                  className="w-full text-left text-sm text-accent hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors"
                  onClick={() => { setQuery(hint); setCommitted(hint) }}
                >
                  <Search size={10} className="inline mr-2 text-ink-muted" />
                  {hint}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const typeIconBg: Record<SearchResult['type'], string> = {
    calculation: 'bg-blue-50 text-accent',
    tech_doc:    'bg-violet-50 text-violet-600',
    past_order:  'bg-emerald-50 text-risk-low',
    template:    'bg-amber-50 text-risk-medium',
    proposal:    'bg-slate-100 text-ink-secondary',
  }

  return (
    <div className="bg-surface-card rounded-2xl shadow-card p-5 hover:shadow-card-hover transition-shadow cursor-pointer">
      <div className="flex items-start gap-3">
        <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', typeIconBg[result.type])}>
          {DOC_TYPE_ICONS[result.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-medium text-ink text-sm">{result.name}</span>
            <Badge variant="stage">{result.typeLabel}</Badge>
            <span className="text-xs text-ink-muted ml-auto">{formatDate(result.date)}</span>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 mb-3">
            <div className="flex items-center gap-1 mb-1">
              <Sparkles size={10} className="text-accent" />
              <span className="text-xs font-semibold text-accent">AI Summary</span>
              <span className="ml-auto text-xs text-ink-muted">{result.relevanceScore}% релевантность</span>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">{result.aiAnswer}</p>
          </div>

          <p className="text-xs text-ink-muted italic leading-relaxed border-l-2 border-edge pl-3">
            {result.relevantFragment}
          </p>

          <div className="flex items-center gap-3 mt-3">
            {result.clientName && (
              <span className="text-xs text-ink-muted">Клиент: {result.clientName}</span>
            )}
            {result.tags.map((tag) => (
              <Badge key={tag} variant="outline">#{tag}</Badge>
            ))}
            <Button size="sm" variant="ghost" className="ml-auto" icon={<ExternalLink size={12} />}>
              Открыть
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
