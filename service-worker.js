const CACHE_NAME = 'qr-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './bulk.html',
  './style.css',
  './bulk.css',
  './script.js',
  './bulk.js',
  './assets/template-background.png',
  './assets/preview.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
