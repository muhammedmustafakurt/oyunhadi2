// 2048 yarışı (2-6 kişi): herkes aynı başlangıç tahtası ve aynı tohumlu karo dizisiyle kendi 4x4 tahtasında
// 3 dakika oynar; en yüksek puan kazanır. Tahtayı sunucu simüle eder; istemciden yalnızca yön gelir.
// Tohum yalnızca sunucuda tutulur, viewFor ile gönderilmez. Süre sunucu saatiyle denetlenir.
export const CONFIG = { min: 2, max: 6 };
export const PREFIX = 'gx';
export const DURATION_MS = 3 * 60 * 1000;
// Oyuncu başına iki hamle arası en az süre (sunucu saati). Hamle betiğiyle saniyede yüzlerce istek göndererek
// 3 dakikada yüksek puan toplamayı ve ödül kodu almayı yavaşlatır; elle oynayan insan (en çok ~8-10 hamle/sn) etkilenmez.
// İstemci (G2048Online) hamleleri bundan biraz geniş aralıkla gönderir ve reddedilen hamleyi yeniden dener.
export const MIN_MOVE_GAP_MS = 120;
export const TOO_FAST = 'Çok hızlı.';

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lineIdx(dir) {
  const out = [];
  for (let k = 0; k < 4; k++) {
    const line = [];
    for (let j = 0; j < 4; j++) {
      if (dir === 'l') line.push(k * 4 + j);
      else if (dir === 'r') line.push(k * 4 + 3 - j);
      else if (dir === 'u') line.push(j * 4 + k);
      else line.push((3 - j) * 4 + k);
    }
    out.push(line);
  }
  return out;
}

// Kaydırma: { b, gained, moved }. Girdi dizisi değiştirilmez. İstemci de iyimser gösterim için kullanır.
export function slide(board, dir) {
  if (dir !== 'l' && dir !== 'r' && dir !== 'u' && dir !== 'd') return { b: board.slice(), gained: 0, moved: false };
  const b = board.slice();
  let gained = 0;
  for (const line of lineIdx(dir)) {
    const vals = line.map((i) => board[i]).filter((v) => v > 0);
    const res = [];
    for (let i = 0; i < vals.length; i++) {
      if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
        res.push(vals[i] * 2); gained += vals[i] * 2; i++;
      } else res.push(vals[i]);
    }
    while (res.length < 4) res.push(0);
    line.forEach((cell, j) => { b[cell] = res[j]; });
  }
  const moved = b.some((v, i) => v !== board[i]);
  return { b, gained, moved };
}

export function canMove(board) {
  return ['l', 'r', 'u', 'd'].some((d) => slide(board, d).moved);
}

// n. karo için bağımsız, tohumlu akış: aynı tohum + aynı sıra => aynı sonuç.
function spawn(board, seed, n) {
  const rng = mulberry32((seed + Math.imul(n + 1, 0x9E3779B1)) >>> 0);
  const empty = [];
  board.forEach((v, i) => { if (v === 0) empty.push(i); });
  if (!empty.length) return board;
  const cell = empty[Math.floor(rng() * empty.length)];
  const val = rng() < 0.9 ? 2 : 4;
  const b = board.slice();
  b[cell] = val;
  return b;
}

const maxOf = (b) => b.reduce((m, v) => (v > m ? v : m), 0);

function randSeed() {
  const a = new Uint32Array(1);
  globalThis.crypto.getRandomValues(a);
  return a[0];
}

export function newGame(seats, now = Date.now()) {
  const seed = randSeed();
  let b = Array(16).fill(0);
  b = spawn(b, seed, 0);
  b = spawn(b, seed, 1);
  return {
    seed,
    startAt: now,
    endsAt: now + DURATION_MS,
    names: seats.map((s) => String(s?.name || 'Oyuncu').slice(0, 24)),
    players: seats.map(() => ({ b: b.slice(), s: 0, n: 2, m: 0, dead: false, t: 0 })), // t: son kabul edilen hamlenin sunucu zamanı
    over: null,
  };
}

function summary(g, seats) {
  const rows = g.players.map((p, i) => ({ i, s: p.s, mx: maxOf(p.b) }));
  rows.sort((a, c) => c.s - a.s || c.mx - a.mx || a.i - c.i);
  const top = rows[0].s;
  const winners = rows.filter((r) => r.s === top).map((r) => r.i);
  const text = winners.length > 1
    ? `Berabere: ${winners.map((i) => g.names[i]).join(', ')} (${top} puan)`
    : `${g.names[winners[0]]} kazandı (${top} puan)!`;
  return {
    ranking: rows.map((r) => r.i),
    scores: g.players.map((p) => p.s),
    tiles: g.players.map((p) => maxOf(p.b)),
    winners,
    text,
  };
}

function finish(g, seats) {
  return { ...g, over: summary(g, seats) };
}

const allDone = (g, seats) => g.players.every((p, i) => p.dead || seats?.[i]?.left);

export function act(g, seats, idx, type, payload, now = Date.now()) {
  if (!g) return { error: 'Oyun yok.' };
  if (g.over) return { error: 'Oyun bitti.' };
  if (!Number.isInteger(idx) || idx < 0 || idx >= g.players.length) return { error: 'Oyunda değilsiniz.' };
  if (type === 'gxend') {
    if (now < g.endsAt) return { error: 'Süre henüz dolmadı.' };
    return finish(structuredClone(g), seats);
  }
  if (type !== 'gxmove') return { error: 'Bilinmeyen işlem.' };
  if (now >= g.endsAt) return finish(structuredClone(g), seats); // süre bitti: hamle sayılmaz, oyun kapanır
  const dir = payload && typeof payload === 'object' ? payload.dir : undefined;
  if (dir !== 'l' && dir !== 'r' && dir !== 'u' && dir !== 'd') return { error: 'Geçersiz yön.' };
  const me = g.players[idx];
  if (me.dead) return { error: 'Hamleniz kalmadı.' };
  if (now - (me.t || 0) < MIN_MOVE_GAP_MS) return { error: TOO_FAST }; // durum yazılmaz; istemci kısa süre sonra yeniden dener
  const r = slide(me.b, dir);
  if (!r.moved) return { error: 'Bu yönde kayma yok.' };
  const n = structuredClone(g);
  const p = n.players[idx];
  p.b = spawn(r.b, g.seed, me.n);
  p.n = me.n + 1;
  p.s = me.s + r.gained;
  p.m = (me.m || 0) + 1;
  p.t = now;
  if (!canMove(p.b)) p.dead = true;
  if (allDone(n, seats)) return finish(n, seats);
  return n;
}

export function onLeave(g, seats, idx) {
  if (!g || g.over) return g;
  if (allDone(g, seats)) return finish(structuredClone(g), seats);
  return g;
}

// Tohum gönderilmez. Süre dolduysa sonuç anlık hesaplanarak gösterilir.
export function viewFor(g, idx, now = Date.now()) {
  if (!g) return g;
  let over = g.over;
  if (!over && now >= g.endsAt) over = summary(g);
  return {
    names: g.names,
    players: g.players.map((p) => ({ b: p.b.slice(), s: p.s, n: p.n, dead: p.dead, mx: maxOf(p.b) })),
    leftMs: over ? 0 : Math.max(0, g.endsAt - now),
    total: DURATION_MS,
    over,
  };
}
