import { useState } from 'react'
import { Toaster } from 'sonner'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import { AppShell } from './components/layout/AppShell'
import { InventoryView } from './components/inventory/InventoryView'
import { AlertsView } from './components/alerts/AlertsView'
import { ShoppingView } from './components/shopping/ShoppingView'
import type { TabId } from './components/layout/BottomNav'
import { useTheme } from './hooks/useTheme'
import { useInventoryStore } from './store/inventoryStore'
import { useNotifications } from './hooks/useNotifications'

const App = () => {
  const [activeTab, setActiveTab] = useState<TabId>('inventory')
  const { theme, toggle: toggleTheme } = useTheme()
  const products = useInventoryStore(s => s.products)
  const snapshots = useInventoryStore(s => s.snapshots)
  const purchases = useInventoryStore(s => s.purchases)
  useNotifications(products, snapshots, purchases)

  return (
    <>
      <AppShell
        header={
          <Header
            theme={theme}
            onToggleTheme={toggleTheme}
            onAlertsClick={() => setActiveTab('alerts')}
          />
        }
        nav={<BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}
      >
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'alerts' && (
          <AlertsView
            onGenerateShoppingList={() => setActiveTab('shopping')}
          />
        )}
        {activeTab === 'shopping' && <ShoppingView />}
      </AppShell>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--popover)',
            color: 'var(--popover-foreground)',
            border: '1px solid var(--border)'
          }
        }}
      />
    </>
  )
}

export default App
