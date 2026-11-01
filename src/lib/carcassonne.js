// Carcassonne (temel oyun): karo yerleştirme, şehir/yol/manastır puanlaması, meeple ve çoğunluk kuralı.
// Kenarlar saat yönünde: 0 Kuzey, 1 Doğu, 2 Güney, 3 Batı. Her kenar: c (şehir), r (yol) ya da f (çayır).
// Çayır (çiftçi) puanlaması bu sürümde yok: köşe düzeyinde alan takibi gerektirir.
// Karo adetleri: TILE_DEFS. Kaynaklarla doğrulanan: toplam 72 karo (başlangıç karosu dahil), başlangıç karosu
// 1 adet, her oyuncu 8 meeple'dan 7'sini kullanır, puanlama kuralları. Harf başına adetler kaynaklarda
// bulunamadığı için taslaktır; kutudaki dağılımla karşılaştırılmalıdır.

const DIR = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const RING8 = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
const MEEPLE_PER_PLAYER = 7;

// k: anahtar, n: adet, e: kenarlar (N E G B), m: manastır, p: flama (şehir).
export const TILE_DEFS = [
  { k: 'A', n: 4, e: 'ffff', m: true },
  { k: 'B', n: 2, e: 'ffrf', m: true },
  { k: 'C', n: 1, e: 'cccc', p: true },
  { k: 'D', n: 5, e: 'cfff' },
  { k: 'E', n: 4, e: 'cfff', p: true },
  { k: 'F', n: 2, e: 'cfcf', p: true },
  { k: 'G', n: 1, e: 'cfcf' },
  { k: 'H', n: 4, e: 'ccff' },
  { k: 'I', n: 2, e: 'ccff', p: true },
  { k: 'J', n: 3, e: 'ccrr' },
  { k: 'K', n: 1, e: 'ccrr', p: true },
  { k: 'L', n: 3, e: 'crfr' },
  { k: 'M', n: 2, e: 'crfr', p: true },
  { k: 'N', n: 3, e: 'crrr' },
  { k: 'O', n: 2, e: 'crrr', p: true },
  { k: 'P', n: 4, e: 'ccrr' },
  { k: 'Q', n: 3, e: 'crrf' },
  { k: 'R', n: 8, e: 'rfrf' },
  { k: 'S', n: 3, e: 'cccf' },
  { k: 'U', n: 9, e: 'rrff' },
  { k: 'V', n: 4, e: 'rrrf' },
  { k: 'W', n: 1, e: 'rrrr' },
];
export const START_DEF = { k: 'START', e: 'crfr' };
const DEF = Object.fromEntries([START_DEF, ...TILE_DEFS].map((d) => [d.k, d]));
export const TILE_TOTAL = TILE_DEFS.reduce((a, d) => a + d.n, 0) + 1; // 72 (başlangıç dahil)

const key = (x, y) => `${x},${y}`;
const parse = (k) => k.split(',').map(Number);
const nbr = (pos, s) => { const [x, y] = parse(pos); return key(x + DIR[s][0], y + DIR[s][1]); };

// Karoyu saat yönünde r kez döndürür (kenar i'deki özellik (i+r) konumuna gider).
export function rot(e, r) {
  const a = e.split('');
  return a.map((_, i) => a[(i - r + 4) % 4]).join('');
}

// Tahtadaki her karo için: kenarlar, manastır, flama. Konum anahtarı "x,y".
function fits(board, pos, e) {
  for (let s = 0; s < 4; s++) {
    const nb = board[nbr(pos, s)];
    if (nb && nb.e[(s + 2) % 4] !== e[s]) return false;
  }
  return true;
}

// Karonun geçerli olduğu tüm (konum, döndürme) çiftleri.
export function spots(board, tk) {
  const def = DEF[tk];
  if (!def) return [];
  const cand = new Set();
  for (const pos of Object.keys(board)) {
    for (let s = 0; s < 4; s++) {
      const n = nbr(pos, s);
      if (!board[n]) cand.add(n);
    }
  }
  const out = [];
  for (const pos of cand) {
    const [x, y] = parse(pos);
    for (let r = 0; r < 4; r++) {
      if (fits(board, pos, rot(def.e, r))) out.push({ x, y, rot: r });
    }
  }
  return out;
}

