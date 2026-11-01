// Ticket to Ride (temel oyun). Kurallar resmi kural kitapçığına (Days of Wonder, 2025 V2) göre:
// 110 tren kartı (8 renk x 12 + 14 lokomotif), oyuncu başına 45 vagon, başta 4 bilet çekilip en az 2'si tutulur,
// tur başına tek eylem (2 kart çek / rota talep et / 3 bilet çek ve en az 1'ini tut), açık 5 kartta 3 lokomotif
// olursa tümü yenilenir, vagonu 2 ya da daha az kalan oyuncudan sonra herkes bir son tur oynar, en uzun yol +10.
// Harita gerçek ABD haritası değil: Türkiye şehirleriyle bu oyun için tasarlanmış küçük bir haritadır.
// Oyun durumu sunucuda tutulur; bu dosya saf fonksiyonlardan oluşur (act(g, idx, action) yeni durum ya da {error} döner).

export const COLORS = ['purple', 'white', 'blue', 'yellow', 'orange', 'black', 'red', 'green'];
export const LOCO = 'loco';
const CARD_TYPES = [...COLORS, LOCO];
export const TRAINS = 45;
export const ROUTE_PTS = [0, 1, 2, 4, 7, 10, 15]; // indeks = rota uzunluğu (1..6)
export const LONGEST_BONUS = 10;
export const INIT_DEAL = 4; // başlangıçta çekilen bilet sayısı; en az 2'si tutulur
export const INIT_MIN_KEEP = 2;
export const DRAW_TICKETS = 3; // tur içinde çekilen bilet sayısı; en az 1'i tutulur

// Şehirler: x, y SVG koordinatları (1000 x 560 görünüm alanı). Yaklaşık konumlar, şematik harita.
export const CITIES = {
  edirne: { n: 'Edirne', x: 29, y: 32 },
  istanbul: { n: 'İstanbul', x: 156, y: 99 },
  bursa: { n: 'Bursa', x: 161, y: 181 },
  canakkale: { n: 'Çanakkale', x: 22, y: 185 },
  balikesir: { n: 'Balıkesir', x: 99, y: 235 },
  izmir: { n: 'İzmir', x: 60, y: 358 },
  mugla: { n: 'Muğla', x: 124, y: 478 },
  denizli: { n: 'Denizli', x: 163, y: 422 },
  afyon: { n: 'Afyon', x: 239, y: 324 },
  antalya: { n: 'Antalya', x: 248, y: 510 },
  konya: { n: 'Konya', x: 341, y: 413 },
  mersin: { n: 'Mersin', x: 454, y: 520 },
  adana: { n: 'Adana', x: 491, y: 500 },
  gaziantep: { n: 'Gaziantep', x: 599, y: 493 },
  malatya: { n: 'Malatya', x: 648, y: 365 },
  diyarbakir: { n: 'Diyarbakır', x: 749, y: 409 },
  van: { n: 'Van', x: 915, y: 350 },
  erzurum: { n: 'Erzurum', x: 804, y: 210 },
  trabzon: { n: 'Trabzon', x: 723, y: 100 },
  samsun: { n: 'Samsun', x: 544, y: 71 },
  sivas: { n: 'Sivas', x: 580, y: 225 },
  kayseri: { n: 'Kayseri', x: 500, y: 327 },
  nevsehir: { n: 'Nevşehir', x: 458, y: 338 },
  ankara: { n: 'Ankara', x: 361, y: 207 },
  eskisehir: { n: 'Eskişehir', x: 238, y: 222 },
  bolu: { n: 'Bolu', x: 295, y: 127 },
};

