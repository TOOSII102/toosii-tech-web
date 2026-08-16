'use client'
import { useEffect } from 'react'

/**
 * Ensures the device back button always navigates within the site.
 *
 * Problem: when a user arrives via a shared/external link (e.g. WhatsApp),
 * there is no prior browser history — so pressing back exits to the Android
 * home screen instead of staying on the site.
 *
 * Fix: on the very first page load of a session, if the user is on a page
 * other than home and there is no prior history, silently insert the home
 * page as a history entry BEFORE the current page. This way pressing back
 * always lands on home (or whichever page they navigated from) rather than
 * leaving the browser.
 *
 * Normal in-site navigation (clicking links) already builds up history via
 * Next.js — this component only covers the "direct link / no history" case.
 */
export default function NavigationHistory() {
  useEffect(() => {
    /* Run only once per session */
    if (sessionStorage.getItem('_tt_nav_init')) return
    sessionStorage.setItem('_tt_nav_init', '1')

    const currentPath =
      window.location.pathname +
      window.location.search +
      window.location.hash

    /* Only inject when the user deep-linked and has no prior history */
    if (currentPath !== '/' && history.length <= 2) {
      /* Replace the current entry with the home page … */
      history.replaceState(null, '', '/')
      /* … then push the actual page back on top */
      history.pushState(null, '', currentPath)
    }
  }, [])

  return null
}
