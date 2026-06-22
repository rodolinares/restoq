import { describe, it, expect, beforeEach } from 'vitest'
import { useInventoryStore } from '../inventoryStore.ts'

describe('useInventoryStore', () => {
  beforeEach(() => {
    useInventoryStore.setState({ products: [], snapshots: [], purchases: [] })
  })

  it('starts with empty arrays', () => {
    const state = useInventoryStore.getState()
    expect(state.products).toEqual([])
    expect(state.snapshots).toEqual([])
    expect(state.purchases).toEqual([])
  })

  it('adds a product', () => {
    useInventoryStore.getState().addProduct({
      name: 'Olive Oil',
      category: 'pantry',
      unit: 'liters',
      targetStock: 2
    })

    const products = useInventoryStore.getState().products
    expect(products).toHaveLength(1)
    expect(products[0].name).toBe('Olive Oil')
    expect(products[0].category).toBe('pantry')
    expect(products[0].unit).toBe('liters')
    expect(products[0].targetStock).toBe(2)
    expect(products[0].id).toBeDefined()
    expect(products[0].createdAt).toBeDefined()
  })

  it('updates a product', () => {
    useInventoryStore.getState().addProduct({
      name: 'Olive Oil',
      category: 'pantry',
      unit: 'liters',
      targetStock: 2
    })

    const id = useInventoryStore.getState().products[0].id
    useInventoryStore.getState().updateProduct(id, { targetStock: 5 })

    expect(useInventoryStore.getState().products[0].targetStock).toBe(5)
    expect(useInventoryStore.getState().products[0].name).toBe('Olive Oil')
  })

  it('deletes a product and cascades to snapshots and purchases', () => {
    const store = useInventoryStore.getState()
    store.addProduct({ name: 'P1', category: 'pantry', unit: 'units', targetStock: 1 })
    const pid = useInventoryStore.getState().products[0].id

    store.addSnapshot({ productId: pid, quantity: 5, takenAt: '2026-06-01T00:00:00.000Z' })
    store.addPurchase({ productId: pid, quantity: 2, purchasedAt: '2026-06-05T00:00:00.000Z' })

    expect(useInventoryStore.getState().snapshots).toHaveLength(1)
    expect(useInventoryStore.getState().purchases).toHaveLength(1)

    useInventoryStore.getState().deleteProduct(pid)

    expect(useInventoryStore.getState().products).toHaveLength(0)
    expect(useInventoryStore.getState().snapshots).toHaveLength(0)
    expect(useInventoryStore.getState().purchases).toHaveLength(0)
  })

  it('adds a snapshot', () => {
    useInventoryStore.getState().addProduct({
      name: 'P1',
      category: 'pantry',
      unit: 'units',
      targetStock: 1
    })
    const pid = useInventoryStore.getState().products[0].id

    useInventoryStore.getState().addSnapshot({
      productId: pid,
      quantity: 3,
      takenAt: '2026-06-01T00:00:00.000Z'
    })

    const snapshots = useInventoryStore.getState().snapshots
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0].productId).toBe(pid)
    expect(snapshots[0].quantity).toBe(3)
    expect(snapshots[0].id).toBeDefined()
  })

  it('deletes a snapshot', () => {
    useInventoryStore.getState().addProduct({
      name: 'P1',
      category: 'pantry',
      unit: 'units',
      targetStock: 1
    })
    const pid = useInventoryStore.getState().products[0].id
    useInventoryStore.getState().addSnapshot({
      productId: pid,
      quantity: 3,
      takenAt: '2026-06-01T00:00:00.000Z'
    })

    const sid = useInventoryStore.getState().snapshots[0].id
    useInventoryStore.getState().deleteSnapshot(sid)

    expect(useInventoryStore.getState().snapshots).toHaveLength(0)
  })

  it('adds a purchase', () => {
    useInventoryStore.getState().addProduct({
      name: 'P1',
      category: 'pantry',
      unit: 'units',
      targetStock: 1
    })
    const pid = useInventoryStore.getState().products[0].id

    useInventoryStore.getState().addPurchase({
      productId: pid,
      quantity: 6,
      purchasedAt: '2026-06-01T00:00:00.000Z'
    })

    const purchases = useInventoryStore.getState().purchases
    expect(purchases).toHaveLength(1)
    expect(purchases[0].productId).toBe(pid)
    expect(purchases[0].quantity).toBe(6)
    expect(purchases[0].id).toBeDefined()
  })

  it('deletes a purchase', () => {
    useInventoryStore.getState().addProduct({
      name: 'P1',
      category: 'pantry',
      unit: 'units',
      targetStock: 1
    })
    const pid = useInventoryStore.getState().products[0].id
    useInventoryStore.getState().addPurchase({
      productId: pid,
      quantity: 6,
      purchasedAt: '2026-06-01T00:00:00.000Z'
    })

    const puid = useInventoryStore.getState().purchases[0].id
    useInventoryStore.getState().deletePurchase(puid)

    expect(useInventoryStore.getState().purchases).toHaveLength(0)
  })

  it('resets all data', () => {
    const store = useInventoryStore.getState()
    store.addProduct({ name: 'P1', category: 'pantry', unit: 'units', targetStock: 1 })
    store.addProduct({ name: 'P2', category: 'cleaning', unit: 'units', targetStock: 2 })

    store.resetAll()

    const state = useInventoryStore.getState()
    expect(state.products).toHaveLength(0)
    expect(state.snapshots).toHaveLength(0)
    expect(state.purchases).toHaveLength(0)
  })
})
