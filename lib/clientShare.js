export async function shareOrCopy({ title, text, url }) {
  if (typeof window === 'undefined') return

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ title, text, url })
      return
    }

    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      window.alert('Share link copied to clipboard.')
      return
    }

    window.prompt('Copy this share link:', url)
  } catch (error) {
    if (error?.name !== 'AbortError') console.warn('[share]', error)
  }
}
