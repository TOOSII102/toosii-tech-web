'use client'

import { useEffect, useState, useRef } from 'react'
import './InstallPrompt.css'

const DISMISS_KEY = 'toosii-install-dismissed-at'
const INSTALLED_KEY = 'toosii-install-completed'
const COOLDOWN_MS = 24 * 60 * 60 * 1000 // don't re-ask for 24 hours after "Not now"
const SHOW_DELAY_MS = 6000 // let the page settle before asking — feels invited, not intrusive

function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true
}

function isIos() {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !window.MSStream
}

function withinCooldown() {
  try {
    const savedAt = Number(window.localStorage.getItem(DISMISS_KEY) || 0)
    return savedAt && Date.now() - savedAt < COOLDOWN_MS
  } catch { return false }
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState(null) // 'native' | 'ios'
  const [busy, setBusy] = useState(false)
  const deferredPromptRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (isStandalone()) return undefined
    try { if (window.localStorage.getItem(INSTALLED_KEY)) return undefined } catch {}
    if (withinCooldown()) return undefined

    const scheduleShow = next => {
      if (timerRef.current) return
      timerRef.current = window.setTimeout(() => { setPlatform(next); setVisible(true) }, SHOW_DELAY_MS)
    }

    const onBeforeInstallPrompt = event => {
      event.preventDefault()
      deferredPromptRef.current = event
      scheduleShow('native')
    }
    const onInstalled = () => {
      try { window.localStorage.setItem(INSTALLED_KEY, '1') } catch {}
      setVisible(false)
      deferredPromptRef.current = null
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    // iOS never fires beforeinstallprompt — there's no native prompt to defer, so
    // offer the manual "Add to Home Screen" instructions instead once the page settles.
    if (isIos()) scheduleShow('ios')

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const dismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {}
    setVisible(false)
  }

  const install = async () => {
    const prompt = deferredPromptRef.current
    if (!prompt) { setVisible(false); return }
    setBusy(true)
    try {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome !== 'accepted') { try { window.localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {} }
    } catch {
      // ignore — some browsers can throw if the prompt was already consumed
    } finally {
      deferredPromptRef.current = null
      setBusy(false)
      setVisible(false)
    }
  }

  if (!visible) return null

  return (
    <div className="install-prompt" role="dialog" aria-label="Install Toosii Tech app">
      <div className="install-prompt-card">
        <button type="button" className="install-prompt-close" onClick={dismiss} aria-label="Dismiss">✕</button>
        <div className="install-prompt-body">
          <img src="/logo.png" alt="" className="install-prompt-icon" />
          <div className="install-prompt-text">
            <p className="install-prompt-title">Install Toosii Tech</p>
            <p className="install-prompt-desc">
              {platform === 'ios'
                ? 'Add it to your Home Screen for one-tap access, a full-screen app view, and faster loading — no App Store needed.'
                : 'Get one-tap access, a full-screen app view, and faster loading — installs straight from your browser, no app store needed.'}
            </p>
            {platform === 'ios' && (
              <ol className="install-prompt-steps">
                <li>Tap the <strong>Share</strong> icon <span className="install-prompt-share-icon" aria-hidden="true">⬆</span> in Safari's toolbar</li>
                <li>Scroll down and choose <strong>Add to Home Screen</strong></li>
                <li>Tap <strong>Add</strong> to confirm</li>
              </ol>
            )}
          </div>
        </div>
        <div className="install-prompt-actions">
          <button type="button" className="install-prompt-btn is-secondary" onClick={dismiss}>Not now</button>
          {platform === 'native' && (
            <button type="button" className="install-prompt-btn is-primary" onClick={install} disabled={busy}>
              {busy ? 'Opening…' : 'Install App'}
            </button>
          )}
          {platform === 'ios' && (
            <button type="button" className="install-prompt-btn is-primary" onClick={dismiss}>Got it</button>
          )}
        </div>
      </div>
    </div>
  )
}
