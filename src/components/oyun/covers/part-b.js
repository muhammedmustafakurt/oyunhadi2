import { tile, sparkle } from './shared';

// Kapaklar (bölüm b): catan, risk, cluedo, scrabble, ticket.

// Altıgen (sivri tepeli) yardımcıları
const hexPts = (cx, cy, r) => {
  const w = r * 0.866;
  return `${cx},${cy - r} ${cx + w},${cy - r / 2} ${cx + w},${cy + r / 2} ${cx},${cy + r} ${cx - w},${cy + r / 2} ${cx - w},${cy - r / 2}`;
};
// Cilalı karo: koyu alt gölge, yüz, üst parlama
const hexTile = (cx, cy, r, c1, c2, num) => {
  const hot = num === 6 || num === 8;
  return `<polygon points="${hexPts(cx, cy + 2.5, r)}" fill="${c2}"/><polygon points="${hexPts(cx, cy, r)}" fill="${c1}" stroke="#fff" stroke-opacity=".55" stroke-width="1"/><polygon points="${cx},${cy - r + 2} ${cx + r * 0.78},${cy - r / 2 + 1} ${cx},${cy - 1} ${cx - r * 0.78},${cy - r / 2 + 1}" fill="#fff" opacity=".22"/><circle cx="${cx}" cy="${cy + 1.2}" r="6.4" fill="#00000030"/><circle cx="${cx}" cy="${cy}" r="6.2" fill="#fff6dc" stroke="#c9a766" stroke-width=".8"/><text x="${cx}" y="${cy + 3.3}" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="9" fill="${hot ? '#d4261b' : '#3b2a14'}">${num}</text>`;
};

const catan = `<rect width="120" height="114" fill="#d9822b"/><circle cx="60" cy="84" r="58" fill="#e9a043" opacity=".7"/><circle cx="60" cy="84" r="38" fill="#f3b85a" opacity=".5"/>`
  + hexTile(31, 68, 16.5, '#2f9a45', '#17692a', 6)
  + hexTile(60, 68, 16.5, '#d4492c', '#8f2410', 8)
  + hexTile(89, 68, 16.5, '#f5c92e', '#c18f0a', 5)
  + hexTile(16.5, 93, 16.5, '#9aa6b8', '#5c677a', 9)
  + hexTile(45.5, 93, 16.5, '#a6e25c', '#5ea21f', 4)
  + hexTile(74.5, 93, 16.5, '#2f9a45', '#17692a', 10)
  + hexTile(103.5, 93, 16.5, '#d4492c', '#8f2410', 3)
  // ev (kavşakta)
  + `<path d="M60 80.5l-8 6.5v9h16v-9z" fill="#00000040" transform="translate(0 1.5)"/><path d="M60 78l-8 6.5v9h16v-9z" fill="#2a6fe0" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M60 78l-8 6.5h16z" fill="#7fb3ff" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>`
  // yol
  + `<rect x="68" y="55" width="16" height="5" rx="2" fill="#d4261b" stroke="#fff" stroke-width="1.2" transform="rotate(-30 76 57)"/>`
  + sparkle(10, 58, .9) + sparkle(110, 106, .7);

