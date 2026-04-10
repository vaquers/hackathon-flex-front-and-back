import { useEffect } from 'react'
import { clsx } from 'clsx'
import { X } from 'lucide-react'

interface SidePanelProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  width?: 'sm' | 'md' | 'lg'
}

const widthStyles = {
  sm: 'w-80',
  md: 'w-[480px]',
  lg: 'w-[640px]',
}

export function SidePanel({ open, onClose, title, children, width = 'md' }: SidePanelProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
      window.addEventListener('keydown', handleKey)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKey)
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-[rgba(21,33,58,0.18)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative my-3 mr-3 h-[calc(100%-24px)] overflow-hidden border border-white/70 bg-white/88 shadow-[0_26px_60px_rgba(76,97,139,0.22)] backdrop-blur-xl',
          'flex flex-col rounded-[34px]',
          widthStyles[width],
          'animate-slide-in-right',
        )}
      >
        {title && (
          <div className="flex flex-shrink-0 items-center justify-between border-b border-white/70 bg-white/66 px-6 py-5 backdrop-blur-xl">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-muted">AI panel</p>
              <h2 className="mt-1 font-display text-sm text-ink">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white/76 p-2 text-ink-muted shadow-panel-soft transition-colors hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