// Rotalar: [a, b, uzunluk, renk]. Renk 'gray' ise rota herhangi tek renkle alınır.
// Aynı iki şehir arasında iki rota varsa çift rotadır (dbl ile birbirine bağlanır).
const RAW_ROUTES = [
  ['edirne', 'istanbul', 3, 'gray'], ['edirne', 'istanbul', 3, 'white'],
  ['istanbul', 'bursa', 3, 'green'], ['istanbul', 'bolu', 3, 'yellow'],
  ['canakkale', 'balikesir', 3, 'white'], ['canakkale', 'balikesir', 3, 'black'],
  ['canakkale', 'bursa', 4, 'purple'], ['balikesir', 'bursa', 2, 'orange'],
  ['balikesir', 'izmir', 4, 'red'], ['bursa', 'eskisehir', 3, 'gray'],
  ['bolu', 'eskisehir', 2, 'purple'], ['bolu', 'ankara', 3, 'black'],
  ['eskisehir', 'ankara', 3, 'blue'], ['eskisehir', 'afyon', 2, 'gray'],
  ['eskisehir', 'konya', 4, 'black'], ['afyon', 'izmir', 3, 'orange'],
  ['izmir', 'denizli', 3, 'yellow'], ['izmir', 'mugla', 4, 'black'],
  ['denizli', 'mugla', 3, 'white'], ['afyon', 'denizli', 2, 'orange'],
  ['afyon', 'konya', 3, 'gray'], ['denizli', 'antalya', 4, 'gray'],
  ['mugla', 'antalya', 3, 'purple'], ['afyon', 'antalya', 4, 'green'],
  ['konya', 'antalya', 4, 'red'], ['konya', 'antalya', 4, 'blue'],
  ['konya', 'nevsehir', 3, 'yellow'], ['konya', 'mersin', 5, 'black'],
  ['mersin', 'adana', 1, 'gray'], ['ankara', 'nevsehir', 4, 'white'],
  ['ankara', 'kayseri', 5, 'yellow'], ['nevsehir', 'kayseri', 2, 'gray'],
  ['nevsehir', 'kayseri', 2, 'orange'], ['ankara', 'sivas', 6, 'purple'],
  ['kayseri', 'sivas', 3, 'blue'], ['kayseri', 'adana', 5, 'gray'],
  ['sivas', 'malatya', 3, 'yellow'], ['sivas', 'samsun', 4, 'gray'],
  ['samsun', 'bolu', 4, 'green'], ['samsun', 'trabzon', 6, 'white'],
  ['sivas', 'erzurum', 5, 'black'], ['trabzon', 'erzurum', 4, 'red'],
  ['erzurum', 'van', 4, 'orange'], ['malatya', 'kayseri', 5, 'purple'],
  ['malatya', 'gaziantep', 3, 'green'], ['malatya', 'diyarbakir', 4, 'white'],
  ['diyarbakir', 'van', 4, 'yellow'], ['diyarbakir', 'van', 4, 'black'],
  ['diyarbakir', 'gaziantep', 3, 'black'], ['gaziantep', 'adana', 3, 'red'],
  ['adana', 'malatya', 4, 'blue'],
];

export const ROUTES = RAW_ROUTES.map(([a, b, len, color], id) => {
  const dbl = RAW_ROUTES.findIndex(([x, y], j) => j !== id && ((x === a && y === b) || (x === b && y === a)));
  return { id, a, b, len, color, dbl: dbl === -1 ? null : dbl };
});

// Bilet kartları: iki şehir ve puan. Puan, en kısa rota uzunluğundan hesaplanır (aşağıda).
const RAW_TICKETS = [
  ['istanbul', 'izmir'], ['edirne', 'antalya'], ['canakkale', 'ankara'], ['bursa', 'konya'],
  ['istanbul', 'adana'], ['balikesir', 'ankara'], ['izmir', 'ankara'], ['mugla', 'ankara'],
  ['denizli', 'sivas'], ['antalya', 'samsun'], ['konya', 'trabzon'], ['mersin', 'erzurum'],
  ['adana', 'van'], ['gaziantep', 'van'], ['malatya', 'trabzon'], ['diyarbakir', 'samsun'],
  ['afyon', 'kayseri'], ['eskisehir', 'erzurum'], ['bolu', 'antalya'], ['istanbul', 'van'],
  ['izmir', 'erzurum'], ['canakkale', 'gaziantep'], ['antalya', 'van'], ['konya', 'samsun'],
  ['edirne', 'diyarbakir'], ['mugla', 'kayseri'], ['istanbul', 'erzurum'], ['ankara', 'diyarbakir'],
  ['izmir', 'trabzon'], ['bursa', 'van'],
];

