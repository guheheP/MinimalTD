// Probe localStorage to determine whether persistence is available.
// Cached after first probe so we don't repeat the I/O on every render.

const PROBE_KEY = '__minimaltd:probe__';
let cached: boolean | null = null;

export function canPersist(storage: Storage | null = safeLocalStorage()): boolean {
  if (cached !== null) return cached;
  if (!storage) {
    cached = false;
    return false;
  }
  try {
    storage.setItem(PROBE_KEY, '1');
    storage.removeItem(PROBE_KEY);
    cached = true;
    return true;
  } catch {
    cached = false;
    return false;
  }
}

export function _resetStorageHealthCache(): void {
  cached = null;
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}
