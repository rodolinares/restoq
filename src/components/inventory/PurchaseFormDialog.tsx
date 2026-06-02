import { useState, useRef, useEffect, type FormEvent } from 'react'
import { toast } from 'sonner'
import { usePurchaseStore } from '@/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PurchaseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingNames: string[]
}

interface FormState {
  name: string
  units: string
  purchaseDate: string
}

const emptyForm: FormState = {
  name: '',
  units: '',
  purchaseDate: new Date().toISOString().slice(0, 10)
}

export function PurchaseFormDialog({ open, onOpenChange, existingNames }: PurchaseFormDialogProps) {
  const addPurchase = usePurchaseStore(s => s.addPurchase)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => nameRef.current?.focus())
    }
  }, [open])

  const [form, setForm] = useState<FormState>({ ...emptyForm })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  function validate(): boolean {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Name is required'
    const units = Number(form.units)
    if (!Number.isFinite(units) || units <= 0 || !Number.isInteger(units)) next.units = 'Must be a whole number > 0'
    if (!form.purchaseDate) next.purchaseDate = 'Date is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    addPurchase({
      name: form.name.trim(),
      units: Number(form.units),
      purchaseDate: form.purchaseDate
    })
    toast(`${form.name.trim()} added`)

    onOpenChange(false)
    setForm({ ...emptyForm })
    setErrors({})
    ;(document.activeElement as HTMLElement)?.blur()
  }

  function resetAndClose(open: boolean) {
    if (!open) {
      setForm({ ...emptyForm })
      setErrors({})
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="pb-[env(safe-area-inset-bottom,16px)]">
        <DialogHeader>
          <DialogTitle>Record Purchase</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product name</Label>
            <Input
              ref={nameRef}
              id="name"
              list="product-suggestions"
              placeholder="e.g. 1L Water Bottle"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              aria-invalid={!!errors.name}
            />
            <datalist id="product-suggestions">
              {existingNames.map(n => (
                <option key={n} value={n} />
              ))}
            </datalist>
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="units">Units purchased</Label>
            <Input
              id="units"
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 6"
              value={form.units}
              onChange={e => setForm(f => ({ ...f, units: e.target.value }))}
              aria-invalid={!!errors.units}
            />
            {errors.units && <p className="text-xs text-destructive">{errors.units}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase date</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={form.purchaseDate}
              onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))}
              aria-invalid={!!errors.purchaseDate}
            />
            {errors.purchaseDate && <p className="text-xs text-destructive">{errors.purchaseDate}</p>}
          </div>

          <div className="flex gap-3 pt-2 pb-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="flex-1">
              Add Purchase
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
