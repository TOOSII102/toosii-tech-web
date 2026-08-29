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
      // This updates the OS-level progress UI the Background Fetch spec shows
      // automatically while the transfer runs — it is NOT a real Downloads-manager
      // entry (it won't appear in chrome://downloads), and no file has been written
      // to the device yet. Word it so that can't be mistaken for "already saved".
      await bgFetch.updateUI({ title: `${bgFetch.title || 'Download'} — tap to save to device` })
    } catch {
      // fall through to notification either way so the user still gets told
    }

    // Tell any open tab right away so it can surface the "Save to device" prompt
    // immediately instead of waiting for a notification tap.
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    clientsList.forEach(client => client.postMessage({ type: 'bg-download-ready', id: bgFetch.id }))

    // Always also show a notification — belt-and-suspenders backup for when no tab
    // was open. IMPORTANT: the transfer finishing does NOT mean the file is on the
    // device yet — browsers require a live tap to actually write it to disk, so this
    // notification's whole job is to make that unmistakable and get the person back
    // to the page to do it.
    await self.registration.showNotification('📥 Ready — tap to save', {
      body: `"${bgFetch.title || 'Your file'}" finished downloading but ISN'T saved yet. Tap this notification to finish saving it to your device.`,
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
