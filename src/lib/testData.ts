import type { PurchaseRecord } from '@/types'

export function getTestPurchases(): Omit<PurchaseRecord, 'id'>[] {
  return [
    { name: 'Milk', units: 4, purchaseDate: '2026-04-01' },
    { name: 'Milk', units: 4, purchaseDate: '2026-04-20' },
    { name: 'Milk', units: 2, purchaseDate: '2026-05-05' },
    { name: 'Bread', units: 3, purchaseDate: '2026-05-01' },
    { name: 'Bread', units: 3, purchaseDate: '2026-05-15' },
    { name: 'Bread', units: 2, purchaseDate: '2026-05-28' },
    { name: 'Eggs', units: 12, purchaseDate: '2026-05-01' },
    { name: 'Eggs', units: 12, purchaseDate: '2026-05-15' },
    { name: 'Eggs', units: 6, purchaseDate: '2026-05-25' },
    { name: 'Tomatoes', units: 8, purchaseDate: '2026-05-10' },
    { name: 'Tomatoes', units: 8, purchaseDate: '2026-05-20' },
    { name: 'Tomatoes', units: 8, purchaseDate: '2026-05-30' }
  ]
}
