import { useState } from 'react'
import { Minus, PackageOpen, Plus, Trash2 } from 'lucide-react'
import { useInventoryStore } from '@/store'
import type { InventoryItem } from '@/types'
import { Button } from '@/components/ui/button'
import { ItemFormDialog } from './ItemFormDialog'

export function InventoryView() {
  const items = useInventoryStore(s => s.items)
  const adjustQuantity = useInventoryStore(s => s.adjustQuantity)
  const removeItem = useInventoryStore(s => s.removeItem)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined)

  function openAdd() {
    setEditingItem(undefined)
    setDialogOpen(true)
  }

  function openEdit(item: InventoryItem) {
    setEditingItem(item)
    setDialogOpen(true)
  }

  return (
    <>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <PackageOpen className="size-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Your inventory is empty</h2>
          <p className="max-w-64 text-sm text-muted-foreground">
            Tap the + button to add your first item.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5"
            >
              <Button
                type="button"
                size="icon-xs"
                variant="outline"
                disabled={item.quantity <= 0}
                onClick={() => adjustQuantity(item.id, -1)}
                aria-label="Decrease quantity"
              >
                <Minus className="size-3" />
              </Button>

              <button
                type="button"
                onClick={() => openEdit(item)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-medium leading-tight">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.quantity} {item.unit} &middot; {item.location}
                  {item.category ? ` · ${item.category}` : ''}
                </p>
              </button>

              {item.quantity <= item.minThreshold && (
                <span className={'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ' + (item.quantity === 0 ? 'badge-out' : 'badge-low')}>
                  {item.quantity === 0 ? 'Out' : 'Low'}
                </span>
              )}

              <Button
                type="button"
                size="icon-xs"
                variant="outline"
                onClick={() => adjustQuantity(item.id, 1)}
                aria-label="Increase quantity"
              >
                <Plus className="size-3" />
              </Button>

              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={() => removeItem(item.id)}
                aria-label="Delete item"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        size="icon"
        className="fixed bottom-20 right-4 z-40 size-12 rounded-full shadow-lg"
        onClick={openAdd}
      >
        <Plus className="size-6" />
      </Button>

      <ItemFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editItem={editingItem}
      />
    </>
  )
}
