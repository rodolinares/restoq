import { useEffect, useRef } from 'react'
import {
  isNotificationSupported,
  isNotificationDenied,
  requestNotificationPermission,
  sendAlertNotification,
  computeAlerts
} from '@/lib/notifications'
import type { Product, StockSnapshot, Purchase } from '@/types/inventory'

const STORAGE_KEY = 'restoq-notified-alerts'

export function useNotifications(products: Product[], snapshots: StockSnapshot[], purchases: Purchase[]) {
  const notifiedKeyRef = useRef(localStorage.getItem(STORAGE_KEY) ?? '')

  useEffect(() => {
    if (!isNotificationSupported()) return
    if (isNotificationDenied()) return

    const alerts = computeAlerts(products, snapshots, purchases)
    const key = alerts
      .map(a => `${a.name}:${a.daysUntilEmpty}`)
      .sort()
      .join('|')

    if (key === '' || key === notifiedKeyRef.current) return

    notifiedKeyRef.current = key

    requestNotificationPermission().then(granted => {
      if (!granted) return
      localStorage.setItem(STORAGE_KEY, key)
      sendAlertNotification(alerts)
    })
  }, [products, snapshots, purchases])
}
