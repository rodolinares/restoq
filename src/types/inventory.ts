export type ProductCategory = 'pantry' | 'cleaning' | 'bathroom' | 'pets' | 'other'

export interface Product {
  id: string
  name: string
  category: ProductCategory
  unit: string
  targetStock: number
  createdAt: string
}

export interface StockSnapshot {
  id: string
  productId: string
  quantity: number
  takenAt: string
}

export interface Purchase {
  id: string
  productId: string
  quantity: number
  purchasedAt: string
}

export interface ProductPrediction {
  currentStock: number
  consumptionRatePerDay: number
  daysUntilEmpty: number | null
  confidence: 'none' | 'low' | 'medium' | 'high'
  isAlert: boolean
  isOverdue: boolean
}
