// Azul (Next Move Games / Plan B Games; Michael Kiesling). 2-4 oyuncu: fabrikalardan aynı renkten fayanslar alınır,
// desen çizgilerine ya da tabana konur; tam desen çizgileri duvara geçer ve puan verir. Oyun, bir oyuncu duvarda
// yatay 5'li bir satır tamamladığı tur sonunda biter; bitiş bonusları eklenir.
// Kaynaklar: officialgamerules.org/game-rules/azul ; rulespal.com/azul/rulebook ; lehi-innovation.github.io (taban cezaları).
// Torba, kapak ve fabrikalar yalnızca sunucuda tutulur; viewFor torbanın içeriğini göstermez, yalnızca sayısını verir.
//
// Durum: { n, round, bag, lid, factories, center, marker, players: [{ wall, lines, floor, score }], turn, startP, gone, over, note }
//   wall: 5x5, boş null, dolu renk kodu. lines: 5 çizgi (kapasite 1..5), her biri renk dizisi.
//   floor: en çok 7 giriş; renk kodu ya da MARKER ('F', başlangıç oyuncusu işareti; fayans değildir).
//   marker: başlangıç oyuncusu işareti merkezde mi (bu turda henüz alınmadı mı).
//   gone: masadan ayrılmış koltuklar (sırası atlanır).
//
// Hamle: act(g, idx, { type: 'take', src: 'factory' | 'center', factory, color, line })  line: 0..4 desen, -1 taban.

export const COLORS = ['B', 'Y', 'R', 'K', 'T']; // mavi, sarı, kırmızı, siyah, turkuaz
export const COLOR_NAME = { B: 'Mavi', Y: 'Sarı', R: 'Kırmızı', K: 'Siyah', T: 'Turkuaz' };
export const FLOOR = [-1, -1, -2, -2, -2, -3, -3]; // taban çizgisindeki 7 yuvanın cezası
export const MARKER = 'F';

// Duvar deseni: her satır bir sağa kayar. Satır r, sütun c'de COLORS[(c - r) mod 5] vardır.
export const wallCol = (color, row) => (COLORS.indexOf(color) + row) % 5;
export const patternColor = (row, col) => COLORS[(((col - row) % 5) + 5) % 5];

const emptyWall = () => Array.from({ length: 5 }, () => Array(5).fill(null));
const newPlayer = () => ({ wall: emptyWall(), lines: [[], [], [], [], []], floor: [], score: 0 });
const count = (a, x) => a.filter((y) => y === x).length;

function shuffle(a, rand) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Torba boşsa kapak karıştırılıp torbaya döner; ikisi de boşsa null.
function draw(g, rand) {
  if (!g.bag.length && g.lid.length) { g.bag = shuffle(g.lid, rand); g.lid = []; }
  return g.bag.length ? g.bag.pop() : null;
}

function fillFactories(g, rand) {
  for (const f of g.factories) {
    for (let k = 0; k < 4; k++) {
      const t = draw(g, rand);
      if (t === null) break;
      f.push(t);
    }
  }
}

export function newGame(n, rand = Math.random) {
  const bag = shuffle(COLORS.flatMap((c) => Array(20).fill(c)), rand);
  const g = {
    n,
    round: 1,
    bag,
    lid: [],
    factories: Array.from({ length: 2 * n + 1 }, () => []), // 2 kişi 5, 3 kişi 7, 4 kişi 9 fabrika
    center: [],
    marker: true,
    players: Array.from({ length: n }, newPlayer),
    turn: 0,
    startP: 0,
    gone: Array(n).fill(false),
    over: null,
    note: 'Bir fabrika ya da merkezden tek renk alın.',
  };
  fillFactories(g, rand);
  g.startP = g.turn = Math.floor(rand() * n);
  return g;
}

// Renk bu desen çizgisine konabilir mi? Taban (-1) her zaman olur. Hata yoksa null.
export function placeError(p, color, line) {
  if (line === -1) return null;
  if (!Number.isInteger(line) || line < 0 || line > 4) return 'Geçersiz desen çizgisi.';
  const row = p.lines[line];
  if (row.length && row[0] !== color) return 'Bu çizgide başka renkte fayans var.';
  if (row.length > line) return 'Bu desen çizgisi dolu.';
  if (p.wall[line].includes(color)) return 'Bu renk bu sırada duvarda zaten var.';
  return null;
}

// Duvara konan fayansın puanı: yatay ve dikey bitişik zincirler (tek başına ise 1 puan).
export function scoreAt(wall, r, c) {
  let h = 1;
  for (let x = c - 1; x >= 0 && wall[r][x]; x--) h++;
  for (let x = c + 1; x < 5 && wall[r][x]; x++) h++;
  let v = 1;
  for (let y = r - 1; y >= 0 && wall[y][c]; y--) v++;
  for (let y = r + 1; y < 5 && wall[y][c]; y++) v++;
  return ((h > 1 ? h : 0) + (v > 1 ? v : 0)) || 1;
}

const pushFloor = (n, p, item) => {
  if (p.floor.length < FLOOR.length) p.floor.push(item);
  else if (item !== MARKER) n.lid.push(item); // taban dolunca fazla fayans kutu kapağına gider
};

function nextTurn(g, from) {
  for (let k = 1; k <= g.n; k++) {
    const j = (from + k) % g.n;
    if (!g.gone[j]) return j;
  }
  return from;
}

