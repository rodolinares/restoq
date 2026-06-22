import { predictProduct } from '@/lib/prediction'
import type { Product, StockSnapshot, Purchase } from '@/types/inventory'

export interface AlertItem {
  name: string
  daysUntilEmpty: number
  currentStock: number
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

  const title = `Restoq — ${parts.join(', ')}`

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

export function computeAlerts(
  products: Product[],
  snapshots: StockSnapshot[],
  purchases: Purchase[]
): AlertItem[] {
  const alerts: AlertItem[] = []

  for (const product of products) {
    const productSnapshots = snapshots.filter(s => s.productId === product.id)
    const productPurchases = purchases.filter(p => p.productId === product.id)
    const pred = predictProduct(product, productSnapshots, productPurchases)

    if (pred.isAlert && pred.daysUntilEmpty !== null) {
      alerts.push({
        name: product.name,
        daysUntilEmpty: pred.daysUntilEmpty,
        currentStock: pred.currentStock,
        isOverdue: pred.isOverdue
      })
    }
  }

  return alerts
}
