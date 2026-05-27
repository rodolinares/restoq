import { useState } from 'react'
import { PackageOpen, Plus } from 'lucide-react'
import { useInventoryStore } from '@/store'
import type { InventoryItem } from '@/types'
import { Button } from '@/components/ui/button'
import { ItemFormDialog } from './ItemFormDialog'

export function InventoryView() {
  const items = useInventoryStore(s => s.items)
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
            <button
              key={item.id}
              type="button"
              onClick={() => openEdit(item)}
              className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} {item.unit} &middot; {item.location}
                  {item.category ? ` · ${item.category}` : ''}
                </p>
              </div>
              {item.quantity <= item.minThreshold && (
                <span className="ml-2 shrink-0 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                  {item.quantity === 0 ? 'Out' : 'Low'}
                </span>
              )}
            </button>
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
