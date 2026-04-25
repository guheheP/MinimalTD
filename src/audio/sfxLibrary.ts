// Procedural SE library — every sound is synthesized on demand.
// No external assets, ~12 short blips that fit the geometric/electronic theme.

export type SfxName =
  | 'tower-fire'
  | 'tower-place'
  | 'tower-upgrade'
  | 'tower-sell'
  | 'enemy-die'
  | 'enemy-boss-die'
  | 'wave-start'
  | 'wave-cleared'
  | 'breach'
  | 'draft-open'
  | 'chest-open'
  | 'loot-rarity-mythic';

type Player = (ctx: AudioContext, master: GainNode) => void;

function tone(
  ctx: AudioContext,
  master: GainNode,
  opts: {
    type?: OscillatorType;
    freqStart: number;
    freqEnd?: number;
    duration: number;
    peak?: number;
    attack?: number;
    delay?: number;
  },
) {
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const t1 = t0 + opts.duration;
  const osc = ctx.createOscillator();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freqStart, t0);
  if (opts.freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freqEnd), t1);
  }
  const g = ctx.createGain();
  const peak = opts.peak ?? 0.3;
  const attack = opts.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t1);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t1 + 0.02);
}

function noise(
  ctx: AudioContext,
  master: GainNode,
  opts: { duration: number; peak?: number; cutoff?: number; delay?: number },
) {
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const t1 = t0 + opts.duration;
  const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * opts.duration)), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = opts.cutoff ?? 2000;
  const g = ctx.createGain();
  const peak = opts.peak ?? 0.25;
  g.gain.setValueAtTime(peak, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t1);
  src.connect(lp);
  lp.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t1 + 0.02);
}

export const SFX_LIBRARY: Record<SfxName, Player> = {
  'tower-fire': (ctx, m) => {
    const jitter = 1 + (Math.random() - 0.5) * 0.16;
    tone(ctx, m, { type: 'square', freqStart: 880 * jitter, freqEnd: 660 * jitter, duration: 0.06, peak: 0.18 });
  },
  'tower-place': (ctx, m) => {
    tone(ctx, m, { type: 'sine', freqStart: 220, freqEnd: 620, duration: 0.18, peak: 0.22 });
    tone(ctx, m, { type: 'triangle', freqStart: 440, duration: 0.12, peak: 0.12, delay: 0.04 });
  },
  'tower-upgrade': (ctx, m) => {
    [523, 659, 784].forEach((f, i) =>
      tone(ctx, m, { type: 'triangle', freqStart: f, duration: 0.11, peak: 0.18, delay: i * 0.06 }),
    );
  },
  'tower-sell': (ctx, m) => {
    tone(ctx, m, { type: 'sawtooth', freqStart: 600, freqEnd: 200, duration: 0.22, peak: 0.18 });
  },
  'enemy-die': (ctx, m) => {
    noise(ctx, m, { duration: 0.08, peak: 0.18, cutoff: 1500 });
  },
  'enemy-boss-die': (ctx, m) => {
    noise(ctx, m, { duration: 0.18, peak: 0.22, cutoff: 1800 });
    tone(ctx, m, { type: 'sine', freqStart: 440, duration: 0.4, peak: 0.18 });
    tone(ctx, m, { type: 'sine', freqStart: 880, duration: 0.4, peak: 0.12, delay: 0.04 });
  },
  'wave-start': (ctx, m) => {
    [300, 450, 600].forEach((f, i) =>
      tone(ctx, m, { type: 'square', freqStart: f, duration: 0.09, peak: 0.16, delay: i * 0.07 }),
    );
  },
  'wave-cleared': (ctx, m) => {
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(ctx, m, { type: 'triangle', freqStart: f, duration: 0.18, peak: 0.18, delay: i * 0.05 }),
    );
  },
  'breach': (ctx, m) => {
    tone(ctx, m, { type: 'sine', freqStart: 80, freqEnd: 40, duration: 0.8, peak: 0.32 });
    noise(ctx, m, { duration: 0.6, peak: 0.18, cutoff: 600 });
  },
  'draft-open': (ctx, m) => {
    tone(ctx, m, { type: 'sine', freqStart: 880, freqEnd: 1320, duration: 0.32, peak: 0.18 });
  },
  'chest-open': (ctx, m) => {
    tone(ctx, m, { type: 'sawtooth', freqStart: 200, freqEnd: 1200, duration: 0.4, peak: 0.2 });
    noise(ctx, m, { duration: 0.15, peak: 0.12, cutoff: 3000, delay: 0.35 });
  },
  'loot-rarity-mythic': (ctx, m) => {
    [1500, 1800, 2200].forEach((f, i) =>
      tone(ctx, m, { type: 'sine', freqStart: f, duration: 0.5, peak: 0.18, delay: i * 0.04 }),
    );
  },
};
