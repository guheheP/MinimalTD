// Minimal offline-first service worker.
// __BUILD_ID__ is replaced at build time by the inject-sw-build-id Vite
// plugin, so each deploy ships a SW with different bytes. That's what makes
// the browser treat it as a new worker — install fires, old caches get
// purged on activate, and the page-level update prompt can offer to switch.
const CACHE_VERSION = 'mtd-__BUILD_ID__';

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
  // Pre-cache the shell, but don't auto-skipWaiting: when an old worker is
  // already controlling the page, we want the page to show its update prompt
  // and only switch when the user clicks (or, on first install, when the
  // browser activates us automatically since there's no controller to wait
  // behind).
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // Use individual adds so a single 404 doesn't poison the whole install.
      Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined))),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

// Page sends this when the user accepts an update prompt. We then activate
// immediately, which fires controllerchange on the page → page reloads.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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
