import { Bell, Moon, Package, Sun } from 'lucide-react'
import { useInventoryStore } from '@/store'

interface HeaderProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onAlertsClick?: () => void
}

export function Header({ theme, onToggleTheme, onAlertsClick }: HeaderProps) {
  const lowStockCount = useInventoryStore(s =>
    s.items.reduce((acc, item) => (item.quantity <= item.minThreshold ? acc + 1 : acc), 0)
  )

  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
      <div className="flex items-center gap-2">
        <Package className="size-5 text-primary" />
        <span className="text-lg font-semibold tracking-tight">RestoQ</span>
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
          {lowStockCount > 0 && (
            <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              {lowStockCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
