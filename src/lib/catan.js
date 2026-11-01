// Catan (temel oyun, 3-4 oyuncu). Resmi temel kurallar: 19 arazi (4 Odun, 4 Koyun, 4 Buğday, 3 Tuğla, 3 Cevher,
// 1 Çöl), 18 sayı jetonu (2 ve 12 birer, diğerleri ikişer), 9 liman (4 genel 3:1, 5 özel 2:1), 25 gelişim kartı
// (14 Şövalye, 2 Yol inşası, 2 Bolluk, 2 Tekel, 5 Zafer puanı). Oyuncu başına 5 köy, 4 şehir, 15 yol.
// Kurulum: yılan sırası (1,2,3,4,4,3,2,1 gibi), her oyuncu köy + yol; ikinci köyden bitişik arazilerin kaynakları.
// Zar 7: 7'den fazla kart tutan yarısını (aşağı yuvarlanır) bankaya atar; zar atan hırsızı taşır ve bir kart çalar.
// Ticaret: banka 4:1, liman 3:1 (genel) ya da 2:1 (özel); oyuncular arası teklif ve karşılık. Puan: köy 1, şehir 2,
// en uzun yol (5+) 2, en büyük ordu (3+ şövalye) 2, zafer kartı 1. İlk 10 puana, kendi sırasında ulaşan kazanır.
//
// Saf fonksiyonlar: act(g, idx, eylem, rng) ve onLeave(g, seats, idx, rng). Rastgelelik rng ile gelir (zar, deste,
// tahta, çalınan kart); sunucu Math.random verir. Hatalı hamle { error } döner. viewFor yalnızca kendi kartları ve
// gelişim kartlarını açar; diğerlerinde yalnızca adet görünür.

export const RES = ['lumber', 'wool', 'grain', 'brick', 'ore'];
export const RES_TR = { lumber: 'Odun', wool: 'Koyun', grain: 'Buğday', brick: 'Tuğla', ore: 'Cevher' };
export const COST = {
  road: { lumber: 1, brick: 1 },
  settle: { lumber: 1, brick: 1, wool: 1, grain: 1 },
  city: { grain: 2, ore: 3 },
  dev: { wool: 1, grain: 1, ore: 1 },
};
export const WIN = 10;
const LIMIT = { road: 15, settle: 5, city: 4 };
const LONG_MIN = 5;
const ARMY_MIN = 3;
const TERRAIN = { lumber: 4, wool: 4, grain: 4, brick: 3, ore: 3, desert: 1 };
const NUMBERS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
const HARBOR_TYPES = ['any', 'any', 'any', 'any', 'lumber', 'wool', 'grain', 'brick', 'ore'];
const DEV_DECK = [
  ...Array(14).fill('knight'), ...Array(2).fill('road'), ...Array(2).fill('plenty'),
  ...Array(2).fill('mono'), ...Array(5).fill('vp'),
];
const CARD_PLAY = new Set(['knight', 'road', 'plenty', 'mono']);
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]; // eksenel (axial) komşu yönleri
const SQ3 = Math.sqrt(3);

// ---- Geometri (deterministik; tahta düzeni sabittir, yalnızca arazi/sayı/liman rastgeledir) ----
const hk = (q, r) => `${q},${r}`;
const hexXY = (q, r) => ({ x: SQ3 * (q + r / 2), y: 1.5 * r });
const HEX = [];
for (let q = -2; q <= 2; q++) for (let r = Math.max(-2, -q - 2); r <= Math.min(2, 2 - q); r++) HEX.push([q, r]);
const HEX_OF = new Map(HEX.map(([q, r], i) => [hk(q, r), i]));

