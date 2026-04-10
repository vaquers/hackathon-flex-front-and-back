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
        className="absolute inset-0 bg-[rgba(18,24,38,0.14)] backdrop-blur-[6px]"
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative h-full flex flex-col border-l border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.985)_0%,rgba(248,251,255,0.96)_100%)] shadow-[0_30px_64px_rgba(109,130,174,0.26)]',
          widthStyles[width],
          'animate-slide-in-right',
          '!rounded-l-[34px] !rounded-r-none'
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(182,193,216,0.42)] flex-shrink-0">
            <h2 className="font-display text-ink text-[15px] tracking-[-0.05em]">{title}</h2>
            <button
              onClick={onClose}
              className="text-ink-muted hover:text-ink p-2 rounded-full border border-white/80 bg-white/80 shadow-panel-soft hover:bg-white transition-colors"
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
