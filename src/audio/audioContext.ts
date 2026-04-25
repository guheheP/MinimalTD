// Lazy-initialized singleton AudioContext.
// Browsers (especially iOS Safari) require the context to be created or resumed
// in response to a user gesture. Call unlockAudio() from any click/tap handler.

let ctx: AudioContext | null = null;
let unlocked = false;

type AudioCtor = typeof AudioContext;

function getCtor(): AudioCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export function getAudioContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = getCtor();
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

export function unlockAudio(): void {
  const c = getAudioContext();
  if (!c) return;
  if (c.state === 'suspended') {
    c.resume().catch(() => {
      // ignore — user gesture might still be required
    });
  }
  unlocked = true;
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}

export function _resetAudioForTest(): void {
  ctx = null;
  unlocked = false;
}
