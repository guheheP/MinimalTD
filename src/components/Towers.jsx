import React from 'react';

// Tower data and map waypoints live in src/game/towers.ts (authoritative source).
// This file holds only render helpers (SVG components and path math).

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
  if (kind === 'shield') {
    // hexagon
    const r = h - 2;
    const pts = [0,1,2,3,4,5].map(i => {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      return `${h + Math.cos(a) * r},${h + Math.sin(a) * r}`;
    }).join(' ');
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polygon points={pts} fill={color} stroke="var(--line)" strokeWidth={1} />
      </svg>
    );
  }
  if (kind === 'phase') {
    // outlined inverted triangle (visually distinct from runner)
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polygon points={`2,2 ${s-2},2 ${h},${s-2}`} fill="none" stroke={color} strokeWidth={Math.max(2, sw)} strokeDasharray="2 2" />
      </svg>
    );
  }
  return null;
}

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

export { TowerGlyph, EnemyShape, pathLength, pointAt };
