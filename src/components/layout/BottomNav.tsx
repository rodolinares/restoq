import { Bell, Package } from 'lucide-react'
import { useInventoryStore } from '@/store'

export type TabId = 'inventory' | 'alerts'

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string; icon: typeof Package }[] = [
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'alerts', label: 'Alerts', icon: Bell },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const lowStockCount = useInventoryStore(s =>
    s.items.reduce((acc, item) => (item.quantity <= item.minThreshold ? acc + 1 : acc), 0)
  )

  return (
    <nav className="flex border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)]">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={
            'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ' +
            (activeTab === id
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground')
          }
        >
          <Icon className="size-5" />
          <span>{label}</span>
          {id === 'alerts' && lowStockCount > 0 && (
            <span className="absolute right-21 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              {lowStockCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}
