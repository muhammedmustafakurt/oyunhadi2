// Toplu etkinlik oyunları: bütün mekân (tüm masalar) aynı anda oynar. Üç tür: Tombala, Masa turnuvası (canlı skor),
// Çekiliş. Durum, etkinlik başına tek bir game_rooms satırında (tbl 'etkinlik', game 'ev@<id>') JSON olarak tutulur;
// istemciler kısa aralıkla sürümü sorar (api/event). Tüm kurallar, rastgelelik ve doğrulama burada, sunucuda çalışır;
// istemciden yalnızca niyet gelir (kart numarası, çekilen sayı, kazanan, puan asla istemciye güvenilmez).
// Kapı (etkinlik açık mı) api/event/route.js ve api/panel/events/route.js içinde events.gateEvent ile uygulanır.
import { randomInt } from 'node:crypto';
import { get, run } from './db';

export const MASS_KINDS = ['tombala', 'skor', 'cekilis'];
export const stateKey = (id) => `ev@${id}`;
const TBL = 'etkinlik';
const MAX_CARDS = 300; // etkinlik başına en çok kart / çekiliş katılımı
const MAX_ENTRIES = 500;
const CLAIM_GAP_MS = 4000; // hatalı talepten sonra aynı oyuncu bu kadar bekler
export const AUTO_OPTIONS = [0, 5, 8, 10, 15, 20, 30];
const clean = (s, max) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, max);

const initial = (kind) => (kind === 'tombala'
  ? { drawn: [], cards: {}, claims: { c1: null, c2: null, c3: null }, over: false, auto: 0, nextAt: 0 }
  : kind === 'skor' ? { scores: {}, log: [] }
  : { entries: {}, winners: [] });

const SEL = 'SELECT id, state, version FROM game_rooms WHERE biz_id = ? AND tbl = ? AND game = ?';

async function readRow(bizId, ev) {
  const key = stateKey(ev.id);
  let r = await get(SEL, bizId, TBL, key);
  if (!r) {
    await run(
      'INSERT INTO game_rooms (biz_id, tbl, game, state, version, updated_at) VALUES (?, ?, ?, ?, 0, ?) ON CONFLICT (biz_id, tbl, game) DO NOTHING',
      bizId, TBL, key, JSON.stringify(initial(ev.kind)), Date.now(),
    );
    r = await get(SEL, bizId, TBL, key);
  }
  return { id: r.id, version: r.version, state: JSON.parse(r.state) };
}

// fn(state kopyası) -> { state, out? } | { error } | { state, error } (durum yazılır, hata da döner) | { noop: true }.
// Aynı anda iki telefon yazarsa sürüm denetimiyle yeniden dener.
async function mutate(bizId, ev, fn) {
  for (let i = 0; i < 4; i++) {
    const r = await readRow(bizId, ev);
    const res = fn(structuredClone(r.state));
    if (res.error && !res.state) return { error: res.error };
    if (res.noop) return { noop: true, state: r.state, version: r.version };
    const ok = await get(
      'UPDATE game_rooms SET state = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ? RETURNING version',
      JSON.stringify(res.state), Date.now(), r.id, r.version,
    );
    if (ok) return { ...res, version: ok.version };
  }
  return { error: 'Şu an meşgul, tekrar deneyin.' };
}

export async function resetState(bizId, ev) {
  await run('DELETE FROM game_rooms WHERE biz_id = ? AND tbl = ? AND game = ?', bizId, TBL, stateKey(ev.id));
}

// ---------- Tombala ----------
const SIZE = 90;
function drawOne(s) {
  const left = [];
  for (let n = 1; n <= SIZE; n++) if (!s.drawn.includes(n)) left.push(n);
  if (!left.length) { s.over = true; return null; }
  const n = left[randomInt(left.length)];
  s.drawn.push(n);
  if (s.drawn.length >= SIZE) s.over = true;
  return n;
}

// Klasik kart: 3 sıra x 9 sütun, her sırada 5 sayı, her sütunda en az 1 sayı (sütun k: k*10..k*10+9; 1-9 ve 80-90 uçlarda).
function newCard() {
  for (;;) {
    const rows = [0, 1, 2].map(() => {
      const p = new Set();
      while (p.size < 5) p.add(randomInt(9));
      return p;
    });
    const cnt = Array(9).fill(0).map((_, c) => rows.filter((r) => r.has(c)).length);
    if (cnt.some((x) => x === 0)) continue;
    const grid = [Array(9).fill(0), Array(9).fill(0), Array(9).fill(0)];
    for (let c = 0; c < 9; c++) {
      const lo = c === 0 ? 1 : c * 10, hi = c === 8 ? 90 : c * 10 + 9;
      const pool = [];
      for (let n = lo; n <= hi; n++) pool.push(n);
      const pick = [];
      while (pick.length < cnt[c]) pick.push(pool.splice(randomInt(pool.length), 1)[0]);
      pick.sort((a, b) => a - b);
      let k = 0;
      for (let r = 0; r < 3; r++) if (rows[r].has(c)) grid[r][c] = pick[k++];
    }
    return grid;
  }
}

