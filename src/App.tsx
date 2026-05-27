import { useState } from 'react'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import { AppShell } from './components/layout/AppShell'
import { InventoryView } from './components/inventory/InventoryView'
import { AlertsView } from './components/alerts/AlertsView'
import type { TabId } from './components/layout/BottomNav'

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('inventory')

  return (
    <AppShell
      header={<Header />}
      nav={<BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}
    >
      {activeTab === 'inventory' ? <InventoryView /> : <AlertsView />}
    </AppShell>
  )
}

export default App
