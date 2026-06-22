import { useMemo } from 'react'
import { Bell, Moon, Package, Sun } from 'lucide-react'
import { useInventoryStore } from '@/store/inventoryStore'
import { computeAlertCount } from '@/lib/prediction'

interface HeaderProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onAlertsClick?: () => void
}

export function Header({ theme, onToggleTheme, onAlertsClick }: HeaderProps) {
  const products = useInventoryStore(s => s.products)
  const snapshots = useInventoryStore(s => s.snapshots)
  const purchases = useInventoryStore(s => s.purchases)

  const alertCount = useMemo(
    () => computeAlertCount(products, snapshots, purchases),
    [products, snapshots, purchases]
  )

  return (
    <header className="border-b border-border bg-background">
      <div className="h-1 bg-gradient-to-r from-ok via-accent to-destructive opacity-60" />
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Package className="size-5 text-accent" />
          <span className="font-heading text-lg font-semibold tracking-tight">Restoq</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>

          <button
            type="button"
            onClick={onAlertsClick}
            className="relative rounded-full p-1.5 text-muted-foreground hover:text-foreground"
            aria-label="View alerts"
          >
            <Bell className="size-5" />
            {alertCount > 0 && (
              <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                {alertCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
