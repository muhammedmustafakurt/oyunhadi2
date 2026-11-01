// Risk (klasik kurallar): 42 bölge, 6 kıta, zarla savaş, kart takası, kıta bonusu.
// Tüm kurallar sunucuda işlenir; her eylem yeni bir durum döndürür ya da { error } verir. Zarlar sunucuda atılır.
//
// Kurallar (kaynak: officialgamerules.org/game-rules/risk, en.wikipedia.org/wiki/Risk_(game), başlangıç ordusu ve
// kart değerleri için klasik Risk kuralları):
// - Başlangıç ordusu (oyuncu başına toplam): 3 kişi 35, 4 kişi 30, 5 kişi 25, 6 kişi 20.
// - Takviye: bölge sayısı/3 (en az 3) + tam sahip olunan kıtaların bonusu + kart takası.
// - Saldırı: saldıran en çok 3 zar (en az 1 ordu bırakmak şartıyla), savunan en çok 2 zar. Zarlar en büyükten
//   başlayarak eşleştirilir; beraberlikte savunan kazanır. Fetihte en az zar sayısı kadar ordu otomatik taşınır,
//   ek ordular (en çok kalan - 1) sonra taşınabilir.
// - Tur sonu: bu turda en az bir bölge fethedildiyse bir kart çekilir (turda en çok 1).
// - Manevra: turda bir kez, kendi bölgeleri üzerinden bağlı bir bölgeden başka bir kendi bölgesine.
// - Kart takası: 3 aynı tür ya da 3 farklı tür; joker her şeyin yerine geçer. Takas değerleri 4,6,8,10,12,15
//   ve sonrası +5. Kartın gösterdiği, takasçıya ait bölgeye +2 ordu eklenir.
// - 5 ya da daha fazla kart varsa takviye öncesi takas zorunludur.
// - Elenen oyuncunun kartları fethedene geçer. Dünyanın tamamını (42 bölge) alan kazanır.
//
// 2 oyuncu varyantı (basit tutuldu): nötr ordu yoktur; her oyuncu 40 ordu ile başlar, bölgeler 21'er paylaşılır.
// Masadan ayrılan oyuncunun bölgeleri tarafsız olur (sahipsiz, ordusu kalır, herkes saldırabilir). Yalnızca bir
// oyuncu kalırsa oyun biter.
//
// Durum: { n, owner[42] (-1 tarafsız), armies[42], alive[], hands[][], deck[], discard[], sets, phase, turn,
//   setup[], pool, conquered, moved, pending, last, winner, over, note, log[] }
// phase: 'setup' | 'reinforce' | 'attack' | 'fortify' | 'over'

// Bölgeler: [ad, kıta]. Kıtalar: Asya 7, Kuzey Amerika 5, Avrupa 5, Afrika 3, Güney Amerika 2, Okyanusya 2.
export const CONT = [
  { name: 'Asya', bonus: 7, ts: ['Afganistan', 'Çin', 'Hindistan', 'İrkutsk', 'Japonya', 'Kamçatka', 'Orta Doğu', 'Moğolistan', 'Siyam', 'Sibirya', 'Ural', 'Yakutsk'] },
  { name: 'Kuzey Amerika', bonus: 5, ts: ['Alaska', 'Alberta', 'Orta Amerika', 'Doğu ABD', 'Grönland', 'Kuzeybatı Toprakları', 'Ontario', 'Quebec', 'Batı ABD'] },
  { name: 'Avrupa', bonus: 5, ts: ['İngiltere', 'İzlanda', 'Kuzey Avrupa', 'İskandinavya', 'Güney Avrupa', 'Ukrayna', 'Batı Avrupa'] },
  { name: 'Afrika', bonus: 3, ts: ['Kongo', 'Doğu Afrika', 'Mısır', 'Madagaskar', 'Kuzey Afrika', 'Güney Afrika'] },
  { name: 'Güney Amerika', bonus: 2, ts: ['Arjantin', 'Brezilya', 'Peru', 'Venezuela'] },
  { name: 'Okyanusya', bonus: 2, ts: ['Doğu Avustralya', 'Endonezya', 'Yeni Gine', 'Batı Avustralya'] },
];

