// Okey 101 (Türk usulü), tek el, 2-4 kişi, bireysel.
//
// Taşlar: id 0..103 normal taş (renk = floor(id/26), sayı = (id%26)%13+1; her taştan iki tane),
// id 104 ve 105 sahte okey. Göstergeden bir sonraki sayı (13'ten sonra 1), aynı renk = okey (joker).
// Gerçek okey taşları jokerdir; sahte okey ise okeyin kendi değerini taşıyan sıradan bir taş gibi davranır.
//
// Kurallar (uygulanan):
//  - Başlayan oyuncu 15, diğerleri 14 taş alır; başlayan önce taş atar. Artan taşlar destede kalır.
//  - Sıra: çek (desteden ya da bir önceki oyuncunun son attığından) -> (aç / per ekle / işle) -> bir taş at.
//  - Açma: perlerin toplamı >= 101 ya da en az 5 çift. Per: aynı sayıda farklı renkte 3-4 taş ya da aynı renkte
//    ardışık >= 3 taş (1, 13'ten sonra gelebilir: 12-13-1; 13-1-2 geçersiz). Okey joker.
//  - Per puanı: taşların temsil ettiği sayıların toplamı (12-13-1 perindeki 1 sayısı 14 sayılır).
//  - Açtıktan sonra yeni per de dizilebilir (en az sınır yok), perlere taş işlenebilir (okey de işlenir). Çift açanlar
//    yalnız çift ekleyebilir; çiftlere ve çift açanlar başkasının perine taş işleyemez. Elde en az 1 taş kalmalıdır
//    (son taş atılır). Elindeki son taşı atan oyuncu eli bitirir.
//  - Deste biterse (çekilecek taş yoksa) el kazananı olmadan biter.
//  - Puan (düşük iyi): bitiren -101 (son taşı okeyle bitirirse -202); açmamış 202; açmış ama bitirmemiş kalan taşların
//    sayı toplamı (okey 25); masadan ayrılan 202.
// Uygulanmayan: joker değiştirme (perdeki okeyi gerçek taşla değiştirme), yerden alınan taşla açma zorunluluğu,
// perin ortasına taş işleme, çift açana ceza çarpanı, çoklu el.
//
// onLeave: ayrılan oyuncunun eli desteye karışır, perleri masada kalır, puanı 202 olur; sırası ondaysa sıra bir
// sonrakine geçer; masada 2'den az oyuncu kalırsa el biter.
export const CONFIG = { min: 2, max: 4 };
export const PREFIX = 'ok';

const FAKE = 104;
const NTILES = 106;
const MAXHAND = 15;

