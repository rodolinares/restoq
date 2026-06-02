import { describe, it, expect, beforeEach } from 'vitest'
import { usePurchaseStore } from '../inventoryStore.ts'

describe('usePurchaseStore', () => {
  beforeEach(() => {
    usePurchaseStore.setState({ purchases: [] })
  })

  it('starts with an empty purchases array', () => {
    expect(usePurchaseStore.getState().purchases).toEqual([])
  })

  it('adds a purchase record', () => {
    usePurchaseStore.getState().addPurchase({
      name: '1L Water Bottle',
      units: 6,
      purchaseDate: '2026-05-15'
    })

    const purchases = usePurchaseStore.getState().purchases
    expect(purchases).toHaveLength(1)
    expect(purchases[0].name).toBe('1L Water Bottle')
    expect(purchases[0].units).toBe(6)
    expect(purchases[0].purchaseDate).toBe('2026-05-15')
    expect(purchases[0].id).toBeDefined()
  })

  it('removes a purchase by id', () => {
    usePurchaseStore.getState().addPurchase({
      name: 'Milk',
      units: 2,
      purchaseDate: '2026-05-10'
    })

    const id = usePurchaseStore.getState().purchases[0].id
    usePurchaseStore.getState().removePurchase(id)

    expect(usePurchaseStore.getState().purchases).toHaveLength(0)
  })

  it('resets all purchases', () => {
    usePurchaseStore.getState().addPurchase({
      name: 'Eggs',
      units: 12,
      purchaseDate: '2026-05-01'
    })
    usePurchaseStore.getState().addPurchase({
      name: 'Bread',
      units: 2,
      purchaseDate: '2026-05-08'
    })

    usePurchaseStore.getState().resetAll()
    expect(usePurchaseStore.getState().purchases).toHaveLength(0)
  })

  it('accumulates multiple purchases for the same product', () => {
    usePurchaseStore.getState().addPurchase({
      name: 'Coffee',
      units: 1,
      purchaseDate: '2026-04-01'
    })
    usePurchaseStore.getState().addPurchase({
      name: 'Coffee',
      units: 1,
      purchaseDate: '2026-04-15'
    })
    usePurchaseStore.getState().addPurchase({
      name: 'Coffee',
      units: 2,
      purchaseDate: '2026-05-01'
    })

    expect(usePurchaseStore.getState().purchases).toHaveLength(3)
    const coffee = usePurchaseStore.getState().purchases.filter(
      p => p.name === 'Coffee'
    )
    expect(coffee).toHaveLength(3)
  })
})
