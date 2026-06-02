import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'restoq-theme'

function getSystemPreference(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
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
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== 'dark' && stored !== 'light') {
        const sys = mql.matches ? 'dark' : 'light'
        applyTheme(sys)
        setTheme(sys)
      }
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }, [theme])

  return { theme, toggle }
}
