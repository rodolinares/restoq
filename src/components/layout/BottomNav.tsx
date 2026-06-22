import { useMemo } from 'react'
import { Bell, Package } from 'lucide-react'
import { usePurchaseStore } from '@/store/inventoryStore'
import { computeAlertCount } from '@/lib/prediction'

export type TabId = 'inventory' | 'alerts'

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string; icon: typeof Package }[] = [
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'alerts', label: 'Alerts', icon: Bell }
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const purchases = usePurchaseStore(s => s.purchases)
  const depletions = usePurchaseStore(s => s.depletions)

  const alertCount = useMemo(() => computeAlertCount(purchases, depletions), [purchases, depletions])

  return (
    <nav className="relative border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)]">
      <div className="absolute -top-px left-0 right-0 flex">
        {tabs.map(({ id }) => (
          <div
            key={id}
            className={'h-0.5 flex-1 transition-colors ' + (activeTab === id ? 'bg-primary' : 'bg-transparent')}
          />
        ))}
      </div>
      <div className="flex">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={
              'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ' +
              (activeTab === id ? 'text-primary' : 'text-muted-foreground hover:text-foreground')
            }
          >
            <Icon className="size-5" />
            <span>{label}</span>
            {id === 'alerts' && alertCount > 0 && (
              <span className="absolute right-21 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