export const TERRITORIES = CONT.flatMap((c) => c.ts);
const TIDX = Object.fromEntries(TERRITORIES.map((t, i) => [t, i]));
export const N_TERR = TERRITORIES.length; // 42

// Klasik Risk haritasının komşulukları (her çizgi iki yönlüdür; kıtalar arası bağlantılar dahil).
const EDGES = [
  ['Alaska', 'Alberta'], ['Alaska', 'Kuzeybatı Toprakları'], ['Alaska', 'Kamçatka'],
  ['Kuzeybatı Toprakları', 'Alberta'], ['Kuzeybatı Toprakları', 'Ontario'], ['Kuzeybatı Toprakları', 'Grönland'],
  ['Alberta', 'Ontario'], ['Alberta', 'Batı ABD'],
  ['Ontario', 'Batı ABD'], ['Ontario', 'Doğu ABD'], ['Ontario', 'Quebec'], ['Ontario', 'Grönland'],
  ['Quebec', 'Doğu ABD'], ['Quebec', 'Grönland'],
  ['Batı ABD', 'Doğu ABD'], ['Batı ABD', 'Orta Amerika'],
  ['Doğu ABD', 'Orta Amerika'],
  ['Grönland', 'İzlanda'],
  ['Orta Amerika', 'Venezuela'],
  ['Venezuela', 'Peru'], ['Venezuela', 'Brezilya'],
  ['Peru', 'Brezilya'], ['Peru', 'Arjantin'],
  ['Brezilya', 'Arjantin'], ['Brezilya', 'Kuzey Afrika'],
  ['İzlanda', 'İngiltere'], ['İzlanda', 'İskandinavya'],
  ['İngiltere', 'İskandinavya'], ['İngiltere', 'Kuzey Avrupa'], ['İngiltere', 'Batı Avrupa'],
  ['İskandinavya', 'Kuzey Avrupa'], ['İskandinavya', 'Ukrayna'],
  ['Kuzey Avrupa', 'Batı Avrupa'], ['Kuzey Avrupa', 'Güney Avrupa'], ['Kuzey Avrupa', 'Ukrayna'],
  ['Batı Avrupa', 'Güney Avrupa'], ['Batı Avrupa', 'Kuzey Afrika'],
  ['Güney Avrupa', 'Ukrayna'], ['Güney Avrupa', 'Orta Doğu'], ['Güney Avrupa', 'Mısır'], ['Güney Avrupa', 'Kuzey Afrika'],
  ['Ukrayna', 'Ural'], ['Ukrayna', 'Afganistan'], ['Ukrayna', 'Orta Doğu'],
  ['Kuzey Afrika', 'Mısır'], ['Kuzey Afrika', 'Doğu Afrika'], ['Kuzey Afrika', 'Kongo'],
  ['Mısır', 'Doğu Afrika'], ['Mısır', 'Orta Doğu'],
  ['Doğu Afrika', 'Kongo'], ['Doğu Afrika', 'Güney Afrika'], ['Doğu Afrika', 'Madagaskar'], ['Doğu Afrika', 'Orta Doğu'],
  ['Kongo', 'Güney Afrika'],
  ['Güney Afrika', 'Madagaskar'],
  ['Orta Doğu', 'Afganistan'], ['Orta Doğu', 'Hindistan'],
  ['Afganistan', 'Ural'], ['Afganistan', 'Çin'], ['Afganistan', 'Hindistan'],
  ['Hindistan', 'Çin'], ['Hindistan', 'Siyam'],
  ['Çin', 'Ural'], ['Çin', 'Sibirya'], ['Çin', 'Moğolistan'], ['Çin', 'Siyam'],
  ['Ural', 'Sibirya'],
  ['Sibirya', 'Yakutsk'], ['Sibirya', 'İrkutsk'], ['Sibirya', 'Moğolistan'],
  ['Yakutsk', 'İrkutsk'], ['Yakutsk', 'Kamçatka'],
  ['İrkutsk', 'Moğolistan'], ['İrkutsk', 'Kamçatka'],
  ['Moğolistan', 'Japonya'], ['Moğolistan', 'Kamçatka'],
  ['Kamçatka', 'Japonya'],
  ['Siyam', 'Endonezya'],
  ['Endonezya', 'Yeni Gine'], ['Endonezya', 'Batı Avustralya'],
  ['Yeni Gine', 'Batı Avustralya'], ['Yeni Gine', 'Doğu Avustralya'],
  ['Batı Avustralya', 'Doğu Avustralya'],
];

