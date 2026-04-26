// Registers the service worker and exposes a tiny pub/sub so the UI can
// surface "a new version is ready" prompts. Skipped in dev (Vite serves
// modules dynamically; an SW would just cache stale ones) and on browsers
// without serviceWorker support.

export interface PwaUpdateState {
  available: boolean;
  trigger: () => void;
}

const initialState: PwaUpdateState = { available: false, trigger: () => {} };
let currentState: PwaUpdateState = initialState;
let listeners: Array<(s: PwaUpdateState) => void> = [];

function publish(next: PwaUpdateState): void {
  currentState = next;
  for (const l of listeners) l(next);
}

export function subscribePwaUpdate(fn: (s: PwaUpdateState) => void): () => void {
  listeners.push(fn);
  fn(currentState);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

// Update checks every hour for installed PWAs that stay open long enough to
// span a deploy.
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return;
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  const swUrl = `${import.meta.env.BASE_URL}sw.js`;
  const scope = import.meta.env.BASE_URL;

  // Was a SW already controlling this page when it loaded? If not, the very
  // first activation will fire controllerchange, but reloading then would
  // just be churn — there's no old code to replace.
  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    if (!hadController) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(swUrl, { scope })
      .then((registration) => {
        const announce = (worker: ServiceWorker) => {
          publish({
            available: true,
            trigger: () => worker.postMessage({ type: 'SKIP_WAITING' }),
          });
        };

        // A waiting worker may already be parked from a previous session.
        if (registration.waiting && navigator.serviceWorker.controller) {
          announce(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              announce(installing);
            }
          });
        });

        // Long-lived PWA sessions: poll for SW updates so a reopened-after-
        // deploy app eventually notices without a manual reload.
        setInterval(() => {
          registration.update().catch(() => undefined);
        }, UPDATE_INTERVAL_MS);
      })
      .catch(() => {
        // Best-effort — never let SW failures break the app boot.
      });
  });
}
