import { tile, sparkle } from './shared';

// Yüzsüz meeple siluet piyonu (merkez x,y; ölçek s)
const MP = 'M-4 -4L-11 -1.5V2.5L-4.5 1.5-7 11H-1.2L0 6.5 1.2 11H7L4.5 1.5 11 2.5V-1.5L4 -4z';
const meeple = (x, y, s, c1, c2) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><g transform="translate(0 1.4)"><path d="${MP}" fill="${c2}"/><circle cx="0" cy="-8.5" r="4.6" fill="${c2}"/></g><path d="${MP}" fill="${c1}"/><circle cx="0" cy="-8.5" r="4.6" fill="${c1}"/><ellipse cx="-1.4" cy="-10.2" rx="2" ry="1.3" fill="#fff" opacity=".45"/><path d="M-9.5 -1.2l5-2h3" stroke="#fff" stroke-width="1.2" fill="none" opacity=".4" stroke-linecap="round"/></g>`;

// Futbol topu
const ball = (x, y, r) => {
  const pt = (a, k) => `${(x + Math.cos(a) * r * k).toFixed(1)} ${(y + Math.sin(a) * r * k).toFixed(1)}`;
  const A = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  const pent = [0, 1, 2, 3, 4].map((i) => pt(A(i), 0.4)).join('L');
  const spokes = [0, 1, 2, 3, 4].map((i) => `<path d="M${pt(A(i), 0.4)}L${pt(A(i), 0.7)}" stroke="#1b1530" stroke-width="${(r * 0.09).toFixed(2)}" stroke-linecap="round"/><path d="M${pt(A(i) + 0.62, 1)}L${pt(A(i) + 0.4, 0.74)}L${pt(A(i) - 0.4, 0.74)}L${pt(A(i) - 0.62, 1)}z" fill="#1b1530"/>`).join('');
  return `<circle cx="${x}" cy="${y + r * 0.12}" r="${r}" fill="#06210f" opacity=".35"/><circle cx="${x}" cy="${y}" r="${r}" fill="#1b1530"/><circle cx="${x}" cy="${y}" r="${r - 1.4}" fill="url(#cv-gw)"/>${spokes}<path d="M${pent}z" fill="#1b1530"/><ellipse cx="${x - r * 0.38}" cy="${y - r * 0.58}" rx="${r * 0.3}" ry="${r * 0.15}" fill="#fff" opacity=".9" transform="rotate(-35 ${x - r * 0.38} ${y - r * 0.58})"/>`;
};

// Azulejo desenleri
const pat = (x, y, s, k, c) => {
  const cx = x + s / 2, cy = y + s / 2;
  if (k === 0) return `<path d="M${cx} ${y + 4.5}L${x + s - 4.5} ${cy} ${cx} ${y + s - 4.5} ${x + 4.5} ${cy}z" fill="${c}"/><circle cx="${cx}" cy="${cy}" r="2.2" fill="#fff" opacity=".75"/>`;
  if (k === 1) return `<circle cx="${cx}" cy="${cy}" r="${s * 0.3}" fill="none" stroke="${c}" stroke-width="2.4"/><circle cx="${cx}" cy="${cy}" r="2.4" fill="${c}"/>`;
  if (k === 2) return [[0, -4.2], [4.2, 0], [0, 4.2], [-4.2, 0]].map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="3.4" fill="${c}"/>`).join('') + `<circle cx="${cx}" cy="${cy}" r="2.2" fill="#fff" opacity=".85"/>`;
  return `<rect x="${cx - 4.5}" y="${cy - 4.5}" width="9" height="9" fill="none" stroke="${c}" stroke-width="2.2" transform="rotate(45 ${cx} ${cy})"/><circle cx="${cx}" cy="${cy}" r="2" fill="${c}"/>`;
};
const azul = () => {
  const W = ['#f6f9ff', '#a9bde6', '#1f5fc0'], B = ['#2f6fd8', '#173f94', '#ffffff'], O = ['#ff9a2e', '#b35205', '#fff4d6'];
  const grid = [[W, B, O, W, B, O], [B, O, W, B, O, W], [O, W, B, O, W, B]];
  let out = '';
  grid.forEach((row, r) => row.forEach((set, c) => {
    out += tile(c * 20, 52 + r * 20, 20, set[0], set[1]) + pat(c * 20, 52 + r * 20, 20, (r + c * 2) % 4, set[2]);
  }));
  return out;
};

// Kadro: saha, 4-3-3
const player = (x, y, c1, c2) =>
  `<ellipse cx="${x}" cy="${y + 5}" rx="5.8" ry="2" fill="#0b3a1c" opacity=".5"/><circle cx="${x}" cy="${y}" r="5.8" fill="${c2}"/><circle cx="${x}" cy="${y}" r="4.6" fill="${c1}"/><ellipse cx="${x - 1}" cy="${y - 2.3}" rx="2.7" ry="1.4" fill="#fff" opacity=".55"/>`;
