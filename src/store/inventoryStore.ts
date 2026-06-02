import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PurchaseRecord } from '@/types'
import { getTestPurchases } from '@/lib/testData'

function generateId(): string {
  return crypto.randomUUID()
}

export interface PurchaseStore {
  purchases: PurchaseRecord[]
  addPurchase: (purchase: Omit<PurchaseRecord, 'id'>) => void
  removePurchase: (id: string) => void
  resetAll: () => void
  generateTestData: () => void
}

export const usePurchaseStore = create<PurchaseStore>()(
  persist(
    set => ({
      purchases: [],

      addPurchase: purchase =>
        set(state => ({
          purchases: [
            ...state.purchases,
            { ...purchase, id: generateId() }
          ]
        })),

      removePurchase: id =>
        set(state => ({
          purchases: state.purchases.filter(p => p.id !== id)
        })),

      resetAll: () => {
        set({ purchases: [] })
      },

      generateTestData: () => {
        set(state => ({
          purchases: [
            ...state.purchases,
            ...getTestPurchases().map(p => ({ ...p, id: generateId() }))
          ]
        }))
      }
    }),
    {
      name: 'restoq-purchases'
    }
  )
)
