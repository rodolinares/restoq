import { useState } from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useInventoryStore } from '@/store/inventoryStore'
import { predictProduct } from '@/lib/prediction'
import type { Product } from '@/types/inventory'
import { Button } from '@/components/ui/button'
import { AddSnapshotDialog } from './AddSnapshotDialog'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

const catColor: Record<string, string> = {
  pantry: 'var(--ok)',
  cleaning: 'var(--accent)',
  bathroom: 'var(--warning)',
  pets: 'var(--primary)',
  other: 'var(--muted-foreground)'
}

const confColor: Record<string, string> = {
  none: 'var(--muted-foreground)',
  low: 'var(--warning)',
  medium: 'var(--ok)',
  high: 'var(--ok)'
}

const StockBar = ({ ratio, color }: { ratio: number; color?: string }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
    <div
      className="h-full rounded-full transition-all duration-300"
      style={{
        width: `${Math.max(0, Math.min(1, ratio)) * 100}%`,
        background: color ?? 'var(--ok)'
      }}
    />
  </div>
)

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const snapshots = useInventoryStore(s => s.snapshots)
  const purchases = useInventoryStore(s => s.purchases)
  const addSnapshot = useInventoryStore(s => s.addSnapshot)

  const [showMenu, setShowMenu] = useState(false)
  const [showSnapshot, setShowSnapshot] = useState(false)

  const productSnapshots = snapshots.filter(s => s.productId === product.id)
  const productPurchases = purchases.filter(p => p.productId === product.id)
  const pred = predictProduct(product, productSnapshots, productPurchases)

  const handleQuickSnapshot = (quantity: number) => {
    addSnapshot({
      productId: product.id,
      quantity,
      takenAt: new Date().toISOString()
    })
    toast(`Counted ${quantity} ${product.unit} of ${product.name}`, { duration: 3000 })
  }

  const borderColor = pred.isOverdue
    ? 'var(--destructive)'
    : pred.isAlert
      ? 'var(--warning)'
      : 'var(--ok)'

  const stockRatio = product.targetStock > 0 ? pred.currentStock / product.targetStock : 1

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex border-l-4" style={{ borderLeftColor: borderColor }}>
          <div className="flex-1 p-4">
            <div className="flex items-start gap-3">
              <div className="flex shrink-0 items-baseline gap-0.5">
                <span
                  className="font-heading text-4xl font-bold leading-none tracking-tight"
                  style={{ color: borderColor }}
                >
                  {pred.currentStock}
                </span>
                <span className="text-xs text-muted-foreground">{product.unit}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-heading text-lg font-semibold leading-tight">
                    {product.name}
                  </p>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                    style={{
                      background: `${catColor[product.category]}18`,
                      color: catColor[product.category]
                    }}
                  >
                    {product.category}
                  </span>
                </div>

                {pred.confidence === 'none' ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Add a count to get a prediction
                  </p>
                ) : pred.isOverdue ? (
                  <p className="mt-0.5 text-sm text-destructive">Out of stock</p>
                ) : pred.daysUntilEmpty !== null ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    ~{Math.round(pred.daysUntilEmpty)}{' '}
                    {Math.round(pred.daysUntilEmpty) === 1 ? 'day' : 'days'} left
                  </p>
                ) : null}

                {pred.confidence !== 'none' && (
                  <div className="mt-2">
                    <StockBar ratio={stockRatio} color={borderColor} />
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className="inline-block size-2 rounded-full"
                        style={{ background: confColor[pred.confidence] }}
                      />
                      <span>{pred.consumptionRatePerDay}/day</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-1 p-2">
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={() => setShowSnapshot(true)}
              aria-label="Add count"
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-3.5" />
            </Button>
            <div className="relative">
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={() => setShowMenu(p => !p)}
                aria-label="Product menu"
                className="text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 z-50 mt-1 w-36 rounded-lg border border-border bg-popover py-1 shadow-lg">
                    <button
                      type="button"
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        onEdit(product)
                        setShowMenu(false)
                      }}
                    >
                      Edit product
                    </button>
                    <button
                      type="button"
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setShowMenu(false)
                      }}
                    >
                      Log purchase
                    </button>
                    <hr className="my-1 border-border" />
                    <button
                      type="button"
                      className="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-muted"
                      onClick={() => {
                        onDelete(product)
                        setShowMenu(false)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddSnapshotDialog
        open={showSnapshot}
        onOpenChange={setShowSnapshot}
        product={product}
        onSave={handleQuickSnapshot}
      />
    </>
  )
}

export type { ProductCardProps }
