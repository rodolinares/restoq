import { useMemo, useState } from 'react'
import { BellOff, RotateCcw } from 'lucide-react'
import { usePurchaseStore } from '@/store'
import { purchaseEngine } from '@/lib/prediction'
import type { ProductPrediction } from '@/types'
import { Button } from '@/components/ui/button'

export function AlertsView() {
  const purchases = usePurchaseStore(s => s.purchases)
  const resetAll = usePurchaseStore(s => s.resetAll)

  const alerts = useMemo(() => {
    const map = new Map<string, { records: typeof purchases; prediction: ProductPrediction | null }>()
    for (const p of purchases) {
      const entry = map.get(p.name) ?? {
        records: [],
        prediction: null as ProductPrediction | null
      }
      entry.records.push(p)
      map.set(p.name, entry)
    }

    const result: { name: string; prediction: ProductPrediction }[] = []
    for (const [name, { records }] of map) {
      const pred = purchaseEngine.predict(records)
      if (
        pred &&
        pred.daysUntilEmpty !== null &&
        pred.daysUntilEmpty <= 7
      ) {
        result.push({ name, prediction: pred })
      }
    }

    return result.sort(
      (a, b) => (a.prediction.daysUntilEmpty ?? Infinity) - (b.prediction.daysUntilEmpty ?? Infinity)
    )
  }, [purchases])

  const [confirmReset, setConfirmReset] = useState(false)

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <BellOff className="size-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">All stocked up</h2>
        <p className="max-w-64 text-sm text-muted-foreground">
          No products are predicted to run out soon.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map(({ name, prediction }) => {
        const isOut = prediction.daysUntilEmpty !== null && prediction.daysUntilEmpty <= 0
        return (
          <div
            key={name}
            className="flex items-center justify-between rounded-lg border border-border bg-destructive/5 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{name}</p>
              <p className="text-sm text-muted-foreground">
                Est. stock: {prediction.estimatedCurrentStock}
              </p>
              {prediction.daysUntilEmpty !== null && (
                <p
                  className={
                    'mt-0.5 text-xs ' +
                    (isOut
                      ? 'text-destructive'
                      : 'text-amber-600 dark:text-amber-400')
                  }
                >
                  {isOut
                    ? 'Overdue for restock'
                    : `~${Math.round(prediction.daysUntilEmpty)} day${Math.round(prediction.daysUntilEmpty) === 1 ? '' : 's'}`}
                  {prediction.confidence === 'low' && ' (estimate)'}
                </p>
              )}
            </div>
            <span
              className={
                'ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ' +
                (isOut
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-amber-100/70 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300')
              }
            >
              {isOut ? 'Out' : 'Low'}
            </span>
          </div>
        )
      })}

      <hr className="my-6 border-border" />

      <div className="flex justify-center pb-4">
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Delete all purchase records?</span>
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