// En kısa yol (Dijkstra, rota uzunlukları toplamı). Haritada bağlantısı olmayan çift yoksa Infinity döner.
export function shortest(from, to, routes = ROUTES) {
  const dist = {};
  for (const c of Object.keys(CITIES)) dist[c] = Infinity;
  dist[from] = 0;
  const done = new Set();
  for (;;) {
    let u = null;
    for (const c of Object.keys(dist)) if (!done.has(c) && (u === null || dist[c] < dist[u])) u = c;
    if (u === null || dist[u] === Infinity) break;
    done.add(u);
    for (const r of routes) {
      const v = r.a === u ? r.b : r.b === u ? r.a : null;
      if (v && dist[u] + r.len < dist[v]) dist[v] = dist[u] + r.len;
    }
  }
  return dist[to];
}

export const TICKETS = RAW_TICKETS.map(([a, b], id) => {
  const d = shortest(a, b);
  return { id, a, b, pts: Math.min(22, Math.round(d * 0.8) + 2) };
});

const ticketView = (id) => ({ id, a: TICKETS[id].a, b: TICKETS[id].b, pts: TICKETS[id].pts });

// Kart destesi ve yardımcılar
export function buildDeck() {
  const d = [];
  for (const c of COLORS) for (let i = 0; i < 12; i++) d.push(c);
  for (let i = 0; i < 14; i++) d.push(LOCO);
  return d;
}

