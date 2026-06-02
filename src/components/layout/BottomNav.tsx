import { useMemo } from 'react'
import { Bell, Package } from 'lucide-react'
import { usePurchaseStore } from '@/store'
import { purchaseEngine } from '@/lib/prediction'

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

  const alertCount = useMemo(() => {
    const map = new Map<string, { units: number; date: string }[]>()
    for (const p of purchases) {
      const list = map.get(p.name) ?? []
      list.push({ units: p.units, date: p.purchaseDate })
      map.set(p.name, list)
    }

    let count = 0
    for (const records of map.values()) {
      const pred = purchaseEngine.predict(
        records.map(r => ({
          id: '',
          name: '',
          units: r.units,
          purchaseDate: r.date
        }))
      )
      if (pred && pred.daysUntilEmpty !== null && pred.daysUntilEmpty <= 7) {
        count++
      }
    }
    return count
  }, [purchases])

  return (
    <nav className="flex border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)]">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={
            'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ' +
            (activeTab === id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')
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
    </nav>
  )
}
