// Cluedo (Türkçe uyarlama). Resmi kurallar: 6 şüpheli, 6 silah, 9 oda (toplam 21 kart). Zarfa gizlice 1 şüpheli +
// 1 silah + 1 oda konur; kalan 18 kart oyunculara dağıtılır. Oyuncu i, şüpheli i'yi (Kırmızı Hanım, Albay Hardal, ...)
// yönetir. Tur: zar at, hareket et (ya da odada kal), odada tahmin et (tahmin edilen şüpheli ve silah odaya çekilir),
// tahmin sırayla soldan çürütülür (yalnızca tahmin edene kart gösterilir), suçlama yap (doğruysa kazanır, yanlışsa elenir
// ama çürütmeye devam eder). Oyun sonunda zarf açılır.
//
// Tahta sadeleştirilmiştir: 9 kavşaktan oluşan bir halka koridor; her kavşağın kapısı bir odaya açılır. Oda bir
// hareket noktasıdır: içine girince hareket biter. Gizli geçitler: Mutfak<->Çalışma Odası, Salon<->Sera.
// Durum: g.pos.sus / g.pos.wpn düğüm numaralarıdır (0-8 kavşak, 9-17 oda: 9 + oda indeksi).
// Gizlilik: zarf ve oyuncuların elleri yalnızca viewFor'da kendi elinin görünümüne girer (oyun bitince zarf açılır).

export const SUSPECTS = ['Kırmızı Hanım', 'Albay Hardal', 'Beyaz Hanım', 'Bay Yeşil', 'Madam Tavus', 'Profesör Erik'];
export const WEAPONS = ['Şamdan', 'Hançer', 'Kurşun Boru', 'Tabanca', 'Halat', 'İngiliz Anahtarı'];
export const ROOMS = ['Mutfak', 'Balo Salonu', 'Sera', 'Yemek Odası', 'Salon', 'Bilardo Odası', 'Kütüphane', 'Çalışma Odası', 'Hol'];
export const RING = 9; // halka koridordaki kavşak sayısı; kavşak j'nin kapısı ROOMS[j]'ye açılır
export const ROOM0 = RING; // oda düğümü = ROOM0 + oda indeksi
export const START = [0, 2, 3, 5, 6, 8]; // şüpheli i'nin başlangıç kavşağı
export const PASSAGE = { 0: 7, 7: 0, 2: 4, 4: 2 }; // gizli geçitler (oda indeksi -> oda indeksi)
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;

// Kart kimlikleri: S0-S5 şüpheliler, W0-W5 silahlar, R0-R8 odalar.
const SUS_IDS = SUSPECTS.map((_, i) => `S${i}`);
const WPN_IDS = WEAPONS.map((_, i) => `W${i}`);
const ROOM_IDS = ROOMS.map((_, i) => `R${i}`);
const ALL_IDS = [...SUS_IDS, ...WPN_IDS, ...ROOM_IDS];

export const cardName = (id) => {
  const k = Number(id.slice(1));
  return id[0] === 'S' ? SUSPECTS[k] : id[0] === 'W' ? WEAPONS[k] : ROOMS[k];
};
export const nodeName = (n) => (n >= ROOM0 ? ROOMS[n - ROOM0] : `Koridor ${n + 1}`);
export const isRoomNode = (n) => n >= ROOM0;

const gone = (seats, i) => !!seats?.[i]?.left;
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const inRoom = (g, i) => g.pos.sus[i] >= ROOM0;
const sugCards = (s) => (s ? [`S${s.sus}`, `W${s.wpn}`, `R${s.rm}`] : []);
const nm = (seats, i) => seats?.[i]?.name || `Oyuncu ${i + 1}`;
const LOG_MAX = 60;
const log = (g, text) => { g.log.push(text); if (g.log.length > LOG_MAX) g.log.splice(0, g.log.length - LOG_MAX); };

