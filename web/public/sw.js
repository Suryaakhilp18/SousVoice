const CACHE_NAME = 'sousvoice-shell-v3';

// Automatically unregister and clean up all caches on activate
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network first for all requests
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
