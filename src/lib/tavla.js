// Tavla (2 kişi, standart kurallar). Koltuk 0 = Beyaz, koltuk 1 = Siyah.
// Nokta dizini 0..23. pts[i] > 0 Beyaz pul sayısı, < 0 Siyah pul sayısı.
// Beyaz 23 -> 0 yönünde ilerler, evi 0..5; Siyah 0 -> 23 yönünde ilerler, evi 18..23.
// Hamle: from 0..23 (nokta) ya da 24 (kırık pul); to 0..23 ya da -1 (pul çıkarma).
// Zar sunucuda crypto.getRandomValues ile atılır. Rastgelelik ve tüm kurallar sunucudadır.
export const CONFIG = { min: 2, max: 2 };
export const PREFIX = 'tv';
export const BAR = 24;
export const OFF = -1;

function randInt(n) {
  const lim = Math.floor(0x100000000 / n) * n;
  const a = new Uint32Array(1);
  do { globalThis.crypto.getRandomValues(a); } while (a[0] >= lim);
  return a[0] % n;
}

const sign = (p) => (p === 0 ? 1 : -1);

function startPoints() {
  const pts = Array(24).fill(0);
  // Beyaz: 24. noktada 2, 13. noktada 5, 8. noktada 3, 6. noktada 5
  pts[23] = 2; pts[12] = 5; pts[7] = 3; pts[5] = 5;
  // Siyah: aynasi
  pts[0] = -2; pts[11] = -5; pts[16] = -3; pts[18] = -5;
  return pts;
}

export function newGame(seats) {
  return {
    pts: startPoints(),
    bar: [0, 0],
    off: [0, 0],
    turn: randInt(2),
    phase: 'roll', // 'roll' | 'move'
    dice: [], // henüz oynanmamış zarlar
    roll: null, // son atılan zarlar { by, d: [a, b], passed }
    names: [0, 1].map((i) => String(seats?.[i]?.name || `Oyuncu ${i + 1}`).slice(0, 24)),
    note: '',
    over: null,
  };
}

const stOf = (g) => ({ pts: g.pts, bar: g.bar, off: g.off });

function allHome(st, p) {
  if (st.bar[p] > 0) return false;
  const s = sign(p);
  for (let i = 0; i < 24; i++) {
    if (st.pts[i] * s > 0) {
      const inHome = p === 0 ? i <= 5 : i >= 18;
      if (!inHome) return false;
    }
  }
  return true;
}

// Bir zarla oynanabilecek tüm adımlar.
function stepsFor(st, p, die) {
  const s = sign(p);
  const out = [];
  const tryTo = (from, to) => {
    if (to >= 0 && to <= 23 && st.pts[to] * s >= -1) out.push({ from, to, die });
  };
  if (st.bar[p] > 0) {
    tryTo(BAR, p === 0 ? 24 - die : die - 1);
    return out;
  }
  const home = allHome(st, p);
  for (let i = 0; i < 24; i++) {
    if (st.pts[i] * s <= 0) continue;
    const to = p === 0 ? i - die : i + die;
    if (to >= 0 && to <= 23) {
      tryTo(i, to);
    } else if (home) {
      const d = p === 0 ? i + 1 : 24 - i;
      if (die === d) out.push({ from: i, to: OFF, die });
      else if (die > d) {
        let farther = false;
        for (let j = 0; j < 24; j++) {
          if (st.pts[j] * s > 0 && (p === 0 ? j > i : j < i)) { farther = true; break; }
        }
        if (!farther) out.push({ from: i, to: OFF, die });
      }
    }
  }
  return out;
}

function stepApply(st, p, m) {
  const s = sign(p);
  const pts = st.pts.slice();
  const bar = st.bar.slice();
  const off = st.off.slice();
  if (m.from === BAR) bar[p]--; else pts[m.from] -= s;
  if (m.to === OFF) off[p]++;
  else {
    if (pts[m.to] * s === -1) { pts[m.to] = 0; bar[1 - p]++; }
    pts[m.to] += s;
  }
  return { pts, bar, off };
}

const keyOf = (st, dice) => `${st.pts.join(',')}|${st.bar}|${st.off}|${dice.join('')}`;

// Bu durumdan oynanabilecek en çok zar sayısı.
function bestDepth(st, p, dice, memo) {
  if (!dice.length) return 0;
  const k = keyOf(st, dice);
  if (memo.has(k)) return memo.get(k);
  let best = 0;
  const seen = new Set();
  for (let a = 0; a < dice.length && best < dice.length; a++) {
    const die = dice[a];
    if (seen.has(die)) continue;
    seen.add(die);
    const rest = dice.filter((_, i) => i !== a);
    for (const m of stepsFor(st, p, die)) {
      const d = 1 + bestDepth(stepApply(st, p, m), p, rest, memo);
      if (d > best) best = d;
      if (best === dice.length) break;
    }
  }
  memo.set(k, best);
  return best;
}