const doneRows = (grid, drawn) => {
  const d = new Set(drawn);
  return grid.filter((row) => row.filter(Boolean).every((n) => d.has(n))).length;
};
const CLAIM_NEED = { 1: 1, 2: 2, 3: 3 }; // 1. çinko: 1 sıra, 2. çinko: 2 sıra, Tombala: 3 sıra (15 sayı)
const CLAIM_NAME = { 1: '1. çinko', 2: '2. çinko', 3: 'Tombala' };

function tombalaAct(s, pid, masa, a, ctx) {
  const card = s.cards[pid];
  if (a.type === 'join') {
    if (card) return { noop: true }; // cihaz başına tek kart; yenilenemez
    if (ctx.near === false) return { error: ctx.noGeo ? 'Kart almak için konum izni vermeniz gerekir (kafede olduğunuz doğrulanır).' : 'Etkinliğe yalnızca kafedeyken katılabilirsiniz.' };
    const name = clean(a.name, 16);
    if (!name) return { error: 'Bir takma ad girin.' };
    if (Object.keys(s.cards).length >= MAX_CARDS) return { error: 'Bu etkinlikte kart kalmadı.' };
    s.cards[pid] = { grid: newCard(), marks: [], name, masa, badAt: 0 };
    return { state: s };
  }
  if (!card) return { error: 'Önce kartınızı alın.' };
  if (a.type === 'mark') {
    const n = Number(a.n);
    if (!Number.isInteger(n) || !s.drawn.includes(n)) return { error: 'Bu sayı henüz çekilmedi.' };
    if (!card.grid.some((row) => row.includes(n))) return { error: 'Bu sayı kartınızda yok.' };
    if (card.marks.includes(n)) return { noop: true };
    card.marks.push(n);
    return { state: s };
  }
  if (a.type === 'claim') {
    const k = Number(a.k);
    if (!(k in CLAIM_NEED)) return { error: 'Geçersiz talep.' };
    if (s.claims[`c${k}`]) return { error: `${CLAIM_NAME[k]} zaten alındı.` };
    if (Date.now() - (card.badAt || 0) < CLAIM_GAP_MS) return { error: 'Çok sık talep ediyorsunuz, birkaç saniye bekleyin.' };
    if (doneRows(card.grid, s.drawn) < CLAIM_NEED[k]) {
      card.badAt = Date.now();
      return { state: s, error: `Kartınızda ${CLAIM_NAME[k]} için gereken sıralar henüz tamam değil.` };
    }
    s.claims[`c${k}`] = { name: card.name, masa: card.masa, at: Date.now() };
    if (k === 3) s.over = true;
    return { state: s };
  }
  return { error: 'Bilinmeyen işlem.' };
}

function tombalaView(s, pid, now) {
  const card = s.cards[pid];
  return {
    drawn: s.drawn, last: s.drawn.at(-1) ?? null, over: s.over, cards: Object.keys(s.cards).length,
    claims: s.claims, auto: s.auto, nextMs: s.auto && !s.over ? Math.max(0, s.nextAt - now) : null,
    card: card ? { grid: card.grid, marks: card.marks, name: card.name } : null,
  };
}

// ---------- Masa turnuvası ----------
function skorRanking(s) {
  return Object.entries(s.scores).map(([masa, pts]) => ({ masa: Number(masa), pts })).sort((a, b) => b.pts - a.pts || a.masa - b.masa);
}
function skorWinners(s) {
  const r = skorRanking(s);
  return r.length && r[0].pts > 0 ? r.filter((x) => x.pts === r[0].pts).map((x) => x.masa) : [];
}

// ---------- Çekiliş ----------
function cekilisAct(s, pid, masa, a, ctx) {
  if (a.type !== 'join') return { error: 'Bilinmeyen işlem.' };
  if (s.entries[pid]) return { error: 'Zaten katıldınız.' };
  if (s.winners.length) return { error: 'Çekiliş yapıldı, yeni katılım alınmıyor.' };
  if (ctx.near === false) return { error: ctx.noGeo ? 'Katılmak için konum izni vermeniz gerekir (kafede olduğunuz doğrulanır).' : 'Çekilişe yalnızca kafedeyken katılabilirsiniz.' };
  const name = clean(a.name, 16);
  if (!name) return { error: 'Bir takma ad girin.' };
  if (Object.keys(s.entries).length >= MAX_ENTRIES) return { error: 'Katılım sınırına ulaşıldı.' };
  s.entries[pid] = { name, masa, at: Date.now() };
  return { state: s };
}

// ---------- Dışa açılan arayüz ----------
// Oyuncu eylemi (api/event POST). Kapı çağıran tarafta uygulanmıştır (yalnızca 'acik' etkinlik).
export async function playerAct(bizId, ev, pid, masa, a, ctx) {
  return mutate(bizId, ev, (s) => {
    if (ev.kind === 'tombala') return tombalaAct(s, pid, masa, a, ctx);
    if (ev.kind === 'cekilis') return cekilisAct(s, pid, masa, a, ctx);
    return { error: 'Bu etkinlikte oyuncu işlemi yok.' };
  });
}

