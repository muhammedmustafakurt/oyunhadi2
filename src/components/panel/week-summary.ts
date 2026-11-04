// Genel bakış ve istatistik sayfalarının ortak haftalık toplamları (14 günlük belgeden son 7 gün + önceki 7 gün).
type Day = { oyun: number; oyuncu: number };

export function weekSummary<T extends Day>(week14: T[]) {
  const week = week14.slice(7), prev = week14.slice(0, 7);
  const sum = (d: T[], k: keyof Day) => d.reduce((n, x) => n + x[k], 0);
  return {
    week,
    games: sum(week, 'oyun'),
    prevGames: sum(prev, 'oyun'),
    players: sum(week, 'oyuncu'),
    prevPlayers: sum(prev, 'oyuncu'),
  };
}

export const pct = (a: number, b: number) => (b === 0 ? undefined : Math.round(((a - b) / b) * 100));

// Saat dilimi etiketi: 24 ve üstü gece yarısına sarılır (22 → "22:00–00:00").
const hh = (h: number) => `${String(((h % 24) + 24) % 24).padStart(2, '0')}:00`;
export const hourRange = (start: string | number) => `${hh(Number(start))}–${hh(Number(start) + 2)}`;
export const hourLabel = (start: string | number) => hh(Number(start));
