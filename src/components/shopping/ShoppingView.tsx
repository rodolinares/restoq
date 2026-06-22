import { useState } from 'react'
import { Copy, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { useInventoryStore } from '@/store/inventoryStore'
import { predictProduct } from '@/lib/prediction'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ShoppingViewProps {
  preselectedProductIds?: string[]
}

interface ShoppingItem {
  productId: string
  name: string
  currentStock: number
  targetStock: number
  unit: string
  suggestedQty: number
}

export function ShoppingView({ preselectedProductIds }: ShoppingViewProps) {
  const products = useInventoryStore(s => s.products)
  const snapshots = useInventoryStore(s => s.snapshots)
  const purchases = useInventoryStore(s => s.purchases)

  const items: ShoppingItem[] = []
  for (const product of products) {
    const productSnapshots = snapshots.filter(s => s.productId === product.id)
    const productPurchases = purchases.filter(p => p.productId === product.id)
    const pred = predictProduct(product, productSnapshots, productPurchases)
    if (pred.isAlert) {
      items.push({
        productId: product.id,
        name: product.name,
        currentStock: pred.currentStock,
        targetStock: product.targetStock,
        unit: product.unit,
        suggestedQty: Math.max(0, product.targetStock - pred.currentStock)
      })
    }
  }
  items.sort((a, b) => a.name.localeCompare(b.name))

  const isPreseeded = preselectedProductIds && preselectedProductIds.length > 0

  const qtyKey = (item: ShoppingItem) =>
    quantities[item.productId] ?? item.suggestedQty

  const selKey = (item: ShoppingItem) => {
    if (item.productId in selected) return selected[item.productId]
    return isPreseeded ? preselectedProductIds!.includes(item.productId) : true
  }

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const toggle = (productId: string) => {
    setSelected(s => ({ ...s, [productId]: !selKey(items.find(i => i.productId === productId)!) }))
  }

  const updateQty = (productId: string, qty: number) => {
    setQuantities(q => ({ ...q, [productId]: Math.max(0, qty) }))
  }

  const copyList = async () => {
    const lines = ['Shopping list — Restoq']
    for (const item of items) {
      if (selKey(item)) {
        const qty = qtyKey(item)
        if (qty > 0) {
          lines.push(`• ${item.name}: ${qty} ${item.unit}`)
        }
      }
    }

    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast('Shopping list copied', { duration: 3000 })
    } catch {
      toast('Failed to copy', { duration: 3000 })
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <ShoppingCart className="size-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Shopping list empty</h2>
        <p className="max-w-64 text-sm text-muted-foreground">
          No products need restocking. Items appear here when stock runs low.
        </p>
      </div>
    )
  }

  const hasSelected = items.some(i => selKey(i))

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Adjust quantities and deselect items you don't need.
      </p>

      <div className="space-y-2">
        {items.map(item => {
          const isSelected = selKey(item)
          const qty = qtyKey(item)

          return (
            <div
              key={item.productId}
              className={
                'overflow-hidden rounded-lg border bg-card shadow-sm transition-opacity ' +
                (isSelected
                  ? 'border-border'
                  : 'border-dashed border-muted-foreground/30 opacity-60')
              }
            >
              <div className="flex items-center gap-3 p-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(item.productId)}
                  className="size-4 accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.currentStock} {item.unit} in stock
                    {item.targetStock > 0 && ` / target ${item.targetStock}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={qty}
                    onChange={e => updateQty(item.productId, Number(e.target.value))}
                    className="h-8 w-20 text-center text-sm"
                    disabled={!isSelected}
                  />
                  <span className="text-xs text-muted-foreground">{item.unit}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Button
        type="button"
        className="mt-4 w-full"
        onClick={copyList}
        disabled={!hasSelected}
      >
        <Copy className="mr-1.5 size-4" />
        Copy list
      </Button>
    </div>
  )
}
