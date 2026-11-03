// Pişti: 52'lik deste, herkes kendi adına (2-4 kişi). Kartlar 0..51: renk = ⌊k/13⌋ (0 sinek, 1 karo, 2 kupa, 3 maça), değer = k%13+1 (1 As, 11 Vale, 12 Kız, 13 Papaz).
// Kural: ortadaki son kartla aynı değerde ya da vale ile oynanan kart yerdeki tüm kartları toplar.
// Yerde tek kart varken aynı değerle toplamak pişti (10), valeyle valeye pişti 20. Puan: As 1, Vale 1, sinek 2 = 2, karo 10 = 3, en çok kart 3.
export const CONFIG = { min: 2, max: 4 };
export const PREFIX = 'ps';

const rnd = (n) => {
  const c = globalThis.crypto;
  if (c && c.getRandomValues) {
    const b = new Uint32Array(1);
    c.getRandomValues(b);
    return Math.floor((b[0] / 4294967296) * n);
  }
  return Math.floor(Math.random() * n);
};

const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

export const rankOf = (k) => (k % 13) + 1;
export const suitOf = (k) => Math.floor(k / 13);
const cardPts = (k) => {
  const r = rankOf(k);
  if (r === 1 || r === 11) return 1;
  if (k === 1) return 2;          // 2 sinek (renk 0, değer 2)
  if (k === 13 + 9) return 3;     // 10 karo (renk 1, değer 10)
  return 0;
};

const isLeft = (seats, i) => !!seats[i]?.left;
const alive = (seats) => seats.map((_, i) => i).filter((i) => !isLeft(seats, i));

function nextAlive(seats, from) {
  const n = seats.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (!isLeft(seats, i)) return i;
  }
  return -1;
}

export function newGame(seats) {
  const n = seats.length;
  const deck = shuffle([...Array(52).keys()]);
  const table = deck.splice(0, 4);
  const g = {
    deck,
    table,
    hands: seats.map(() => []),
    taken: seats.map(() => []),
    pisti: seats.map(() => 0),   // pişti puanı
    pistiN: seats.map(() => 0),  // pişti sayısı
    turn: rnd(n),
    last: null,                  // son hamle {seat, card, took, pisti}
    lastTaker: -1,
    note: '',
    over: null,
  };
  return deal(g, seats);
}

// Eller boşsa herkese 4'er kart dağıtılır (az kaldıysa eşit bölüştürülür).
function deal(g, seats) {
  const al = alive(seats);
  if (al.length === 0) return g;
  const per = Math.min(4, Math.floor(g.deck.length / al.length));
  if (per <= 0) return g;
  const deck = [...g.deck];
  const hands = g.hands.map((h) => [...h]);
  for (let r = 0; r < per; r++) for (const i of al) hands[i].push(deck.shift());
  return { ...g, deck, hands };
}

function finish(g, seats, reason) {
  let table = g.table;
  let taken = g.taken.map((t) => [...t]);
  if (table.length && g.lastTaker >= 0) { taken[g.lastTaker] = [...taken[g.lastTaker], ...table]; table = []; }
  const counts = taken.map((t) => t.length);
  const max = Math.max(...counts);
  const topSeats = counts.map((c, i) => (c === max ? i : -1)).filter((i) => i >= 0);
  const scores = seats.map((s, i) => {
    const cards = taken[i].reduce((a, k) => a + cardPts(k), 0);
    const most = max > 0 && topSeats.length === 1 && topSeats[0] === i ? 3 : 0;
    return { seat: i, count: counts[i], cards, pisti: g.pisti[i], pistiN: g.pistiN[i], most, total: cards + g.pisti[i] + most };
  });
  const best = Math.max(...scores.filter((s) => !isLeft(seats, s.seat)).map((s) => s.total), -1);
  const winners = scores.filter((s) => !isLeft(seats, s.seat) && s.total === best).map((s) => s.seat);
  const ranking = [...scores].sort((a, b) => b.total - a.total).map((s) => s.seat);
  const text = reason || (winners.length === 1 ? `${seats[winners[0]].name} kazandı!` : `Berabere: ${winners.map((i) => seats[i].name).join(', ')}`);
  return { ...g, table, taken, hands: g.hands.map(() => []), turn: -1, over: { scores, winners, ranking, text }, note: text };
}