// Özellikler (şehir/yol birleşik bileşenleri) ve manastırlar. Her karoda aynı türden kenarlar tek parça sayılır.
// Dönen: list (özellik nesneleri) ve idOf(pos, kind) (meeple'ın bulunduğu özelliğin kimliği).
function features(board) {
  const parent = new Map();
  const find = (x) => {
    if (!parent.has(x)) parent.set(x, x);
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r);
    return r;
  };
  for (const pos of Object.keys(board)) {
    const t = board[pos];
    for (const k of ['c', 'r']) {
      if (!t.e.includes(k)) continue;
      find(`${pos}|${k}`);
      for (let s = 0; s < 4; s++) {
        if (t.e[s] !== k) continue;
        const nb = nbr(pos, s);
        if (board[nb] && board[nb].e[(s + 2) % 4] === k) {
          parent.set(find(`${pos}|${k}`), find(`${nb}|${k}`));
        }
      }
    }
  }
  const map = new Map();
  const get = (id, kind) => {
    if (!map.has(id)) map.set(id, { id, kind, tiles: new Set(), pennants: 0, open: 0, filled: 0 });
    return map.get(id);
  };
  for (const pos of Object.keys(board)) {
    const t = board[pos];
    for (const k of ['c', 'r']) {
      if (!t.e.includes(k)) continue;
      const f = get(find(`${pos}|${k}`), k);
      f.tiles.add(pos);
      if (k === 'c' && t.p) f.pennants++;
      for (let s = 0; s < 4; s++) {
        if (t.e[s] === k && !board[nbr(pos, s)]) f.open++;
      }
    }
    if (t.m) {
      let filled = 0;
      for (const [dx, dy] of RING8) {
        const [x, y] = parse(pos);
        if (board[key(x + dx, y + dy)]) filled++;
      }
      const f = get(`m|${pos}`, 'm');
      f.tiles.add(pos);
      f.filled = filled;
      f.open = 8 - filled;
    }
  }
  const idOf = (pos, kind) => (kind === 'm' ? `m|${pos}` : find(`${pos}|${kind}`));
  return { list: [...map.values()], idOf };
}

// Özellik puanı. Tamamlanmış yol: karo sayısı. Tamamlanmış şehir: 2/karo + 2/flama.
// Manastır: 1 + çevredeki dolu karo sayısı (tamamlanınca 9). Tamamlanmamış şehir: 1/karo + 1/flama; yol: 1/karo.
export function points(f) {
  const done = f.open === 0;
  if (f.kind === 'm') return 1 + f.filled;
  if (f.kind === 'r') return f.tiles.size;
  return done ? 2 * f.tiles.size + 2 * f.pennants : f.tiles.size + f.pennants;
}

