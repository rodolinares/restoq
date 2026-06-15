import { predictConsumption } from '@/lib/prediction'

export interface AlertItem {
  name: string
  daysUntilEmpty: number
  estimatedCurrentStock: number
  isOverdue: boolean
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator
}

export function isNotificationGranted(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}

export function isNotificationDenied(): boolean {
  return 'Notification' in window && Notification.permission === 'denied'
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  const result = await Notification.requestPermission()
  return result === 'granted'
}

function formatAlertsForNotification(alerts: AlertItem[]): { title: string; body: string } | null {
  if (alerts.length === 0) return null

  const overdue = alerts.filter(a => a.isOverdue)
  const low = alerts.filter(a => !a.isOverdue)

  const parts: string[] = []
  if (overdue.length > 0) parts.push(`${overdue.length} overdue for restock`)
  if (low.length > 0) parts.push(`${low.length} running low`)

  const title = `RestoQ — ${parts.join(', ')}`

  const items = alerts.slice(0, 4)
  const body =
    items
      .map(a => {
        if (a.isOverdue) return `${a.name} — OVERDUE`
        return `${a.name} — ~${Math.round(a.daysUntilEmpty)} days`
      })
      .join('\n') + (alerts.length > 4 ? `\n+${alerts.length - 4} more` : '')

  return { title, body }
}

export async function sendAlertNotification(alerts: AlertItem[]): Promise<void> {
  if (!isNotificationGranted() || alerts.length === 0) return

  const formatted = formatAlertsForNotification(alerts)
  if (!formatted) return

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(formatted.title, {
      body: formatted.body,
      icon: '/restoq/restoq-icon.svg',
      badge: '/restoq/restoq-icon.svg',
      tag: 'restoq-stock-alert',
      data: { url: '/restoq/' }
    })
  } catch {
    if (isNotificationGranted()) {
      new Notification(formatted.title, {
        body: formatted.body,
        icon: '/restoq/restoq-icon.svg'
      })
    }
  }
}

export function computeAlerts(purchases: Array<{ name: string; units: number; purchaseDate: string }>): AlertItem[] {
  const map = new Map<string, Array<{ name: string; units: number; purchaseDate: string }>>()
  for (const p of purchases) {
    const list = map.get(p.name) ?? []
    list.push(p)
    map.set(p.name, list)
  }

  const alerts: AlertItem[] = []

  for (const [name, records] of map) {
    if (records.length <= 1) continue
    const pred = predictConsumption(records)
    if (pred && pred.daysUntilEmpty !== null && pred.daysUntilEmpty <= 7) {
      alerts.push({
        name,
        daysUntilEmpty: pred.daysUntilEmpty,
        estimatedCurrentStock: pred.estimatedCurrentStock,
        isOverdue: pred.daysUntilEmpty <= 0
      })
    }
  }

  return alerts
}