// Sıra, eli dolu bir sonraki oyuncuya geçer; eller bittiyse yeni dağıtım ya da oyun sonu.
function afterMove(g, seats, from) {
  const al = alive(seats);
  if (al.length <= 1) return finish(g, seats, al.length === 1 ? `${seats[al[0]].name} masada tek kaldı.` : 'Herkes ayrıldı.');
  let n = g;
  if (al.every((i) => n.hands[i].length === 0)) {
    if (n.deck.length < al.length) return finish(n, seats);
    n = deal(n, seats);
  }
  const t = nextAlive(seats, from);
  return { ...n, turn: t };
}

export function act(g, seats, idx, type, payload) {
  if (g.over) return { error: 'Oyun bitti.' };
  if (type !== 'psplay') return { error: 'Bilinmeyen işlem.' };
  if (g.turn !== idx) return { error: 'Sıra sende değil.' };
  const card = payload && payload.card;
  if (!Number.isInteger(card) || card < 0 || card > 51) return { error: 'Geçersiz kart.' };
  if (!g.hands[idx].includes(card)) return { error: 'Bu kart elinde yok.' };

  const hands = g.hands.map((h, i) => (i === idx ? h.filter((c) => c !== card) : [...h]));
  let table = [...g.table];
  const taken = g.taken.map((t) => [...t]);
  const pisti = [...g.pisti];
  const pistiN = [...g.pistiN];
  let took = 0;
  let pst = 0;
  let lastTaker = g.lastTaker;
  const r = rankOf(card);
  const top = table.length ? table[table.length - 1] : null;
  if (top !== null && (r === 11 || r === rankOf(top))) {
    if (table.length === 1 && r === rankOf(top)) {
      pst = r === 11 ? 20 : 10;
      pisti[idx] += pst;
      pistiN[idx] += 1;
    }
    took = table.length + 1;
    taken[idx] = [...taken[idx], ...table, card];
    table = [];
    lastTaker = idx;
  } else {
    table = [...table, card];
  }
  const name = seats[idx].name;
  const note = pst ? `${name} ${pst === 20 ? 'vale ile ' : ''}pişti yaptı! +${pst}` : took ? `${name} ${took} kart topladı.` : `${name} kart attı.`;
  const n = { ...g, hands, table, taken, pisti, pistiN, lastTaker, note, last: { seat: idx, card, took, pisti: pst } };
  return afterMove(n, seats, idx);
}

export function onLeave(g, seats, idx) {
  if (g.over) return g;
  // Ayrılanın eli oyundan çıkarılır (ortaya karışmaz); topladığı kartlar sayılmaya devam eder.
  const hands = g.hands.map((h, i) => (i === idx ? [] : [...h]));
  let n = { ...g, hands, note: `${seats[idx]?.name || 'Bir oyuncu'} masadan ayrıldı.` };
  const al = alive(seats);
  if (al.length <= 1) return finish(n, seats, al.length === 1 ? `${seats[al[0]].name} masada tek kaldı.` : 'Herkes ayrıldı.');
  if (al.every((i) => hands[i].length === 0)) {
    if (n.deck.length < al.length) return finish(n, seats);
    n = deal(n, seats);
  }
  if (n.turn === idx || n.turn < 0 || isLeft(seats, n.turn)) n = { ...n, turn: nextAlive(seats, idx) };
  return n;
}

export function viewFor(g, idx) {
  if (!g) return null;
  return {
    hand: idx >= 0 && g.hands[idx] ? [...g.hands[idx]].sort((a, b) => a - b) : [],
    handCounts: g.hands.map((h) => h.length),
    top: g.table.length ? g.table[g.table.length - 1] : null,
    tableCount: g.table.length,
    deckLeft: g.deck.length,
    takenCounts: g.taken.map((t) => t.length),
    pisti: g.pisti,
    pistiN: g.pistiN,
    turn: g.turn,
    last: g.last,
    note: g.note,
    over: g.over,
  };
}