function shuffle(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Oyun kurulumu: zarf, dağıtım (kalan 18 kart turla dağıtılır, 3-4 kişide eşitsiz olabilir), başlangıç konumları.
export function newGame(n, rnd = Math.random) {
  const env = {
    s: Math.floor(rnd() * SUSPECTS.length),
    w: Math.floor(rnd() * WEAPONS.length),
    r: Math.floor(rnd() * ROOMS.length),
  };
  const envIds = [`S${env.s}`, `W${env.w}`, `R${env.r}`];
  const deck = shuffle(ALL_IDS.filter((c) => !envIds.includes(c)), rnd);
  const hands = Array.from({ length: n }, () => []);
  deck.forEach((c, k) => hands[k % n].push(c));
  // Silahlar altı ayrı odaya rastgele yerleşir (klasik kurulum).
  const wRooms = shuffle([...Array(ROOMS.length).keys()], rnd).slice(0, WEAPONS.length);
  return {
    n,
    turn: 0,
    phase: 'roll', // roll | move | turn | refute | over
    dice: null,
    reach: [],
    pos: { sus: START.slice(), wpn: wRooms.map((r) => ROOM0 + r) },
    env,
    hands,
    out: Array.from({ length: n }, () => false), // yanlış suçlayıp elenenler (çürütmeye devam ederler)
    sugDone: false,
    sugg: null, // son tahmin (herkese açık): { by, sus, wpn, rm }
    reveal: null, // çürütme kartı: yalnızca tahmin edene { to, card, by }
    waitRef: null, // çürütmesi beklenen oyuncu
    rq: [], // çürütme sırası (tahmin edenin solundan)
    rqi: 0,
    over: null, // { winner: idx | null, env }
    log: ['Oyun başladı. Kırmızı Hanım\'ın sırası.'],
  };
}

// Şüpheli i'nin bu turda gidebileceği düğümler (zar toplamı kadar). Kavşaklarda ve geçişlerde diğer şüphelilerin
// bulunduğu kavşaklar engeldir; odalar engel değildir; odaya girince hareket biter; aynı odaya tur içinde iki kez girilmez.
export function reachable(g, mover, dice) {
  const start = g.pos.sus[mover];
  const blocked = new Set();
  g.pos.sus.forEach((p, k) => { if (k !== mover && p < ROOM0) blocked.add(p); });
  const out = new Set();
  const startRoom = start >= ROOM0 ? start - ROOM0 : null;
  const walk = (j, steps, seen) => {
    if (steps < 1) return;
    if (j !== startRoom) out.add(ROOM0 + j); // kapıdan odaya girmek bir adım
    for (const nb of [(j + 1) % RING, (j + RING - 1) % RING]) {
      if (seen.has(nb) || blocked.has(nb)) continue;
      out.add(nb);
      seen.add(nb);
      walk(nb, steps - 1, seen);
      seen.delete(nb);
    }
  };
  if (startRoom === null) {
    walk(start, dice, new Set([start]));
  } else if (dice >= 1 && !blocked.has(startRoom)) {
    out.add(startRoom); // odadan kapıya çıkmak bir adım
    walk(startRoom, dice - 1, new Set([startRoom]));
  }
  return [...out].sort((a, b) => a - b);
}

function nextActive(g, seats, from) {
  for (let k = 1; k <= g.n; k++) {
    const i = (from + k) % g.n;
    if (!g.out[i] && !gone(seats, i)) return i;
  }
  return null;
}

function finish(g) {
  g.over = { winner: null, env: { ...g.env } };
  g.phase = 'over';
  log(g, 'Kimse doğru suçlayamadı. Zarf açıldı.');
}

function endTurn(g, seats) {
  const nxt = nextActive(g, seats, g.turn);
  if (nxt === null) { finish(g); return; }
  g.turn = nxt;
  g.phase = 'roll';
  g.dice = null;
  g.reach = [];
  g.sugDone = false;
  g.reveal = null;
}

// Sırası gelen oyuncu ayrılmış ya da elenmişse turu devret (oyun takılmasın).
function fixTurn(g, seats) {
  if (g.over || g.phase === 'refute') return;
  if (gone(seats, g.turn) || g.out[g.turn]) endTurn(g, seats);
}

// Çürütme sırasını ilerletir: kartı olan (ayrılmamış) ilk oyuncuda durur; kimsede yoksa tahmin çürütülemez.
function advanceRefute(g, seats) {
  const cards = sugCards(g.sugg);
  while (g.rqi < g.rq.length) {
    const i = g.rq[g.rqi];
    if (!gone(seats, i) && g.hands[i].some((c) => cards.includes(c))) {
      g.phase = 'refute';
      g.waitRef = i;
      return;
    }
    g.rqi++;
  }
  g.phase = 'turn';
  g.waitRef = null;
  log(g, 'Tahmin çürütülemedi (kimse çürütemedi).');
  fixTurn(g, seats);
}

// Hamleyi uygular. Geçersizse { error }, geçerliyse yeni durum döner (girdi değişmez).
// a.type: clroll | clstay | clpassage | clmove (to) | clsuggest (sus, wpn) | clshow (card) | claccuse (sus, wpn, rm) | clend
export function act(g0, idx, a, seats = [], rnd = Math.random) {
  if (!g0 || g0.over) return { error: 'Oyun bitti.' };
  if (!int(idx, 0, g0.n - 1)) return { error: 'Oyunda değilsiniz.' };
  if (gone(seats, idx)) return { error: 'Oyunda değilsiniz.' };
  const g = structuredClone(g0);
  const who = nm(seats, idx);

  if (a.type === 'clshow') {
    if (g.phase !== 'refute' || g.waitRef !== idx) return { error: 'Şu an çürütme yapmanız gerekmiyor.' };
    const cards = sugCards(g.sugg);
    if (!cards.includes(a.card) || !g.hands[idx].includes(a.card)) return { error: 'Geçersiz kart.' };
    g.reveal = { to: g.sugg.by, card: a.card, by: idx };
    g.phase = 'turn';
    g.waitRef = null;
    log(g, 'Tahmin çürütüldü.');
    fixTurn(g, seats); // tahmin eden bu arada ayrılmış olabilir
    return { state: g };
  }

  if (g.phase === 'refute') return { error: 'Çürütme bekleniyor.' };
  if (g.out[idx]) return { error: 'Elendiniz; yalnızca çürütme yapabilirsiniz.' };
  if (g.turn !== idx) return { error: 'Sıra sizde değil.' };

  switch (a.type) {
    case 'clroll': {
      if (g.phase !== 'roll') return { error: 'Şu an zar atılamaz.' };
      const d1 = 1 + Math.floor(rnd() * 6), d2 = 1 + Math.floor(rnd() * 6);
      g.dice = [d1, d2];
      g.reach = reachable(g, idx, d1 + d2);
      log(g, `${who} ${d1} + ${d2} attı.`);
      if (g.reach.length) g.phase = 'move';
      else { g.phase = 'turn'; log(g, `${who} hareket edemedi.`); }
      return { state: g };
    }
    case 'clstay': {
      if (g.phase !== 'roll' || !inRoom(g, idx)) return { error: 'Yalnızca odadayken yerinizde kalabilirsiniz.' };
      g.phase = 'turn';
      return { state: g };
    }
    case 'clpassage': {
      if (g.phase !== 'roll' || !inRoom(g, idx)) return { error: 'Gizli geçit için odada olmalısınız.' };
      const r = g.pos.sus[idx] - ROOM0;
      if (PASSAGE[r] === undefined) return { error: 'Bu odada gizli geçit yok.' };
      g.pos.sus[idx] = ROOM0 + PASSAGE[r];
      g.phase = 'turn';
      log(g, `${who} gizli geçitten ${ROOMS[PASSAGE[r]]} odasına geçti.`);
      return { state: g };
    }
    case 'clmove': {
      if (g.phase !== 'move') return { error: 'Şu an hareket edilemez.' };
      if (!g.reach.includes(a.to)) return { error: 'Oraya bu zarla gidilemez.' };
      g.pos.sus[idx] = a.to;
      g.reach = [];
      g.phase = 'turn';
      log(g, `${who} ${nodeName(a.to)} konumuna gitti.`);
      return { state: g };
    }
    case 'clsuggest': {
      if (g.phase !== 'turn' || g.sugDone) return { error: 'Bu tur tahmin yapılamaz.' };
      if (!inRoom(g, idx)) return { error: 'Tahmin için bir odada olmalısınız.' };
      if (!int(a.sus, 0, SUSPECTS.length - 1) || !int(a.wpn, 0, WEAPONS.length - 1)) return { error: 'Geçersiz tahmin.' };
      const rm = g.pos.sus[idx] - ROOM0;
      const s = { by: idx, sus: a.sus, wpn: a.wpn, rm };
      g.sugg = s;
      g.sugDone = true;
      g.reveal = null;
      g.pos.sus[a.sus] = ROOM0 + rm;
      g.pos.wpn[a.wpn] = ROOM0 + rm;
      log(g, `${who} tahmin etti: ${SUSPECTS[a.sus]}, ${WEAPONS[a.wpn]}, ${ROOMS[rm]}.`);
      // Çürütme sırası: tahmin edenin solundaki oyuncudan başlayıp saat yönünde; ayrılmışlar atlanır.
      g.rq = [];
      for (let k = 1; k < g.n; k++) {
        const i = (idx + k) % g.n;
        if (!gone(seats, i)) g.rq.push(i);
      }
      g.rqi = 0;
      advanceRefute(g, seats);
      return { state: g };
    }
    case 'claccuse': {
      if (!(g.phase === 'roll' || g.phase === 'turn') || !inRoom(g, idx)) return { error: 'Suçlama için bir odada olmalısınız.' };
      if (!int(a.sus, 0, SUSPECTS.length - 1) || !int(a.wpn, 0, WEAPONS.length - 1) || !int(a.rm, 0, ROOMS.length - 1)) return { error: 'Geçersiz suçlama.' };
      const ok = a.sus === g.env.s && a.wpn === g.env.w && a.rm === g.env.r;
      log(g, `${who} suçladı: ${SUSPECTS[a.sus]}, ${WEAPONS[a.wpn]}, ${ROOMS[a.rm]} — ${ok ? 'DOĞRU!' : 'yanlış, elendi.'}`);
      if (ok) {
        g.over = { winner: idx, env: { ...g.env } };
        g.phase = 'over';
        return { state: g };
      }
      g.out[idx] = true;
      endTurn(g, seats);
      return { state: g };
    }
    case 'clend': {
      if (g.phase !== 'turn') return { error: 'Önce zar atın.' };
      endTurn(g, seats);
      return { state: g };
    }
    default:
      return { error: 'Bilinmeyen işlem.' };
  }
}

// Masadan ayrılan ya da kicklenen oyuncu: çürütmesi bekleniyorsa sıradakine geçilir, sırası ise tur devredilir.
export function onLeave(g0, seats, idx) {
  if (!g0 || g0.over) return g0;
  const g = structuredClone(g0);
  if (g.phase === 'refute' && g.rq[g.rqi] === idx) {
    g.rqi++;
    advanceRefute(g, seats);
  }
  // Hiç aktif oyuncu kalmadıysa endTurn bitirir (fixTurn içinde).
  fixTurn(g, seats);
  return g;
}

// Oyuncuya giden görünüm: zarf ve diğerlerinin eli hiçbir zaman gönderilmez (oyun bitince zarf açılır).
export function viewFor(g, idx) {
  if (!g) return null;
  const mine = int(idx, 0, g.n - 1) ? g.hands[idx] : [];
  return {
    turn: g.turn,
    phase: g.phase,
    dice: g.dice,
    pos: { sus: [...g.pos.sus], wpn: [...g.pos.wpn] },
    reach: g.phase === 'move' && idx === g.turn ? g.reach : [],
    out: [...g.out],
    sugDone: g.sugDone,
    sugg: g.sugg,
    refuting: g.phase === 'refute',
    myRefute: g.phase === 'refute' && idx === g.waitRef,
    hand: [...mine],
    reveal: g.reveal && g.reveal.to === idx ? { card: g.reveal.card, by: g.reveal.by } : null,
    log: g.log.slice(-40),
    over: g.over,
  };
}
