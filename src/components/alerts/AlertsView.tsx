import { useMemo, useState } from 'react'
import { BellOff, RotateCcw } from 'lucide-react'
import { useInventoryStore } from '@/store'
import { simpleEngine } from '@/lib/prediction'
import type { InventoryItem, ItemPrediction } from '@/types'
import { Button } from '@/components/ui/button'

export function AlertsView() {
  const items = useInventoryStore(s => s.items)
  const consumptionLog = useInventoryStore(s => s.consumptionLog)
  const resetAll = useInventoryStore(s => s.resetAll)

  const entries = useMemo(() => {
    const low = items.filter(item => item.quantity <= item.minThreshold)
    const withPrediction: { item: InventoryItem; prediction: ItemPrediction | null }[] = []
    for (const item of low) {
      const history = consumptionLog.filter(e => e.itemId === item.id)
      const prediction =
        history.length > 0 ? simpleEngine.predict(item.quantity, item.minThreshold, history) : null
      withPrediction.push({ item, prediction })
    }
    withPrediction.sort((a, b) => {
      const da = a.prediction?.daysUntilEmpty ?? Infinity
      const db = b.prediction?.daysUntilEmpty ?? Infinity
      return da - db
    })
    return withPrediction
  }, [items, consumptionLog])

  const [confirmReset, setConfirmReset] = useState(false)

  if (entries.length === 0) {
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
      {entries.map(({ item, prediction }) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-lg border border-border bg-destructive/5 px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              {item.quantity} / {item.minThreshold} {item.unit}
            </p>
            {prediction &&
              prediction.daysUntilEmpty !== null &&
              (() => {
                const d = prediction.daysUntilEmpty
                const color =
                  d <= 0
                    ? 'text-destructive'
                    : d <= 7
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground'
                return (
                  <p className={'mt-0.5 text-xs ' + color}>
                    {d <= 0
                      ? 'Overdue for restock'
                      : `~${Math.round(d)} day${Math.round(d) === 1 ? '' : 's'} until empty`}
                    {prediction.confidence === 'low' && ' (estimate)'}
                  </p>
                )
              })()}
          </div>
          <span
            className={
              'ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ' +
              (item.quantity === 0 ? 'bg-destructive text-destructive-foreground' : 'badge-low')
            }
          >
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
            <Button variant="outline" size="sm" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="mr-1.5 size-3.5" />
            Reset all data
          </Button>
        )}
      </div>
    </div>
  )
}
