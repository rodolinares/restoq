import { useMemo } from 'react'
import { Bell, Moon, Package, Sun } from 'lucide-react'
import { usePurchaseStore } from '@/store/inventoryStore'
import { computeAlertCount } from '@/lib/prediction'

interface HeaderProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onAlertsClick?: () => void
}

export function Header({ theme, onToggleTheme, onAlertsClick }: HeaderProps) {
  const purchases = usePurchaseStore(s => s.purchases)
  const depletions = usePurchaseStore(s => s.depletions)

  const alertCount = useMemo(() => computeAlertCount(purchases, depletions), [purchases, depletions])

  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
      <div className="flex items-center gap-2">
        <Package className="size-5 text-primary" />
        <span className="text-lg font-semibold tracking-tight">Restoq</span>
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
    </header>
  )
}
