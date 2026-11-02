// Oyun kartı simgeleri (premium kutu oyunu dili): krem zemin, mürekkep çizgisi, takım başına tek renkli dolgu.
// Her simge 100x100'lük bir SVG iç kodudur; dolgu rengi `--acc` değişkeninden gelir.

export const INK = '#1c1233';
export const PAPER = '#fff7ee';

// Takım renkleri (sitenin turuncu / sarı / mor / yeşil paleti)
export const SUIT_COLOR = { strateji: '#ff5a36', parti: '#f2b01e', gizem: '#5a3fd1', kelime: '#14a38b' } as const;
export type Suit = keyof typeof SUIT_COLOR;

export const SUIT_OF: Record<string, Suit> = {
  monopoly: 'strateji', satranc: 'strateji', catan: 'strateji', risk: 'strateji', ticket: 'strateji', carcassonne: 'strateji', azul: 'strateji',
  tabu: 'parti', kimim: 'parti', cizim: 'parti', bil: 'parti', futbolcu: 'parti',
  spyfall: 'gizem', ajanlar: 'gizem', vampir: 'gizem', cluedo: 'gizem',
  scrabble: 'kelime', kadro: 'kelime',
};
export const accentOf = (id: string) => SUIT_COLOR[SUIT_OF[id] ?? 'strateji'];

const S = `stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`;
const fillOf = (k?: 'a' | string) => (k === 'a' ? 'style="fill:var(--acc)"' : k ? `style="fill:${k}"` : `fill="${PAPER}"`);
const m = (d: string, k?: string) => `<path d="${d}" ${S} ${fillOf(k)}/>`;
const ci = (cx: number, cy: number, r: number, k?: string) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${S} ${fillOf(k)}/>`;
const rc = (x: number, y: number, w: number, h: number, r = 0, k?: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${S} ${fillOf(k)}/>`;
const tx = (x: number, y: number, size: number, t: string) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="800" font-style="italic" fill="${INK}" style="font-family:var(--font-logo),Georgia,serif">${t}</text>`;
const line = (d: string) => `<path d="${d}" fill="none" ${S}/>`;

export const SYMBOLS: Record<string, string> = {
  monopoly: m('M14 46 L50 16 L86 46', 'a') + rc(22, 46, 56, 38) + rc(43, 62, 14, 22, 0, 'a') + rc(60, 22, 9, 14),
  satranc: ci(50, 26, 12, 'a') + m('M40 40 Q44 58 34 74 H66 Q56 58 60 40Z') + rc(26, 74, 48, 11, 3, 'a') + line('M30 36 H70'),
  spyfall: ci(44, 44, 26, 'a') + line('M64 64 L86 86') + m('M20 44 Q44 22 68 44 Q44 66 20 44Z') + ci(44, 44, 6),
  ajanlar: Array.from({ length: 9 }, (_, i) => rc(16 + (i % 3) * 24, 16 + Math.floor(i / 3) * 24, 20, 20, 3, i === 4 || i === 2 || i === 6 ? 'a' : undefined)).join(''),
  // Vampir: yüksek yakalı pelerin, soluk yüz, sivri saç çizgisi, kırmızı gözler ve dişler
  vampir:
    m('M8 96 L20 58 Q50 74 80 58 L92 96Z', 'a') +
    m('M30 58 L18 28 L44 52Z', 'a') + m('M70 58 L82 28 L56 52Z', 'a') +
    m('M32 40 Q32 18 50 18 Q68 18 68 40 Q68 62 50 66 Q32 62 32 40Z', '#f6ecef') +
    m('M32 40 Q30 14 50 14 Q70 14 68 40 Q60 28 50 36 Q40 28 32 40Z', INK) +
    `<ellipse cx="42.5" cy="45" rx="3.4" ry="4" fill="#d62839" stroke="${INK}" stroke-width="1.4"/><ellipse cx="57.5" cy="45" rx="3.4" ry="4" fill="#d62839" stroke="${INK}" stroke-width="1.4"/>` +
    line('M37 38 L46 41 M63 38 L54 41') +
    m('M41 55 Q50 60 59 55', '#7a1020') +
    `<path d="M43.5 56.5 L46 64 L48.5 58 Z M51.5 58 L54 64 L56.5 56.5 Z" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
  tabu: ci(50, 50, 34) + ci(50, 50, 24, 'a') + line('M30 30 L70 70'),
  kimim: m('M22 16 H78 Q88 16 88 26 V58 Q88 68 78 68 H54 L36 86 V68 H22 Q12 68 12 58 V26 Q12 16 22 16Z', 'a') + tx(50, 56, 46, '?'),
  cizim: '<g transform="rotate(38 50 50)">' + rc(40, 6, 20, 14, 3, 'a') + rc(40, 20, 20, 44) + m('M40 64 L50 90 L60 64Z', 'a') + line('M46 78 H54') + '</g>',
  bil: line('M50 4 V12 M16 18 L22 24 M84 18 L78 24 M6 46 H14 M94 46 H86') + ci(50, 44, 26, 'a') + rc(38, 70, 24, 10) + rc(42, 80, 16, 8, 3, 'a'),
  catan: m('M50 8 L87 29 V71 L50 92 L13 71 V29Z', 'a') + ci(50, 50, 21) + tx(50, 60, 28, '6'),
  risk: ci(50, 50, 38, 'a') + m('M26 34 Q40 22 50 36 Q42 54 28 50Z') + m('M56 58 Q74 50 78 66 Q68 82 56 74Z'),
  cluedo: ci(50, 50, 38, 'a') + ci(50, 40, 9) + m('M43 48 H57 L62 74 H38Z'),
  scrabble: rc(18, 12, 64, 76, 8) + tx(46, 64, 54, 'A') + tx(71, 79, 14, '1'),
  ticket: m('M10 28 H90 V42 a8 8 0 0 0 0 16 V72 H10 V58 a8 8 0 0 0 0 -16Z', 'a') + line('M20 60 L30 42 L44 52 L56 38'),
  carcassonne: line('M50 8 V30') + m('M50 8 L70 16 L50 24Z', 'a') + m('M24 30 h12 v8 h8 v-8 h12 v8 h8 v-8 h12 v56 H24Z') + m('M42 86 V68 a8 8 0 0 1 16 0 V86Z', 'a'),
  kadro: rc(10, 16, 80, 68, 4, 'a') + line('M50 16 V84') + ci(50, 50, 10) + rc(10, 34, 14, 32) + rc(76, 34, 14, 32) + ci(36, 28, 4) + ci(36, 50, 4) + ci(36, 72, 4) + ci(64, 38, 4) + ci(64, 62, 4),
  futbolcu: ci(46, 54, 34) + m('M46 38 L60 48 L55 64 H37 L32 48Z', 'a') + line('M46 38 V22 M60 48 L74 42 M55 64 L64 76 M37 64 L28 76 M32 48 L18 42') + ci(78, 24, 15, 'a') + tx(78, 31, 22, '?'),
  azul: rc(14, 14, 72, 72, 5) + m('M50 22 L78 50 L50 78 L22 50Z', 'a') + m('M50 36 L64 50 L50 64 L36 50Z') + ci(50, 50, 3, 'a'),
};

