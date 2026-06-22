import type { Product, StockSnapshot, Purchase, ProductPrediction } from '@/types/inventory'

const MS_PER_DAY = 86_400_000

const daysBetween = (a: string, b: string): number => {
  return (new Date(b).getTime() - new Date(a).getTime()) / MS_PER_DAY
}

export function predictProduct(
  product: Product,
  snapshots: StockSnapshot[],
  purchases: Purchase[]
): ProductPrediction {
  const sorted = [...snapshots].sort((a, b) => a.takenAt.localeCompare(b.takenAt))
  const now = new Date().toISOString()

  if (sorted.length <= 1) {
    const currentStock = sorted.length === 1 ? sorted[0].quantity : 0
    return {
      currentStock,
      consumptionRatePerDay: 0,
      daysUntilEmpty: null,
      confidence: 'none',
      isAlert: currentStock <= product.targetStock && sorted.length === 1,
      isOverdue: false
    }
  }

  const productPurchases = purchases.filter(p => p.productId === product.id)
  const rates: number[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const older = sorted[i]
    const newer = sorted[i + 1]
    const d = daysBetween(older.takenAt, newer.takenAt)
    if (d <= 0) continue

    const betweenPurchases = productPurchases.filter(
      p => p.purchasedAt > older.takenAt && p.purchasedAt <= newer.takenAt
    )
    const totalBetween = betweenPurchases.reduce((sum, p) => sum + p.quantity, 0)
    const consumed = older.quantity + totalBetween - newer.quantity
    const rate = consumed / d

    if (rate > 0) {
      rates.push(rate)
    }
  }

  if (rates.length === 0) {
    const currentStock = sorted[sorted.length - 1].quantity
    return {
      currentStock,
      consumptionRatePerDay: 0,
      daysUntilEmpty: null,
      confidence: 'none',
      isAlert: currentStock <= product.targetStock,
      isOverdue: false
    }
  }

  const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length

  const newest = sorted[sorted.length - 1]
  const sinceLast = productPurchases.filter(p => p.purchasedAt > newest.takenAt)
  const totalSinceLast = sinceLast.reduce((sum, p) => sum + p.quantity, 0)

  const daysSince = Math.max(daysBetween(newest.takenAt, now), 0)
  const rawStock = newest.quantity + totalSinceLast - avgRate * daysSince
  const currentStock = Math.max(0, rawStock)
  const daysUntilEmpty = avgRate > 0 ? currentStock / avgRate : null

  const snapCount = sorted.length
  const confidence = snapCount <= 2 ? 'low' : snapCount <= 4 ? 'medium' : 'high'

  const isOverdue = daysUntilEmpty !== null && daysUntilEmpty <= 0
  const isAlert = (daysUntilEmpty !== null && daysUntilEmpty <= 7) || currentStock <= product.targetStock

  return {
    currentStock: Math.round(currentStock * 10) / 10,
    consumptionRatePerDay: Math.round(avgRate * 100) / 100,
    daysUntilEmpty: daysUntilEmpty !== null ? Math.round(daysUntilEmpty * 10) / 10 : null,
    confidence,
    isAlert,
    isOverdue
  }
}

export function computeAlertCount(
  products: Product[],
  snapshots: StockSnapshot[],
  purchases: Purchase[]
): number {
  let count = 0
  for (const product of products) {
    const productSnapshots = snapshots.filter(s => s.productId === product.id)
    const productPurchases = purchases.filter(p => p.productId === product.id)
    const pred = predictProduct(product, productSnapshots, productPurchases)
    if (pred.isAlert) count++
  }
  return count
}
