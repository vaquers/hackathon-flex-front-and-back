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
        className="absolute inset-0 bg-brand-900/20"
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative bg-surface-card shadow-panel h-full flex flex-col border-l border-edge',
          widthStyles[width],
          'animate-slide-in-right'
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-edge flex-shrink-0">
            <h2 className="font-display font-semibold text-ink text-sm">{title}</h2>
            <button
              onClick={onClose}
              className="text-ink-muted hover:text-ink p-1 rounded-md hover:bg-surface-hover transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
