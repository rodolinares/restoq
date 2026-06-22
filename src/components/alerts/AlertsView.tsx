import { useMemo, useState } from 'react'
import { BellOff, RotateCcw } from 'lucide-react'
import { usePurchaseStore } from '@/store/inventoryStore'
import { predictConsumption } from '@/lib/prediction'
import type { ProductPrediction } from '@/types/inventory'
import { Button } from '@/components/ui/button'

export function AlertsView() {
  const purchases = usePurchaseStore(s => s.purchases)
  const depletions = usePurchaseStore(s => s.depletions)
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
      const pred = predictConsumption(records, depletions)
      if (pred && pred.daysUntilEmpty !== null && pred.daysUntilEmpty <= 7) {
        result.push({ name, prediction: pred })
      }
    }

    return result.sort((a, b) => (a.prediction.daysUntilEmpty ?? Infinity) - (b.prediction.daysUntilEmpty ?? Infinity))
  }, [purchases, depletions])

  const [confirmReset, setConfirmReset] = useState(false)

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <BellOff className="size-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">All stocked up</h2>
        <p className="max-w-64 text-sm text-muted-foreground">Nothing needs restocking right now.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map(({ name, prediction }) => {
        const isOut = prediction.daysUntilEmpty !== null && prediction.daysUntilEmpty <= 0
        const borderColor = isOut ? 'var(--destructive)' : 'var(--warning)'
        const stock = prediction.estimatedCurrentStock
        const stockRatio = prediction.lastPurchaseUnits ? stock / prediction.lastPurchaseUnits : 0

        return (
          <div
            key={name}
            className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
          >
            <div className="flex border-l-4" style={{ borderLeftColor: borderColor }}>
              <div className="flex-1 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex shrink-0 items-baseline gap-0.5">
                    <span
                      className="font-heading text-4xl font-bold leading-none tracking-tight"
                      style={{ color: borderColor }}
                    >
                      {stock}
                    </span>
                    {prediction.lastPurchaseUnits && (
                      <span className="text-xs text-muted-foreground">
                        /{prediction.lastPurchaseUnits}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-lg font-semibold leading-tight">{name}</p>
                    <p className={isOut ? 'mt-0.5 text-sm text-destructive' : 'mt-0.5 text-sm text-warning'}>
                      {isOut
                        ? 'Overdue for restock'
                        : `~${Math.round(prediction.daysUntilEmpty!)} day${Math.round(prediction.daysUntilEmpty!) === 1 ? '' : 's'} left`}
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(0, Math.min(1, stockRatio)) * 100}%`, background: borderColor }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
