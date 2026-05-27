import { useState, type FormEvent } from 'react'
import { useInventoryStore } from '@/store'
import { UNITS, LOCATIONS } from '@/lib/constants'
import type { InventoryItem, Unit, Location } from '@/types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editItem?: InventoryItem
}

type FormState = {
  name: string
  category: string
  quantity: string
  minThreshold: string
  unit: Unit
  location: Location
  notes: string
}

const emptyForm: FormState = {
  name: '',
  category: '',
  quantity: '0',
  minThreshold: '0',
  unit: 'pcs',
  location: 'pantry',
  notes: '',
}

export function ItemFormDialog({ open, onOpenChange, editItem }: ItemFormDialogProps) {
  const addItem = useInventoryStore(s => s.addItem)
  const updateItem = useInventoryStore(s => s.updateItem)

  const isEditing = !!editItem

  const [form, setForm] = useState<FormState>(() =>
    editItem
      ? {
          name: editItem.name,
          category: editItem.category,
          quantity: String(editItem.quantity),
          minThreshold: String(editItem.minThreshold),
          unit: editItem.unit,
          location: editItem.location,
          notes: editItem.notes ?? '',
        }
      : { ...emptyForm }
  )

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  function validate(): boolean {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Name is required'
    const qty = Number(form.quantity)
    if (!Number.isFinite(qty) || qty < 0 || !Number.isInteger(qty)) next.quantity = 'Must be a whole number ≥ 0'
    const threshold = Number(form.minThreshold)
    if (!Number.isFinite(threshold) || threshold < 0 || !Number.isInteger(threshold)) next.minThreshold = 'Must be a whole number ≥ 0'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const quantity = Number(form.quantity)
    const minThreshold = Number(form.minThreshold)

    if (isEditing) {
      updateItem(editItem.id, {
        name: form.name.trim(),
        category: form.category.trim(),
        quantity,
        minThreshold,
        unit: form.unit,
        location: form.location,
        notes: form.notes.trim() || undefined,
      })
    } else {
      addItem({
        name: form.name.trim(),
        category: form.category.trim(),
        quantity,
        minThreshold,
        unit: form.unit,
        location: form.location,
        notes: form.notes.trim() || undefined,
      })
    }

    onOpenChange(false)
    setForm({ ...emptyForm })
    setErrors({})
  }

  function resetAndClose(open: boolean) {
    if (!open) {
      setForm(editItem ? { ...emptyForm } : { ...emptyForm })
      setErrors({})
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="pb-[env(safe-area-inset-bottom,16px)]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Item' : 'Add Item'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Olive Oil"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g. Cooking"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                step={1}
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                aria-invalid={!!errors.quantity}
              />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="minThreshold">Min. Threshold</Label>
              <Input
                id="minThreshold"
                type="number"
                min={0}
                step={1}
                value={form.minThreshold}
                onChange={e => setForm(f => ({ ...f, minThreshold: e.target.value }))}
                aria-invalid={!!errors.minThreshold}
              />
              {errors.minThreshold && <p className="text-xs text-destructive">{errors.minThreshold}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select
                value={form.unit}
                onValueChange={v => setForm(f => ({ ...f, unit: v as Unit }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={form.location}
                onValueChange={v => setForm(f => ({ ...f, location: v as Location }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map(l => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Brand, expiry, etc."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="flex-1">
              {isEditing ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