// Köşe: üç altıgenin (kara dışında olabilir) ortak noktası. Sıra: önce ilk altıgen, sonra kenar yönleri.
const VKEY = new Map();
const VERT = [];
HEX.forEach(([q, r]) => {
  for (let i = 0; i < 6; i++) {
    const b = [q + DIRS[i][0], r + DIRS[i][1]];
    const c = [q + DIRS[(i + 1) % 6][0], r + DIRS[(i + 1) % 6][1]];
    const trio = [[q, r], b, c];
    const keys = trio.map(([x, y]) => hk(x, y)).sort();
    const id = keys.join('|');
    if (VKEY.has(id)) continue;
    const pts = trio.map(([x, y]) => hexXY(x, y));
    VKEY.set(id, VERT.length);
    VERT.push({
      x: pts.reduce((s, p) => s + p.x, 0) / 3,
      y: pts.reduce((s, p) => s + p.y, 0) / 3,
      hx: keys.filter((k) => HEX_OF.has(k)).map((k) => HEX_OF.get(k)),
      keys,
    });
  }
});

// Kenar: iki köşe ortak iki altıgeni paylaşıyorsa aralarında yol vardır.
const EDGE = [];
for (let i = 0; i < VERT.length; i++) {
  for (let j = i + 1; j < VERT.length; j++) {
    const sh = VERT[i].keys.filter((k) => VERT[j].keys.includes(k));
    if (sh.length !== 2) continue;
    const sides = sh.map((k) => (HEX_OF.has(k) ? HEX_OF.get(k) : -1));
    if (sides.every((s) => s < 0)) continue;
    EDGE.push({ a: i, b: j, sides });
  }
}
const VE = VERT.map(() => []); // köşedeki kenarlar
EDGE.forEach((e, k) => { VE[e.a].push(k); VE[e.b].push(k); });
const VADJ = VERT.map((_, v) => VE[v].map((k) => (EDGE[k].a === v ? EDGE[k].b : EDGE[k].a)));
const HEX_VERTS = HEX.map((_, h) => VERT.map((_, v) => v).filter((v) => VERT[v].hx.includes(h)));
const mid = (k) => ({ x: (VERT[EDGE[k].a].x + VERT[EDGE[k].b].x) / 2, y: (VERT[EDGE[k].a].y + VERT[EDGE[k].b].y) / 2 });
// Kıyı kenarları (bir tarafı deniz) merkez etrafında sıralanır; limanlar bunların her ikisinde biri alınarak konur.
const COAST = EDGE.map((_, k) => k)
  .filter((k) => EDGE[k].sides.includes(-1))
  .sort((x, y) => Math.atan2(mid(x).y, mid(x).x) - Math.atan2(mid(y).y, mid(y).x));

// İstemcinin tahtayı çizmesi için geometri (yalnızca konum bilgisi; oyun durumu içermez).
export function layout() {
  return {
    hexes: HEX.map(([q, r], h) => ({ q, r, ...hexXY(q, r), v: HEX_VERTS[h] })),
    verts: VERT.map((v) => ({ x: v.x, y: v.y })),
    edges: EDGE.map((e) => [e.a, e.b]),
  };
}

// ---- Yardımcılar ----
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const zero = () => Object.fromEntries(RES.map((r) => [r, 0]));
const sum = (o) => RES.reduce((s, r) => s + (o[r] || 0), 0);
const canPay = (have, cost) => RES.every((r) => (have[r] || 0) >= (cost[r] || 0));
// Kaynak nesnesini doğrular: yalnızca tanınan anahtarlar, tam sayı ve 0 veya daha büyük değerler.
function resOk(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const out = zero();
  for (const k of Object.keys(o)) {
    if (!RES.includes(k)) return null;
    const v = o[k];
    if (!Number.isInteger(v) || v < 0 || v > 99) return null;
    out[k] = v;
  }
  return out;
}
const addRes = (have, delta, sign = 1) => RES.forEach((r) => { have[r] = (have[r] || 0) + sign * (delta[r] || 0); });
// Yapım/satın alma bedeli bankaya döner (kaynak korunumu).
const spend = (g, p, cost) => { addRes(g.players[p].r, cost, -1); addRes(g.bank, cost, 1); };
const nm = (g, p) => g.names?.[p] || `Oyuncu ${p + 1}`;
const ok = (x) => Number.isInteger(x) && x >= 0;

