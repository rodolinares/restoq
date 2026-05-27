import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InventoryItem } from '@/types'

function generateId(): string {
  return crypto.randomUUID()
}

export interface InventoryStore {
  items: InventoryItem[]
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateItem: (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>) => void
  removeItem: (id: string) => void
  adjustQuantity: (id: string, delta: number) => void
  lowStockItems: () => InventoryItem[]
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: item =>
        set(state => ({
          items: [
            ...state.items,
            {
              ...item,
              id: generateId(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        })),

      updateItem: (id, updates) =>
        set(state => ({
          items: state.items.map(item =>
            item.id === id
              ? { ...item, ...updates, updatedAt: Date.now() }
              : item
          ),
        })),

      removeItem: id =>
        set(state => ({
          items: state.items.filter(item => item.id !== id),
        })),

      adjustQuantity: (id, delta) =>
        set(state => ({
          items: state.items.map(item =>
            item.id === id
              ? { ...item, quantity: item.quantity + delta, updatedAt: Date.now() }
              : item
          ),
        })),

      lowStockItems: () => get().items.filter(item => item.quantity <= item.minThreshold),
    }),
    { name: 'restoq-inventory' }
  )
)
