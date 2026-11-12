// Memora · service worker: shell + detector facial disponibles offline.
const VERSION = 'memora-v1';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './icons/icon.svg', './icons/icon-maskable.svg',
  './src/widget.js', './src/styles.js', './src/db.js', './src/scanner.js', './src/exporter.js',
];
// Los modelos (~7 MB) se cachean recién cuando el usuario escanea por primera vez.
const LAZY = /\/vendor\//;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (LAZY.test(url.pathname)) {
    // cache-first: pesado e inmutable
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
      return res;
    })));
    return;
  }
  // network-first para el shell: siempre la última versión si hay red
  e.respondWith(fetch(e.request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html'))));
});