function makeBoard(rng) {
  const terr = shuffle(Object.entries(TERRAIN).flatMap(([t, n]) => Array(n).fill(t)), rng);
  const nums = shuffle(NUMBERS, rng);
  let k = 0;
  const hexes = terr.map((t) => ({ t, n: t === 'desert' ? null : nums[k++] }));
  // Limanlar kıyıda birer aralıkla dizilir; başlangıç noktası rastgele.
  const off = rng() < 0.5 ? 0 : 1;
  const kinds = shuffle(HARBOR_TYPES, rng);
  const ports = kinds.map((t, i) => ({ e: COAST[(off + 2 * i) % COAST.length], t }));
  return { hexes, ports };
}

// ---- Tahta kuralları ----
const own = (g, p) => g.vb.filter((o) => o && o.p === p);
const settleLeft = (g, p) => LIMIT.settle - own(g, p).filter((o) => !o.c).length;
const cityLeft = (g, p) => LIMIT.city - own(g, p).filter((o) => o.c).length;
const roadLeft = (g, p) => LIMIT.road - g.eb.filter((x) => x === p).length;
// Köy kuralı: boş köşe ve komşu köşelerde bina yok (mesafe kuralı).
const canSettleAt = (g, v) => g.vb[v] === null && VADJ[v].every((u) => g.vb[u] === null);
// Yol kuralı: kendi köyüne ya da kendi yoluna bağlı; rakip binası olan köşeden geçilmez.
function roadOK(g, p, e) {
  if (g.eb[e] !== null) return false;
  return [EDGE[e].a, EDGE[e].b].some((v) => (g.vb[v] ? g.vb[v].p === p : VE[v].some((f) => g.eb[f] === p)));
}
const touchesLast = (e, v) => EDGE[e].a === v || EDGE[e].b === v;

function victimsOf(g, p, h) {
  const set = new Set();
  for (const v of HEX_VERTS[h]) {
    const o = g.vb[v];
    if (o && o.p !== p && sum(g.players[o.p].r) > 0) set.add(o.p);
  }
  return [...set];
}

// Yalnızca oyuncunun sırası ve adımı uygunsa yapabileceği yerler (istemci vurgulamak için kullanır; sunucu da doğrular).
export function legal(g, p) {
  const out = { settle: [], city: [], road: [] };
  if (g.over || !Number.isInteger(p) || p < 0 || p >= g.n || g.gone[p] || g.turn !== p) return out;
  if (g.phase === 'setup') {
    if (g.step === 'settle') VERT.forEach((_, v) => { if (canSettleAt(g, v)) out.settle.push(v); });
    else if (g.step === 'road' && g.lastV !== null) EDGE.forEach((_, e) => { if (g.eb[e] === null && touchesLast(e, g.lastV)) out.road.push(e); });
    return out;
  }
  if (g.step === 'main') {
    if (settleLeft(g, p) > 0) VERT.forEach((_, v) => { if (canSettleAt(g, v) && VE[v].some((e) => g.eb[e] === p)) out.settle.push(v); });
    if (cityLeft(g, p) > 0) g.vb.forEach((o, v) => { if (o && o.p === p && !o.c) out.city.push(v); });
  }
  if ((g.step === 'main' || g.step === 'roll') && roadLeft(g, p) > 0) EDGE.forEach((_, e) => { if (roadOK(g, p, e)) out.road.push(e); });
  return out;
}

// En uzun sürekli yol. Rakip binası olan köşede yol kesilir (köşede bitmek serbesttir).
function longest(g, p) {
  let best = 0;
  const used = new Set();
  const blocked = (v) => !!g.vb[v] && g.vb[v].p !== p;
  const walk = (v, len) => {
    if (len > best) best = len;
    if (len > 0 && blocked(v)) return;
    for (const e of VE[v]) {
      if (g.eb[e] !== p || used.has(e)) continue;
      used.add(e);
      walk(EDGE[e].a === v ? EDGE[e].b : EDGE[e].a, len + 1);
      used.delete(e);
    }
  };
  g.eb.forEach((o, e) => { if (o === p) { walk(EDGE[e].a, 0); walk(EDGE[e].b, 0); } });
  return best;
}

