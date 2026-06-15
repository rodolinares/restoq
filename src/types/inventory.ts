export interface PurchaseRecord {
  id: string
  name: string
  units: number
  purchaseDate: string
}

export interface Depletion {
  productName: string
  depletedAt: string
}

export interface ProductPrediction {
  name: string
  dailyUsage: number | null
  daysUntilEmpty: number | null
  estimatedCurrentStock: number
  lastPurchaseDate: string | null
  lastPurchaseUnits: number | null
  confidence: 'low' | 'medium' | 'high'
}
