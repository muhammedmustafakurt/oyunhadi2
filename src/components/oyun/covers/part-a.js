import { tile, sparkle } from './shared';

// Kapaklar (bölüm a): casus, gizli ajanlar, tabu, ben kimim, çiz bakalım.
const bar = (x, y, w, c = '#2a2442', o = 0.8) => `<rect x="${x}" y="${y}" width="${w}" height="3.2" rx="1.6" fill="${c}" opacity="${o}"/>`;
const drop = (x, y, s, c, c2) => `<path d="M${x} ${y - 7 * s}c${4 * s} ${5 * s} ${6 * s} ${8 * s} ${6 * s} ${11 * s}a${6 * s} ${6 * s} 0 0 1-${12 * s} 0c0-${3 * s} ${2 * s}-${6 * s} ${6 * s}-${11 * s}z" fill="${c}" stroke="${c2}" stroke-width="1.6"/><ellipse cx="${x - 2 * s}" cy="${y + 2 * s}" rx="${1.4 * s}" ry="${2.4 * s}" fill="#fff" opacity=".6"/>`;
const agent = (x, y, c1, c2) => tile(x, y, 20, c1, c2);

export const PART_A = {
  spyfall: {
    t: ['CASUS', ''],
    svg: `<rect width="120" height="114" fill="#2d2470"/><circle cx="60" cy="86" r="50" fill="#4332a0" opacity=".8"/><circle cx="60" cy="86" r="34" fill="#5a45c4" opacity=".5"/>
<g stroke="#8d7bff" stroke-width="1" opacity=".35"><path d="M0 62h120M0 80h120M0 98h120M20 50v64M50 50v64M80 50v64M108 50v64"/></g>
<g transform="translate(60 49) scale(.86) translate(-60 -49)"><path d="M92 70c-5 0-9 4-9 9 0 7 9 15 9 15s9-8 9-15c0-5-4-9-9-9z" fill="#ff5a4a" stroke="#8c1410" stroke-width="1.8"/><circle cx="92" cy="79" r="3.4" fill="#fff"/><path d="M89 74a5 5 0 0 1 5-2" stroke="#fff" stroke-width="1.4" fill="none" opacity=".7"/>
<path d="M69 94l26 17" stroke="#150f3d" stroke-width="12" stroke-linecap="round"/><path d="M69 94l26 17" stroke="#8a4b22" stroke-width="8" stroke-linecap="round"/><path d="M71 92l24 15" stroke="#c98a52" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
<circle cx="50" cy="86" r="26" fill="#150f3d"/><circle cx="50" cy="86" r="23" fill="#ffc233"/><circle cx="50" cy="86" r="23" fill="none" stroke="#ff8a1f" stroke-width="2.5" opacity=".7"/>
<circle cx="50" cy="86" r="18.5" fill="#cfe4ff"/><circle cx="50" cy="86" r="18.5" fill="#6c5cf0" opacity=".25"/>
<g><ellipse cx="50" cy="93" rx="17" ry="4.2" fill="#150f3d"/><path d="M38 92c0-7 1-13 5-15 3-2 5 0 7 0s4-2 7 0c4 2 5 8 5 15z" fill="#241a55"/><path d="M38.5 89.5h23v3.4h-23z" fill="#ffc233"/><path d="M43 79c2-1 4 0 7 0" stroke="#fff" stroke-width="1.4" opacity=".4" fill="none"/></g>
<path d="M36 78a17 17 0 0 1 14-9" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".75"/><circle cx="40" cy="70" r="2" fill="#fff"/>
<g><circle cx="22" cy="104" r="5.2" fill="#ffc233" stroke="#8a3b00" stroke-width="1.4"/><rect x="21" y="106" width="2" height="5" fill="#8a3b00" opacity=".0"/></g>
</g>${sparkle(10, 62, .9, '#ffe27a')}${sparkle(108, 58, .8)}${sparkle(76, 66, .55, '#ffe27a')}`,
  },
  ajanlar: {
    t: ['GİZLİ', 'AJANLAR'],
    svg: `<rect width="120" height="114" fill="#cf2b22"/><circle cx="50" cy="96" r="54" fill="#e8483a" opacity=".7"/><circle cx="50" cy="96" r="36" fill="#f6705a" opacity=".35"/>
<g transform="translate(60 49) scale(.86) translate(-60 -49)"><g transform="translate(0 -6) rotate(-3 50 82)">
${tile(6, 52, 22, '#ff6a5a', '#8c130d')}${tile(30, 52, 22, '#4aa3ff', '#164f9e')}${tile(54, 52, 22, '#f3e2b8', '#a98a4c')}
${tile(6, 76, 22, '#f3e2b8', '#a98a4c')}${tile(30, 76, 22, '#4a4a60', '#0c0c16')}${tile(54, 76, 22, '#4aa3ff', '#164f9e')}
${tile(6, 100, 22, '#ff6a5a', '#8c130d')}${tile(30, 100, 22, '#f3e2b8', '#a98a4c')}${tile(54, 100, 22, '#ff6a5a', '#8c130d')}
</g>
<g transform="translate(0 -6) rotate(-3 50 82)">${bar(36, 87, 10, '#fff', .85)}${bar(11, 87, 12, '#6a4b12')}${bar(60, 63, 12, '#6a4b12')}${bar(36, 111, 10, '#6a4b12')}${bar(36, 63, 10, '#fff', .85)}${bar(60, 87, 10, '#fff', .85)}${bar(11, 63, 10, '#fff', .85)}${bar(11, 111, 10, '#fff', .85)}${bar(60, 111, 10, '#fff', .85)}</g>
<g transform="translate(0 -4) rotate(7 100 84)"><rect x="82" y="58" width="32" height="40" rx="3.5" fill="#1b1530"/><rect x="84" y="60" width="28" height="36" rx="2.5" fill="#fff6dc"/><rect x="86" y="62" width="24" height="6" rx="1.5" fill="#fff" opacity=".5"/>
${[0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4].map((c) => `<rect x="${87 + c * 4.6}" y="${66 + r * 5.8}" width="3.8" height="4.8" rx=".8" fill="${['#ff4a3a', '#2f8cff', '#d9c08a', '#d9c08a', '#ff4a3a', '#2f8cff', '#222', '#ff4a3a', '#d9c08a', '#2f8cff', '#d9c08a', '#ff4a3a', '#2f8cff', '#d9c08a', '#ff4a3a', '#2f8cff', '#d9c08a', '#ff4a3a', '#d9c08a', '#2f8cff', '#ff4a3a', '#d9c08a', '#2f8cff', '#2f8cff', '#d9c08a'][r * 5 + c]}"/>`).join('')).join('')}</g>
</g>${sparkle(110, 54, .8)}${sparkle(5, 98, .6, '#ffe27a')}`,
  },
  tabu: {
    t: ['TABU', ''],
    svg: `<rect width="120" height="114" fill="#d92f78"/><circle cx="60" cy="90" r="52" fill="#f0508e" opacity=".7"/><circle cx="60" cy="90" r="34" fill="#ff7aa9" opacity=".3"/>
<g transform="translate(60 49) scale(.86) translate(-60 -49)"><g transform="rotate(-6 60 84)"><rect x="29" y="53" width="62" height="58" rx="5" fill="#1b1530"/><rect x="31" y="55" width="58" height="54" rx="4" fill="#fff8ec"/><rect x="31" y="55" width="58" height="13" rx="4" fill="#ffc233"/><rect x="31" y="64" width="58" height="4" fill="#ffc233"/><rect x="35" y="57" width="50" height="4.5" rx="2" fill="#fff" opacity=".5"/>
<rect x="38" y="58.5" width="30" height="5.5" rx="2.7" fill="#8a3b00"/>
${[0, 1, 2, 3].map((i) => `<rect x="${i % 2 ? 42 : 38}" y="${73 + i * 8.6}" width="${i % 2 ? 36 : 44}" height="5.4" rx="2.7" fill="#2a2442" opacity=".85"/>`).join('')}</g>
<circle cx="60" cy="85" r="27" fill="#ff2d3d" opacity=".16"/>
<circle cx="60" cy="85" r="25" fill="none" stroke="#5c0a14" stroke-width="12"/><circle cx="60" cy="85" r="25" fill="none" stroke="#ff3a48" stroke-width="8.5"/><path d="M42 67a25 25 0 0 1 22-7" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".6"/>
<path d="M42.5 102.5l35-35" stroke="#5c0a14" stroke-width="12" stroke-linecap="round"/><path d="M42.5 102.5l35-35" stroke="#ff3a48" stroke-width="8.5" stroke-linecap="round"/><path d="M45 99l17-17" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>
</g>${sparkle(12, 64, .9)}${sparkle(108, 98, .8, '#ffe27a')}${sparkle(104, 60, .55)}`,
  },
  kimim: {
    t: ['BEN', 'KİMİM?'],
    svg: `<rect width="120" height="114" fill="#0f9bb8"/><circle cx="60" cy="88" r="52" fill="#2bc0dc" opacity=".6"/><circle cx="60" cy="88" r="32" fill="#7fe3f2" opacity=".3"/>
<g transform="translate(60 49) scale(.86) translate(-60 -49)"><path d="M38 72c-6 0-12 3-17 9M82 72c6 0 12 3 17 9M40 96c-8 2-14 6-18 12M80 96c8 2 14 6 18 12" stroke="#fff" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round" fill="none" opacity=".7"/>
<g><path d="M6 54h30a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H20l-7 7 1-7H6a4 4 0 0 1-4-4V58a4 4 0 0 1 4-4z" fill="#0a4f66"/><path d="M6 52h30a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H20l-7 7 1-7H6a4 4 0 0 1-4-4V56a4 4 0 0 1 4-4z" fill="#ffd84a"/><rect x="5" y="54" width="32" height="4" rx="2" fill="#fff" opacity=".45"/>${bar(8, 61, 24, '#8a5a00')}${bar(8, 67, 15, '#8a5a00')}</g>
<g><path d="M84 59h26a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4h-6l1 7-8-7H84a4 4 0 0 1-4-4V63a4 4 0 0 1 4-4z" fill="#8a1d36"/><path d="M84 57h26a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4h-6l1 7-8-7H84a4 4 0 0 1-4-4V61a4 4 0 0 1 4-4z" fill="#ff6a7f"/><rect x="83" y="59" width="28" height="4" rx="2" fill="#fff" opacity=".45"/>${bar(86, 66, 22, '#fff', .9)}${bar(86, 72, 13, '#fff', .9)}</g>
<g><path d="M8 96h26a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4z" fill="#3a1f96"/><path d="M8 94h26a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4z" fill="#a98bff"/>${bar(9, 98, 20, '#fff', .9)}${bar(9, 104, 12, '#fff', .9)}</g>
<g><path d="M88 98h22a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H88a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4z" fill="#1c6b3c"/><path d="M88 96h22a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H88a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4z" fill="#43d9a0"/>${bar(88, 100, 16, '#fff', .9)}${bar(88, 105, 10, '#fff', .9)}</g>
<g transform="rotate(5 60 84)"><rect x="39" y="53" width="44" height="60" rx="5" fill="#0a3a4a"/><rect x="39" y="50" width="44" height="60" rx="5" fill="#fff8ec"/><rect x="39" y="50" width="44" height="60" rx="5" fill="none" stroke="#1b1530" stroke-width="2"/><rect x="42" y="53" width="38" height="12" rx="3" fill="#fff" stroke="#e7d9bd" stroke-width=".8"/><rect x="42" y="99" width="38" height="8" rx="3" fill="#ffd84a" opacity=".0"/>
<text x="61" y="100" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="52" fill="#0a3a4a" stroke="#0a3a4a" stroke-width="6" stroke-linejoin="round">?</text>
<text x="61" y="98" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="52" fill="#ff7a59" stroke="#c23c1b" stroke-width="1.6" stroke-linejoin="round">?</text></g>
</g>${sparkle(100, 52, .8)}${sparkle(14, 88, .6, '#ffe27a')}`,
  },
  cizim: {
    t: ['ÇİZ', 'BAKALIM'],
    svg: `<rect width="120" height="114" fill="#f2a000"/><circle cx="56" cy="92" r="52" fill="#ffbd2e" opacity=".75"/><circle cx="56" cy="92" r="34" fill="#ffd96a" opacity=".4"/>
<g transform="translate(60 49) scale(.86) translate(-60 -49)"><g><rect x="9" y="56" width="74" height="54" rx="4" fill="#4a2a0a"/><rect x="9" y="53" width="74" height="54" rx="4" fill="#b8742e"/><rect x="9" y="53" width="74" height="54" rx="4" fill="none" stroke="#5a3210" stroke-width="1.6"/><rect x="11" y="55" width="70" height="5" rx="2" fill="#fff" opacity=".28"/><rect x="15" y="59" width="62" height="42" rx="2" fill="#fffaf0" stroke="#5a3210" stroke-width="1.6"/></g>
<path d="M19 90c7-18 13-18 18-6s11 10 17-4 12-12 18 2" stroke="#2f8cff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<path d="M19 96c9-8 18-4 26-1s16 1 24-8" stroke="#ff4a6a" stroke-width="4.5" stroke-linecap="round" fill="none"/>
<path d="M22 72c8-6 14-2 20 0s12 2 18-6" stroke="#2ec27e" stroke-width="4" stroke-linecap="round" fill="none"/>
<circle cx="68" cy="74" r="6" fill="#ffd84a" stroke="#d9930b" stroke-width="1.6"/>
<g transform="rotate(42 96 84)"><rect x="90" y="46" width="13" height="50" rx="2" fill="#17102d"/><rect x="91" y="46" width="11" height="50" rx="2" fill="#e8403a"/><rect x="91" y="46" width="4" height="50" fill="#fff" opacity=".35"/><rect x="91" y="40" width="11" height="9" rx="2" fill="#c9ced8" stroke="#17102d" stroke-width="1.4"/><rect x="91" y="35" width="11" height="6" rx="3" fill="#ff9aa8" stroke="#17102d" stroke-width="1.4"/><path d="M90 96h13l-6.5 15z" fill="#f3d19a" stroke="#17102d" stroke-width="1.6" stroke-linejoin="round"/><path d="M94 104.5h5l-2.5 6.5z" fill="#2a2442"/></g>
${drop(104, 66, .9, '#2f8cff', '#14498f')}${drop(88, 108, .7, '#ff4a6a', '#8a1230')}${drop(8, 108, .6, '#2ec27e', '#126b43')}
</g>${sparkle(12, 50, .8)}${sparkle(112, 100, .6)}`,
  },
};