const pubPoints = (g, p) => {
  let v = 0;
  for (const o of g.vb) if (o && o.p === p) v += o.c ? 2 : 1;
  if (g.lr === p) v += 2;
  if (g.la === p) v += 2;
  return v;
};
const points = (g, p) => pubPoints(g, p) + g.players[p].d.filter((c) => c === 'vp').length + g.players[p].nd.filter((c) => c === 'vp').length;

// Kart çekme: rastgele bir kart seçer ve elden çıkarır; yoksa null.
function drawCard(have, rng) {
  const total = sum(have);
  if (!total) return null;
  let k = Math.floor(rng() * total);
  for (const r of RES) {
    if (k < have[r]) { have[r]--; return r; }
    k -= have[r];
  }
  return null;
}

function discardRandom(g, p, n, rng) {
  for (let i = 0; i < n; i++) {
    const r = drawCard(g.players[p].r, rng);
    if (r) g.bank[r]++;
  }
}

// Zar: her arazide sayı tutan ve hırsız olmayan kara için köy/şehir sahiplerine kaynak; banka yetmezse
// birden fazla alıcı varsa kimse almaz, tek alıcıya kalan kadar verilir (resmi kural).
function produce(g, s) {
  const demand = {};
  g.hexes.forEach((h, hi) => {
    if (h.n !== s || hi === g.robber || h.t === 'desert') return;
    for (const v of HEX_VERTS[hi]) {
      const o = g.vb[v];
      if (!o) continue;
      demand[h.t] ??= {};
      demand[h.t][o.p] = (demand[h.t][o.p] || 0) + (o.c ? 2 : 1);
    }
  });
  for (const r of Object.keys(demand)) {
    const per = demand[r];
    const total = Object.values(per).reduce((a, b) => a + b, 0);
    const owners = Object.keys(per);
    if (total <= g.bank[r]) {
      for (const p of owners) { g.players[p].r[r] += per[p]; g.bank[r] -= per[p]; }
    } else if (owners.length === 1) {
      const p = Number(owners[0]);
      g.players[p].r[r] += g.bank[r];
      g.bank[r] = 0;
    }
  }
}

function moveRobber(g, p, hex, victim, rng) {
  if (!Number.isInteger(hex) || hex < 0 || hex >= HEX.length) return 'Geçersiz arazi.';
  if (hex === g.robber) return 'Hırsız aynı araziye bırakılamaz.';
  const vs = victimsOf(g, p, hex);
  if (vs.length) {
    if (!vs.includes(victim)) return 'Çalınacak bir rakip seçin.';
    const r = drawCard(g.players[victim].r, rng);
    if (r) g.players[p].r[r]++;
  }
  g.robber = hex;
  return null;
}

function placeRoad(g, p, e, paid) {
  if (!Number.isInteger(e) || e < 0 || e >= EDGE.length) return 'Geçersiz yol.';
  if (!roadOK(g, p, e)) return 'Yol buraya bağlı değil ya da dolu.';
  if (roadLeft(g, p) < 1) return 'Yol stokunuz bitti.';
  if (paid) {
    if (!canPay(g.players[p].r, COST.road)) return 'Kaynaklarınız yetmiyor.';
    spend(g, p, COST.road);
  }
  g.eb[e] = p;
  return null;
}

function tradeRate(g, p, res) {
  let rate = 4;
  for (const pt of g.ports) {
    const ends = [EDGE[pt.e].a, EDGE[pt.e].b];
    if (!ends.some((v) => g.vb[v]?.p === p)) continue;
    if (pt.t === 'any') rate = Math.min(rate, 3);
    else if (pt.t === res) rate = Math.min(rate, 2);
  }
  return rate;
}

function endTurn(g) {
  const P = g.players[g.turn];
  P.d.push(...P.nd);
  P.nd = [];
  g.devPlayed = false;
  g.offer = null;
  let t = g.turn;
  for (let i = 1; i <= g.n; i++) {
    const q = (g.turn + i) % g.n;
    if (!g.gone[q]) { t = q; break; }
  }
  g.turn = t;
  g.step = 'roll';
}

