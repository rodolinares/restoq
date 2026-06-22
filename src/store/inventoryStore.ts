import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, StockSnapshot, Purchase, ProductCategory } from '@/types/inventory'

function nowISO(): string {
  return new Date().toISOString()
}

export interface InventoryStore {
  products: Product[]
  snapshots: StockSnapshot[]
  purchases: Purchase[]

  addProduct: (p: Omit<Product, 'id' | 'createdAt'>) => void
  updateProduct: (id: string, patch: Partial<Omit<Product, 'id'>>) => void
  deleteProduct: (id: string) => void

  addSnapshot: (s: Omit<StockSnapshot, 'id'>) => void
  deleteSnapshot: (id: string) => void

  addPurchase: (p: Omit<Purchase, 'id'>) => void
  deletePurchase: (id: string) => void

  resetAll: () => void
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    set => ({
      products: [],
      snapshots: [],
      purchases: [],

      addProduct: p =>
        set(state => ({
          products: [
            ...state.products,
            { ...p, id: crypto.randomUUID(), createdAt: nowISO() }
          ]
        })),

      updateProduct: (id, patch) =>
        set(state => ({
          products: state.products.map(p => (p.id === id ? { ...p, ...patch } : p))
        })),

      deleteProduct: id =>
        set(state => ({
          products: state.products.filter(p => p.id !== id),
          snapshots: state.snapshots.filter(s => s.productId !== id),
          purchases: state.purchases.filter(pu => pu.productId !== id)
        })),

      addSnapshot: s =>
        set(state => ({
          snapshots: [...state.snapshots, { ...s, id: crypto.randomUUID() }]
        })),

      deleteSnapshot: id =>
        set(state => ({
          snapshots: state.snapshots.filter(s => s.id !== id)
        })),

      addPurchase: p =>
        set(state => ({
          purchases: [...state.purchases, { ...p, id: crypto.randomUUID() }]
        })),

      deletePurchase: id =>
        set(state => ({
          purchases: state.purchases.filter(pu => pu.id !== id)
        })),

      resetAll: () => {
        set({ products: [], snapshots: [], purchases: [] })
      }
    }),
    {
      name: 'restoq-inventory'
    }
  )
)

export type { ProductCategory }
