const CACHE_NAME = 'goalboost-v1';
const OFFLINE_URL = '/index.html';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json'
  // aggiungi qui altre risorse critiche (es. CSS, immagini, /icons/*)
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // rimuovi vecchie cache se servono
      const keys = await caches.keys();
      await Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
      self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // strategy: cache-first for same-origin navigation and assets
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(resp => {
          // cache fetched assets (optional: filter by type)
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return resp;
        }).catch(() => {
          // fallback navigation to offline page (index)
          if (req.mode === 'navigate') return caches.match(OFFLINE_URL);
        });
      })
    );
  } else {
    // cross-origin: try network then fallback to cache
    event.respondWith(fetch(req).catch(() => caches.match(req)));
  }
});