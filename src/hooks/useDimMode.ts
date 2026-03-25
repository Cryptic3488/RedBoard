import { useEffect, useState } from 'react'

const STORAGE_KEY = 'redboard-dim'

export function useDimMode() {
  const [dim, setDim] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')

  useEffect(() => {
    if (dim) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem(STORAGE_KEY, String(dim))
  }, [dim])

  return { dim, setDim }
}