// --- rastgelelik (sunucu) ---
function randInt(n) {
  const c = globalThis.crypto;
  const lim = Math.floor(0x100000000 / n) * n;
  const b = new Uint32Array(1);
  for (let k = 0; k < 64; k++) {
    c.getRandomValues(b);
    if (b[0] < lim) return b[0] % n;
  }
  return b[0] % n;
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- taş ve per yardımcıları (istemci de önizleme için kullanır) ---
export function tileFace(ok, id) {
  if (id >= FAKE) return { c: ok.c, n: ok.n, fake: true };
  return { c: Math.floor(id / 26), n: (id % 26) % 13 + 1 };
}
export const isJoker = (ok, id) => id < FAKE && Math.floor(id / 26) === ok.c && (id % 26) % 13 + 1 === ok.n;
const validId = (x) => Number.isInteger(x) && x >= 0 && x < NTILES;

// Per yorumlarını döndürür: [{ k:'set'|'run', tiles:[{id,c,n}], pts }]. En çok 15 taş; döngü sınırlıdır.
export function groupOptions(ok, ids) {
  if (!Array.isArray(ids) || ids.length < 3 || ids.length > MAXHAND || new Set(ids).size !== ids.length) return [];
  const nat = [];
  const jok = [];
  ids.forEach((id, i) => (isJoker(ok, id) ? jok.push(i) : nat.push({ id, i, ...tileFace(ok, id) })));
  const out = [];
  if (nat.length === 0) return out;
  // Küme: aynı sayı, farklı renkler.
  if (ids.length <= 4 && nat.every((t) => t.n === nat[0].n) && new Set(nat.map((t) => t.c)).size === nat.length) {
    const free = [0, 1, 2, 3].filter((c) => !nat.some((t) => t.c === c));
    const tiles = ids.map((id, i) => {
      if (!isJoker(ok, id)) { const f = tileFace(ok, id); return { id, c: f.c, n: f.n }; }
      return { id, c: free.shift(), n: nat[0].n };
    });
    out.push({ k: 'set', tiles, pts: nat[0].n * ids.length });
  }
  // Seri: aynı renk, ardışık (1 en sonda 14 olarak da durabilir).
  if (ids.length <= 14 && nat.every((t) => t.c === nat[0].c)) {
    const f = nat[0];
    const starts = f.n === 1 ? [1 - f.i, 14 - f.i] : [f.n - f.i];
    for (const s of starts) {
      if (s < 1 || s + ids.length - 1 > 14) continue;
      const ok2 = nat.every((t) => t.n === s + t.i || (t.n === 1 && s + t.i === 14));
      if (!ok2) continue;
      const tiles = ids.map((id, i) => ({ id, c: f.c, n: s + i }));
      out.push({ k: 'run', tiles, pts: tiles.reduce((a, t) => a + t.n, 0) });
    }
  }
  return out;
}
// En çok puan veren yorum (belirsizse); kind verilirse yalnız o tür.
export function evalGroup(ok, ids, kind) {
  let best = null;
  for (const o of groupOptions(ok, ids)) if ((!kind || o.k === kind) && (!best || o.pts > best.pts)) best = o;
  return best;
}
// Çift: aynı renk ve sayıda iki taş; okey biriyle (ya da ikisiyle) eşleşir.
export function evalPair(ok, ids) {
  if (!Array.isArray(ids) || ids.length !== 2 || ids[0] === ids[1]) return null;
  const nat = ids.filter((id) => !isJoker(ok, id)).map((id) => tileFace(ok, id));
  if (nat.length === 2 && (nat[0].c !== nat[1].c || nat[0].n !== nat[1].n)) return null;
  const f = nat[0] ?? { c: ok.c, n: ok.n };
  return { k: 'pair', tiles: ids.map((id) => ({ id, c: f.c, n: f.n })), pts: 0 };
}

// --- durum ---
export function newGame(seats) {
  const n = seats.length;
  const ids = shuffle([...Array(NTILES).keys()]);
  const k = ids.findIndex((id) => id < FAKE);
  const ind = ids.splice(k, 1)[0];
  const ic = Math.floor(ind / 26);
  const inum = (ind % 26) % 13 + 1;
  const ok = { c: ic, n: inum === 13 ? 1 : inum + 1 };
  const first = randInt(n);
  const hands = [];
  for (let i = 0; i < n; i++) hands.push(ids.splice(0, i === first ? 15 : 14));
  return {
    n, deck: ids, ind, ok, hands,
    disc: seats.map(() => []),
    melds: [],
    opened: seats.map(() => null), // null | 'melds' | 'pairs'
    out: seats.map(() => false),
    names: seats.map((s) => String(s.name ?? '')),
    turn: first, step: 'discard', drawn: -1,
    note: `${seats[first].name} başlıyor.`,
    over: null,
  };
}

const clone = (g) => JSON.parse(JSON.stringify(g));
function nextActive(g, from) {
  for (let k = 1; k <= g.n; k++) {
    const i = (from + k) % g.n;
    if (!g.out[i]) return i;
  }
  return -1;
}
function prevActive(g, from) {
  for (let k = 1; k <= g.n; k++) {
    const i = (from - k + g.n * 2) % g.n;
    if (!g.out[i]) return i;
  }
  return -1;
}
function handValue(ok, hand) {
  let s = 0;
  for (const id of hand) s += isJoker(ok, id) ? 25 : tileFace(ok, id).n;
  return s;
}

// Eli bitirir; winner -1 ise kazanan yoktur (deste bitti ya da herkes ayrıldı).
function finish(g, winner, viaOkey, text) {
  const scores = g.hands.map((h, i) => {
    if (i === winner) return { seat: i, name: g.names[i], score: viaOkey ? -202 : -101, kind: viaOkey ? 'okey' : 'bitirdi' };
    if (g.out[i]) return { seat: i, name: g.names[i], score: 202, kind: 'ayrıldı' };
    if (!g.opened[i]) return { seat: i, name: g.names[i], score: 202, kind: 'açamadı' };
    return { seat: i, name: g.names[i], score: handValue(g.ok, h), kind: 'açtı' };
  });
  return {
    ...g, turn: -1, step: 'done', drawn: -1, note: text,
    over: { winner, text, scores, hands: g.hands.map((h, i) => (g.out[i] ? [] : h.slice())) },
  };
}

export function act(g0, seats, idx, type, payload) {
  if (!g0 || g0.over) return { error: 'El bitti.' };
  const g = clone(g0);
  const p = payload && typeof payload === 'object' ? payload : {};
  if (!Number.isInteger(idx) || idx < 0 || idx >= g.n || g.out[idx]) return { error: 'Oyunda değilsiniz.' };
  if (g.turn !== idx) return { error: 'Sıra sende değil.' };
  const hand = g.hands[idx];
  const name = g.names[idx];

  if (type === 'okdraw') {
    if (g.step !== 'draw') return { error: 'Zaten taş çektin; şimdi bir taş at.' };
    let t;
    if (p.from === 'deck') {
      if (g.deck.length === 0) return finish(g, -1, false, 'Deste bitti; el kazananı olmadan sona erdi.');
      t = g.deck.shift();
      g.note = `${name} desteden çekti.`;
    } else if (p.from === 'discard') {
      const pv = prevActive(g, idx);
      if (pv < 0 || pv === idx || g.disc[pv].length === 0) return { error: 'Alınacak atılmış taş yok.' };
      t = g.disc[pv].pop();
      g.note = `${name} atılan taşı aldı.`;
    } else return { error: 'Nereden çekeceğini seç.' };
    hand.push(t);
    g.drawn = t;
    g.step = 'discard';
    return g;
  }

  if (g.step !== 'discard') return { error: 'Önce bir taş çek.' };

  if (type === 'okdiscard') {
    const t = p.tile;
    if (!validId(t) || !hand.includes(t)) return { error: 'Bu taş elinde yok.' };
    hand.splice(hand.indexOf(t), 1);
    g.disc[idx].push(t);
    g.drawn = -1;
    if (hand.length === 0) {
      if (!g.opened[idx]) return { error: 'Açmadan elini bitiremezsin.' };
      const viaOkey = isJoker(g.ok, t);
      return finish(g, idx, viaOkey, `${name} eli bitirdi${viaOkey ? ' (okeyle!)' : ''}.`);
    }
    g.turn = nextActive(g, idx);
    g.step = 'draw';
    g.note = `${name} taş attı.`;
    return g;
  }

  if (type === 'okopen') {
    const pairs = p.pairs === true;
    const groups = p.melds;
    if (!Array.isArray(groups) || groups.length < 1 || groups.length > 7) return { error: 'Dizilecek per yok.' };
    const used = new Set();
    for (const grp of groups) {
      if (!Array.isArray(grp) || grp.length > MAXHAND) return { error: 'Geçersiz per.' };
      for (const id of grp) {
        if (!validId(id) || !hand.includes(id)) return { error: 'Bu taş elinde yok.' };
        if (used.has(id)) return { error: 'Aynı taş iki kez kullanılamaz.' };
        used.add(id);
      }
    }
    if (used.size >= hand.length) return { error: 'Atmak için en az bir taş elde kalmalı.' };
    const mode = g.opened[idx];
    if (mode === 'pairs' && !pairs) return { error: 'Çift açtın; yalnız çift ekleyebilirsin.' };
    if (mode === 'melds' && pairs) return { error: 'Per açtın; çift ekleyemezsin.' };
    const built = [];
    let total = 0;
    for (const grp of groups) {
      const m = pairs ? evalPair(g.ok, grp) : evalGroup(g.ok, grp);
      if (!m) return { error: pairs ? 'Çift geçersiz: aynı renk ve sayıda iki taş olmalı.' : 'Geçersiz per. Aynı sayıda farklı renk (3-4) ya da aynı renkte ardışık (en az 3) olmalı.' };
      built.push({ ...m, owner: idx });
      total += m.pts;
    }
    if (!mode) {
      if (pairs && groups.length < 5) return { error: 'Çift açmak için en az 5 çift gerekli.' };
      if (!pairs && total < 101) return { error: `Açmak için perlerin toplamı en az 101 olmalı (şu an ${total}).` };
      g.opened[idx] = pairs ? 'pairs' : 'melds';
    }
    g.hands[idx] = hand.filter((t) => !used.has(t));
    g.melds.push(...built);
    g.note = mode ? `${name} yeni per dizdi.` : `${name} ${pairs ? 'çift açtı' : `${total} puanla açtı`}.`;
    return g;
  }

  if (type === 'okadd') {
    if (g.opened[idx] !== 'melds') return { error: 'Perlere taş işlemek için önce per açmalısın.' };
    const { meld, tile, pos } = p;
    if (!Number.isInteger(meld) || meld < 0 || meld >= g.melds.length) return { error: 'Per bulunamadı.' };
    if (!validId(tile) || !hand.includes(tile)) return { error: 'Bu taş elinde yok.' };
    if (hand.length <= 1) return { error: 'Atmak için en az bir taş elde kalmalı.' };
    const m = g.melds[meld];
    if (m.k === 'pair') return { error: 'Çiftlere taş işlenmez.' };
    const ids = m.tiles.map((t) => t.id);
    if (m.k === 'run') {
      if (!Number.isInteger(pos) || (pos !== 0 && pos !== ids.length)) return { error: 'Taş yalnız perin başına ya da sonuna işlenir.' };
      ids.splice(pos, 0, tile);
    } else ids.push(tile);
    const r = evalGroup(g.ok, ids, m.k);
    if (!r) return { error: 'Bu taş o pere işlenemez.' };
    g.melds[meld] = { ...r, owner: m.owner };
    hand.splice(hand.indexOf(tile), 1);
    g.note = `${name} perlere taş işledi.`;
    return g;
  }

  return { error: 'Bilinmeyen işlem.' };
}

export function onLeave(g0, seats, idx) {
  if (!g0 || g0.over) return g0;
  const g = clone(g0);
  if (!Number.isInteger(idx) || idx < 0 || idx >= g.n || g.out[idx]) return g;
  g.deck.push(...shuffle(g.hands[idx]));
  g.hands[idx] = [];
  g.out[idx] = true;
  const alive = g.out.filter((x) => !x).length;
  if (alive < 2) return finish(g, -1, false, 'Oyuncular ayrıldı; el sona erdi.');
  if (g.turn === idx) {
    g.turn = nextActive(g, idx);
    g.step = 'draw';
    g.drawn = -1;
  }
  g.note = `${g.names[idx]} masadan ayrıldı.`;
  return g;
}

// Oyuncuya giden görünüm: yalnız kendi eli; deste içeriği ve başkalarının elleri asla gönderilmez.
export function viewFor(g, idx) {
  if (!g) return null;
  const mine = idx >= 0 && idx < g.n && !g.out[idx];
  return {
    n: g.n,
    me: idx,
    names: g.names,
    hand: mine ? g.hands[idx].slice() : [],
    counts: g.hands.map((h) => h.length),
    deck: g.deck.length,
    ind: g.ind,
    ok: g.ok,
    disc: g.disc,
    melds: g.melds,
    opened: g.opened,
    out: g.out,
    turn: g.turn,
    step: g.step,
    drawn: mine && g.turn === idx ? g.drawn : -1,
    prev: g.over ? -1 : g.turn >= 0 ? prevActive(g, g.turn) : -1,
    note: g.note,
    over: g.over,
  };
}
