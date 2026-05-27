import type { Location, Unit } from '@/types'

export const UNITS: { value: Unit; label: string }[] = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'g', label: 'Grams' },
  { value: 'l', label: 'Liters' },
  { value: 'ml', label: 'Milliliters' },
  { value: 'tbsp', label: 'Tablespoons' },
  { value: 'tsp', label: 'Teaspoons' },
  { value: 'cup', label: 'Cups' },
  { value: 'oz', label: 'Ounces' },
  { value: 'lb', label: 'Pounds' },
]

export const LOCATIONS: { value: Location; label: string }[] = [
  { value: 'pantry', label: 'Pantry' },
  { value: 'fridge', label: 'Fridge' },
  { value: 'freezer', label: 'Freezer' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' },
]