// Süresi gelen otomatik tombala çekimini yapar (oyuncu ya da panel yoklaması tetikler).
export async function tick(bizId, ev, row) {
  const s = row.state;
  if (ev.kind !== 'tombala' || !s.auto || s.over || Date.now() < s.nextAt) return row;
  const r = await mutate(bizId, ev, (x) => {
    if (!x.auto || x.over || Date.now() < x.nextAt) return { noop: true };
    drawOne(x);
    x.nextAt = Date.now() + x.auto * 1000;
    return { state: x };
  });
  return r.error ? row : { state: r.state, version: r.version };
}

export async function loadState(bizId, ev) {
  const row = await readRow(bizId, ev);
  return ev.status === 'acik' ? tick(bizId, ev, row) : row;
}

// Oyuncunun gördüğü durum. Başkasının kartı, pid'ler ve çekiliş katılımcı adları gitmez.
export function playerView(ev, row, pid, masa) {
  const s = row.state;
  const base = { version: `${row.version}-${ev.status}`, status: ev.status, kind: ev.kind, title: ev.title, now: Date.now() };
  if (ev.kind === 'tombala') return { ...base, ...tombalaView(s, pid, Date.now()) };
  if (ev.kind === 'skor') {
    const rank = skorRanking(s);
    return {
      ...base, game: ev.cfg?.game || 'Masa turnuvası', me: Number(masa.slice(5)), ranking: rank,
      log: s.log.slice(-8).reverse(), winners: ev.status === 'bitti' ? skorWinners(s) : [],
    };
  }
  return {
    ...base, count: Object.keys(s.entries).length, joined: !!s.entries[pid],
    winners: s.winners.map((w) => ({ name: w.name, masa: w.masa })),
  };
}

// Panelin gördüğü durum (kazananlar ad + masa, katılımcı listesi).
export function panelView(ev, row) {
  const s = row.state;
  const base = { status: ev.status, kind: ev.kind, version: row.version };
  if (ev.kind === 'tombala') {
    return { ...base, drawn: s.drawn, last: s.drawn.at(-1) ?? null, over: s.over, cards: Object.keys(s.cards).length, claims: s.claims, auto: s.auto, nextMs: s.auto && !s.over ? Math.max(0, s.nextAt - Date.now()) : null };
  }
  if (ev.kind === 'skor') {
    return { ...base, game: ev.cfg?.game || 'Masa turnuvası', ranking: skorRanking(s), log: s.log.slice(-15).reverse(), winners: skorWinners(s) };
  }
  return { ...base, entries: Object.values(s.entries).sort((a, b) => a.at - b.at).map((e) => ({ name: e.name, masa: e.masa })), winners: s.winners };
}

// Mekân sahibinin işlemleri (api/panel/events). op: draw | auto | reset | score.
export async function panelAct(bizId, ev, op, args, tables) {
  if (op === 'reset') {
    await resetState(bizId, ev);
    return { ok: true };
  }
  const r = await mutate(bizId, ev, (s) => {
    if (ev.kind === 'tombala') {
      if (op === 'draw') {
        if (s.over) return { error: 'Oyun bitti; sıfırlayıp yeniden başlatın.' };
        drawOne(s);
        if (s.auto) s.nextAt = Date.now() + s.auto * 1000;
        return { state: s };
      }
      if (op === 'auto') {
        const sec = Number(args.sec);
        if (!AUTO_OPTIONS.includes(sec)) return { error: 'Geçersiz aralık.' };
        s.auto = sec;
        s.nextAt = sec ? Date.now() + sec * 1000 : 0;
        return { state: s };
      }
    }
    if (ev.kind === 'skor' && op === 'score') {
      const masa = Number(args.masa), delta = Number(args.delta);
      if (!Number.isInteger(masa) || masa < 1 || masa > tables) return { error: 'Geçersiz masa.' };
      if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 1000) return { error: 'Puan -1000 ile 1000 arasında, sıfırdan farklı bir tam sayı olmalı.' };
      const next = Math.max(-100000, Math.min(100000, (s.scores[masa] || 0) + delta));
      s.scores[masa] = next;
      s.log.push({ masa, delta, note: clean(args.note, 60), at: Date.now() });
      s.log = s.log.slice(-50);
      return { state: s };
    }
    if (ev.kind === 'cekilis' && op === 'draw') {
      const n = Number(args.n);
      const pool = Object.values(s.entries).filter((e) => !s.winners.some((w) => w.at === e.at && w.name === e.name && w.masa === e.masa));
      if (!Number.isInteger(n) || n < 1 || n > 10) return { error: 'Kazanan sayısı 1 ile 10 arasında olmalı.' };
      if (!pool.length) return { error: 'Çekilecek katılımcı yok.' };
      for (let i = 0; i < Math.min(n, pool.length); i++) {
        const w = pool.splice(randomInt(pool.length), 1)[0]; // kriptografik rastgele
        s.winners.push({ name: w.name, masa: w.masa, at: w.at });
      }
      return { state: s };
    }
    return { error: 'Bu etkinlik türünde böyle bir işlem yok.' };
  });
  return r.error ? { error: r.error } : { ok: true };
}
