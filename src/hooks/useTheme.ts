import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'restoq-theme'

function getSystemPreference(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getSnapshot(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function subscribe(callback: () => void) {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function applyTheme(theme: 'dark' | 'light') {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(STORAGE_KEY, theme)
}

function getInitialTheme(): 'dark' | 'light' {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return getSystemPreference()
}

// Run before React hydrates
applyTheme(getInitialTheme())

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot)

  const toggle = useCallback(() => {
    applyTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme])

  return { theme, toggle }
}
