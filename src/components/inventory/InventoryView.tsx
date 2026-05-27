import { PackageOpen } from 'lucide-react'
import { useInventoryStore } from '@/store'

export function InventoryView() {
  const items = useInventoryStore(s => s.items)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <PackageOpen className="size-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Your inventory is empty</h2>
        <p className="max-w-64 text-sm text-muted-foreground">
          Tap the + button to add your first item.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              {item.quantity} {item.unit} &middot; {item.location}
            </p>
          </div>
          {item.quantity <= item.minThreshold && (
            <span className="ml-2 shrink-0 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
              Low
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
