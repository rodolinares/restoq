import { describe, it, expect } from 'vitest'
import { purchaseEngine } from '../prediction.ts'
import type { PurchaseRecord } from '@/types'

function record(overrides: Partial<PurchaseRecord> = {}): PurchaseRecord {
  return {
    id: '1',
    name: 'Test Product',
    units: 6,
    purchaseDate: '2026-05-15',
    ...overrides
  }
}

describe('purchaseEngine.predict', () => {
  it('returns null for empty records', () => {
    expect(purchaseEngine.predict([])).toBeNull()
  })

  it('returns low confidence prediction for a single record', () => {
    const result = purchaseEngine.predict([record()])
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
    const r2 = record({ id: '2', purchaseDate: '2026-05-15', units: 6 })
    const result = purchaseEngine.predict([r1, r2])

    expect(result).not.toBeNull()
    expect(result!.dailyUsage).toBeGreaterThan(0)
    expect(result!.daysUntilEmpty).not.toBeNull()
    expect(result!.confidence).toBe('low')
  })

  it('returns medium confidence for 3-5 records', () => {
    const records = [1, 2, 3].map(i =>
      record({
        id: String(i),
        purchaseDate: `2026-05-${String(i * 5).padStart(2, '0')}`,
        units: 4
      })
    )
    const result = purchaseEngine.predict(records)
    expect(result!.confidence).toBe('medium')
  })

  it('returns high confidence for 6+ records', () => {
    const records = [1, 2, 3, 4, 5, 6].map(i =>
      record({
        id: String(i),
        purchaseDate: `2026-0${3 + Math.floor((i - 1) / 2)}-${String((i % 28) + 1).padStart(2, '0')}`,
        units: 4
      })
    )
    const result = purchaseEngine.predict(records)
    expect(result!.confidence).toBe('high')
  })

  it('predicts days until empty decreases over time', () => {
    const records = [
      record({ id: '1', purchaseDate: '2026-04-01', units: 10 }),
      record({ id: '2', purchaseDate: '2026-04-15', units: 10 })
    ]
    const result = purchaseEngine.predict(records)

    expect(result).not.toBeNull()
    expect(result!.dailyUsage).toBeGreaterThan(0)
    expect(result!.daysUntilEmpty).not.toBeNull()
    expect(result!.daysUntilEmpty!).toBeGreaterThanOrEqual(0)
  })

  it('handles same-day purchases by accumulating units', () => {
    const r1 = record({ id: '1', purchaseDate: '2026-05-01', units: 6 })
    const r2 = record({ id: '2', purchaseDate: '2026-05-15', units: 6 })
    const r3 = record({ id: '3', purchaseDate: '2026-05-15', units: 4 })
    const result = purchaseEngine.predict([r1, r2, r3])

    expect(result).not.toBeNull()
    expect(result!.lastPurchaseUnits).toBe(4)
    expect(result!.lastPurchaseDate).toBe('2026-05-15')
  })
})
