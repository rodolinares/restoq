import type { ReactNode } from 'react'

interface AppShellProps {
  header: ReactNode
  nav: ReactNode
  children: ReactNode
}

export function AppShell({ header, nav, children }: AppShellProps) {
  return (
    <div className="mx-auto flex h-dvh max-w-lg flex-col bg-background">
      {header}
      <main className="flex-1 overflow-y-auto px-4 pb-4 pt-4">{children}</main>
      {nav}
    </div>
  )
}
