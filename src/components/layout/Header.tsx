import { Bell, Package } from 'lucide-react'
import { useInventoryStore } from '@/store'

export function Header() {
  const lowStockCount = useInventoryStore(s =>
    s.items.reduce((acc, item) => (item.quantity <= item.minThreshold ? acc + 1 : acc), 0)
  )

  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
      <div className="flex items-center gap-2">
        <Package className="size-5 text-primary" />
        <span className="text-lg font-semibold tracking-tight">RestoQ</span>
      </div>
      <button
        type="button"
        className="relative rounded-full p-1.5 text-muted-foreground hover:text-foreground"
        aria-label="View alerts"
      >
        <Bell className="size-5" />
        {lowStockCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            {lowStockCount}
          </span>
        )}
      </button>
    </header>
  )
}
