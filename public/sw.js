const CACHE_NAME = 'toosii-tech-shell-v1'
const SHELL = ['/', '/tools', '/api', '/library', '/manifest.webmanifest', '/logo.png']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/') || /\.(mp4|mp3|webm|m3u8|ts)$/i.test(url.pathname)) return
  event.respondWith(fetch(request).then(response => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone()
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
    }
    return response
  }).catch(() => caches.match(request).then(cached => cached || caches.match('/'))))
})

/* ---------------------------------------------------------------------- *
 * Background Fetch (true background downloads for /tools/movies)
 * Registered from lib/downloadManager.js via registration.backgroundFetch.fetch().
 * These handlers keep running even if every tab for the site is closed, which is
 * what lets a movie/episode download finish in the background of the device.
 * ---------------------------------------------------------------------- */
const BG_DOWNLOAD_CACHE = 'toosii-bg-downloads'

self.addEventListener('backgroundfetchsuccess', event => {
  const bgFetch = event.registration
  event.waitUntil((async () => {
    try {
      const records = await bgFetch.matchAll()
      const cache = await caches.open(BG_DOWNLOAD_CACHE)
      await Promise.all(records.map(async record => {
        const response = await record.responseReady
        await cache.put(record.request, response)
      }))
      await bgFetch.updateUI({ title: `${bgFetch.title || 'Download'} — ready` })
    } catch {
      // fall through to notification either way so the user still gets told
    }

    // Tell any open tab right away so it can save the file to disk immediately
    // instead of waiting for a notification tap (this is the fix for downloads that
    // "complete" but never actually land on the device while the app stays open).
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    clientsList.forEach(client => client.postMessage({ type: 'bg-download-ready', id: bgFetch.id }))

    // Always also show a notification — belt-and-suspenders backup for when no tab
    // was open, or the auto-save above fails for any reason (e.g. the browser blocks
    // a programmatic save outside a user gesture).
    await self.registration.showNotification('Download complete', {
      body: `${bgFetch.title || 'Your video'} finished downloading. Tap to save it to this device.`,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: bgFetch.id,
      data: { id: bgFetch.id, kind: 'bg-download-complete' },
    })
  })())
})

self.addEventListener('backgroundfetchfail', event => {
  const bgFetch = event.registration
  event.waitUntil(self.registration.showNotification('Download failed', {
    body: `${bgFetch.title || 'Your video'} couldn't finish downloading. Reopen the app to try again.`,
    icon: '/logo.png',
    tag: bgFetch.id,
    data: { id: bgFetch.id, kind: 'bg-download-failed' },
  }))
})

self.addEventListener('backgroundfetchabort', event => {
  // User (or the browser, e.g. low storage/network loss beyond retry) canceled the
  // in-progress background download. Nothing to clean up server-side; the manifest
  // entry in localStorage is cleared from the page/manager side.
})

self.addEventListener('backgroundfetchclick', event => {
  const bgFetch = event.registration
  event.waitUntil(self.clients.openWindow(`/tools/movies?resumeDownload=${encodeURIComponent(bgFetch.id)}`))
})

self.addEventListener('notificationclick', event => {
  const id = event.notification.data?.id || ''
  event.notification.close()
  event.waitUntil(self.clients.openWindow(`/tools/movies?resumeDownload=${encodeURIComponent(id)}`))
})
