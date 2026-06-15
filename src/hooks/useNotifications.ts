import { useEffect, useRef } from 'react'
import {
  isNotificationSupported,
  isNotificationDenied,
  requestNotificationPermission,
  sendAlertNotification,
  computeAlerts
} from '@/lib/notifications'
import type { PurchaseRecord, Depletion } from '@/types/inventory'

const STORAGE_KEY = 'restoq-notified-alerts'

export function useNotifications(purchases: PurchaseRecord[], depletions: Depletion[] = []) {
  const notifiedKeyRef = useRef(localStorage.getItem(STORAGE_KEY) ?? '')

  useEffect(() => {
    if (!isNotificationSupported()) return
    if (isNotificationDenied()) return

    const alerts = computeAlerts(purchases, depletions)
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
  }, [purchases, depletions])
}
