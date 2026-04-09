import { clsx } from 'clsx'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('rounded-md bg-edge animate-skeleton-pulse', className)} />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-surface-card rounded-xl border border-edge p-5 space-y-3">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-3">
          <Skeleton className="h-3.5 w-1/4" />
          <Skeleton className="h-3.5 w-1/6" />
          <Skeleton className="h-3.5 w-1/8" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="bg-surface-card rounded-xl border border-edge p-5">
        <Skeleton className="h-4 w-40 mb-4" />
        <SkeletonTable rows={4} />
      </div>
    </div>
  )
}