// Risk
const die = (x, y, rot) => {
  const p = (px, py) => `<circle cx="${px}" cy="${py}" r="2" fill="#1f2a10"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-11" y="-9" width="22" height="22" rx="4" fill="#0000004a"/><rect x="-11" y="-11" width="22" height="22" rx="4" fill="#c3cbd6"/><rect x="-10" y="-11" width="20" height="20" rx="4" fill="#fff"/><rect x="-8" y="-9.5" width="16" height="6" rx="3" fill="#fff" opacity=".6"/>${p(-5, -5)}${p(5, -5)}${p(0, 0)}${p(-5, 5)}${p(5, 5)}</g>`;
};
const die3 = (x, y, rot) => {
  const p = (px, py) => `<circle cx="${px}" cy="${py}" r="2" fill="#d4261b"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-11" y="-9" width="22" height="22" rx="4" fill="#0000004a"/><rect x="-11" y="-11" width="22" height="22" rx="4" fill="#c3cbd6"/><rect x="-10" y="-11" width="20" height="20" rx="4" fill="#fff"/><rect x="-8" y="-9.5" width="16" height="6" rx="3" fill="#fff" opacity=".6"/>${p(-5, -5)}${p(0, 0)}${p(5, 5)}</g>`;
};
const land = (d, c1, c2) => `<path d="${d}" fill="${c2}" transform="translate(0 2.5)"/><path d="${d}" fill="${c1}" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>`;
const risk = `<rect width="120" height="114" fill="#4f8a22"/><circle cx="60" cy="80" r="56" fill="#69a52f" opacity=".55"/>`
  + land('M7 62c2-8 12-11 20-9 7-3 14 0 18 5 5 2 4 9-1 12l-3 10c-2 6-8 5-11 1-3-5-8-3-12-6-8-2-13-6-11-13z', '#e0412e', '#8f1f12')
  + land('M58 58c6-5 16-6 24-3 8-4 20-2 27 5 4 5 2 12-4 14-5 7-14 5-18 1-6 4-14 2-18-3-8-2-15-7-11-14z', '#3b86e8', '#1c4a96')
  + land('M24 92c4-5 12-5 17-1 5 3 4 11-1 14-7 3-17 1-16-13z', '#f5c92e', '#b98a09')
  + land('M64 90c6-3 14-2 18 3 3 5-1 12-8 13-8 0-14-8-10-16z', '#ff8c2a', '#a8520a')
  + land('M94 92c5-2 12 0 14 5 1 6-5 10-11 9-7-2-8-12-3-14z', '#a56ae8', '#5a2d93')
  // zarlar
  + die(46, 84, -14) + die3(70, 77, 12)
  // piyon (silindir + bayrak)
  + `<ellipse cx="97" cy="76" rx="9" ry="3.2" fill="#00000050"/><rect x="89" y="64" width="16" height="11" rx="2.5" fill="#8f1f12"/><ellipse cx="97" cy="64" rx="8" ry="3" fill="#e0412e"/><rect x="90" y="65" width="14" height="3" rx="1.5" fill="#fff" opacity=".3"/><rect x="96" y="49" width="2" height="15" fill="#fff"/><path d="M98 49l12 4-12 5z" fill="#ffd84a" stroke="#b98a09" stroke-width=".8" stroke-linejoin="round"/>`
  + `<ellipse cx="22" cy="82" rx="7" ry="2.5" fill="#00000050"/><rect x="16" y="72" width="12" height="10" rx="2" fill="#1c4a96"/><rect x="16" y="72" width="12" height="3" rx="1.5" fill="#fff" opacity=".35"/><ellipse cx="22" cy="72" rx="6" ry="2.4" fill="#3b86e8"/>`
  + sparkle(12, 54, .8) + sparkle(110, 104, .9);

// Cluedo
const cluedo = `<rect width="120" height="114" fill="#5a1740"/><circle cx="46" cy="64" r="34" fill="#7a2358" opacity=".8"/><circle cx="26" cy="54" r="9" fill="url(#cv-moon)"/>`
  // köşk
  + `<g fill="#1c0a1c"><rect x="14" y="76" width="64" height="32"/><path d="M10 76l32-18 32 18z"/><rect x="18" y="56" width="10" height="20"/><path d="M16 56l7-9 7 9z"/><rect x="58" y="60" width="12" height="16"/><path d="M56 60l8-9 8 9z"/><rect x="36" y="48" width="12" height="12"/><path d="M34 48l8-8 8 8z"/></g>`
  + `<g fill="#ffd23f"><rect x="21" y="62" width="4" height="6" rx="1"/><rect x="62" y="65" width="4" height="6" rx="1"/><rect x="39" y="51" width="6" height="6" rx="3"/><rect x="22" y="84" width="7" height="9" rx="1.5"/><rect x="36" y="84" width="7" height="9" rx="1.5"/><rect x="50" y="84" width="7" height="9" rx="1.5" opacity=".35"/><rect x="63" y="84" width="7" height="9" rx="1.5"/></g>`
  + `<path d="M0 108h120v6H0z" fill="#1c0a1c"/>`
  // büyüteç
  + `<line x1="94" y1="88" x2="109" y2="106" stroke="#00000055" stroke-width="8" stroke-linecap="round" transform="translate(0 2)"/><line x1="94" y1="88" x2="109" y2="106" stroke="#7a3a1a" stroke-width="7.5" stroke-linecap="round"/><line x1="94" y1="88" x2="109" y2="106" stroke="#c97a3a" stroke-width="3" stroke-linecap="round" transform="translate(-1 -0.5)"/>`
  + `<circle cx="84" cy="74" r="17" fill="#00000050" transform="translate(0 2.5)"/><circle cx="84" cy="74" r="17" fill="#ffd23f"/><circle cx="84" cy="74" r="13" fill="#2c0f33"/><circle cx="84" cy="74" r="13" fill="#b96ad8" opacity=".25"/><path d="M76 68a11 11 0 0 1 10-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".75"/>`
  // anahtar deliği
  + `<circle cx="84" cy="72" r="4.2" fill="#ffd23f"/><path d="M81.5 74h5l1.8 9h-8.6z" fill="#ffd23f"/>`
  // zarf
  + `<rect x="3" y="92" width="30" height="19" rx="2.5" fill="#00000050" transform="translate(0 2)"/><rect x="3" y="92" width="30" height="19" rx="2.5" fill="#f6e2b3" stroke="#c9a15a" stroke-width="1"/><path d="M3.5 93l14.5 11 14.5-11" fill="none" stroke="#c9a15a" stroke-width="1.4" stroke-linejoin="round"/><circle cx="18" cy="104" r="3.4" fill="#d4261b" stroke="#8f1410" stroke-width=".8"/>`
  + sparkle(106, 56, .9, '#ffe27a') + sparkle(8, 80, .6);