const kadro = () => {
  const Y = '#ffd84a', Yd = '#b57a05', R = '#ff7a59', Rd = '#a8300f';
  const pl = [[12, 80, R, Rd], ...[60, 73, 87, 100].map((y) => [30, y, Y, Yd]), ...[66, 80, 94].map((y) => [53, y, Y, Yd]), ...[66, 80, 94].map((y) => [76, y, Y, Yd])];
  return `<rect width="120" height="114" fill="#1d9a4c"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${i * 20}" y="0" width="10" height="114" fill="#25b05a" opacity=".55"/>`).join('')}<g fill="none" stroke="#fff" stroke-width="1.6" opacity=".9" stroke-linejoin="round"><rect x="5" y="54" width="110" height="52" rx="2"/><path d="M60 54v52"/><circle cx="60" cy="80" r="11"/><rect x="5" y="59" width="24" height="42"/><rect x="5" y="69" width="10" height="24"/><rect x="91" y="59" width="24" height="42"/><rect x="105" y="69" width="10" height="24"/></g><circle cx="60" cy="80" r="1.8" fill="#fff"/>${pl.map(([x, y, a, b]) => player(x, y, a, b)).join('')}${ball(99, 82, 8)}${sparkle(112, 52, .8)}${sparkle(7, 50, .6)}`;
};

// Futbolcuyu Bul: konuşma balonları
const bubble = (x, y, w, h, c1, c2, txt) =>
  `<path d="M${x - 7} ${y + h * 0.5 + 2}l8 -4v8z" fill="${c2}"/><rect x="${x}" y="${y + 2}" width="${w}" height="${h}" rx="7" fill="${c2}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${c1}"/><rect x="${x + 3}" y="${y + 1.5}" width="${w - 6}" height="${h * 0.34}" rx="3.5" fill="#fff" opacity=".3"/><text x="${x + w / 2}" y="${y + h * 0.72}" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="10" fill="#fff" stroke="${c2}" stroke-width="2" paint-order="stroke">${txt}</text>`;

const tower = (x, h = 46) =>
  `<rect x="${x}" y="${108 - h}" width="17" height="${h}" rx="1.5" fill="#d9ad6a"/><rect x="${x}" y="${108 - h}" width="6" height="${h}" fill="#fff" opacity=".28"/><rect x="${x + 10}" y="${108 - h}" width="7" height="${h}" fill="#a8763a" opacity=".5"/><path d="M${x - 3} ${108 - h}L${x + 8.5} ${108 - h - 18} ${x + 20} ${108 - h}z" fill="#c8321e"/><path d="M${x - 3} ${108 - h}L${x + 8.5} ${108 - h - 18} ${x + 5} ${108 - h}z" fill="#ff6a4d"/><rect x="${x + 5}" y="${108 - h + 8}" width="7" height="11" rx="3.5" fill="#5a2a12"/><path d="M${x + 8.5} ${108 - h - 18}v-6" stroke="#5a2a12" stroke-width="1.2"/><path d="M${x + 8.5} ${108 - h - 24}l7 2.5-7 2.5z" fill="#ffd84a"/>`;

export const PART_C = {
  carcassonne: { t: ['CARCASSONNE', ''], svg: `<rect width="120" height="114" fill="#6f9a2c"/><circle cx="60" cy="100" r="58" fill="#86b53a"/><circle cx="60" cy="100" r="40" fill="#9bc94a" opacity=".6"/>${sparkle(10, 58, .8)}${sparkle(110, 62, .7)}<path d="M0 104q30-10 60-4t60 4v10H0z" fill="#4f7a1c"/><rect x="30" y="70" width="60" height="38" fill="#e8c48a"/><rect x="30" y="70" width="60" height="9" fill="#fff" opacity=".3"/><rect x="30" y="100" width="60" height="8" fill="#a8763a"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${31 + i * 12.5}" y="65" width="8" height="6" fill="#e8c48a"/><rect x="${31 + i * 12.5}" y="65" width="8" height="2.5" fill="#fff" opacity=".4"/>`).join('')}<path d="M52 108V90a8 8 0 0 1 16 0v18z" fill="#5a2a12"/><path d="M60 82v26M54 94h12" stroke="#2a1206" stroke-width="1.4" opacity=".6"/>${tower(19)}${tower(84)}${tile(2, 87, 22, '#c9a064', '#7a5224')}<rect x="2" y="95" width="22" height="6" fill="#f2dcae"/>${tile(96, 87, 22, '#7fcf48', '#3f7a1c')}<path d="M99 106C104 100 110 98 115 92" stroke="#f2dcae" stroke-width="5" fill="none" stroke-linecap="round"/>${meeple(14, 80, .8, '#ff4d4d', '#8c1414')}${meeple(106, 78, .8, '#4aa8ff', '#144a8c')}` },

  azul: { t: ['AZUL', ''], svg: `<rect width="120" height="114" fill="#2468c4"/><circle cx="60" cy="40" r="46" fill="#2f7fe0" opacity=".7"/><g fill="#fff" opacity=".12"><circle cx="14" cy="22" r="10"/><circle cx="108" cy="30" r="14"/></g>${azul()}${sparkle(108, 50, .8)}${sparkle(12, 48, .6)}` },

  kadro: { t: ['KADRO', ''], svg: kadro() },

  futbolcu: { t: ['FUTBOLCUYU', 'BUL'], svg: `<rect width="120" height="114" fill="#0f6b3e"/><circle cx="40" cy="90" r="58" fill="#168a52"/><circle cx="40" cy="90" r="38" fill="#1fa862" opacity=".5"/><g fill="#fff" opacity=".08">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${i * 20}" y="0" width="10" height="114"/>`).join('')}</g>${ball(26, 86, 19)}<text x="64" y="98" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="52" fill="#8a3b00" stroke="#8a3b00" stroke-width="2.4" transform="translate(0 2.5)">?</text><text x="64" y="98" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="52" fill="url(#cv-gt)" stroke="#8a3b00" stroke-width="2.4" paint-order="stroke">?</text>${bubble(89, 54, 27, 20, '#2fc46a', '#14702f', 'EVET')}${bubble(89, 82, 27, 20, '#ff4d4d', '#9a1616', 'HAYIR')}${sparkle(46, 60, .8)}` },
};
