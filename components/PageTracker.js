'use client'
  import { useEffect, useRef } from 'react'
  import { usePathname }       from 'next/navigation'

  export default function PageTracker() {
    const pathname = usePathname()
    const last     = useRef('')

    useEffect(() => {
      if (pathname === last.current) return
      last.current = pathname

      const payload = {
        page:     pathname,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      }

      // Use sendBeacon for reliability; fall back to fetch
      const body = JSON.stringify(payload)
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' })
        navigator.sendBeacon('/api/track', blob)
      } else {
        fetch('/api/track', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
      }
    }, [pathname])

    return null
  }
  