'use client'

import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    return undefined
  }, [])

  return null
}