export function shuffle(arr, rnd = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const emptyHand = () => Object.fromEntries(CARD_TYPES.map((c) => [c, 0]));
const handCount = (h) => CARD_TYPES.reduce((s, c) => s + (h[c] || 0), 0);
const err = (error) => ({ error });

// Oyun durumundan bir kart çeker (deste boşsa atılanlar karıştırılıp yeni deste olur). Hiç kart yoksa null.
function takeDeck(s) {
  if (s.deck.length === 0) {
    if (s.discard.length === 0) return null;
    s.deck = shuffle(s.discard);
    s.discard = [];
  }
  return s.deck.pop();
}

// Açık 5 kartta üç lokomotif varsa tüm açık kartlar atılır ve yeni 5 kart açılır (kurallarda "herhangi bir anda").
function refreshFaceUp(s) {
  for (let guard = 0; guard < 1000; guard++) {
    if (s.faceUp.filter((c) => c === LOCO).length < 3) return;
    // Önce yeni kartlar çekilir, eski açık kartlar sonra atılır; böylece deste yeniden karıştığında atılanlar hemen geri gelmez.
    const old = s.faceUp.filter(Boolean);
    s.faceUp = s.faceUp.map(() => takeDeck(s));
    for (const c of old) s.discard.push(c);
  }
}

const cardsLeft = (s) => s.deck.length + s.discard.length + s.faceUp.filter(Boolean).length;

// Rota alınabiliyor mu? Gri rotada herhangi tek renk; renkli rotada rota rengi ve lokomotif kullanılır.
// Döner: [{ cards: {renk: adet}, label }]; boş dizi ise ödeme yapılamaz.
export function payOptions(route, hand) {
  const need = route.len;
  const locos = hand[LOCO] || 0;
  const opt = (c, k) => ({ cards: { ...(k ? { [c]: k } : {}), ...(need - k ? { [LOCO]: need - k } : {}) }, color: c, k });
  if (route.color !== 'gray') {
    const k = Math.min(hand[route.color] || 0, need);
    return need - k <= locos ? [opt(route.color, k)] : [];
  }
  // Gri rota: her renk için bir seçenek (en çok kartı olan önce); yalnızca lokomotifle de alınabilir.
  const colored = COLORS.map((c) => opt(c, Math.min(hand[c] || 0, need)))
    .filter((o) => o.k > 0 && need - o.k <= locos)
    .sort((x, y) => y.k - x.k);
  return locos >= need ? [...colored, opt(null, 0)] : colored;
}

// Bir oyuncunun rotası kendi trenleriyle bağlı mı (bilet tamamlama).
function adjacency(owned) {
  const adj = {};
  for (const r of owned) {
    (adj[r.a] ||= []).push(r.b);
    (adj[r.b] ||= []).push(r.a);
  }
  return adj;
}

export function connected(owned, from, to) {
  const adj = adjacency(owned);
  const seen = new Set([from]);
  const q = [from];
  while (q.length) {
    const u = q.shift();
    if (u === to) return true;
    for (const v of adj[u] || []) if (!seen.has(v)) { seen.add(v); q.push(v); }
  }
  return false;
}

// En uzun yol: oyuncunun kendi trenleriyle, her tren en fazla bir kez kullanılarak (döngü ve aynı şehre
// birden çok uğrama serbest). Kenar sayısı olarak ölçülür (rota uzunlukları değil; tren sayısı).
export function longestTrail(owned) {
  if (owned.length === 0) return 0;
  const adj = {};
  owned.forEach((r, e) => {
    (adj[r.a] ||= []).push([r.b, e]);
    (adj[r.b] ||= []).push([r.a, e]);
  });
  const used = new Array(owned.length).fill(false);
  const total = owned.length;
  let best = 0;
  // Üst sınır: v'den kullanılmamış kenarlarla ulaşılabilen kenar sayısı. Bu sınır en iyi sonucu geçemiyorsa dal kesilir.
  const reach = (v) => {
    const seenV = new Set([v]);
    const seenE = new Set();
    const q = [v];
    while (q.length) {
      const u = q.pop();
      for (const [w, e] of adj[u]) {
        if (used[e]) continue;
        seenE.add(e);
        if (!seenV.has(w)) { seenV.add(w); q.push(w); }
      }
    }
    return seenE.size;
  };
  // Sunucuyu uzun aramayla meşgul etmemek için arama bütçesi: çok yoğun bir kümede en iyi değer bu bütçede
  // bulunandır (uç durumda alt sınır). Gerçekçi oyun durumlarında bütçe dolmaz.
  let budget = 150000;
  const dfs = (v, len) => {
    if (len > best) best = len;
    if (best === total || --budget <= 0) return;
    if (len + reach(v) <= best) return;
    for (const [w, e] of adj[v]) {
      if (used[e]) continue;
      used[e] = true;
      dfs(w, len + 1);
      used[e] = false;
      if (best === total) return;
    }
  };
  for (const v of Object.keys(adj)) {
    dfs(v, 0);
    if (best === total) break;
  }
  return best;
}

export function routePoints(owner, seat) {
  return ROUTES.reduce((sum, r) => sum + (owner[r.id] === seat ? ROUTE_PTS[r.len] : 0), 0);
}

// Her oyuncunun son puanı: rota puanı + tamamlanan biletler - tamamlanamayanlar + en uzun yol bonusu.
function score(s) {
  const n = s.n;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const owned = ROUTES.filter((r) => s.owner[r.id] === i);
    const tickets = s.tickets[i].map((id) => {
      const t = TICKETS[id];
      const ok = connected(owned, t.a, t.b);
      return { ...ticketView(id), ok };
    });
    const ticketDelta = tickets.reduce((sum, t) => sum + (t.ok ? t.pts : -t.pts), 0);
    rows.push({
      seat: i,
      routes: routePoints(s.owner, i),
      tickets,
      completed: tickets.filter((t) => t.ok).length,
      ticketDelta,
      longest: longestTrail(owned),
      bonus: 0,
      total: 0,
    });
  }
  const active = rows.filter((r) => !s.gone[r.seat]);
  const best = Math.max(0, ...active.map((r) => r.longest));
  if (best > 0) for (const r of active) if (r.longest === best) r.bonus = LONGEST_BONUS;
  for (const r of rows) r.total = r.routes + r.ticketDelta + r.bonus;
  return rows;
}

