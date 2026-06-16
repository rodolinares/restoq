import { useState, useEffect } from 'react'

export function useVisualViewport() {
  const [height, setHeight] = useState(
    typeof window !== 'undefined'
      ? window.visualViewport?.height ?? window.innerHeight
      : 0
  )

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const onResize = () => setHeight(vv.height)
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  return height
}
