import { describe, it, expect, vi, beforeEach } from 'vitest'
import { predictProduct } from '../prediction.ts'
import type { Product, StockSnapshot, Purchase } from '@/types/inventory'

const product: Product = {
  id: 'p1',
  name: 'Olive Oil',
  category: 'pantry',
  unit: 'liters',
  targetStock: 2,
  createdAt: '2026-01-01T00:00:00.000Z'
}

const snapshot = (overrides: Partial<StockSnapshot> = {}): StockSnapshot => ({
  id: 's1',
  productId: 'p1',
  quantity: 5,
  takenAt: '2026-06-01T00:00:00.000Z',
  ...overrides
})

const purchase = (overrides: Partial<Purchase> = {}): Purchase => ({
  id: 'pu1',
  productId: 'p1',
  quantity: 2,
  purchasedAt: '2026-06-10T00:00:00.000Z',
  ...overrides
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))
})

describe('predictProduct', () => {
  it('returns none confidence with zero snapshots', () => {
    const result = predictProduct(product, [], [])
    expect(result.confidence).toBe('none')
    expect(result.currentStock).toBe(0)
    expect(result.daysUntilEmpty).toBeNull()
    expect(result.consumptionRatePerDay).toBe(0)
  })

  it('returns none confidence with one snapshot', () => {
    const result = predictProduct(product, [snapshot()], [])
    expect(result.confidence).toBe('none')
    expect(result.currentStock).toBe(5)
    expect(result.daysUntilEmpty).toBeNull()
  })

  it('alerts when single snapshot stock is at or below targetStock', () => {
    const lowProduct: Product = { ...product, targetStock: 5 }
    const result = predictProduct(lowProduct, [snapshot({ quantity: 4 })], [])
    expect(result.isAlert).toBe(true)
  })

  it('computes consumption rate from two snapshots', () => {
    const s1 = snapshot({ id: 's1', quantity: 10, takenAt: '2026-06-01T00:00:00.000Z' })
    const s2 = snapshot({ id: 's2', quantity: 4, takenAt: '2026-06-11T00:00:00.000Z' })
    const result = predictProduct(product, [s1, s2], [])

    expect(result.confidence).toBe('low')
    expect(result.consumptionRatePerDay).toBeGreaterThan(0)
    expect(result.daysUntilEmpty).not.toBeNull()
  })

  it('accounts for purchases between snapshots', () => {
    const s1 = snapshot({ id: 's1', quantity: 10, takenAt: '2026-06-01T00:00:00.000Z' })
    const s2 = snapshot({ id: 's2', quantity: 8, takenAt: '2026-06-11T00:00:00.000Z' })
    const pu = purchase({ id: 'pu1', quantity: 3, purchasedAt: '2026-06-05T00:00:00.000Z' })
    const result = predictProduct(product, [s1, s2], [pu])

    expect(result.confidence).toBe('low')
    expect(result.consumptionRatePerDay).toBeGreaterThan(0)
  })

  it('returns none confidence when consumption rate is zero or negative', () => {
    const s1 = snapshot({ id: 's1', quantity: 4, takenAt: '2026-06-01T00:00:00.000Z' })
    const s2 = snapshot({ id: 's2', quantity: 10, takenAt: '2026-06-11T00:00:00.000Z' })
    const result = predictProduct(product, [s1, s2], [])

    expect(result.confidence).toBe('none')
    expect(result.daysUntilEmpty).toBeNull()
  })

  it('returns medium confidence for 3-4 snapshots', () => {
    const snapshots = [
      snapshot({ id: 's1', quantity: 10, takenAt: '2026-06-01T00:00:00.000Z' }),
      snapshot({ id: 's2', quantity: 7, takenAt: '2026-06-05T00:00:00.000Z' }),
      snapshot({ id: 's3', quantity: 4, takenAt: '2026-06-10T00:00:00.000Z' })
    ]
    const result = predictProduct(product, snapshots, [])
    expect(result.confidence).toBe('medium')
  })

  it('returns high confidence for 5+ snapshots', () => {
    const snapshots = [1, 2, 3, 4, 5].map(i => ({
      id: `s${i}`,
      productId: 'p1',
      quantity: 10 - i,
      takenAt: `2026-06-${String(i * 3).padStart(2, '0')}T00:00:00.000Z`
    }))
    const result = predictProduct(product, snapshots, [])
    expect(result.confidence).toBe('high')
  })

  it('clamps negative projected stock to zero', () => {
    const s1 = snapshot({ id: 's1', quantity: 2, takenAt: '2026-05-01T00:00:00.000Z' })
    const s2 = snapshot({ id: 's2', quantity: 1, takenAt: '2026-05-11T00:00:00.000Z' })
    const result = predictProduct(product, [s1, s2], [])

    expect(result.currentStock).toBe(0)
  })

  it('marks overdue when daysUntilEmpty is 0 or negative', () => {
    vi.setSystemTime(new Date('2027-01-01T12:00:00.000Z'))
    const s1 = snapshot({ id: 's1', quantity: 2, takenAt: '2026-06-01T00:00:00.000Z' })
    const s2 = snapshot({ id: 's2', quantity: 1, takenAt: '2026-06-11T00:00:00.000Z' })
    const result = predictProduct(product, [s1, s2], [])

    expect(result.isOverdue).toBe(true)
    expect(result.isAlert).toBe(true)
  })

  it('marks alert when daysUntilEmpty <= 7', () => {
    const s1 = snapshot({ id: 's1', quantity: 10, takenAt: '2026-06-01T00:00:00.000Z' })
    const s2 = snapshot({ id: 's2', quantity: 3, takenAt: '2026-06-12T00:00:00.000Z' })
    const result = predictProduct(product, [s1, s2], [])

    expect(result.isAlert).toBe(true)
    expect(result.daysUntilEmpty).toBeLessThanOrEqual(7)
  })

  it('does not alert when stock is healthy', () => {
    vi.setSystemTime(new Date('2026-06-13T12:00:00.000Z'))
    const s1 = snapshot({ id: 's1', quantity: 10, takenAt: '2026-06-01T00:00:00.000Z' })
    const s2 = snapshot({ id: 's2', quantity: 9, takenAt: '2026-06-12T00:00:00.000Z' })
    const result = predictProduct(product, [s1, s2], [])

    expect(result.isAlert).toBe(false)
    expect(result.daysUntilEmpty).toBeGreaterThan(7)
  })
})
