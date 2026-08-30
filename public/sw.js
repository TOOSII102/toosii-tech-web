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
