import { useState, useMemo } from 'react'
import { Clock, Frown, PackageOpen, Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { usePurchaseStore } from '@/store/inventoryStore'
import { predictConsumption } from '@/lib/prediction'
import type { PurchaseRecord, ProductPrediction, Depletion } from '@/types/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PurchaseFormDialog } from './PurchaseFormDialog'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'

const groupByProduct = (
  purchases: PurchaseRecord[],
  depletions: Depletion[] = []
): { name: string; records: PurchaseRecord[]; prediction: ProductPrediction | null }[] => {
  const map = new Map<string, PurchaseRecord[]>()
  for (const p of purchases) {
    const list = map.get(p.name) ?? []
    list.push(p)
    map.set(p.name, list)
  }
  return Array.from(map.entries())
    .map(([name, records]) => ({
      name,
      records: records.sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate)),
      prediction: predictConsumption(records, depletions)
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

const StockBar = ({ ratio }: { ratio: number }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
    <div
      className="h-full rounded-full transition-all duration-300"
      style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, background: 'var(--ok)' }}
    />
  </div>
)

export function InventoryView() {
  const purchases = usePurchaseStore(s => s.purchases)
  const depletions = usePurchaseStore(s => s.depletions)
  const removePurchase = usePurchaseStore(s => s.removePurchase)

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deletingPurchase, setDeletingPurchase] = useState<PurchaseRecord | undefined>(undefined)

  const groups = useMemo(() => {
    const all = groupByProduct(purchases, depletions)
    if (!search.trim()) return all
    const q = search.toLowerCase()
    return all.filter(g => g.name.toLowerCase().includes(q))
  }, [purchases, depletions, search])

  const handleDelete = (record: PurchaseRecord) => {
    removePurchase(record.id)
    setDeletingPurchase(undefined)
    toast('Purchase removed', { icon: <Trash2 className="size-4" />, duration: 3000 })
  }

  return (
    <>
      {purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <PackageOpen className="size-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Your pantry is bare</h2>
          <p className="max-w-64 text-sm text-muted-foreground">Record your first purchase to start tracking.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Search className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No products match your search</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map(group => (
                <ProductGroup key={group.name} group={group} onDeleteRecord={setDeletingPurchase} />
              ))}
            </div>
          )}
        </div>
      )}

      <Button
        type="button"
        size="icon"
        className="fixed bottom-20 right-4 z-40 size-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => setShowForm(true)}
      >
        <Plus className="size-6" />
      </Button>

      <PurchaseFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        existingNames={Array.from(new Set(purchases.map(p => p.name)))}
      />

      <ConfirmDeleteDialog
        open={!!deletingPurchase}
        onOpenChange={open => !open && setDeletingPurchase(undefined)}
        itemName={deletingPurchase?.name ?? ''}
        detail={deletingPurchase ? `${deletingPurchase.units} units on ${deletingPurchase.purchaseDate}` : ''}
        onConfirm={() => deletingPurchase && handleDelete(deletingPurchase)}
      />
    </>
  )
}

interface ProductGroupProps {
  group: {
    name: string
    records: PurchaseRecord[]
    prediction: ProductPrediction | null
  }
  onDeleteRecord: (record: PurchaseRecord) => void
}

function getProductDepletion(productName: string, depletions: Depletion[]): Depletion | undefined {
  const matches = depletions.filter(d => d.productName === productName)
  if (matches.length === 0) return undefined
  return matches.sort((a, b) => b.depletedAt.localeCompare(a.depletedAt))[0]
}

const ProductGroup = ({ group, onDeleteRecord }: ProductGroupProps) => {
  const depletions = usePurchaseStore(s => s.depletions)
  const markDepleted = usePurchaseStore(s => s.markDepleted)
  const clearDepletion = usePurchaseStore(s => s.clearDepletion)

  const pred = group.prediction
  const depletion = getProductDepletion(group.name, depletions)
  const isDepleted = depletion !== undefined

  const isExpired =
    !isDepleted && pred?.daysUntilEmpty !== null && pred?.daysUntilEmpty !== undefined && pred.daysUntilEmpty <= 0

  const isLow =
    !isDepleted &&
    pred?.daysUntilEmpty !== null &&
    pred?.daysUntilEmpty !== undefined &&
    pred.daysUntilEmpty > 0 &&
    pred.daysUntilEmpty <= 7

  const stock = isDepleted ? 0 : pred?.estimatedCurrentStock ?? 0
  const stockRatio = isDepleted ? 0 : pred?.lastPurchaseUnits ? stock / pred.lastPurchaseUnits : 1

  const borderColor = isDepleted
    ? 'var(--muted-foreground)'
    : isExpired
      ? 'var(--destructive)'
      : isLow
        ? 'var(--warning)'
        : 'var(--ok)'

  const handleMarkDepleted = () => {
    markDepleted(group.name)
    toast(`Marked "${group.name}" as depleted`, { duration: 3000 })
  }

  const handleUndoDepleted = () => {
    clearDepletion(group.name)
    toast(`Restored "${group.name}"`, { duration: 3000 })
  }

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
                {stock}
              </span>
              {!isDepleted && pred?.lastPurchaseUnits && (
                <span className="text-xs text-muted-foreground">
                  /{pred.lastPurchaseUnits}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-lg font-semibold leading-tight">{group.name}</p>
              {pred && !isDepleted && pred.daysUntilEmpty !== null && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  ~{Math.round(pred.daysUntilEmpty)}{' '}
                  {Math.round(pred.daysUntilEmpty) === 1 ? 'day' : 'days'} left
                  {pred.confidence === 'low' && ' (estimate)'}
                </p>
              )}
              {isDepleted && depletion && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Depleted {depletion.depletedAt}
                </p>
              )}
              {!isDepleted && pred && (
                <div className="mt-2">
                  <StockBar ratio={stockRatio} />
                  {pred.dailyUsage !== null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {pred.dailyUsage}/day &middot; {pred.confidence} confidence
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-1 p-3">
          {isDepleted ? (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={handleUndoDepleted}
              aria-label="Undo mark as depleted"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={handleMarkDepleted}
              aria-label="Mark as depleted"
              className="text-muted-foreground hover:text-foreground"
            >
              <Frown className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
      {group.records.length > 0 && (
        <div className="divide-y divide-border border-t border-dashed border-muted-foreground/20">
          {group.records.map(record => (
            <div key={record.id} className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-3 shrink-0" />
                <span>{record.purchaseDate}</span>
                <span className="font-medium text-foreground/70">&times; {record.units}</span>
              </div>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={() => onDeleteRecord(record)}
                aria-label="Delete purchase"
                className="text-muted-foreground/50 hover:text-destructive"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