// Yer/tur kuralları: ayrılmış oyuncunun sırası kalırsa tur otomatik ilerler (zar/hırsız rastgele).
function skipGone(g, rng) {
  if (g.phase !== 'play') return;
  let guard = 0;
  while (g.gone[g.turn] && guard++ < 8 && !g.over) {
    if (g.step === 'discard') break;
    if (g.step === 'robber') {
      const hexes = HEX.map((_, i) => i).filter((i) => i !== g.robber);
      const h = hexes[Math.floor(rng() * hexes.length)];
      const vs = victimsOf(g, g.turn, h);
      moveRobber(g, g.turn, h, vs.length ? vs[Math.floor(rng() * vs.length)] : null, rng);
      g.step = 'main';
    }
    if (g.step === 'roll' || g.step === 'main') endTurn(g);
  }
}

// Ödül kartları: en uzun yol ve en büyük ordu. Berabere kalınca mevcut sahip korunur.
function awards(g) {
  const L = g.players.map((_, p) => longest(g, p));
  const M = Math.max(0, ...L);
  if (M < LONG_MIN) g.lr = null;
  else if (g.lr === null || L[g.lr] !== M) {
    const c = L.map((x, p) => (x === M ? p : -1)).filter((p) => p >= 0);
    g.lr = c.length === 1 ? c[0] : null;
  }
  let h = g.la;
  let hc = h === null ? ARMY_MIN - 1 : g.players[h].k;
  g.players.forEach((P, p) => {
    if (p !== h && P.k >= ARMY_MIN && P.k > hc) { h = p; hc = P.k; }
  });
  g.la = h;
}

function finish(g, rng) {
  skipGone(g, rng);
  awards(g);
  if (g.phase === 'play' && !g.over && points(g, g.turn) >= WIN) {
    g.over = `${nm(g, g.turn)} ${WIN} puana ulaştı ve Catan'ı kazandı!`;
    g.winner = g.turn;
  }
  return g;
}

// ---- Oyun kurulumu ----
export function newGame(n, rng = Math.random) {
  const { hexes, ports } = makeBoard(rng);
  const order = [...Array(n).keys(), ...[...Array(n).keys()].reverse()];
  return {
    phase: 'setup', step: 'settle', n, names: [],
    order, sIdx: 0, turn: order[0], lastV: null,
    hexes, ports, robber: hexes.findIndex((h) => h.t === 'desert'),
    vb: VERT.map(() => null),
    eb: EDGE.map(() => null),
    bank: Object.fromEntries(RES.map((r) => [r, 19])),
    players: Array.from({ length: n }, () => ({ r: zero(), d: [], nd: [], k: 0 })),
    gone: Array(n).fill(false),
    dev: shuffle(DEV_DECK, rng), used: [],
    dice: null, need: [], devPlayed: false, offer: null,
    lr: null, la: null, over: null, winner: null,
  };
}