export const NEIGH = Array.from({ length: N_TERR }, () => []);
for (const [a, b] of EDGES) {
  const x = TIDX[a], y = TIDX[b];
  if (x === undefined || y === undefined) throw new Error(`risk: bilinmeyen bölge ${a} / ${b}`);
  NEIGH[x].push(y);
  NEIGH[y].push(x);
}
export const EDGE_LIST = EDGES.map(([a, b]) => [TIDX[a], TIDX[b]]);

export const START = { 2: 40, 3: 35, 4: 30, 5: 25, 6: 20 };
const SETS = [4, 6, 8, 10, 12, 15];
export const setValue = (k) => (k < SETS.length ? SETS[k] : 15 + 5 * (k - SETS.length + 1));
const SYMS = ['i', 'c', 'a']; // piyade, süvari, top
export const SYM_TR = { i: 'Piyade', c: 'Süvari', a: 'Top', w: 'Joker' };

const fail = (error) => ({ error });
const clone = (g) => structuredClone(g);
const isTerr = (t) => Number.isInteger(t) && t >= 0 && t < N_TERR;

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const ownedBy = (g, p) => g.owner.reduce((c, o) => c + (o === p ? 1 : 0), 0);

// Bir oyuncunun bu turda alacağı takviye: bölge/3 (en az 3) + tam kıta bonusları. Kart takası ayrıca eklenir.
export function reinforcement(g, p) {
  let total = Math.max(3, Math.floor(ownedBy(g, p) / 3));
  for (const c of CONT) if (c.ts.every((t) => g.owner[TIDX[t]] === p)) total += c.bonus;
  return total;
}

// Set geçerli mi: üç kart aynı tür, üç farklı tür ya da içinde joker.
export function validSet(cards) {
  if (cards.length !== 3) return false;
  if (cards.some((c) => c.k === 'w')) return true;
  const ks = cards.map((c) => c.k);
  return new Set(ks).size === 1 || new Set(ks).size === 3;
}

export function newGame(n, rng = Math.random) {
  if (!Number.isInteger(n) || n < 2 || n > 6) return null;
  const order = shuffle([...Array(N_TERR).keys()], rng);
  const owner = Array(N_TERR).fill(-1);
  order.forEach((t, i) => { owner[t] = i % n; });
  const cnt = Array(n).fill(0);
  owner.forEach((o) => { cnt[o]++; });
  const deck = shuffle([
    ...Array.from({ length: N_TERR }, (_, t) => ({ k: SYMS[t % 3], t })),
    { k: 'w', t: null }, { k: 'w', t: null },
  ], rng);
  return {
    n,
    owner,
    armies: Array(N_TERR).fill(1),
    alive: Array(n).fill(true),
    hands: Array.from({ length: n }, () => []),
    deck,
    discard: [],
    sets: 0,
    phase: 'setup',
    turn: 0,
    setup: cnt.map((c) => START[n] - c),
    pool: 0,
    conquered: false,
    moved: false,
    pending: null,
    last: null,
    winner: null,
    over: null,
    note: 'Bölgeler dağıtıldı. Sırayla birer ordu yerleştirin.',
    log: [],
  };
}

const nextSeat = (g, from, pred) => {
  for (let s = 1; s <= g.n; s++) {
    const i = (from + s) % g.n;
    if (pred(i)) return i;
  }
  return -1;
};