// Oyun bitişi: sıralama puan, sonra tamamlanan bilet, sonra en uzun yol bonusu ile yapılır. Hepsi eşitse
// (kalan tüm ödüller) paylaşılır. Masadan ayrılanlar en sona gider.
function finish(s) {
  const rows = score(s);
  const ranking = [...rows].sort((a, b) => (Number(!!s.gone[a.seat]) - Number(!!s.gone[b.seat]))
    || (b.total - a.total) || (b.completed - a.completed) || (b.bonus - a.bonus) || (a.seat - b.seat))
    .map((r) => r.seat);
  const top = rows.filter((r) => !s.gone[r.seat] && r.total === rows[ranking[0]].total
    && r.completed === rows[ranking[0]].completed && r.bonus === rows[ranking[0]].bonus).map((r) => r.seat);
  const text = top.length === 0 ? 'Oyuncular masadan ayrıldığı için oyun bitti.'
    : top.length > 1 ? `Berabere! Oyuncu ${top.map((i) => i + 1).join(' ve ')} birinci.`
      : `Oyuncu ${top[0] + 1} kazandı! (${rows[top[0]].total} puan)`;
  return { ...s, phase: 'over', offer: null, endLeft: null, drawn: 0, note: text, over: { ranking, text, rows } };
}

const activeCount = (s) => s.gone.filter((x) => !x).length;

function nextActive(s, p) {
  for (let k = 1; k <= s.n; k++) {
    const q = (p + k) % s.n;
    if (!s.gone[q]) return q;
  }
  return -1;
}

// Bir oyuncunun yapabileceği bir hamle var mı? (kart çekme, bilet çekme ya da alınabilir rota)
function canAct(s, seat) {
  if (cardsLeft(s) > 0 || s.tdeck.length > 0) return true;
  return ROUTES.some((r) => s.owner[r.id] === -1 && !doubleBlocked(s, seat, r) && s.trains[seat] >= r.len
    && payOptions(r, s.hands[seat]).length > 0);
}

// Çift rota kuralı: 2-3 oyuncuda çiftin diğeri alınmışsa kapalıdır; 4-5 oyuncuda aynı oyuncu ikisini alamaz.
function doubleBlocked(s, seat, r) {
  if (r.dbl == null) return false;
  const so = s.owner[r.dbl];
  return s.n <= 3 ? so !== -1 : so === seat;
}

// Tur sonu: vagonu 2 ya da az kalan oyuncu tetikler; herkes (tetikleyen dahil) bir son tur oynar.
function endTurn(s) {
  const p = s.turn;
  s.drawn = 0;
  s.offer = null;
  if (s.endLeft != null) {
    s.endLeft -= 1;
    if (s.endLeft <= 0) return finish(s);
  } else if (s.trains[p] <= 2) {
    s.endLeft = activeCount(s);
  }
  const nxt = nextActive(s, p);
  if (nxt === -1) return finish(s);
  if (!canAct(s, nxt)) return finish(s);
  s.turn = nxt;
  s.note = `Oyuncu ${nxt + 1} sırada.`;
  return s;
}

// Başlangıç: 45 vagon, 4 tren kartı, 5 açık kart (lokomotif kuralıyla), her oyuncuya 4 bilet teklifi.
export function newGame(n, rnd = Math.random) {
  const deck = shuffle(buildDeck(), rnd);
  const s = {
    phase: 'tkinit',
    n,
    deck,
    discard: [],
    faceUp: [],
    hands: Array.from({ length: n }, () => emptyHand()),
    trains: Array(n).fill(TRAINS),
    owner: ROUTES.map(() => -1),
    tickets: Array.from({ length: n }, () => []),
    tdeck: shuffle(TICKETS.map((t) => t.id), rnd),
    initOffer: [],
    offer: null,
    turn: -1,
    drawn: 0,
    endLeft: null,
    gone: Array(n).fill(false),
    over: null,
    note: 'Biletlerini seç: en az 2 tut.',
  };
  for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) s.hands[i][takeDeck(s)] += 1;
  s.faceUp = Array.from({ length: 5 }, () => takeDeck(s));
  refreshFaceUp(s);
  s.initOffer = Array.from({ length: n }, () => s.tdeck.splice(0, INIT_DEAL));
  return s;
}

