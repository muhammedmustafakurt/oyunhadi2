// Kadro: herkes bir formasyon seçip 11 kişilik Süper Lig kadrosunu kurar. Oyuncu puanları seçim sırasında gizlidir;
// tur bitince (herkes kilitleyince ya da süre dolunca) seçilen 11 oyuncunun puan ortalaması en yüksek olan kazanır.
// Seçimler bağımsızdır: başkasının seçtiği oyuncu da seçilebilir. Süre dolduğunda boş kalan slot 5.00 sayılır.
import { POOL } from './kadro-data';
import { FORMATIONS, FORM_MS, PICK_MS, EMPTY_SCORE } from './kadro-public';

export { POOL, FORMATIONS, FORM_MS, PICK_MS, EMPTY_SCORE };
const DEFAULT_FORM = '4-3-3';
const cents = (p) => Math.round(p * 100);

export function newGame(n, now = Date.now()) {
  return {
    phase: 'pick',
    formBy: now + FORM_MS, // bu ana kadar formasyon seçilmezse boş kadro kilitlenir
    players: Array.from({ length: n }, () => ({ form: null, slots: Array(11).fill(null), endsAt: 0, locked: false, left: false, byTime: false })),
    over: null,
  };
}

const live = (g) => g.players.map((_, i) => i).filter((i) => !g.players[i].left);
const deadline = (p, g) => (p.form ? p.endsAt : g.formBy);

// Sıralama ve sonuç: seçilen oyuncuların puanı (yüzde birler) toplanır, boş slot 5.00 sayılır.
function sumOf(p) {
  return p.slots.reduce((t, s) => t + (s === null ? cents(EMPTY_SCORE) : cents(POOL[s][3])), 0);
}

function finish(g) {
  const act = live(g);
  const sums = g.players.map(sumOf);
  const order = [...g.players.keys()].sort((a, b) =>
    (Number(g.players[a].left) - Number(g.players[b].left)) || (sums[b] - sums[a]) || (a - b));
  // Eşitlikte aynı sıra (1, 1, 3, ...).
  const rank = {};
  order.forEach((i, k) => {
    rank[i] = k > 0 && !g.players[i].left && !g.players[order[k - 1]].left && sums[i] === sums[order[k - 1]] ? rank[order[k - 1]] : k + 1;
  });
  const best = act.length ? Math.max(...act.map((i) => sums[i])) : 0;
  const tops = act.filter((i) => sums[i] === best);
  return {
    ...g,
    phase: 'over',
    over: { ranking: order, rank, sums, avg: sums.map((s) => s / 1100), tops, none: act.length === 0 },
  };
}

// Herkes kilitlediyse (ya da kimse kalmadıysa) turu bitirir.
const maybeFinish = (g) => (g.phase === 'pick' && live(g).every((i) => g.players[i].locked) ? finish(g) : g);

// Süresi dolan oyuncuların kadrosunu kilitler (formasyon seçmemişse varsayılan formasyon, boş slotlar 5.00).
function settle(g, now) {
  if (g.phase !== 'pick') return g;
  let changed = false;
  const players = g.players.map((p, i) => {
    if (p.left || p.locked || now < deadline(p, g)) return p;
    changed = true;
    return { ...p, form: p.form || DEFAULT_FORM, locked: true, byTime: true };
  });
  return changed ? maybeFinish({ ...g, players }) : g;
}

export function timeout(g, now = Date.now()) {
  return g.phase === 'over' ? g : settle(g, now);
}

const setP = (g, idx, patch) => ({ ...g, players: g.players.map((p, i) => (i === idx ? { ...p, ...patch } : p)) });

