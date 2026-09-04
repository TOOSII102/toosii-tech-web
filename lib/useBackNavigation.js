'use client'
import { useEffect, useRef } from 'react'

/**
 * Makes the device/browser back button close an in-app "detail" view (an expanded
 * search result, an open article, a modal) instead of skipping straight past it to
 * whatever page the person came from.
 *
 * Without this, a flow like "search → tap a result → press back" exits the tool
 * entirely on the first back press, because the detail view never registered as a
 * step in browser history — pressing back always undoes the LAST navigation, and
 * without a pushState call, opening the detail view was never one.
 *
 * Usage:
 *   const closeResult = useBackNavigation(!!result, () => setResult(null))
 *   <button onClick={closeResult}>← Back</button>
 *
 * Pass the boolean that's true while the view is open, and the function that closes
 * it. Use the returned `close` function for any in-app "Back"/"Close" button so a
 * press there and a press of the physical back button stay in sync (each undoes
 * exactly one history entry).
 */
export function useBackNavigation(isOpen, onClose) {
  const pushedRef = useRef(false)

  useEffect(() => {
    if (!isOpen) return undefined
    window.history.pushState({ ttOverlay: true }, '')
    pushedRef.current = true
    const onPopState = () => { pushedRef.current = false; onClose() }
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
      pushedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  return () => {
    if (pushedRef.current) { pushedRef.current = false; window.history.back() }
    else onClose()
  }
}
