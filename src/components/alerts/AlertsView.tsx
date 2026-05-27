import { useMemo, useState } from 'react'
import { BellOff, RotateCcw } from 'lucide-react'
import { useInventoryStore } from '@/store'
import { Button } from '@/components/ui/button'

export function AlertsView() {
  const items = useInventoryStore(s => s.items)
  const resetAll = useInventoryStore(s => s.resetAll)
  const lowStockItems = useMemo(
    () => items.filter(item => item.quantity <= item.minThreshold),
    [items]
  )
  const [confirmReset, setConfirmReset] = useState(false)

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
          <span className={'ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ' + (item.quantity === 0 ? 'bg-destructive text-destructive-foreground' : 'badge-low')}>
            {item.quantity === 0 ? 'Out' : 'Low'}
          </span>
        </div>
      ))}

      <hr className="my-6 border-border" />

      <div className="flex justify-center pb-4">
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Delete all items?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                resetAll()
                setConfirmReset(false)
              }}
            >
              Confirm
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmReset(true)}
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            Reset all data
          </Button>
        )}
      </div>
    </div>
  )
}
