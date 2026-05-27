import type { ConsumptionEvent, ItemPrediction, PredictionEngine } from '@/types'

const MS_PER_DAY = 86_400_000

function avgDailyRate(history: ConsumptionEvent[]): number | null {
  if (history.length === 0) return null

  const totalConsumed = history.reduce((sum, e) => sum + Math.abs(e.delta), 0)
  const firstTs = Math.min(...history.map(e => e.timestamp))
  const lastTs = Math.max(...history.map(e => e.timestamp))
  const spanDays = Math.max((lastTs - firstTs) / MS_PER_DAY, 1)

  return totalConsumed / spanDays
}

function confidenceLevel(count: number): ItemPrediction['confidence'] {
  if (count <= 1) return 'low'
  if (count <= 4) return 'medium'
  return 'high'
}

export const simpleEngine: PredictionEngine = {
  predict(quantity, minThreshold, history) {
    const rate = avgDailyRate(history)
    if (rate === null || rate <= 0) return null

    const daysUntilEmpty = quantity / rate
    const daysUntilThreshold = (quantity - minThreshold) / rate

    return {
      daysUntilEmpty: Math.round(daysUntilEmpty * 10) / 10,
      daysUntilThreshold: Math.round(daysUntilThreshold * 10) / 10,
      confidence: confidenceLevel(history.length),
    }
  },
}