const roll = (k, rng) => Array.from({ length: k }, () => 1 + Math.floor(rng() * 6)).sort((a, b) => b - a);

function log(s, msg) {
  s.log = [...s.log, msg].slice(-40);
  s.note = msg;
}

// Sıra bir oyuncuya geçer ve takviye aşaması başlar.
function beginTurn(s, p) {
  s.turn = p;
  s.phase = 'reinforce';
  s.pool = reinforcement(s, p);
  s.conquered = false;
  s.moved = false;
  s.pending = null;
}

// Kurulum bittiğinde ilk hayatta olan oyuncudan takviye başlar.
function finishSetup(s) {
  beginTurn(s, s.alive.indexOf(true));
  log(s, `Kurulum bitti. ${s.turn + 1}. oyuncu takviye yapsın.`);
}

function drawCard(s, p, rng) {
  if (!s.deck.length && s.discard.length) {
    s.deck = shuffle(s.discard, rng);
    s.discard = [];
  }
  if (s.deck.length) s.hands[p].push(s.deck.pop());
}

function deploy(g, idx, t, n) {
  if (!isTerr(t) || g.owner[t] !== idx) return fail('Bu bölge size ait değil.');
  if (g.turn !== idx) return fail('Sıra sizde değil.');
  const s = clone(g);
  if (g.phase === 'setup') {
    s.armies[t] += 1;
    s.setup[idx] -= 1;
    const nx = nextSeat(s, idx, (i) => s.alive[i] && s.setup[i] > 0);
    if (nx < 0) finishSetup(s);
    else { s.turn = nx; log(s, `${nx + 1}. oyuncu ordu yerleştirsin.`); }
    return s;
  }
  if (g.phase !== 'reinforce') return fail('Şu an ordu yerleştiremezsiniz.');
  const k = n === undefined ? g.pool : n;
  if (!Number.isInteger(k) || k < 1 || k > g.pool) return fail(`En fazla ${g.pool} ordu yerleştirebilirsiniz.`);
  if (g.hands[idx].length >= 5) return fail('Elinizde 5 ya da daha fazla kart var; önce kart takası yapın.');
  s.armies[t] += k;
  s.pool -= k;
  if (s.pool === 0) { s.phase = 'attack'; log(s, 'Takviye bitti. Saldırabilirsiniz.'); }
  else log(s, `${s.pool} ordu kaldı.`);
  return s;
}

function trade(g, idx, cards) {
  if (g.phase !== 'reinforce' || g.turn !== idx) return fail('Kart takası yalnızca takviye aşamasında yapılır.');
  const hand = g.hands[idx];
  if (!Array.isArray(cards) || cards.length !== 3 || new Set(cards).size !== 3
    || !cards.every((i) => Number.isInteger(i) && i >= 0 && i < hand.length)) return fail('Üç kart seçin.');
  const picked = cards.map((i) => hand[i]);
  if (!validSet(picked)) return fail('Bu üç kart geçerli bir set değil (aynı tür ya da üç farklı tür; joker her şeyin yerine geçer).');
  const s = clone(g);
  const value = setValue(s.sets);
  s.sets += 1;
  for (const i of [...cards].sort((a, b) => b - a)) s.discard.push(s.hands[idx].splice(i, 1)[0]);
  for (const c of picked) {
    if (c.t !== null && s.owner[c.t] === idx) s.armies[c.t] += 2;
  }
  s.pool += value;
  log(s, `${value} ordu kazandınız (kart takası).`);
  return s;
}

