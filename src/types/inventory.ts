export type Unit =
  | 'pcs'
  | 'kg'
  | 'g'
  | 'l'
  | 'ml'
  | 'tbsp'
  | 'tsp'
  | 'cup'
  | 'oz'
  | 'lb'

export type Location = 'pantry' | 'fridge' | 'freezer' | 'bathroom' | 'cleaning' | 'other'

export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  minThreshold: number
  unit: Unit
  location: Location
  notes?: string
  imageUrl?: string
  createdAt: number
  updatedAt: number
}
