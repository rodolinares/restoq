import { BellOff } from 'lucide-react'
import { useInventoryStore } from '@/store'

export function AlertsView() {
  const lowStockItems = useInventoryStore(s => s.lowStockItems())

  if (lowStockItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <BellOff className="size-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">All stocked up</h2>
        <p className="max-w-64 text-sm text-muted-foreground">
          No items are running low right now.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {lowStockItems.map(item => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-lg border border-border bg-destructive/5 px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              {item.quantity} / {item.minThreshold} {item.unit}
            </p>
          </div>
          <span className="ml-2 shrink-0 rounded-full bg-destructive px-2.5 py-0.5 text-xs font-medium text-destructive-foreground">
            {item.quantity === 0 ? 'Out' : 'Low'}
          </span>
        </div>
      ))}
    </div>
  )
}