// Tahtayı ve meeple'ları yeniden okuyarak puanlar. ending=false: yalnızca tamamlananlar; true: hepsi.
function settle(g, ending) {
  const { list, idOf } = features(g.board);
  for (const f of list) {
    if (!ending && f.open > 0) continue;
    const ms = g.meeples.filter((m) => idOf(m.pos, m.kind) === f.id);
    if (!ms.length) continue;
    const counts = {};
    for (const m of ms) counts[m.owner] = (counts[m.owner] || 0) + 1;
    const best = Math.max(...Object.values(counts));
    const pts = points(f);
    for (const o of Object.keys(counts)) if (counts[o] === best) g.score[Number(o)] += pts;
    for (const m of ms) g.supply[m.owner]++;
    g.meeples = g.meeples.filter((m) => !ms.includes(m));
  }
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function finish(g) {
  settle(g, true);
  g.tile = null;
  g.phase = 'over';
  const best = Math.max(...g.score);
  const winners = g.score.map((s, i) => (s === best ? i : -1)).filter((i) => i >= 0);
  g.over = { scores: g.score.slice(), winners };
  g.msg = `Oyun bitti. ${winners.map((i) => g.names[i]).join(', ')} kazandı${winners.length > 1 ? ' (beraberlik)' : ''}.`;
  return g;
}

// Desteden karo çeker; hiçbir yere konamayan karo atılır ve yenisi çekilir. Deste bitince oyun biter.
function draw(g) {
  g.tile = null;
  g.phase = 'place';
  while (g.deck.length) {
    const k = g.deck.pop();
    if (spots(g.board, k).length) { g.tile = k; return g; }
    g.discards++;
  }
  return finish(g);
}

function nextTurn(g) {
  const n = g.names.length;
  for (let i = 1; i <= n; i++) {
    const j = (g.turn + i) % n;
    if (!g.left[j]) { g.turn = j; break; }
  }
  g.last = null;
  return draw(g);
}

export function newGame(seats) {
  const deck = [];
  for (const d of TILE_DEFS) for (let i = 0; i < d.n; i++) deck.push(d.k);
  const n = seats.length;
  const g = {
    names: seats.map((s) => s.name),
    board: { '0,0': { k: START_DEF.k, e: START_DEF.e, m: false, p: false } },
    deck: shuffle(deck),
    discards: 0,
    supply: Array(n).fill(MEEPLE_PER_PLAYER),
    score: Array(n).fill(0),
    meeples: [],
    left: Array(n).fill(false),
    turn: 0,
    phase: 'place',
    tile: null,
    last: null,
    over: null,
    msg: '',
  };
  return draw(g);
}

// Sıradaki oyuncu dışındakiler için durum (desteyi gizler, yerleştirme noktalarını yalnızca sıra sahibine verir).
export function viewFor(g, me) {
  if (!g) return g;
  const { deck, ...rest } = g;
  const mine = me === g.turn && g.phase === 'place' && g.tile && !g.over;
  return { ...rest, deckLeft: deck.length, spots: mine ? spots(g.board, g.tile) : [], me };
}

// Hamle. a.type: 'place' ({x,y,rot}) ya da 'meeple' ({kind: 'c'|'r'|'m'|null}; null: meeple koyma).
// Hata durumunda {error} döner; durum değişmez (çağıran kopya üzerinde çalışır).
export function act(g, idx, a) {
  if (!g || g.over) return { error: 'Oyun bitti.' };
  if (idx !== g.turn) return { error: 'Sıra sizde değil.' };
  if (a.type === 'place') {
    if (g.phase !== 'place' || !g.tile) return { error: 'Şu an karo koyamazsınız.' };
    const x = Number(a.x), y = Number(a.y), r = Number(a.rot);
    if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(r) || r < 0 || r > 3) return { error: 'Geçersiz konum.' };
    const pos = key(x, y);
    if (g.board[pos]) return { error: 'Bu alan dolu.' };
    const def = DEF[g.tile];
    const e = rot(def.e, r);
    if (!fits(g.board, pos, e)) return { error: 'Karo bu noktaya uymuyor.' };
    g.board[pos] = { k: def.k, e, m: !!def.m, p: !!def.p };
    g.last = pos;
    g.phase = 'meeple';
    settle(g, false);
    return g;
  }
  if (a.type === 'meeple') {
    if (g.phase !== 'meeple') return { error: 'Önce karo koymalısınız.' };
    if (a.kind) {
      const k = a.kind;
      if (!['c', 'r', 'm'].includes(k)) return { error: 'Geçersiz meeple yeri.' };
      const t = g.board[g.last];
      if (k === 'm' ? !t.m : !t.e.includes(k)) return { error: 'Bu karoda böyle bir yer yok.' };
      if (g.supply[idx] <= 0) return { error: 'Meeple\'iniz kalmadı.' };
      const { idOf } = features(g.board);
      const id = idOf(g.last, k);
      if (g.meeples.some((m) => idOf(m.pos, m.kind) === id)) return { error: 'Bu yerde zaten bir meeple var.' };
      g.meeples.push({ pos: g.last, kind: k, owner: idx });
      g.supply[idx]--;
      settle(g, false);
    }
    return nextTurn(g);
  }
  return { error: 'Bilinmeyen işlem.' };
}

// Oyuncu masadan ayrılırsa: sırası ise hamlesi atlanır; 2'den az oyuncu kalırsa oyun biter.
export function onLeave(g, seats, idx) {
  if (!g || g.over) return g;
  g.left[idx] = true;
  if (g.left.filter((x) => !x).length < 2) {
    g.msg = `${g.names[idx]} ayrıldı.`;
    return finish(g);
  }
  if (g.turn === idx) {
    g.msg = `${g.names[idx]} ayrıldığı için sırası atlandı.`;
    return nextTurn(g);
  }
  return g;
}

export const MEEPLES = MEEPLE_PER_PLAYER;