// Sıradaki oyuncunun geçerli hamleleri: [{ from, to, die }]. Mümkün olan en çok zar oynanmak zorundadır;
// yalnızca tek zar oynanabiliyorsa büyük zar oynanır.
export function legalMoves(g) {
  if (!g || g.over || g.phase !== 'move' || !g.dice.length) return [];
  const p = g.turn;
  const st = stOf(g);
  const memo = new Map();
  const all = [];
  const seen = new Set();
  g.dice.forEach((die, a) => {
    if (seen.has(die)) return;
    seen.add(die);
    const rest = g.dice.filter((_, i) => i !== a);
    for (const m of stepsFor(st, p, die)) {
      all.push({ ...m, depth: 1 + bestDepth(stepApply(st, p, m), p, rest, memo) });
    }
  });
  if (!all.length) return [];
  const max = Math.max(...all.map((m) => m.depth));
  let keep = all.filter((m) => m.depth === max);
  if (max === 1 && new Set(g.dice).size === 2) {
    const big = Math.max(...g.dice);
    const bigOnes = keep.filter((m) => m.die === big);
    if (bigOnes.length) keep = bigOnes;
  }
  return keep.map(({ from, to, die }) => ({ from, to, die }));
}

function nextTurn(n, note) {
  n.turn = 1 - n.turn;
  n.phase = 'roll';
  n.dice = [];
  if (note) n.note = note;
}

function winCheck(n, p) {
  if (n.off[p] < 15) return false;
  const mars = n.off[1 - p] === 0;
  const points = mars ? 2 : 1;
  n.over = {
    winner: p,
    points,
    mars,
    text: `${n.names[p]} kazandı${mars ? ' (mars, 2 puan)' : ''}!`,
  };
  n.phase = 'done';
  n.dice = [];
  n.note = n.over.text;
  return true;
}

const isInt = (v) => typeof v === 'number' && Number.isInteger(v);

export function act(g, seats, idx, type, payload) {
  if (!g || g.over) return { error: 'Oyun bitti.' };
  if (idx !== 0 && idx !== 1) return { error: 'Oyunda değilsiniz.' };
  if (idx !== g.turn) return { error: 'Sıra sizde değil.' };
  const n = structuredClone(g);
  const me = idx;

  if (type === 'tvroll') {
    if (g.phase !== 'roll') return { error: 'Zaten zar attınız, hamle yapın.' };
    const a = randInt(6) + 1;
    const b = randInt(6) + 1;
    n.dice = a === b ? [a, a, a, a] : [Math.max(a, b), Math.min(a, b)];
    n.phase = 'move';
    n.roll = { by: me, d: [a, b], passed: false };
    n.note = `${n.names[me]} ${a}-${b} attı.`;
    if (!legalMoves(n).length) {
      n.roll.passed = true;
      nextTurn(n, `${n.names[me]} ${a}-${b} attı, oynanacak hamle yok; sıra geçti.`);
    }
    return n;
  }

  if (type === 'tvpass') {
    if (g.phase !== 'move') return { error: 'Önce zar atın.' };
    if (legalMoves(g).length) return { error: 'Oynanabilecek hamle var, pas geçilemez.' };
    nextTurn(n, `${n.names[me]} pas geçti.`);
    return n;
  }

  if (type === 'tvmove') {
    if (g.phase !== 'move') return { error: 'Önce zar atın.' };
    const pl = payload && typeof payload === 'object' ? payload : {};
    const { from, to } = pl;
    if (!isInt(from) || from < 0 || from > 24 || !isInt(to) || to < -1 || to > 23) return { error: 'Geçersiz hamle.' };
    const cands = legalMoves(g).filter((m) => m.from === from && m.to === to);
    if (!cands.length) {
      if (g.bar[me] > 0 && from !== BAR) return { error: 'Önce kırık pulunuzu oyuna sokmalısınız.' };
      return { error: 'Bu hamle geçerli değil.' };
    }
    const m = cands.reduce((x, y) => (y.die < x.die ? y : x));
    const st = stepApply(stOf(n), me, m);
    n.pts = st.pts; n.bar = st.bar; n.off = st.off;
    const di = n.dice.indexOf(m.die);
    n.dice.splice(di, 1);
    if (winCheck(n, me)) return n;
    if (!n.dice.length) {
      nextTurn(n, '');
    } else if (!legalMoves(n).length) {
      nextTurn(n, `${n.names[me]} kalan zarı oynayamadı; sıra geçti.`);
    }
    return n;
  }

  return { error: 'Bilinmeyen işlem.' };
}

// Ayrılan yenilir; rakip kazanır.
export function onLeave(g, seats, idx) {
  if (!g || g.over) return g;
  if (idx !== 0 && idx !== 1) return g;
  const n = structuredClone(g);
  const w = 1 - idx;
  n.over = { winner: w, points: 1, mars: false, text: `${n.names[idx]} masadan ayrıldı; ${n.names[w]} kazandı.` };
  n.phase = 'done';
  n.dice = [];
  n.note = n.over.text;
  return n;
}

// Tavlada gizli bilgi yoktur.
export function viewFor(g) {
  return g ? structuredClone(g) : g;
}
