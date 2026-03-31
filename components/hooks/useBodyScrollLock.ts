'use client'

import { useEffect } from 'react'

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof window === 'undefined') return

    const scrollY = window.scrollY
    const { body, documentElement } = document
    const previousBodyOverflow = body.style.overflow
    const previousBodyPosition = body.style.position
    const previousBodyTop = body.style.top
    const previousBodyWidth = body.style.width
    const previousHtmlOverflow = documentElement.style.overflow

    documentElement.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'

    return () => {
      documentElement.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyOverflow
      body.style.position = previousBodyPosition
      body.style.top = previousBodyTop
      body.style.width = previousBodyWidth
      window.scrollTo(0, scrollY)
    }
  }, [locked])
}
