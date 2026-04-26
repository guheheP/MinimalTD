// Renders public/icon.svg + public/icon-maskable.svg to the PNG sizes that
// browsers, the manifest, and iOS Home Screen actually need. Run via
// `npm run icons` after editing the SVGs.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, '..', 'public');

const baseSvg = readFileSync(resolve(publicDir, 'icon.svg'), 'utf8');
const maskableSvg = readFileSync(resolve(publicDir, 'icon-maskable.svg'), 'utf8');

const renders = [
  { svg: baseSvg, size: 192, out: 'icon-192.png' },
  { svg: baseSvg, size: 512, out: 'icon-512.png' },
  { svg: baseSvg, size: 180, out: 'apple-touch-icon.png' },
  { svg: baseSvg, size: 32, out: 'favicon-32.png' },
  { svg: maskableSvg, size: 512, out: 'icon-maskable-512.png' },
];

for (const { svg, size, out } of renders) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(resolve(publicDir, out), png);
  console.log(`wrote public/${out} (${size}x${size}, ${png.length} bytes)`);
}