// Eylemler: kdformasyon {choice}, kdpick {choice}, kdswap {from, to}, kdlock, kdtimeout.
// Hata olursa { error } döner (oda durumu değişmez).
export function act(g, seats, idx, type, a = {}, now = Date.now()) {
  if (type === 'kdtimeout') return timeout(g, now);
  if (!g || g.phase !== 'pick') return { error: 'Tur bitti.' };
  if (!Number.isInteger(idx) || idx < 0 || idx >= g.players.length || g.players[idx].left) return { error: 'Oyunda değilsiniz.' };
  g = settle(g, now);
  if (g.phase !== 'pick') return g;
  const p = g.players[idx];
  if (p.locked) return { error: 'Kadronu zaten kilitledin.' };

  if (type === 'kdformasyon') {
    if (p.form) return { error: 'Formasyonu zaten seçtin.' };
    if (typeof a.choice !== 'string' || !Object.hasOwn(FORMATIONS, a.choice)) return { error: 'Geçersiz formasyon.' };
    return setP(g, idx, { form: a.choice, endsAt: now + PICK_MS });
  }

  if (!p.form) return { error: 'Önce formasyonu seç.' };

  if (type === 'kdpick') {
    const slot = p.slots.indexOf(null);
    if (slot < 0) return { error: 'Kadro dolu.' };
    const c = a.choice;
    if (!Number.isInteger(c) || c < 0 || c >= POOL.length) return { error: 'Geçersiz oyuncu.' };
    if (POOL[c][2] !== FORMATIONS[p.form].mevkiler[slot]) return { error: 'Bu oyuncu bu mevkiye uymuyor.' };
    if (p.slots.includes(c)) return { error: 'Bu oyuncuyu zaten seçtin.' };
    return setP(g, idx, { slots: p.slots.map((s, i) => (i === slot ? c : s)) });
  }

  if (type === 'kdswap') {
    if (p.slots.includes(null)) return { error: 'Önce 11 oyuncuyu seç.' };
    const { from, to } = a;
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from > 10 || to > 10 || from === to) return { error: 'Geçersiz yer değiştirme.' };
    const slots = [...p.slots];
    [slots[from], slots[to]] = [slots[to], slots[from]];
    return setP(g, idx, { slots });
  }

  if (type === 'kdlock') {
    if (p.slots.includes(null)) return { error: 'Önce 11 oyuncuyu seç.' };
    return maybeFinish(setP(g, idx, { locked: true }));
  }

  return { error: 'Bilinmeyen işlem.' };
}

// Oyuncu masadan ayrıldı (seats'te left işaretlendikten sonra çağrılır): kimseyi beklemeyiz.
export function onLeave(g, seats, idx) {
  if (!g || g.phase !== 'pick') return g;
  const n = setP(g, idx, { left: true });
  return maybeFinish(n);
}

const pub = (i) => ({ n: POOL[i][0], t: POOL[i][1], m: POOL[i][2] });

// Bir oyuncuya giden görünüm: başkalarının kadrosu tur bitene kadar gizli (yalnızca kilitledi mi).
// Puanlar yalnızca tur bitince, sonuç tablosunda gönderilir.
export function viewFor(g, idx, now = Date.now()) {
  if (!g) return null;
  const over = g.phase === 'over';
  const me = idx >= 0 ? g.players[idx] : null;
  const pending = g.players.filter((p) => !p.left && !p.locked);
  const nextAt = pending.length ? Math.min(...pending.map((p) => deadline(p, g))) : 0;
  return {
    phase: g.phase,
    // Tarayıcıya yalnızca isim, takım ve mevki gider; puan yok.
    pool: over ? null : POOL.map((o) => [o[0], o[1], o[2]]),
    locked: g.players.map((p) => p.locked),
    formed: g.players.map((p) => !!p.form),
    left: g.players.map((p) => p.left),
    formLeftMs: Math.max(0, g.formBy - now),
    nextMs: over || !nextAt ? 0 : Math.max(0, nextAt - now),
    mine: me && {
      form: me.form,
      slots: me.slots,
      locked: me.locked,
      byTime: me.byTime,
      leftMs: over || me.locked ? 0 : Math.max(0, deadline(me, g) - now),
    },
    over: over
      ? {
          ranking: g.over.ranking,
          rank: g.over.rank,
          avg: g.over.avg,
          tops: g.over.tops,
          none: g.over.none,
          squads: g.players.map((p, i) => ({
            form: p.form || DEFAULT_FORM,
            byTime: p.byTime,
            left: p.left,
            sum: g.over.sums[i],
            slots: p.slots.map((s) => (s === null ? null : { ...pub(s), p: POOL[s][3] })),
          })),
        }
      : null,
  };
}
