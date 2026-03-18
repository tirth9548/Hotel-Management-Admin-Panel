const ADMIN_CACHE_NAME = 'grand-plaza-admin-v1';
const urlsToCache = [
  './admin.html',
  './admin.css',
  './admin.js',
  './Manage Users.html',
  './Manage Users.js',
  './Hotel Grand Plaza Logo.png'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(ADMIN_CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== ADMIN_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch - cache first
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
