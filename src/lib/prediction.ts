import type { ProductPrediction, Depletion } from '@/types/inventory'

const MS_PER_DAY = 86_400_000

const toDate = (s: string): Date => {
  return new Date(s + 'T00:00:00')
}

function getLastDepletion(productName: string, depletions: Depletion[]): Depletion | undefined {
  const matches = depletions.filter(d => d.productName === productName)
  if (matches.length === 0) return undefined
  return matches.sort((a, b) => b.depletedAt.localeCompare(a.depletedAt))[0]
}

export function predictConsumption(
  records: Array<{ name: string; units: number; purchaseDate: string }>,
  depletions: Depletion[] = []
): ProductPrediction | null {
  if (records.length === 0) return null

  const sorted = [...records].sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate))
  const totalUnits = records.reduce((sum, r) => sum + r.units, 0)

  const lastRecord = sorted[sorted.length - 1]
  const depletion = getLastDepletion(lastRecord.name, depletions)
  const isDepleted = depletion !== undefined && depletion.depletedAt >= lastRecord.purchaseDate

  if (isDepleted) {
    return {
      name: lastRecord.name,
      dailyUsage:
        records.length >= 2
          ? Math.round(
              (totalUnits /
                Math.max(
                  (toDate(sorted[sorted.length - 1].purchaseDate).getTime() -
                    toDate(sorted[0].purchaseDate).getTime()) /
                    MS_PER_DAY,
                  1
                )) *
                100
            ) / 100
          : null,
      daysUntilEmpty: 0,
      estimatedCurrentStock: 0,
      lastPurchaseDate: lastRecord.purchaseDate,
      lastPurchaseUnits: lastRecord.units,
      confidence: records.length <= 2 ? 'low' : records.length <= 5 ? 'medium' : 'high'
    }
  }

  if (records.length === 1) {
    const r = records[0]
    return {
      name: r.name,
      dailyUsage: null,
      daysUntilEmpty: null,
      estimatedCurrentStock: r.units,
      lastPurchaseDate: r.purchaseDate,
      lastPurchaseUnits: r.units,
      confidence: 'low'
    }
  }

  const firstDate = toDate(sorted[0].purchaseDate)
  const lastDate = toDate(sorted[sorted.length - 1].purchaseDate)
  const daysSpan = Math.max((lastDate.getTime() - firstDate.getTime()) / MS_PER_DAY, 1)

  const dailyRate = totalUnits / daysSpan

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysSinceLastPurchase = Math.max((today.getTime() - lastDate.getTime()) / MS_PER_DAY, 0)

  const estimatedCurrentStock = Math.max(0, lastRecord.units - daysSinceLastPurchase * dailyRate)
  const daysUntilEmpty = dailyRate > 0 ? estimatedCurrentStock / dailyRate : null

  const confidence = records.length <= 2 ? 'low' : records.length <= 5 ? 'medium' : 'high'

  return {
    name: lastRecord.name,
    dailyUsage: Math.round(dailyRate * 100) / 100,
    daysUntilEmpty: daysUntilEmpty !== null ? Math.round(daysUntilEmpty * 10) / 10 : null,
    estimatedCurrentStock: Math.round(estimatedCurrentStock * 10) / 10,
    lastPurchaseDate: lastRecord.purchaseDate,
    lastPurchaseUnits: lastRecord.units,
    confidence
  }
}

export function computeAlertCount(
  purchases: Array<{ name: string; units: number; purchaseDate: string }>,
  depletions: Depletion[] = []
): number {
  const map = new Map<string, Array<{ name: string; units: number; purchaseDate: string }>>()
  for (const p of purchases) {
    const list = map.get(p.name) ?? []
    list.push(p)
    map.set(p.name, list)
  }
  let count = 0
  for (const records of map.values()) {
    const pred = predictConsumption(records, depletions)
    if (pred && pred.daysUntilEmpty !== null && pred.daysUntilEmpty <= 7) {
      count++
    }
  }
  return count
}
