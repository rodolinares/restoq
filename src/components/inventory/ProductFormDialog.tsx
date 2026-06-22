import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useVisualViewport } from '@/hooks/useVisualViewport'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Product, ProductCategory } from '@/types/inventory'

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'pantry', label: 'Pantry' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'pets', label: 'Pets' },
  { value: 'other', label: 'Other' }
]

const UNIT_SUGGESTIONS = ['units', 'kg', 'liters', 'rolls', 'packs', 'bottles', 'cans', 'boxes']

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
  onSave: (data: Omit<Product, 'id' | 'createdAt'>) => void
}

export function ProductFormDialog({ open, onOpenChange, product, onSave }: ProductFormDialogProps) {
  const nameRef = useRef<HTMLInputElement>(null)
  const vvHeight = useVisualViewport()
  const [layoutHeight, setLayoutHeight] = useState(window.innerHeight)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('pantry')
  const [unit, setUnit] = useState('')
  const [targetStock, setTargetStock] = useState('')
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  useEffect(() => {
    const onResize = () => setLayoutHeight(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const keyboardHeight = Math.max(0, layoutHeight - vvHeight)
  const isKeyboardOpen = keyboardHeight > 80

  const dialogStyle = isKeyboardOpen
    ? { bottom: keyboardHeight, maxHeight: vvHeight - 32 }
    : undefined

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      requestAnimationFrame(() => nameRef.current?.focus())
      if (product) {
        setName(product.name)
        setCategory(product.category)
        setUnit(product.unit)
        setTargetStock(String(product.targetStock))
      } else {
        setName('')
        setCategory('pantry')
        setUnit('')
        setTargetStock('')
      }
      setErrors({})
    }
    onOpenChange(newOpen)
  }

  const validate = (): boolean => {
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Name is required'
    const ts = Number(targetStock)
    if (!Number.isFinite(ts) || ts < 0) next.targetStock = 'Must be >= 0'
    if (!unit.trim()) next.unit = 'Unit is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    onSave({
      name: name.trim(),
      category,
      unit: unit.trim(),
      targetStock: Math.max(0, Number(targetStock))
    })
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="overflow-y-auto transition-[bottom] duration-200 pb-[env(safe-area-inset-bottom,16px)]"
        style={dialogStyle}
      >
        <DialogHeader>
          <DialogTitle>{product ? 'Edit product' : 'New product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pname">Name</Label>
            <Input
              ref={nameRef}
              id="pname"
              placeholder="e.g. Olive Oil"
              value={name}
              onChange={e => setName(e.target.value)}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value as ProductCategory)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-[border-color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              list="unit-suggestions"
              placeholder="e.g. liters"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              aria-invalid={!!errors.unit}
            />
            <datalist id="unit-suggestions">
              {UNIT_SUGGESTIONS.map(u => (
                <option key={u} value={u} />
              ))}
            </datalist>
            {errors.unit && <p className="text-xs text-destructive">{errors.unit}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetStock">Desired minimum stock</Label>
            <Input
              id="targetStock"
              type="number"
              min={0}
              step={0.1}
              placeholder="e.g. 2"
              value={targetStock}
              onChange={e => setTargetStock(e.target.value)}
              aria-invalid={!!errors.targetStock}
            />
            {errors.targetStock && <p className="text-xs text-destructive">{errors.targetStock}</p>}
          </div>

          <div className="flex gap-3 pt-2 pb-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="flex-1">
              {product ? 'Save changes' : 'Add product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
