import type { UrgencyLevel } from '@/types'

export function formatRub(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} млн ₽`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)} тыс ₽`
  }
  return `${amount.toLocaleString('ru-RU')} ₽`
}

export function formatDaysAgo(days: number): string {
  if (days === 0) return 'Сегодня'
  if (days === 1) return '1 день назад'
  if (days < 5) return `${days} дня назад`
  if (days < 21) return `${days} дней назад`
  return `${days} дн. назад`
}

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function urgencyLabel(urgency: UrgencyLevel): string {
  const labels: Record<UrgencyLevel, string> = {
    low: 'Низкая',
    medium: 'Средняя',
    high: 'Высокая',
    critical: 'Критическая',
  }
  return labels[urgency]
}

export function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value))
}
