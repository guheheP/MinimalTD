// Compact number format: 1234 → "1.2K", 1234567 → "1.2M".
// Sub-1000 numbers are shown as integers.
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '∞';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs < 1000) return sign + Math.round(abs).toString();
  if (abs < 1_000_000) return sign + trimZero(abs / 1000) + 'K';
  if (abs < 1_000_000_000) return sign + trimZero(abs / 1_000_000) + 'M';
  if (abs < 1_000_000_000_000) return sign + trimZero(abs / 1_000_000_000) + 'B';
  return sign + trimZero(abs / 1_000_000_000_000) + 'T';
}

function trimZero(n: number): string {
  const s = n.toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

export function formatCurrency(n: number): string {
  return '$' + formatNumber(n);
}

export function formatScore(n: number): string {
  if (n < 100000) return n.toString().padStart(5, '0');
  return formatNumber(n);
}

// Format milliseconds as "MM:SS" (or "H:MM:SS" if >= 1h).
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (x: number) => x.toString().padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}
