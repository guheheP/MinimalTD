import { useEffect, useRef, useState } from 'react';

const SAMPLE_SIZE = 60;

export default function FpsOverlay() {
  const [stats, setStats] = useState({ fps: 0, frameMs: 0 });
  const samplesRef = useRef<number[]>([]);
  const lastRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let raf = 0;
    const tick = (now: number) => {
      if (lastRef.current !== 0) {
        const dt = now - lastRef.current;
        const arr = samplesRef.current;
        arr.push(dt);
        if (arr.length > SAMPLE_SIZE) arr.shift();
        if (now - lastUpdateRef.current > 250) {
          const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
          setStats({ fps: avg > 0 ? Math.round(1000 / avg) : 0, frameMs: avg });
          lastUpdateRef.current = now;
        }
      }
      lastRef.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <div
      className="mono"
      style={{
        position: 'fixed',
        top: 6,
        right: 8,
        zIndex: 9999,
        padding: '2px 8px',
        background: 'rgba(0,0,0,0.55)',
        color: '#9ee493',
        fontSize: 10,
        letterSpacing: '0.12em',
        pointerEvents: 'none',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      FPS {stats.fps} · {stats.frameMs.toFixed(1)}ms
    </div>
  );
}