// ---- Eylemler: her biri g'yi (kopya) değiştirir ve hata metni ya da null döner ----
function doAct(g, p, a, rng) {
  const setup = g.phase === 'setup';
  const P = g.players[p];
  switch (a.type) {
    case 'csettle': {
      const v = a.v;
      if (!Number.isInteger(v) || v < 0 || v >= VERT.length) return 'Geçersiz köşe.';
      if (setup) {
        if (g.turn !== p || g.step !== 'settle') return 'Şu an köy koyamazsınız.';
        if (!canSettleAt(g, v)) return 'Bu köşe uygun değil (dolu ya da komşu köy var).';
        if (settleLeft(g, p) < 1) return 'Köy stokunuz bitti.';
        g.vb[v] = { p, c: false };
        g.lastV = v;
        g.step = 'road';
        if (g.sIdx >= g.n) { // ikinci köy: bitişik arazilerden birer kaynak
          for (const hi of VERT[v].hx) {
            const h = g.hexes[hi];
            if (h.t !== 'desert' && g.bank[h.t] > 0) { g.bank[h.t]--; P.r[h.t]++; }
          }
        }
        return null;
      }
      if (g.turn !== p || g.step !== 'main') return 'Şu an köy kuramazsınız.';
      if (!canSettleAt(g, v) || !VE[v].some((e) => g.eb[e] === p)) return 'Köy kendi yolunuza bağlı ve komşusu boş bir köşeye kurulmalı.';
      if (settleLeft(g, p) < 1) return 'Köy stokunuz bitti.';
      if (!canPay(P.r, COST.settle)) return 'Kaynaklarınız yetmiyor.';
      spend(g, p, COST.settle);
      g.vb[v] = { p, c: false };
      return null;
    }
    case 'ccity': {
      if (setup || g.turn !== p || g.step !== 'main') return 'Şu an şehir kuramazsınız.';
      const v = a.v;
      if (!Number.isInteger(v) || v < 0 || v >= VERT.length) return 'Geçersiz köşe.';
      const o = g.vb[v];
      if (!o || o.p !== p || o.c) return 'Şehir için kendi köyünüzü seçin.';
      if (cityLeft(g, p) < 1) return 'Şehir stokunuz bitti.';
      if (!canPay(P.r, COST.city)) return 'Kaynaklarınız yetmiyor.';
      spend(g, p, COST.city);
      o.c = true;
      return null;
    }
    case 'croad': {
      if (setup) {
        if (g.turn !== p || g.step !== 'road') return 'Şu an yol koyamazsınız.';
        const e = a.e;
        if (!Number.isInteger(e) || e < 0 || e >= EDGE.length || g.eb[e] !== null || !touchesLast(e, g.lastV)) return 'Yol son köye bitişik olmalı.';
        if (roadLeft(g, p) < 1) return 'Yol stokunuz bitti.';
        g.eb[e] = p;
        g.lastV = null;
        g.sIdx++;
        if (g.sIdx >= 2 * g.n) { g.phase = 'play'; g.turn = 0; g.step = 'roll'; }
        else { g.turn = g.order[g.sIdx]; g.step = 'settle'; }
        return null;
      }
      if (g.turn !== p || g.step !== 'main') return 'Şu an yol kuramazsınız.';
      if (!canPay(P.r, COST.road)) return 'Kaynaklarınız yetmiyor.';
      return placeRoad(g, p, a.e, true);
    }
    case 'cdev': {
      if (setup || g.turn !== p || g.step !== 'main') return 'Gelişim kartı şu an alınamaz.';
      if (!g.dev.length) return 'Gelişim kartı kalmadı.';
      if (!canPay(P.r, COST.dev)) return 'Kaynaklarınız yetmiyor.';
      spend(g, p, COST.dev);
      P.nd.push(g.dev.pop());
      return null;
    }
    case 'croll': {
      if (setup || g.turn !== p || g.step !== 'roll') return 'Zar şu an atılamaz.';
      const d1 = 1 + Math.floor(rng() * 6);
      const d2 = 1 + Math.floor(rng() * 6);
      g.dice = [d1, d2];
      const s = d1 + d2;
      if (s === 7) {
        g.need = g.players
          .map((Q, q) => ({ p: q, n: Math.floor(sum(Q.r) / 2) }))
          .filter((x) => sum(g.players[x.p].r) > 7);
        g.need = g.need.filter((x) => {
          if (!g.gone[x.p]) return true;
          discardRandom(g, x.p, x.n, rng);
          return false;
        });
        g.step = g.need.length ? 'discard' : 'robber';
      } else {
        produce(g, s);
        g.step = 'main';
      }
      return null;
    }
    case 'cdrop': {
      if (g.phase !== 'play' || g.step !== 'discard') return 'Şu an kart atmanız gerekmiyor.';
      const i = g.need.findIndex((x) => x.p === p);
      if (i < 0) return 'Kart atmanız gerekmiyor.';
      const r = resOk(a.r);
      if (!r) return 'Geçersiz kart seçimi.';
      if (sum(r) !== g.need[i].n) return `${g.need[i].n} kart seçmelisiniz.`;
      if (!canPay(P.r, r)) return 'Elinizde olmayan kart seçtiniz.';
      addRes(P.r, r, -1);
      addRes(g.bank, r, 1);
      g.need.splice(i, 1);
      if (!g.need.length) g.step = 'robber';
      return null;
    }
    case 'crobber': {
      if (g.phase !== 'play' || g.step !== 'robber' || g.turn !== p) return 'Hırsızı şu an taşıyamazsınız.';
      const err = moveRobber(g, p, a.hex, a.victim, rng);
      if (!err) g.step = 'main';
      return err;
    }
    case 'cplay': {
      if (setup || g.turn !== p || (g.step !== 'roll' && g.step !== 'main')) return 'Gelişim kartı şu an oynanamaz.';
      if (g.devPlayed) return 'Bu turda zaten bir gelişim kartı oynadınız.';
      if (!CARD_PLAY.has(a.card)) return 'Bu kart oynanamaz.';
      const i = P.d.indexOf(a.card);
      if (i < 0) return 'Bu karta sahip değilsiniz (ya da bu turda aldınız).';
      let err = null;
      if (a.card === 'knight') err = moveRobber(g, p, a.hex, a.victim, rng);
      else if (a.card === 'road') {
        const es = Array.isArray(a.edges) ? a.edges : [];
        if (es.length < 1 || es.length > 2) return 'Bir ya da iki yol seçin.';
        for (const e of es) { err = placeRoad(g, p, e, false); if (err) break; }
      } else if (a.card === 'plenty') {
        const ps = Array.isArray(a.picks) ? a.picks : [];
        if (ps.length !== 2 || ps.some((r) => !RES.includes(r))) return 'İki kaynak seçin.';
        const need = zero();
        ps.forEach((r) => { need[r]++; });
        if (RES.some((r) => g.bank[r] < need[r])) return 'Bankada bu kaynaklar yok.';
        addRes(g.bank, need, -1);
        addRes(P.r, need, 1);
      } else {
        if (!RES.includes(a.res)) return 'Bir kaynak seçin.';
        let got = 0;
        g.players.forEach((Q, q) => { if (q !== p) { got += Q.r[a.res]; Q.r[a.res] = 0; } });
        P.r[a.res] += got;
      }
      if (err) return err;
      P.d.splice(i, 1);
      g.used.push(a.card);
      if (a.card === 'knight') P.k++;
      g.devPlayed = true;
      return null;
    }
    case 'cend': {
      if (setup || g.turn !== p || g.step !== 'main') return 'Turu şu an bitiremezsiniz.';
      endTurn(g);
      return null;
    }
    case 'cbank': {
      if (setup || g.turn !== p || g.step !== 'main') return 'Banka ile şu an ticaret yapamazsınız.';
      const { give, want } = a;
      if (!RES.includes(give) || !RES.includes(want) || give === want) return 'Geçersiz ticaret.';
      const rate = tradeRate(g, p, give);
      if (P.r[give] < rate) return `${RES_TR[give]} yetersiz (${rate} tane gerekir).`;
      if (g.bank[want] < 1) return `Bankada ${RES_TR[want]} kalmadı.`;
      P.r[give] -= rate;
      g.bank[give] += rate;
      g.bank[want]--;
      P.r[want]++;
      return null;
    }
    case 'coffer': {
      if (setup || g.turn !== p || g.step !== 'main') return 'Teklif şu an yapılamaz.';
      if (g.offer) return 'Açık bir teklif var.';
      const give = resOk(a.give);
      const want = resOk(a.want);
      if (!give || !want || sum(give) < 1 || sum(want) < 1) return 'Geçersiz teklif.';
      if (RES.some((r) => give[r] && want[r])) return 'Aynı kaynak türü iki tarafta olamaz.';
      if (!canPay(P.r, give)) return 'Vereceğiniz kartlar yetmiyor.';
      g.offer = { from: p, give, want, acc: [] };
      return null;
    }
    case 'cacc': {
      const o = g.offer;
      if (!o) return 'Açık teklif yok.';
      if (p === o.from) return 'Kendi teklifinizi kabul edemezsiniz.';
      if (o.acc.includes(p)) return 'Zaten kabul ettiniz.';
      if (!canPay(P.r, o.want)) return 'Bu teklifi karşılayacak kartınız yok.';
      o.acc.push(p);
      return null;
    }
    case 'cpick': {
      const o = g.offer;
      if (!o || o.from !== p) return 'Bu teklif sizin değil.';
      const w = Number(a.with);
      if (!o.acc.includes(w) || g.gone[w]) return 'Bu oyuncu teklifi kabul etmedi.';
      if (!canPay(P.r, o.give) || !canPay(g.players[w].r, o.want)) return 'Kaynaklardan biri artık yetersiz.';
      const W = g.players[w];
      RES.forEach((r) => {
        P.r[r] += o.want[r] - o.give[r];
        W.r[r] += o.give[r] - o.want[r];
      });
      g.offer = null;
      return null;
    }
    case 'cclose': {
      if (!g.offer || g.offer.from !== p) return 'Kapatacak teklif yok.';
      g.offer = null;
      return null;
    }
    default:
      return 'Bilinmeyen işlem.';
  }
}