// Scrabble
const bonus = [
  ['#e0412e', '#8f1f12', 'K3'], ['#f58fb4', '#b84a77', ''], ['#4aa8f0', '#1f6fb0', ''], ['#f58fb4', '#b84a77', ''], ['#e0412e', '#8f1f12', 'K3'], ['#f58fb4', '#b84a77', ''],
];
const bcell = (x, y, c) => `<rect x="${x}" y="${y}" width="18" height="18" rx="2.5" fill="${c[1]}"/><rect x="${x}" y="${y - 1}" width="18" height="16.5" rx="2.5" fill="${c[0]}"/><rect x="${x + 2}" y="${y + 0.5}" width="14" height="4" rx="2" fill="#fff" opacity=".3"/>${c[2] ? `<text x="${x + 9}" y="${y + 11.5}" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="7" fill="#fff" opacity=".9">${c[2] === 'K3' ? '3×' : c[2]}</text>` : ''}`;
const scrabble = `<rect width="120" height="114" fill="#e1761a"/><rect x="0" y="52" width="120" height="62" fill="#1d7a4a"/><rect x="0" y="52" width="120" height="3" fill="#fff" opacity=".3"/>`
  + [0, 1, 2, 3, 4, 5].map((i) => bcell(i * 20 + 1, 56, bonus[i])).join('')
  + [0, 1, 2, 3, 4, 5].map((i) => bcell(i * 20 + 1, 94, bonus[(i + 3) % 6])).join('')
  + bcell(1, 75, ['#4aa8f0', '#1f6fb0', '']) + bcell(101, 75, ['#4aa8f0', '#1f6fb0', ''])
  + `<rect x="18" y="75" width="86" height="20" rx="3" fill="#00000040" transform="translate(0 2.5)"/>`
  + tile(20, 74, 20, '#f3c26b', '#8a5316', 'E') + tile(40, 74, 20, '#f3c26b', '#8a5316', 'L') + tile(60, 74, 20, '#f3c26b', '#8a5316', 'M') + tile(80, 74, 20, '#f3c26b', '#8a5316', 'A')
  + sparkle(112, 56, .8) + sparkle(8, 52, .7) + sparkle(100, 30, .7);

