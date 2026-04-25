/* global React */

// ===== Tower definitions =====
const TOWERS = [
  { id:'basic',   name:'POINT',    glyph:'●', cost: 50,  dmg: 8,  rng: 90,  rof: 1.2, color:'var(--accent-1)', type:'BASIC',    desc:'Single-target. Cheap, reliable, fast fire-rate.' },
  { id:'sniper',  name:'PIERCE',   glyph:'▲', cost: 120, dmg: 36, rng:200,  rof: 0.5, color:'var(--accent-2)', type:'SNIPER',   desc:'Long range. High damage, slow reload.' },
  { id:'cannon',  name:'BLAST',    glyph:'■', cost: 160, dmg: 22, rng:110,  rof: 0.4, color:'var(--accent-3)', type:'SPLASH',   desc:'AoE damage on impact.' },
  { id:'frost',   name:'FREEZE',   glyph:'◆', cost: 100, dmg: 4,  rng:100,  rof: 1.0, color:'var(--accent-4)', type:'SLOW',     desc:'Slows targets in radius.' },
  { id:'multi',   name:'SCATTER',  glyph:'★', cost: 180, dmg: 6,  rng:120,  rof: 1.6, color:'var(--accent-5)', type:'MULTI',    desc:'Hits up to 4 targets at once.' },
  { id:'venom',   name:'VENOM',    glyph:'⬢', cost: 140, dmg: 3,  rng:100,  rof: 0.9, color:'var(--accent-6)', type:'POISON',   desc:'Damage-over-time. Stacks.' },
  { id:'shock',   name:'CHAIN',    glyph:'⚡', cost: 220, dmg: 14, rng:130,  rof: 0.7, color:'var(--accent-7)', type:'SHOCK',    desc:'Chains lightning between 3 enemies.' },
  { id:'beacon',  name:'BEACON',   glyph:'⬡', cost: 160, dmg: 0,  rng:140,  rof: 0,   color:'var(--accent-8)', type:'SUPPORT',  desc:'+25% damage to towers in radius.' },
];

// SVG glyphs by style: "geometric" | "outline" | "filled"
function TowerGlyph({ id, size=28, style='geometric', color='currentColor' }) {
  const s = size;
  const half = s/2;
  const stroke = style === 'outline' ? color : 'none';
  const fill   = style === 'outline' ? 'none' : color;
  const sw = Math.max(2, Math.round(s/14));

  const inner = {
    basic:   <circle cx={half} cy={half} r={half - sw/2} />,
    sniper:  <polygon points={`${half},${sw/2} ${s-sw/2},${s-sw/2} ${sw/2},${s-sw/2}`} />,
    cannon:  <rect x={sw/2} y={sw/2} width={s - sw} height={s - sw} />,
    frost:   <polygon points={`${half},${sw/2} ${s-sw/2},${half} ${half},${s-sw/2} ${sw/2},${half}`} />,
    multi: (
      <polygon points={(() => {
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const a = (Math.PI / 5) * i - Math.PI / 2;
          const r = i % 2 === 0 ? half - sw/2 : (half - sw/2) * 0.45;
          pts.push(`${half + Math.cos(a) * r},${half + Math.sin(a) * r}`);
        }
        return pts.join(' ');
      })()} />
    ),
    venom: (
      <polygon points={(() => {
        const r = half - sw/2;
        return [0,1,2,3,4,5].map(i => {
          const a = (Math.PI / 3) * i;
          return `${half + Math.cos(a) * r},${half + Math.sin(a) * r}`;
        }).join(' ');
      })()} />
    ),
    shock: (
      <polygon points={`${half*0.65},${sw/2} ${s-sw/2},${half*0.85} ${half*1.1},${half*1.05} ${half*1.35},${s-sw/2} ${sw/2},${half*1.15} ${half*0.9},${half*0.95}`} />
    ),
    beacon: (
      <polygon points={(() => {
        const r = half - sw/2;
        return [0,1,2,3,4,5].map(i => {
          const a = (Math.PI / 3) * i + Math.PI/6;
          return `${half + Math.cos(a) * r},${half + Math.sin(a) * r}`;
        }).join(' ');
      })()} />
    ),
  }[id];

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{display:'block'}}>
      <g fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="miter">
        {inner}
      </g>
    </svg>
  );
}

// ===== Enemy shapes =====
function EnemyShape({ kind='runner', size=18, color='var(--ink)' }) {
  const s = size, h = s/2;
  const sw = 2;
  if (kind === 'runner') {
    // small triangle
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polygon points={`${h},2 ${s-2},${s-2} 2,${s-2}`} fill={color} />
      </svg>
    );
  }
  if (kind === 'tank') {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <rect x={2} y={2} width={s-4} height={s-4} fill={color} />
      </svg>
    );
  }
  if (kind === 'swarm') {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <circle cx={h} cy={h} r={h-2} fill={color} />
      </svg>
    );
  }
  if (kind === 'boss') {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polygon points={`${h},2 ${s-2},${h} ${h},${s-2} 2,${h}`} fill={color} stroke="var(--line)" strokeWidth={sw} />
      </svg>
    );
  }
  return null;
}

// ===== Map paths (waypoints in 0..1 normalized) =====
const MAPS = {
  zigzag: {
    name: 'ZIGZAG',
    code: 'M-01',
    difficulty: 'EASY',
    paths: [[
      [0.0, 0.20], [0.30, 0.20], [0.30, 0.55], [0.65, 0.55],
      [0.65, 0.30], [0.90, 0.30], [0.90, 0.80], [1.0, 0.80]
    ]],
  },
  spiral: {
    name: 'SPIRAL',
    code: 'M-02',
    difficulty: 'MEDIUM',
    paths: [[
      [0.0, 0.10], [0.85, 0.10], [0.85, 0.85], [0.15, 0.85],
      [0.15, 0.30], [0.65, 0.30], [0.65, 0.65], [0.40, 0.65],
      [0.40, 0.50], [1.00, 0.50]
    ]],
  },
  fork: {
    name: 'FORK',
    code: 'M-03',
    difficulty: 'HARD',
    paths: [
      [[0.0, 0.30], [0.40, 0.30], [0.40, 0.55], [1.0, 0.55]],
      [[0.0, 0.80], [0.60, 0.80], [0.60, 0.55], [1.0, 0.55]],
    ],
  },
  cross: {
    name: 'CROSS',
    code: 'M-04',
    difficulty: 'EXPERT',
    paths: [[
      [0.0, 0.50], [0.30, 0.50], [0.30, 0.15], [0.55, 0.15],
      [0.55, 0.85], [0.80, 0.85], [0.80, 0.40], [1.0, 0.40]
    ]],
  },
};

// ===== Helpers =====
function pathLength(points) {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const [x1,y1] = points[i-1], [x2,y2] = points[i];
    len += Math.hypot(x2-x1, y2-y1);
  }
  return len;
}
function pointAt(points, t) {
  // t in 0..1 along total length
  const total = pathLength(points);
  let target = total * t;
  for (let i = 1; i < points.length; i++) {
    const [x1,y1] = points[i-1], [x2,y2] = points[i];
    const seg = Math.hypot(x2-x1, y2-y1);
    if (target <= seg) {
      const k = seg === 0 ? 0 : target / seg;
      return [x1 + (x2-x1) * k, y1 + (y2-y1) * k];
    }
    target -= seg;
  }
  return points[points.length - 1];
}

Object.assign(window, { TOWERS, MAPS, TowerGlyph, EnemyShape, pathLength, pointAt });