// Hamleyi uygular. Hata varsa { error } döner, oyun durumu değişmez (kopya üzerinde çalışılır).
export function act(g0, p, a, rng = Math.random) {
  if (!g0 || g0.over) return { error: 'Oyun bitti.' };
  if (!Number.isInteger(p) || p < 0 || p >= g0.n || g0.gone[p]) return { error: 'Oyunda değilsiniz.' };
  const g = structuredClone(g0);
  const err = doAct(g, p, a ?? {}, rng);
  if (err) return { error: err };
  return finish(g, rng);
}

// Oyuncu masadan ayrıldı: kurulum sırasında ya da iki kişiden az kalırsa oyun biter; aksi halde sırası atlanır.
export function onLeave(g0, seats, idx, rng = Math.random) {
  if (!g0 || g0.over) return g0;
  const g = structuredClone(g0);
  g.gone[idx] = true;
  if (g.offer) {
    if (g.offer.from === idx) g.offer = null;
    else g.offer.acc = g.offer.acc.filter((x) => x !== idx);
  }
  const left = g.gone.map((x, i) => (x ? -1 : i)).filter((i) => i >= 0);
  if (g.phase === 'setup' || left.length < 2) {
    g.over = left.length === 1 ? `${nm(g, left[0])} kazandı (rakipler masadan ayrıldı).` : 'Oyun, oyuncular ayrıldığı için sona erdi.';
    g.winner = left.length === 1 ? left[0] : null;
    return g;
  }
  g.need = g.need.filter((x) => {
    if (x.p !== idx) return true;
    discardRandom(g, idx, x.n, rng);
    return false;
  });
  if (g.step === 'discard' && !g.need.length) g.step = 'robber';
  return finish(g, rng);
}

