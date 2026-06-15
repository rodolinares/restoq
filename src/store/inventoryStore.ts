import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PurchaseRecord } from '@/types/inventory'

export interface PurchaseStore {
  purchases: PurchaseRecord[]
  addPurchase: (purchase: Omit<PurchaseRecord, 'id'>) => void
  removePurchase: (id: string) => void
  resetAll: () => void
}

export const usePurchaseStore = create<PurchaseStore>()(
  persist(
    set => ({
      purchases: [],

      addPurchase: purchase =>
        set(state => ({
          purchases: [...state.purchases, { ...purchase, id: crypto.randomUUID() }]
        })),

      removePurchase: id =>
        set(state => ({
          purchases: state.purchases.filter(p => p.id !== id)
        })),

      resetAll: () => {
        set({ purchases: [] })
      }
    }),
    {
      name: 'restoq-purchases'
    }
  )
)
