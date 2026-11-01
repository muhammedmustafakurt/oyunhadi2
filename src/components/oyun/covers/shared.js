// Oyun kartı kapak sanatı yardımcıları. Her kapak 120x114'lük bir SVG iç kodudur (string).
// Başlık yazısı (parlak, kabarık harfler) buildCover ile sonradan eklenir; sanat için kural:
//  - Arka plan (bg) tüm 120x114 alanı doldurur.
//  - Başlık yaklaşık y=8..50 aralığında, ortada durur; ana motifler y=48..114 aralığında olmalı.
//  - Yüz, göz, gülümseme, karakter ÇİZME. Geometrik, cilalı (açık üst parlama + koyu alt kenar) parçalar kullan.
export const DEFS = `
<linearGradient id="cv-gt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".55" stop-color="#ffc233"/><stop offset="1" stop-color="#ff8a1f"/></linearGradient>
<linearGradient id="cv-gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9d5ff"/></linearGradient>
<radialGradient id="cv-moon" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fffbe0"/><stop offset=".6" stop-color="#ffe27a"/><stop offset="1" stop-color="#f0b429"/></radialGradient>`;

// Cilalı kare fayans: c1 yüz rengi, c2 kenar/gölge rengi, txt isteğe bağlı harf.
export const tile = (x, y, s, c1, c2, txt = '') =>
  `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="2.5" fill="${c2}"/><rect x="${x + 1.5}" y="${y + 1.5}" width="${s - 3}" height="${s - 3}" rx="2" fill="${c1}"/><rect x="${x + 3}" y="${y + 3}" width="${s - 6}" height="${s * 0.32}" rx="1.5" fill="#fff" opacity=".28"/>${txt ? `<text x="${x + s / 2}" y="${y + s * 0.72}" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="${s * 0.6}" fill="#fff" stroke="${c2}" stroke-width="1.4" paint-order="stroke">${txt}</text>` : ''}`;

// Parıltı (4 köşeli yıldız)
export const sparkle = (x, y, s = 1, c = '#fff', o = 0.9) =>
  `<path d="M${x} ${y - 6 * s}l${1.6 * s} ${4 * s} ${4 * s} ${1.6 * s}-${4 * s} ${1.6 * s}-${1.6 * s} ${4 * s}-${1.6 * s}-${4 * s}-${4 * s}-${1.6 * s} ${4 * s}-${1.6 * s}z" fill="${c}" opacity="${o}"/>`;

// Başlık: iki satır; ilk satır altın sarısı kabarık harf, ikinci satır beyaz-mavi.
export function titleSvg(t) {
  const [a, b] = t;
  const s1 = a.length <= 5 ? 26 : a.length <= 7 ? 21 : 17;
  const s2 = !b ? 0 : b.length <= 8 ? 14 : 12;
  const y1 = b ? 30 : 34;
  return `<g font-family="Fredoka, sans-serif" font-weight="700" text-anchor="middle" paint-order="stroke" stroke-linejoin="round">
<text x="60" y="${y1 + 2.5}" font-size="${s1}" fill="#1b1530" stroke="#1b1530" stroke-width="5">${a}</text>
<text x="60" y="${y1}" font-size="${s1}" fill="url(#cv-gt)" stroke="#8a3b00" stroke-width="2.6">${a}</text>
${b ? `<text x="60" y="44" font-size="${s2}" fill="url(#cv-gw)" stroke="#1b3d8a" stroke-width="3">${b}</text>` : ''}</g>`;
}

// entry: { t: ['BİL', 'BAKALIM'], svg: '<rect .../>...' }
export const buildCover = (entry, withTitle = true) => entry.svg + (withTitle ? titleSvg(entry.t) : '');