// Mühür: tırtıklı halka içinde simge (120x120'lik alan)
export function sealSvg(id: string, scale = 0.68): string {
  const sym = SYMBOLS[id];
  if (!sym) return '';
  let ticks = '';
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    ticks += `<line x1="${(60 + Math.cos(a) * 52).toFixed(1)}" y1="${(60 + Math.sin(a) * 52).toFixed(1)}" x2="${(60 + Math.cos(a) * 57).toFixed(1)}" y2="${(60 + Math.sin(a) * 57).toFixed(1)}" stroke="${INK}" stroke-width="1.4"/>`;
  }
  return `<circle cx="60" cy="60" r="52" fill="none" stroke="${INK}" stroke-width="1.4"/><circle cx="60" cy="60" r="47" style="fill:var(--acc);fill-opacity:.16"/>${ticks}` +
    `<g transform="translate(60 60) scale(${scale}) translate(-50 -50)">${sym}</g>`;
}

// Oyun adını iki satıra böler (ortaya en yakın boşluktan)
export function nameLines(n: string): string[] {
  if (n.indexOf(' ') < 0 || n.length <= 9) return [n];
  let best = n.indexOf(' ');
  let d = 99;
  let j = -1;
  while ((j = n.indexOf(' ', j + 1)) >= 0) {
    const dd = Math.abs(j - n.length / 2);
    if (dd < d) { d = dd; best = j; }
  }
  return [n.slice(0, best), n.slice(best + 1)];
}