function attack(g, idx, from, to, dice, rng) {
  if (g.phase !== 'attack' || g.turn !== idx) return fail('Saldırı yalnızca saldırı aşamasında yapılır.');
  if (!isTerr(from) || !isTerr(to)) return fail('Geçersiz bölge.');
  if (g.owner[from] !== idx) return fail('Saldıran bölge size ait olmalı.');
  if (g.owner[to] === idx) return fail('Kendi bölgenize saldıramazsınız.');
  if (!NEIGH[from].includes(to)) return fail('Bölgeler komşu değil.');
  if (g.armies[from] < 2) return fail('Saldırmak için en az 2 ordu gerekir.');
  const maxA = Math.min(3, g.armies[from] - 1);
  const k = dice === undefined || dice === null ? maxA : dice;
  if (!Number.isInteger(k) || k < 1 || k > maxA) return fail(`Bu saldırıda 1-${maxA} zar atabilirsiniz.`);

  const s = clone(g);
  s.pending = null;
  const ar = roll(k, rng);
  const dr = roll(Math.min(2, s.armies[to]), rng);
  let aLost = 0, dLost = 0;
  for (let i = 0; i < Math.min(ar.length, dr.length); i++) {
    if (ar[i] > dr[i]) dLost++;
    else aLost++; // beraberlikte savunan kazanır
  }
  s.armies[from] -= aLost;
  s.armies[to] -= dLost;
  const prev = s.owner[to];
  const won = s.armies[to] === 0;
  s.last = { by: idx, from, to, a: ar, d: dr, aLost, dLost, won };

  if (!won) {
    log(s, `${TERRITORIES[from]} → ${TERRITORIES[to]}: savunma kazandı (−${aLost} sizden, −${dLost} rakipten).`);
    return s;
  }
  // Fetih: aLost = 0 olur (bölgeyi alabilmek için tüm karşılaştırmaları kazanmak gerekir); en az zar kadar taşınır.
  s.owner[to] = idx;
  s.conquered = true;
  s.armies[from] -= k;
  s.armies[to] = k;
  s.pending = { from, to, max: s.armies[from] - 1 };
  log(s, `${TERRITORIES[to]} fethedildi.`);
  if (prev >= 0 && !s.owner.includes(prev)) {
    s.alive[prev] = false;
    s.hands[idx].push(...s.hands[prev]);
    s.hands[prev] = [];
    log(s, `${prev + 1}. oyuncu elendi; kartları sizin oldu.`);
  }
  if (ownedBy(s, idx) === N_TERR) {
    s.over = `${idx + 1}. oyuncu dünyayı fethetti.`;
    s.winner = idx;
    s.phase = 'over';
    s.pending = null;
    log(s, s.over);
  }
  return s;
}

function extraMove(g, idx, n) {
  const p = g.pending;
  if (!p || g.turn !== idx || g.phase !== 'attack') return fail('Taşınacak ordu yok.');
  const k = n === undefined ? 0 : n;
  if (!Number.isInteger(k) || k < 0 || k > p.max) return fail(`En fazla ${p.max} ek ordu taşıyabilirsiniz.`);
  const s = clone(g);
  s.armies[p.from] -= k;
  s.armies[p.to] += k;
  s.pending = null;
  if (k > 0) log(s, `${k} ek ordu taşındı.`);
  return s;
}

function endAttack(g, idx) {
  if (g.phase !== 'attack' || g.turn !== idx) return fail('Saldırı aşamasında değilsiniz.');
  const s = clone(g);
  s.phase = 'fortify';
  s.pending = null;
  log(s, 'Saldırı bitti. İsterseniz manevra yapın ya da turu bitirin.');
  return s;
}

function connected(g, idx, from, to) {
  const seen = new Set([from]);
  const q = [from];
  while (q.length) {
    const t = q.shift();
    if (t === to) return true;
    for (const u of NEIGH[t]) {
      if (!seen.has(u) && g.owner[u] === idx) { seen.add(u); q.push(u); }
    }
  }
  return false;
}

