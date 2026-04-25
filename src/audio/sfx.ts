import { useMetaStore } from '../state/metaStore';
import { getAudioContext } from './audioContext';
import { SFX_LIBRARY, type SfxName } from './sfxLibrary';

const DEDUP_MS = 200;
const lastPlayed = new Map<SfxName, number>();

export interface PlaySfxOptions {
  gain?: number;
}

export function playSfx(name: SfxName, opts: PlaySfxOptions = {}): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const settings = useMetaStore.getState().settings;
  const sfxVolume = settings.sfxVolume;
  if (sfxVolume <= 0) return;

  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const last = lastPlayed.get(name) ?? 0;
  if (now - last < DEDUP_MS) return;
  lastPlayed.set(name, now);

  const player = SFX_LIBRARY[name];
  if (!player) return;

  const master = ctx.createGain();
  master.gain.value = sfxVolume * (opts.gain ?? 1);
  master.connect(ctx.destination);

  try {
    player(ctx, master);
  } catch {
    // Audio failures are never fatal — skip silently.
  }
}

export function _resetSfxDedupForTest(): void {
  lastPlayed.clear();
}
