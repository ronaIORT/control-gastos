const CACHE = 'control-gastos-v3.1'

const BASE = self.location.pathname.replace(/\/service-worker\.js$/, '')

const PRECACHE = [
  BASE + '/',
  BASE + '/icon-192.png',
  BASE + '/manifest.json',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clients.claim().then(() =>
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
    )
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
    })
  )
})
