import { useEffect, useState } from 'react';

export interface Viewport {
  w: number;
  h: number;
  isPortrait: boolean;
  isMobile: boolean;
  isCoarse: boolean;
}

const MOBILE_BREAKPOINT = 768;

export function readViewport(): Viewport {
  if (typeof window === 'undefined') {
    return { w: 1280, h: 800, isPortrait: false, isMobile: false, isCoarse: false };
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isCoarse = typeof window.matchMedia === 'function'
    ? window.matchMedia('(pointer: coarse)').matches
    : false;
  return { w, h, isPortrait: h > w, isMobile: w < MOBILE_BREAKPOINT, isCoarse };
}

export function useViewport(): Viewport {
  const [v, setV] = useState<Viewport>(readViewport);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const on = () => setV(readViewport());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return v;
}
