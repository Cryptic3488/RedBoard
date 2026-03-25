import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'redboard-dim'

interface ThemeContextValue {
  dim: boolean
  setDim: (v: boolean) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dim, setDimState] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')

  useEffect(() => {
    if (dim) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem(STORAGE_KEY, String(dim))
  }, [dim])

  function setDim(v: boolean) {
    setDimState(v)
  }

  return (
    <ThemeContext.Provider value={{ dim, setDim }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
