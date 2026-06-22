import { useMemo, useState } from 'react'
import { BellOff, ClipboardList, RotateCcw } from 'lucide-react'
import { useInventoryStore } from '@/store/inventoryStore'
import { predictProduct } from '@/lib/prediction'
import type { ProductPrediction } from '@/types/inventory'
import { Button } from '@/components/ui/button'

interface AlertItem {
  productId: string
  name: string
  prediction: ProductPrediction
  unit: string
}

interface AlertsViewProps {
  onGenerateShoppingList?: (productIds: string[]) => void
}

export function AlertsView({ onGenerateShoppingList }: AlertsViewProps) {
  const products = useInventoryStore(s => s.products)
  const snapshots = useInventoryStore(s => s.snapshots)
  const purchases = useInventoryStore(s => s.purchases)
  const resetAll = useInventoryStore(s => s.resetAll)

  const alerts = useMemo(() => {
    const result: AlertItem[] = []

    for (const product of products) {
      const productSnapshots = snapshots.filter(s => s.productId === product.id)
      const productPurchases = purchases.filter(p => p.productId === product.id)
      const pred = predictProduct(product, productSnapshots, productPurchases)

      if (pred.isAlert) {
        result.push({
          productId: product.id,
          name: product.name,
          prediction: pred,
          unit: product.unit
        })
      }
    }

    return result.sort(
      (a, b) => (a.prediction.daysUntilEmpty ?? Infinity) - (b.prediction.daysUntilEmpty ?? Infinity)
    )
  }, [products, snapshots, purchases])

  const [confirmReset, setConfirmReset] = useState(false)

  const overdue = alerts.filter(a => a.prediction.isOverdue)
  const low = alerts.filter(a => !a.prediction.isOverdue)

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
      {overdue.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-destructive">Out of stock</h3>
          <div className="space-y-2">
            {overdue.map(item => (
              <AlertCard key={item.productId} item={item} isOverdue />
            ))}
          </div>
        </div>
      )}

      {low.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-warning">Low stock</h3>
          <div className="space-y-2">
            {low.map(item => (
              <AlertCard key={item.productId} item={item} isOverdue={false} />
            ))}
          </div>
        </div>
      )}

      <Button
        type="button"
        className="mt-4 w-full"
        onClick={() => onGenerateShoppingList?.(alerts.map(a => a.productId))}
      >
        <ClipboardList className="mr-1.5 size-4" />
        Generate shopping list
      </Button>

      <hr className="my-6 border-border" />

      <div className="flex justify-center pb-4">
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Delete all data?</span>
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

function AlertCard({ item, isOverdue }: { item: AlertItem; isOverdue: boolean }) {
  const borderColor = isOverdue ? 'var(--destructive)' : 'var(--warning)'
  const { prediction: pred, name, unit } = item
  const stockRatio = pred.currentStock / (pred.currentStock + 1)

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex border-l-4" style={{ borderLeftColor: borderColor }}>
        <div className="flex-1 p-4">
          <div className="flex items-start gap-4">
            <div className="flex shrink-0 items-baseline gap-0.5">
              <span
                className="font-heading text-4xl font-bold leading-none tracking-tight"
                style={{ color: borderColor }}
              >
                {pred.currentStock}
              </span>
              <span className="text-xs text-muted-foreground">{unit}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-lg font-semibold leading-tight">{name}</p>
              <p className={isOverdue ? 'mt-0.5 text-sm text-destructive' : 'mt-0.5 text-sm text-warning'}>
                {isOverdue
                  ? 'Overdue for restock'
                  : `~${Math.round(pred.daysUntilEmpty!)} day${Math.round(pred.daysUntilEmpty!) === 1 ? '' : 's'} left`}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(1, stockRatio)) * 100}%`,
                    background: borderColor
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
