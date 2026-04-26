// Registers the service worker that turns Minimal TD into an installable PWA.
// Skipped in dev — Vite serves modules dynamically there, and an SW would
// just cache stale ones. Skipped on browsers without SW support.

export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return;
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  const swUrl = `${import.meta.env.BASE_URL}sw.js`;
  const scope = import.meta.env.BASE_URL;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl, { scope }).catch(() => {
      // Registration is best-effort — failures don't break the app.
    });
  });
}
