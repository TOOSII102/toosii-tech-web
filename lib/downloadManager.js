'use client'

// Downloads on movies/audio/video pages are plain, browser-native <a href download>
// links now — no custom JS engine in the middle. That's what actually registers in
// chrome://downloads, shows the real OS download notification, and lands in the
// device's real Downloads folder automatically, with nothing that can silently fail
// to save. (An earlier version of this file streamed files with fetch() and added
// pause/resume plus a Background Fetch mode; both added real edge cases — background
// downloads in particular could report success without the file ever reaching disk —
// so that complexity was removed in favor of the platform's own reliable mechanism.)

/**
 * Restrictive in-app browsers (WhatsApp, Instagram, TikTok, etc.) run on a stripped-down
 * WebView that often can't write to the real Downloads folder even though the JS APIs
 * appear to work. There's no code fix for that sandbox — the honest thing to do is
 * detect it and tell the caller, so the UI can suggest opening in the full browser.
 */
export function isRestrictiveWebView() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok|Twitter|WhatsApp/i.test(ua)) return true
  // Android WebView signature: has "wv" alongside the normal Chrome UA tokens, as
  // opposed to a real Chrome install.
  if (/Android/.test(ua) && /; ?wv\)/.test(ua)) return true
  return false
}