// Bilet tutma: başlangıçta en az 2, tur içinde çekilenlerden en az 1. Kullanılmayanlar destenin altına.
function keepTickets(s, idx, keep, offerIds, min) {
  if (!Array.isArray(keep)) return err('Geçersiz seçim.');
  const ids = [...new Set(keep)];
  if (ids.length !== keep.length || !ids.every((x) => offerIds.includes(x))) return err('Bu biletler teklifte yok.');
  if (ids.length < min) return err(`En az ${min} bilet tutmalısın.`);
  s.tickets[idx].push(...ids);
  s.tdeck.push(...shuffle(offerIds.filter((x) => !ids.includes(x))));
  return null;
}

function startPlay(s) {
  s.phase = 'play';
  s.turn = Math.floor(Math.random() * s.n);
  s.note = `Oyuncu ${s.turn + 1} başlıyor.`;
}

function drawCard(s, idx, slot) {
  let card;
  if (slot === 'deck') {
    card = takeDeck(s);
    if (!card) return err('Destede kart kalmadı.');
  } else {
    if (!Number.isInteger(slot) || slot < 0 || slot > 4) return err('Geçersiz kart.');
    card = s.faceUp[slot];
    if (!card) return err('Bu açık kart yok.');
    if (card === LOCO && s.drawn > 0) return err('Açık lokomotif yalnızca tur başında, tek kart olarak alınabilir.');
    s.faceUp[slot] = takeDeck(s);
    refreshFaceUp(s);
  }
  s.hands[idx][card] += 1;
  s.drawn = card === LOCO && slot !== 'deck' ? 2 : s.drawn + 1;
  // İkinci kart çekilemiyorsa (yalnızca açık lokomotif kaldı ya da hiç kart yok) tur kendiliğinden biter.
  const canSecond = s.deck.length + s.discard.length > 0 || s.faceUp.some((c) => c && c !== LOCO);
  if (s.drawn >= 2 || !canSecond) return endTurn(s);
  return s;
}

function claimRoute(s, idx, routeId, cards) {
  if (s.drawn !== 0) return err('Kart çektikten sonra rota alamazsın.');
  const r = ROUTES[routeId];
  if (!r) return err('Geçersiz rota.');
  if (s.owner[r.id] !== -1) return err('Bu rota zaten alınmış.');
  if (doubleBlocked(s, idx, r)) {
    return err(s.n <= 3 ? 'Çift rotanın diğeri alındı; bu masada yalnızca bir hat alınabilir.' : 'Aynı çift rotanın ikisini birden alamazsın.');
  }
  if (s.trains[idx] < r.len) return err('Yeterli vagonun yok.');
  if (!cards || typeof cards !== 'object') return err('Kart seçimi gerekli.');
  const pay = {};
  for (const k of Object.keys(cards)) {
    const v = cards[k];
    if (!CARD_TYPES.includes(k) || !Number.isInteger(v) || v < 0) return err('Geçersiz kart seçimi.');
    if (v > 0) pay[k] = v;
  }
  const total = Object.values(pay).reduce((x, y) => x + y, 0);
  if (total !== r.len) return err(`Bu rota ${r.len} kartla alınır.`);
  const hand = s.hands[idx];
  for (const k of Object.keys(pay)) if (pay[k] > (hand[k] || 0)) return err('Elinde yeterli kart yok.');
  const colors = Object.keys(pay).filter((k) => k !== LOCO);
  if (r.color === 'gray') {
    if (colors.length > 1) return err('Gri rota tek renk kartlarla (ve lokomotiflerle) alınır.');
  } else if (colors.some((k) => k !== r.color)) {
    return err('Kartların rengi rotanın rengiyle uyuşmuyor.');
  }
  for (const k of Object.keys(pay)) {
    hand[k] -= pay[k];
    for (let i = 0; i < pay[k]; i++) s.discard.push(k);
  }
  s.owner[r.id] = idx;
  s.trains[idx] -= r.len;
  return endTurn(s);
}

