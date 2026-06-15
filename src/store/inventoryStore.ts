import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PurchaseRecord, Depletion } from '@/types/inventory'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface PurchaseStore {
  purchases: PurchaseRecord[]
  depletions: Depletion[]
  addPurchase: (purchase: Omit<PurchaseRecord, 'id'>) => void
  removePurchase: (id: string) => void
  markDepleted: (productName: string) => void
  clearDepletion: (productName: string) => void
  resetAll: () => void
}

export const usePurchaseStore = create<PurchaseStore>()(
  persist(
    set => ({
      purchases: [],
      depletions: [],

      addPurchase: purchase =>
        set(state => ({
          purchases: [...state.purchases, { ...purchase, id: crypto.randomUUID() }]
        })),

      removePurchase: id =>
        set(state => ({
          purchases: state.purchases.filter(p => p.id !== id)
        })),

      markDepleted: productName =>
        set(state => {
          const existing = state.depletions.findIndex(d => d.productName === productName)
          if (existing !== -1) {
            const next = [...state.depletions]
            next[existing] = { productName, depletedAt: today() }
            return { depletions: next }
          }
          return { depletions: [...state.depletions, { productName, depletedAt: today() }] }
        }),

      clearDepletion: productName =>
        set(state => ({
          depletions: state.depletions.filter(d => d.productName !== productName)
        })),

      resetAll: () => {
        set({ purchases: [], depletions: [] })
      }
    }),
    {
      name: 'restoq-purchases'
    }
  )
)