// Ticket to Ride
const car = (x, c1, c2) => `<rect x="${x}" y="82" width="22" height="16" rx="3" fill="${c2}"/><rect x="${x}" y="80" width="22" height="16" rx="3" fill="${c1}" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/><rect x="${x + 2}" y="82" width="18" height="4.5" rx="2" fill="#fff" opacity=".3"/><rect x="${x + 3.5}" y="88" width="4.5" height="4.5" rx="1" fill="#fff" opacity=".85"/><rect x="${x + 13.5}" y="88" width="4.5" height="4.5" rx="1" fill="#fff" opacity=".85"/><circle cx="${x + 5}" cy="98" r="3.4" fill="#222a3a" stroke="#fff" stroke-width="1"/><circle cx="${x + 17}" cy="98" r="3.4" fill="#222a3a" stroke="#fff" stroke-width="1"/>`;
const city = (x, y) => `<circle cx="${x}" cy="${y}" r="4.6" fill="#0d3a66"/><circle cx="${x}" cy="${y}" r="3.4" fill="#fff"/><circle cx="${x}" cy="${y}" r="1.4" fill="#d4261b"/>`;
const ticket = `<rect width="120" height="114" fill="#1d86d8"/><circle cx="60" cy="86" r="56" fill="#3aa0ec" opacity=".6"/>`
  + `<path d="M8 66c10-8 24-8 30 0 7 8 20 4 28-2 10-8 22-6 32 2l6 12c-8 8-22 4-30 2-12-4-22 4-32 2-12-2-26-2-34-6z" fill="#7cd08a" opacity=".5"/>`
  // rota çizgileri
  + `<path d="M14 62C30 54 40 72 58 62" fill="none" stroke="#0d3a66" stroke-width="5.5" stroke-linecap="round"/><path d="M14 62C30 54 40 72 58 62" fill="none" stroke="#ffd23f" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="5 2.2"/>`
  + `<path d="M58 62C74 52 90 56 104 64" fill="none" stroke="#0d3a66" stroke-width="5.5" stroke-linecap="round"/><path d="M58 62C74 52 90 56 104 64" fill="none" stroke="#ff5a4a" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="5 2.2"/>`
  + `<path d="M58 62C56 70 66 74 76 76" fill="none" stroke="#0d3a66" stroke-width="5.5" stroke-linecap="round"/><path d="M58 62C56 70 66 74 76 76" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="4 2"/>`
  + city(14, 62) + city(58, 62) + city(104, 64)
  // raylar
  + `<rect x="0" y="104" width="120" height="10" fill="#0d3a66"/><g fill="#8a5a2b">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => `<rect x="${i * 10 - 1}" y="106" width="6" height="8" rx="1"/>`).join('')}</g><rect x="0" y="102" width="120" height="3" fill="#cfd8e3"/><rect x="0" y="102" width="120" height="1.2" fill="#fff"/>`
  // tren
  + car(6, '#ffd23f', '#b98a09') + car(30, '#ff5a4a', '#9a2518') + car(54, '#43d98a', '#1c8a50')
  + `<rect x="80" y="82" width="32" height="16" rx="3" fill="#0d2a4a"/><rect x="78" y="76" width="30" height="20" rx="4" fill="#2a4fb0" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/><rect x="80" y="78" width="26" height="5" rx="2.5" fill="#fff" opacity=".3"/><rect x="92" y="66" width="13" height="12" rx="2" fill="#1d3a82" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/><rect x="95" y="69" width="7" height="5" rx="1" fill="#bfe1ff"/><rect x="82" y="62" width="7" height="14" rx="1.5" fill="#1d3a82"/><rect x="80.5" y="60" width="10" height="3.5" rx="1.5" fill="#ff5a4a"/><circle cx="85" cy="98" r="3.6" fill="#222a3a" stroke="#fff" stroke-width="1"/><circle cx="96" cy="98" r="3.6" fill="#222a3a" stroke="#fff" stroke-width="1"/><circle cx="106" cy="98" r="3.6" fill="#222a3a" stroke="#fff" stroke-width="1"/><path d="M108 90l9 12h-9z" fill="#ffd23f" stroke="#b98a09" stroke-width=".8"/>`
  + `<circle cx="84" cy="56" r="3" fill="#fff" opacity=".6"/><circle cx="90" cy="50" r="2.2" fill="#fff" opacity=".45"/>`
  + sparkle(112, 52, .8) + sparkle(8, 90, .6);

export const PART_B = {
  catan: { t: ['CATAN', ''], svg: catan },
  risk: { t: ['RİSK', ''], svg: risk },
  cluedo: { t: ['CLUEDO', ''], svg: cluedo },
  scrabble: { t: ['SCRABBLE', ''], svg: scrabble },
  ticket: { t: ['TICKET', 'TO RIDE'], svg: ticket },
};