function fortify(g, idx, from, to, n) {
  if (g.phase !== 'fortify' || g.turn !== idx) return fail('Manevra yalnızca saldırıdan sonra yapılır.');
  if (g.moved) return fail('Bu turda manevra hakkınızı kullandınız.');
  if (!isTerr(from) || !isTerr(to) || from === to) return fail('Geçersiz bölge.');
  if (g.owner[from] !== idx || g.owner[to] !== idx) return fail('Yalnızca kendi bölgeleriniz arasında taşıyabilirsiniz.');
  if (!connected(g, idx, from, to)) return fail('Bölgeler kendi bölgeleriniz üzerinden bağlı değil.');
  const k = n === undefined ? 1 : n;
  if (!Number.isInteger(k) || k < 1 || k > g.armies[from] - 1) return fail(`1-${g.armies[from] - 1} ordu taşıyabilirsiniz.`);
  const s = clone(g);
  s.armies[from] -= k;
  s.armies[to] += k;
  s.moved = true;
  log(s, `${k} ordu ${TERRITORIES[from]} → ${TERRITORIES[to]} taşındı.`);
  return s;
}

function endTurn(g, idx, rng) {
  if ((g.phase !== 'attack' && g.phase !== 'fortify') || g.turn !== idx) return fail('Turu şu an bitiremezsiniz.');
  const s = clone(g);
  if (s.conquered) drawCard(s, idx, rng);
  const nx = nextSeat(s, idx, (i) => s.alive[i]);
  beginTurn(s, nx);
  log(s, `${nx + 1}. oyuncu takviye yapsın (${s.pool} ordu).`);
  return s;
}

// Tek giriş noktası: rooms.js hamleyi bununla uygular. rng yalnızca testte sabitlenebilsin diye dışarıdan alınır.
export function act(g, idx, type, a = {}, rng = Math.random) {
  if (!g || g.over) return fail('Oyun bitti.');
  if (!Number.isInteger(idx) || idx < 0 || idx >= g.n || !g.alive[idx]) return fail('Oyunda değilsiniz.');
  switch (type) {
    case 'rdeploy': return deploy(g, idx, a.t, a.n);
    case 'rtrade': return trade(g, idx, a.cards);
    case 'rattack': return attack(g, idx, a.from, a.to, a.dice, rng);
    case 'rmove': return extraMove(g, idx, a.n);
    case 'rendattack': return endAttack(g, idx);
    case 'rfortify': return fortify(g, idx, a.from, a.to, a.n);
    case 'rendturn': return endTurn(g, idx, rng);
    default: return fail('Bilinmeyen işlem.');
  }
}

// Oyuncu masadan ayrılırsa bölgeleri tarafsız olur; sırası gelmişse sıra atlanır.
export function onLeave(g, seats, idx) {
  if (!g || g.over || !g.alive[idx]) return g;
  const s = clone(g);
  s.alive[idx] = false;
  s.owner = s.owner.map((o) => (o === idx ? -1 : o));
  s.discard.push(...s.hands[idx]);
  s.hands[idx] = [];
  s.setup[idx] = 0;
  log(s, `${seats?.[idx]?.name ?? `${idx + 1}. oyuncu`} masadan ayrıldı; bölgeleri tarafsız oldu.`);
  const left = s.alive.filter(Boolean).length;
  if (left <= 1) {
    const w = s.alive.indexOf(true);
    s.winner = w;
    s.phase = 'over';
    s.pending = null;
    s.over = w >= 0 ? `${seats?.[w]?.name ?? 'Oyuncu'} kazandı (rakipler masadan ayrıldı).` : 'Oyun bitti.';
    log(s, s.over);
    return s;
  }
  if (s.turn === idx) {
    if (s.phase === 'setup') {
      const nx = nextSeat(s, idx, (i) => s.alive[i] && s.setup[i] > 0);
      if (nx < 0) finishSetup(s);
      else s.turn = nx;
    } else {
      beginTurn(s, nextSeat(s, idx, (i) => s.alive[i]));
    }
  }
  return s;
}

// İstemciye giden görünüm: diğer oyuncuların kartları gizli kalır, yalnızca adetleri gider.
export function viewFor(g, me) {
  if (!g) return null;
  return {
    ...g,
    hands: g.hands.map((h, i) => (i === me ? h : [])),
    counts: g.hands.map((h) => h.length),
    deck: g.deck.length,
    discard: g.discard.length,
  };
}
