const CACHE = 'control-gastos-v2'

const PRECACHE = [
  '/',
  '/src/css/variables.css',
  '/src/css/main.css',
  '/src/css/components/dashboard.css',
  '/src/css/components/forms.css',
  '/src/css/components/table.css',
  '/src/css/components/modal.css',
  '/src/css/responsive.css',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})
