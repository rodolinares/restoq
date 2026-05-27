import { useState, useMemo } from 'react'
import { Minus, PackageOpen, Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useInventoryStore } from '@/store'
import { simpleEngine } from '@/lib/prediction'
import { CATEGORIES, LOCATIONS } from '@/lib/constants'
import type { InventoryItem, Location, ItemPrediction } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ItemFormDialog } from './ItemFormDialog'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'

type SortKey =
  | 'name-asc'
  | 'name-desc'
  | 'qty-asc'
  | 'qty-desc'
  | 'updated-desc'
  | 'updated-asc'
  | 'urgency-asc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'qty-asc', label: 'Qty (lowest)' },
  { value: 'qty-desc', label: 'Qty (highest)' },
  { value: 'updated-desc', label: 'Recent first' },
  { value: 'updated-asc', label: 'Oldest first' },
  { value: 'urgency-asc', label: 'Urgency (soonest)' }
]

function sortItems(
  items: InventoryItem[],
  sortKey: SortKey,
  predictions: Map<string, ItemPrediction | null>
): InventoryItem[] {
  const copy = [...items]
  switch (sortKey) {
    case 'name-asc':
      return copy.sort((a, b) => a.name.localeCompare(b.name))
    case 'name-desc':
      return copy.sort((a, b) => b.name.localeCompare(a.name))
    case 'qty-asc':
      return copy.sort((a, b) => a.quantity - b.quantity)
    case 'qty-desc':
      return copy.sort((a, b) => b.quantity - a.quantity)
    case 'updated-desc':
      return copy.sort((a, b) => b.updatedAt - a.updatedAt)
    case 'updated-asc':
      return copy.sort((a, b) => a.updatedAt - b.updatedAt)
    case 'urgency-asc':
      return copy.sort((a, b) => {
        const da = predictions.get(a.id)?.daysUntilEmpty ?? Infinity
        const db = predictions.get(b.id)?.daysUntilEmpty ?? Infinity
        return da - db
      })
  }
}

export function InventoryView() {
  const items = useInventoryStore(s => s.items)
  const consumptionLog = useInventoryStore(s => s.consumptionLog)
  const adjustQuantity = useInventoryStore(s => s.adjustQuantity)
  const removeItem = useInventoryStore(s => s.removeItem)

  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState<Location | '__all__'>('__all__')
  const [categoryFilter, setCategoryFilter] = useState('__all__')
  const [sortKey, setSortKey] = useState<SortKey>('name-asc')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | undefined>(undefined)

  const predictions = useMemo(() => {
    const map = new Map<string, ItemPrediction | null>()
    for (const item of items) {
      const history = consumptionLog.filter(e => e.itemId === item.id)
      map.set(
        item.id,
        history.length > 0 ? simpleEngine.predict(item.quantity, item.minThreshold, history) : null
      )
    }
    return map
  }, [items, consumptionLog])

  const filteredItems = useMemo(() => {
    let result = items

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(item => item.name.toLowerCase().includes(q))
    }

    if (locationFilter !== '__all__') {
      result = result.filter(item => item.location === locationFilter)
    }

    if (categoryFilter !== '__all__') {
      result = result.filter(item => item.category === categoryFilter)
    }

    return sortItems(result, sortKey, predictions)
  }, [items, search, locationFilter, categoryFilter, sortKey, predictions])

  const hasFilters = search || locationFilter !== '__all__' || categoryFilter !== '__all__'

  function openAdd() {
    setEditingItem(undefined)
    setDialogOpen(true)
  }

  function openEdit(item: InventoryItem) {
    setEditingItem(item)
    setDialogOpen(true)
  }

  function handleDelete(item: InventoryItem) {
    removeItem(item.id)
    setDeletingItem(undefined)
    toast(`${item.name} deleted`, { icon: <Trash2 className="size-4" /> })
  }

  return (
    <>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <PackageOpen className="size-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Your inventory is empty</h2>
          <p className="max-w-64 text-sm text-muted-foreground">
            Tap the + button to add your first item.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
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

          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={locationFilter}
                onValueChange={v => setLocationFilter(v as Location | '__all__')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All locations</SelectItem>
                  {LOCATIONS.map(l => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All categories</SelectItem>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32 shrink-0">
              <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            {hasFilters && items.length !== filteredItems.length && ` of ${items.length}`}
          </p>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Search className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {hasFilters ? 'No items match your filters' : 'No items yet'}
              </p>
              {hasFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setLocationFilter('__all__')
                    setCategoryFilter('__all__')
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5"
                >
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="outline"
                    disabled={item.quantity <= 0}
                    onClick={() => adjustQuantity(item.id, -1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-3" />
                  </Button>

                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium leading-tight">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.quantity} {item.unit} &middot; {item.location}
                      {item.category ? ` · ${item.category}` : ''}
                    </p>
                    {(() => {
                      const p = predictions.get(item.id)
                      if (!p || p.daysUntilEmpty === null) return null
                      const d = p.daysUntilEmpty
                      const color =
                        d <= 0
                          ? 'text-destructive'
                          : d <= 7
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground'
                      return (
                        <p className={'mt-0.5 truncate text-xs ' + color}>
                          {d <= 0
                            ? 'Overdue'
                            : `~${Math.round(d)} day${Math.round(d) === 1 ? '' : 's'}`}
                          {p.confidence === 'low' && ' (estimate)'}
                        </p>
                      )
                    })()}
                  </button>

                  {item.quantity <= item.minThreshold && (
                    <span
                      className={
                        'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ' +
                        (item.quantity === 0 ? 'badge-out' : 'badge-low')
                      }
                    >
                      {item.quantity === 0 ? 'Out' : 'Low'}
                    </span>
                  )}

                  <Button
                    type="button"
                    size="icon-xs"
                    variant="outline"
                    onClick={() => adjustQuantity(item.id, 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-3" />
                  </Button>

                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => setDeletingItem(item)}
                    aria-label="Delete item"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Button
        type="button"
        size="icon"
        className="fixed bottom-20 right-4 z-40 size-12 rounded-full shadow-lg"
        onClick={openAdd}
      >
        <Plus className="size-6" />
      </Button>

      <ItemFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editItem={editingItem} />

      <ConfirmDeleteDialog
        open={!!deletingItem}
        onOpenChange={open => !open && setDeletingItem(undefined)}
        itemName={deletingItem?.name ?? ''}
        onConfirm={() => deletingItem && handleDelete(deletingItem)}
      />
    </>
  )
}
