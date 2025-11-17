const CACHE_NAME = 'qr-cache-v2'; // Incremented cache version to force update
const urlsToCache = [
  './',
  './index.html',
  './bulk.html',
  './privacy.html',
  './manifest.json',
  
  // Cache the new combined CSS file
  './css/style.css',
  
  // Cache the new combined JS file
  './js/script.js',

  // Cache core assets
  './assets/template-background.png',
  './assets/preview.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/fonts/impact.ttf',

  // Cache external libraries
  'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js'
];

// Clean up old caches on activate
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // Delete old cache (e.g., 'qr-cache-v1')
          }
        })
      );
    })
  );
});

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});