// Görünüm: kendi kartları ve gelişim kartları açık; diğerleri için yalnızca adet.
export function viewFor(g, me) {
  if (!g) return null;
  const legalNow = me >= 0 && me < g.n && !g.over ? legal(g, me) : { settle: [], city: [], road: [] };
  return {
    phase: g.phase, step: g.step, turn: g.turn, me, n: g.n,
    names: g.names, over: g.over, winner: g.winner,
    dice: g.dice, robber: g.robber,
    hexes: g.hexes, ports: g.ports,
    vb: g.vb, eb: g.eb, lastV: g.lastV,
    bank: g.bank, devLeft: g.dev.length, devUsed: devCount(g.used), devPlayed: g.devPlayed,
    need: g.need, offer: g.offer, gone: g.gone,
    lr: g.lr, la: g.la,
    legal: legalNow,
    players: g.players.map((P, p) => ({
      cards: sum(P.r),
      res: p === me ? { ...P.r } : null,
      dev: p === me ? devCount(P.d) : null,
      devNew: p === me ? devCount(P.nd) : null,
      devN: P.d.length + P.nd.length,
      k: P.k,
      pub: pubPoints(g, p),
      mine: p === me,
    })),
  };
}

function devCount(list) {
  const out = { knight: 0, road: 0, plenty: 0, mono: 0, vp: 0 };
  for (const c of list) out[c]++;
  return out;
}

// Test ve istemci yardımcıları.
export { longest as longestRoad };
