import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useVisualViewport } from '@/hooks/useVisualViewport'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Product } from '@/types/inventory'

interface AddSnapshotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  onSave: (quantity: number) => void
}

export function AddSnapshotDialog({ open, onOpenChange, product, onSave }: AddSnapshotDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const vvHeight = useVisualViewport()
  const [layoutHeight, setLayoutHeight] = useState(window.innerHeight)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

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
      setValue('')
      setError('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const qty = Number(value)
    if (!Number.isFinite(qty) || qty < 0) {
      setError('Must be a valid number >= 0')
      return
    }
    onSave(qty)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="overflow-y-auto transition-[bottom] duration-200 pb-[env(safe-area-inset-bottom,16px)]"
        style={dialogStyle}
      >
        <DialogHeader>
          <DialogTitle>Count {product.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Current stock ({product.unit})
            </Label>
            <Input
              ref={inputRef}
              id="quantity"
              type="number"
              min={0}
              step={0.1}
              placeholder="e.g. 5"
              value={value}
              onChange={e => {
                setValue(e.target.value)
                setError('')
              }}
              aria-invalid={!!error}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex gap-3 pt-2 pb-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="flex-1">
              Save count
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