// Sıra sahibinin hamlesini uygular. Eylemler: tkdraw {slot: 0-4|'deck'}, tkclaim {route, cards},
// tktickets, tkkeep {keep: [bilet id]}. Hatalı hamlede durum değişmez ve {error} döner.
export function act(g, idx, action) {
  if (!g || g.over) return err('Oyun bitti.');
  if (!Number.isInteger(idx) || idx < 0 || idx >= g.n || g.gone[idx]) return err('Oyunda değilsiniz.');
  const s = structuredClone(g);
  if (s.phase === 'tkinit') {
    if (action?.type !== 'tkkeep') return err('Önce hedef biletlerini seç.');
    const offer = s.initOffer[idx];
    if (!offer) return err('Biletlerini zaten seçtin.');
    const e = keepTickets(s, idx, action.keep, offer, INIT_MIN_KEEP);
    if (e) return e;
    s.initOffer[idx] = null;
    if (s.initOffer.every((x) => x === null)) startPlay(s);
    return s;
  }
  if (action?.type === 'tkkeep') {
    if (!s.offer || s.offer.seat !== idx) return err('Seçilecek bilet yok.');
    const e = keepTickets(s, idx, action.keep, s.offer.ids, 1);
    if (e) return e;
    return endTurn(s);
  }
  if (s.offer) return err('Önce çektiğin biletlerden seçim yap.');
  if (idx !== s.turn) return err('Sıra sizde değil.');
  switch (action?.type) {
    case 'tkdraw': return drawCard(s, idx, action.slot);
    case 'tkclaim': return claimRoute(s, idx, action.route, action.cards);
    case 'tktickets': {
      if (s.drawn !== 0) return err('Kart çektikten sonra bilet çekemezsin.');
      if (s.tdeck.length === 0) return err('Bilet destesi bitti.');
      s.offer = { seat: idx, ids: s.tdeck.splice(0, DRAW_TICKETS) };
      return s;
    }
    default: return err('Bilinmeyen işlem.');
  }
}

// Masadan ayrılan oyuncu: bekleyen bilet teklifi otomatik tutulur, sırası atlanır. Tek kişi kalırsa oyun biter.
export function onLeave(g, seats, idx) {
  if (!g || g.over) return g;
  const s = structuredClone(g);
  s.gone[idx] = true;
  if (activeCount(s) <= 1) return finish(s);
  if (s.phase === 'tkinit') {
    if (s.initOffer[idx]) {
      const keep = s.initOffer[idx].slice(0, INIT_MIN_KEEP);
      keepTickets(s, idx, keep, s.initOffer[idx], INIT_MIN_KEEP);
      s.initOffer[idx] = null;
    }
    if (s.initOffer.every((x) => x === null)) startPlay(s);
    return s;
  }
  if (s.offer && s.offer.seat === idx) {
    keepTickets(s, idx, [s.offer.ids[0]], s.offer.ids, 1);
    return endTurn(s);
  }
  if (s.turn === idx) return endTurn(s);
  return s;
}

// Bir oyuncuya giden görünüm. Başkalarının kartları ve biletleri yalnızca sayı olarak gider;
// oyun bitince biletler açılır.
export function viewFor(g, me) {
  if (!g) return null;
  const mine = me >= 0 && me < g.n;
  return {
    phase: g.phase,
    n: g.n,
    turn: g.turn,
    drawn: g.drawn,
    note: g.note,
    faceUp: g.faceUp,
    deckLeft: g.deck.length,
    discardLeft: g.discard.length,
    ticketsLeft: g.tdeck.length,
    owner: g.owner,
    endLeft: g.endLeft,
    players: g.hands.map((h, i) => ({
      trains: g.trains[i],
      cards: handCount(h),
      tickets: g.tickets[i].length,
      gone: !!g.gone[i],
      pending: g.phase === 'tkinit' ? g.initOffer[i] !== null : g.offer?.seat === i,
      routes: routePoints(g.owner, i),
    })),
    hand: mine ? g.hands[me] : null,
    tickets: mine ? g.tickets[me].map(ticketView) : null,
    offer: mine && g.offer?.seat === me ? g.offer.ids.map(ticketView) : null,
    initOffer: mine && g.phase === 'tkinit' && g.initOffer[me] ? g.initOffer[me].map(ticketView) : null,
    over: g.over ? { ...g.over, rows: g.over.rows } : null,
  };
}
