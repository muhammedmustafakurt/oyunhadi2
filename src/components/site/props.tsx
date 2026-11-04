// Uçuşan oyun nesneleri (zar, piyon, kart, yıldız). Renk geçişi yok: hacim hissi, düz renkli yüzeylerle verilir.
type P = { className?: string; r?: number; delay?: string };

const wrap = (className = '', r = 0, delay = '0s') => ({
  className: `pointer-events-none absolute animate-float drop-shadow-[5px_5px_0_var(--color-ink)] ${className}`,
  style: { '--r': `${r}deg`, animationDelay: delay } as React.CSSProperties,
  'aria-hidden': true as const,
});

export function Dice({ className, r = -14, delay }: P) {
  return (
    <svg viewBox="0 0 100 100" {...wrap(className, r, delay)}>
      <path d="M50 6 92 28 50 50 8 28Z" fill="#ff6a4d" />
      <path d="M8 28 50 50v44L8 72Z" fill="#e2391a" />
      <path d="M92 28 50 50v44l42-22Z" fill="#c22f12" />
      <ellipse cx="50" cy="28" rx="6" ry="3.5" fill="#fff" />
      <ellipse cx="26" cy="52" rx="4" ry="5.5" fill="#fff" opacity=".95" />
      <ellipse cx="34" cy="72" rx="4" ry="5.5" fill="#fff" opacity=".95" />
      <ellipse cx="66" cy="62" rx="4" ry="5.5" fill="#fff" opacity=".9" />
      <ellipse cx="78" cy="48" rx="4" ry="5.5" fill="#fff" opacity=".9" />
    </svg>
  );
}

export function Pawn({ className, r = 8, delay }: P) {
  return (
    <svg viewBox="0 0 80 120" {...wrap(className, r, delay)}>
      <path d="M22 112c0-22 6-40 12-52h12c6 12 12 30 12 52Z" fill="#7c3aed" />
      <path d="M40 60h6c6 12 12 30 12 52H40Z" fill="#5b21b6" />
      <ellipse cx="40" cy="112" rx="30" ry="7" fill="#4c1d95" />
      <ellipse cx="40" cy="58" rx="16" ry="5" fill="#6d28d9" />
      <circle cx="40" cy="34" r="22" fill="#8b5cf6" />
      <path d="M40 12a22 22 0 0 1 0 44Z" fill="#7c3aed" />
      <circle cx="32" cy="26" r="6" fill="#c4b5fd" />
    </svg>
  );
}

export function Card({ className, r = 12, delay }: P) {
  return (
    <svg viewBox="0 0 90 120" {...wrap(className, r, delay)}>
      <rect x="6" y="6" width="78" height="108" rx="12" fill="#1d9f6e" transform="translate(4 4)" />
      <rect x="6" y="6" width="78" height="108" rx="12" fill="#5ef2b5" />
      <rect x="16" y="16" width="58" height="88" rx="8" fill="none" stroke="#0b1a13" strokeOpacity=".25" strokeWidth="3" />
      <path d="M45 40c8 0 13 6 13 13 0 5-3 9-6 11l5 14H33l5-14c-3-2-6-6-6-11 0-7 5-13 13-13Z" fill="#0b1a13" opacity=".7" />
    </svg>
  );
}

export function Star({ className, r = 0, delay }: P) {
  return (
    <svg viewBox="0 0 100 100" {...wrap(className, r, delay)}>
      <path d="M50 6l13 27 30 4-22 21 5 30-26-14-26 14 5-30L7 37l30-4Z" fill="#d68a00" transform="translate(3 4)" />
      <path d="M50 6l13 27 30 4-22 21 5 30-26-14-26 14 5-30L7 37l30-4Z" fill="#ffc83d" />
      <path d="M50 6v62l-26 14 5-30L7 37l30-4Z" fill="#ffd66b" />
    </svg>
  );
}
