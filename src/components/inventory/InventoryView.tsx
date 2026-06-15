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
          <h2 className="text-lg font-semibold">No purchases yet</h2>
          <p className="max-w-64 text-sm text-muted-foreground">Tap the + button to record your first purchase.</p>
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
        className="fixed bottom-20 right-4 z-40 size-12 rounded-full shadow-lg"
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

  const handleMarkDepleted = () => {
    markDepleted(group.name)
    toast(`Marked "${group.name}" as depleted`, { duration: 3000 })
  }

  const handleUndoDepleted = () => {
    clearDepletion(group.name)
    toast(`Restored "${group.name}"`, { duration: 3000 })
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{group.name}</p>
          {pred && (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span>
                Stock:{' '}
                <span
                  className={
                    isDepleted || isExpired
                      ? 'font-medium text-destructive'
                      : isLow
                        ? 'font-medium text-amber-600 dark:text-amber-400'
                        : 'font-medium text-foreground'
                  }
                >
                  {isDepleted ? 0 : pred.estimatedCurrentStock}
                </span>
              </span>
              {!isDepleted && pred.daysUntilEmpty !== null && (
                <span>
                  &middot; ~{Math.round(pred.daysUntilEmpty)} {Math.round(pred.daysUntilEmpty) === 1 ? 'day' : 'days'}
                </span>
              )}
              {isDepleted && depletion && (
                <span className="text-muted-foreground/60">&middot; Depleted {depletion.depletedAt}</span>
              )}
              {!isDepleted && pred.confidence === 'low' && <span className="text-muted-foreground/60">(estimate)</span>}
              {!isDepleted && pred.confidence === 'high' && (
                <span className="text-emerald-600 dark:text-emerald-400">(high confidence)</span>
              )}
              {!isDepleted && pred.dailyUsage !== null && (
                <span className="text-muted-foreground/60">&middot; {pred.dailyUsage}/day</span>
              )}
            </div>
          )}
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-1.5">
          {isDepleted ? (
            <>
              <span className="rounded-full bg-destructive/12 px-2.5 py-0.5 text-xs font-medium text-destructive">
                Depleted
              </span>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={handleUndoDepleted}
                aria-label="Undo mark as depleted"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </Button>
            </>
          ) : (
            <>
              {isExpired && (
                <span className="rounded-full bg-destructive/12 px-2.5 py-0.5 text-xs font-medium text-destructive">
                  Out
                </span>
              )}
              {isLow && (
                <span className="rounded-full bg-amber-100/70 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/25 dark:text-amber-300">
                  Low
                </span>
              )}
              {group.records.length > 0 && (
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
            </>
          )}
        </div>
      </div>

      <div className="divide-y divide-border">
        {group.records.map(record => (
          <div key={record.id} className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-3.5 text-muted-foreground" />
              <span>{record.purchaseDate}</span>
              <span className="font-medium">&times; {record.units}</span>
            </div>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={() => onDeleteRecord(record)}
              aria-label="Delete purchase"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