// Bitiş bonusları: yatay satır +2, dikey sütun +7, bir renkten 5 fayans +10. Eşitlikte önce yatay satır sayısı.
function finish(n, lead = '') {
  const detail = n.players.map((p) => {
    const w = p.wall;
    const rows = w.filter((row) => row.every(Boolean)).length;
    const cols = [0, 1, 2, 3, 4].filter((c) => w.every((row) => row[c])).length;
    const colors = COLORS.filter((c) => w.flat().filter((x) => x === c).length === 5).length;
    return { rows, cols, colors, bonus: rows * 2 + cols * 7 + colors * 10 };
  });
  n.players.forEach((p, i) => { p.score += detail[i].bonus; });
  const ranking = n.players.map((_, i) => i).sort((a, b) =>
    (Number(n.gone[a]) - Number(n.gone[b])) || (n.players[b].score - n.players[a].score) || (detail[b].rows - detail[a].rows));
  const live = ranking.filter((i) => !n.gone[i]);
  const best = live.length ? n.players[live[0]].score : 0;
  const winners = live.filter((i) => n.players[i].score === best && detail[i].rows === detail[live[0]].rows);
  n.over = { ranking, winners, detail, lead };
  n.note = 'Oyun bitti.';
  return n;
}

// Tur sonu: tam desen çizgileri duvara geçer (puanlanır), kalanlar kapağa; taban cezası uygulanır.
// Oyun bitmediyse yeni tur için fabrikalar doldurulur ve başlangıç işareti sahibi başlar.
function endRound(n, rand) {
  let holder = -1;
  n.players.forEach((p, i) => {
    for (let r = 0; r < 5; r++) {
      const row = p.lines[r];
      if (row.length !== r + 1) continue;
      const col = wallCol(row[0], r);
      p.wall[r][col] = row[0];
      p.score += scoreAt(p.wall, r, col);
      n.lid.push(...row.slice(1));
      p.lines[r] = [];
    }
    let pen = 0;
    p.floor.forEach((x, k) => { pen += FLOOR[k]; if (x === MARKER) holder = i; });
    p.score = Math.max(0, p.score + pen);
    for (const x of p.floor) if (x !== MARKER) n.lid.push(x);
    p.floor = [];
  });
  // Başlangıç işareti hiç alınmadıysa (merkezde kaldıysa) başlayan oyuncu değişmez.
  if (holder >= 0) n.startP = holder;
  if (n.players.some((p) => p.wall.some((row) => row.every(Boolean)))) return finish(n);
  n.round += 1;
  n.marker = true;
  n.center = [];
  n.turn = n.gone[n.startP] ? nextTurn(n, n.startP) : n.startP;
  fillFactories(n, rand);
  n.note = `Tur ${n.round}: fabrikalar dolduruldu.`;
  return n;
}

// Bir oyuncunun hamlesi. Hata varsa { error }, yoksa yeni durum döner (gelen g değişmez).
export function act(g, idx, a, rand = Math.random) {
  if (g.over) return { error: 'Oyun bitti.' };
  if (g.gone[idx]) return { error: 'Oyunda değilsiniz.' };
  if (g.turn !== idx) return { error: 'Sıra sizde değil.' };
  if (a.type !== 'take') return { error: 'Bilinmeyen hamle.' };
  const color = a.color;
  if (!COLORS.includes(color)) return { error: 'Geçersiz renk.' };
  const n = structuredClone(g);
  let taken;
  if (a.src === 'factory') {
    const f = Number.isInteger(a.factory) ? n.factories[a.factory] : undefined;
    if (!f) return { error: 'Geçersiz fabrika.' };
    if (!f.includes(color)) return { error: 'Bu fabrikada bu renk yok.' };
    taken = count(f, color);
    n.center.push(...f.filter((c) => c !== color)); // geri kalanlar merkeze
    f.length = 0;
  } else if (a.src === 'center') {
    if (!n.center.includes(color)) return { error: 'Merkezde bu renk yok.' };
    taken = count(n.center, color);
    n.center = n.center.filter((c) => c !== color);
  } else {
    return { error: 'Geçersiz kaynak.' };
  }
  const p = n.players[idx];
  const err = placeError(p, color, a.line);
  if (err) return { error: err };
  if (a.src === 'center' && n.marker) { n.marker = false; pushFloor(n, p, MARKER); }
  let left = taken;
  if (a.line >= 0) {
    const row = p.lines[a.line];
    const put = Math.min(a.line + 1 - row.length, left);
    for (let k = 0; k < put; k++) row.push(color);
    left -= put;
  }
  for (let k = 0; k < left; k++) pushFloor(n, p, color);
  if (n.center.length === 0 && n.factories.every((f) => f.length === 0)) return endRound(n, rand);
  n.turn = nextTurn(n, idx);
  return n;
}

// Masadan ayrılan oyuncu: sırası atlanır. Yalnızca bir oyuncu kalırsa oyun biter.
export function onLeave(g, seats, idx) {
  if (g.over) return g;
  const n = structuredClone(g);
  n.gone[idx] = true;
  if (n.gone.filter((x) => !x).length <= 1) return finish(n, 'Rakipler masadan ayrıldı.');
  if (n.turn === idx) n.turn = nextTurn(n, idx);
  return n;
}

// Herkese giden görünüm: torbanın içeriği gizlidir, yalnızca sayısı gider.
export function viewFor(g) {
  if (!g) return null;
  return {
    round: g.round,
    turn: g.turn,
    startP: g.startP,
    factories: g.factories,
    center: g.center,
    marker: g.marker,
    bagLeft: g.bag.length,
    lidLeft: g.lid.length,
    players: g.players,
    gone: g.gone,
    note: g.note,
    over: g.over,
  };
}
