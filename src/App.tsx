import { useState } from 'react'
import { Toaster } from 'sonner'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import { AppShell } from './components/layout/AppShell'
import { InventoryView } from './components/inventory/InventoryView'
import { AlertsView } from './components/alerts/AlertsView'
import type { TabId } from './components/layout/BottomNav'
import { useTheme } from './hooks/useTheme'

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('inventory')
  const { theme, toggle: toggleTheme } = useTheme()

  return (
    <>
      <AppShell
        header={<Header theme={theme} onToggleTheme={toggleTheme} onAlertsClick={() => setActiveTab('alerts')} />}
        nav={<BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}
      >
        {activeTab === 'inventory' ? <InventoryView /> : <AlertsView />}
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
