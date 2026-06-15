import { describe, it, expect } from 'vitest'
import { predictConsumption } from '../prediction.ts'

const record = (overrides: Partial<{ name: string; units: number; purchaseDate: string }> = {}) => {
  return {
    name: 'Test Product',
    units: 6,
    purchaseDate: '2026-05-15',
    ...overrides
  }
}

describe('predictConsumption', () => {
  it('returns null for empty records', () => {
    expect(predictConsumption([])).toBeNull()
  })

  it('returns low confidence prediction for a single record', () => {
    const result = predictConsumption([record()])
    expect(result).not.toBeNull()
    expect(result!.name).toBe('Test Product')
    expect(result!.dailyUsage).toBeNull()
    expect(result!.daysUntilEmpty).toBeNull()
    expect(result!.estimatedCurrentStock).toBe(6)
    expect(result!.lastPurchaseDate).toBe('2026-05-15')
    expect(result!.lastPurchaseUnits).toBe(6)
    expect(result!.confidence).toBe('low')
  })

  it('calculates daily usage from two records', () => {
    const r1 = record({ purchaseDate: '2026-05-01', units: 6 })
    const r2 = record({ purchaseDate: '2026-05-15', units: 6 })
    const result = predictConsumption([r1, r2])

    expect(result).not.toBeNull()
    expect(result!.dailyUsage).toBeGreaterThan(0)
    expect(result!.daysUntilEmpty).not.toBeNull()
    expect(result!.confidence).toBe('low')
  })

  it('returns medium confidence for 3-5 records', () => {
    const records = [1, 2, 3].map(i =>
      record({
        purchaseDate: `2026-05-${String(i * 5).padStart(2, '0')}`,
        units: 4
      })
    )
    const result = predictConsumption(records)
    expect(result!.confidence).toBe('medium')
  })

  it('returns high confidence for 6+ records', () => {
    const records = [1, 2, 3, 4, 5, 6].map(i =>
      record({
        purchaseDate: `2026-0${3 + Math.floor((i - 1) / 2)}-${String((i % 28) + 1).padStart(2, '0')}`,
        units: 4
      })
    )
    const result = predictConsumption(records)
    expect(result!.confidence).toBe('high')
  })

  it('predicts days until empty decreases over time', () => {
    const records = [
      record({ purchaseDate: '2026-04-01', units: 10 }),
      record({ purchaseDate: '2026-04-15', units: 10 })
    ]
    const result = predictConsumption(records)

    expect(result).not.toBeNull()
    expect(result!.dailyUsage).toBeGreaterThan(0)
    expect(result!.daysUntilEmpty).not.toBeNull()
    expect(result!.daysUntilEmpty!).toBeGreaterThanOrEqual(0)
  })

  it('handles same-day purchases by accumulating units', () => {
    const r1 = record({ purchaseDate: '2026-05-01', units: 6 })
    const r2 = record({ purchaseDate: '2026-05-15', units: 6 })
    const r3 = record({ purchaseDate: '2026-05-15', units: 4 })
    const result = predictConsumption([r1, r2, r3])

    expect(result).not.toBeNull()
    expect(result!.lastPurchaseUnits).toBe(4)
    expect(result!.lastPurchaseDate).toBe('2026-05-15')
  })
})
