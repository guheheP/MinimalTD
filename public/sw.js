// Minimal offline-first service worker.
// Bump CACHE_VERSION when the app shell or manifest contract changes so old
// clients drop their stale caches on activate. Hashed Vite asset filenames
// already self-invalidate, so we don't need elaborate route handling.
const CACHE_VERSION = 'mtd-v1';

// All paths are resolved against the SW's own scope, so the same code works
// at the root and under /<repo>/ on GitHub Pages.
const SCOPE = self.registration.scope;
const PRECACHE_URLS = [
  '',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
  'favicon-32.png',
].map((p) => new URL(p, SCOPE).toString());

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // Use individual adds so a single 404 doesn't poison the whole install.
      Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation: network-first so a fresh deploy is picked up, fall back to the
  // cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy)).catch(() => undefined);
          return res;
        })
        .catch(() => caches.match(req).then((c) => c ?? caches.match(new URL('', SCOPE).toString()))),
    );
    return;
  }

  // Static assets (hashed by Vite, so safe to cache-first forever).
  event.respondWith(
    caches.match(req).then((cached) =>
      cached ??
      fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy)).catch(() => undefined);
        }
        return res;
      }).catch(() => cached),
    ),
  );
});
