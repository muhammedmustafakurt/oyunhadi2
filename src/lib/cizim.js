// Çiz Bakalım (Pictionary): sırası gelen oyuncu gizli kelimeyi parmağıyla çizer, diğerleri yazarak tahmin eder.
// Kelime yalnızca çizene (ve bilenlere) gider; tahminler sunucuda denetlenir. Çizim, çizgi parçaları olarak
// (0-1000 ızgarasında tam sayı noktalar) biriktirilir ve herkesin ekranına yansır.
export const TURN_MS = 80 * 1000;
export const REVEAL_MS = 6 * 1000;
export const CORRECT_BASE = 100; // doğru tahmin: 100 + kalan süreye göre en çok 100
export const DRAWER_GAIN = 40; // çizen, her bilen için bu kadar puan alır
export const GRID = 1000;
const MAX_NUMS = 12000; // bir turdaki toplam nokta sayısı üst sınırı (x ve y ayrı sayılır)
const MAX_PIECE = 600;
const MAX_PIECES = 30;
const COLORS = 13; // 12 renk + silgi (12)
const SIZES = 4;

export const WORDS = [
  'kedi', 'köpek', 'balık', 'kuş', 'tavşan', 'fil', 'zürafa', 'kaplumbağa', 'penguen', 'kelebek', 'örümcek', 'yılan',
  'timsah', 'aslan', 'maymun', 'ördek', 'inek', 'at', 'arı', 'yengeç',
  'ev', 'ağaç', 'çiçek', 'güneş', 'ay', 'yıldız', 'bulut', 'yağmur', 'kardan adam', 'gökkuşağı', 'dağ', 'ada', 'şelale', 'volkan',
  'araba', 'uçak', 'gemi', 'bisiklet', 'tren', 'otobüs', 'roket', 'helikopter', 'balon', 'tekne',
  'elma', 'muz', 'karpuz', 'çilek', 'üzüm', 'havuç', 'pizza', 'hamburger', 'dondurma', 'pasta', 'simit', 'çay', 'kahve', 'yumurta', 'peynir', 'ekmek',
  'telefon', 'bilgisayar', 'televizyon', 'saat', 'gözlük', 'şemsiye', 'anahtar', 'kilit', 'makas', 'çanta', 'ayakkabı', 'şapka', 'tarak', 'kitap', 'kalem',
  'gitar', 'piyano', 'davul', 'mikrofon', 'keman',
  'kral', 'prenses', 'korsan', 'hayalet', 'robot', 'astronot', 'palyaço', 'sihirbaz', 'ejderha',
  'diş', 'göz', 'kulak', 'el', 'ayak', 'kalp', 'burun',
  'lamba', 'sandalye', 'masa', 'yatak', 'kapı', 'pencere', 'merdiven', 'köprü', 'kale', 'çadır', 'fener', 'buzdolabı',
  'futbol topu', 'kaydırak', 'salıncak', 'uçurtma', 'kar tanesi', 'ateş', 'damla', 'çekiç', 'testere', 'bayrak',
  'Galata Kulesi', 'Kız Kulesi', 'Eyfel Kulesi', 'piramit', 'camii', 'çınar ağacı',
  'uyumak', 'yüzmek', 'koşmak', 'dans etmek', 'ağlamak', 'gülmek',
];

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Türkçe harf farklarını (ç/c, ı/i…) yok sayarak karşılaştırılacak biçim.
const MAP = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };
const norm = (s) => String(s ?? '').toLocaleLowerCase('tr').replace(/[çğıöşüâîû]/g, (m) => MAP[m]).replace(/[^a-z0-9]/g, '');

// İki yazım arasında en çok bir harf fark var mı ("çok yakın" ipucu için).
function near(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

const active = (seats) => seats.filter((s) => !s.left).length;
const guessers = (g, seats) => seats.map((_, i) => i).filter((i) => !seats[i].left && i !== g.drawer);
const letterPos = (w) => [...w].map((ch, i) => (ch === ' ' ? -1 : i)).filter((i) => i >= 0);

function setWord(g) {
  const word = g.deck[g.deckPos % g.deck.length];
  return { ...g, word, deckPos: g.deckPos + 1, hintOrder: shuffle(letterPos(WORDS[word])) };
}

function startTurn(g0, seats, now) {
  const n = g0.order.length;
  let drawer = -1;
  for (let k = 0; k < n; k++) {
    const s = g0.order[(g0.turnNo + k) % n];
    if (!seats[s].left) { drawer = s; break; }
  }
  const g = setWord({ ...g0, drawer, phase: 'draw', endsAt: now + TURN_MS, strokes: [], got: [], swapped: false, last: null });
  const chat = [...g.chat, { k: 'sys', t: `${seats[drawer].name} çiziyor.` }].slice(-40);
  return { ...g, chat, note: `${seats[drawer].name} çiziyor. Kelimeyi tahmin edin!` };
}

export function newGame(seats, now = Date.now()) {
  const n = seats.length;
  const g = {
    order: shuffle([...Array(n).keys()]),
    total: n <= 4 ? n * 2 : n,
    extra: 0,
    turnNo: 0,
    scores: Array(n).fill(0),
    deck: shuffle(WORDS.map((_, i) => i)),
    deckPos: 0,
    chat: [],
    drawer: -1,
    phase: 'draw',
    endsAt: 0,
    strokes: [],
    got: [],
    swapped: false,
    hintOrder: [],
    last: null,
    word: 0,
    note: '',
    over: null,
  };
  return startTurn(g, seats, now);
}

// Birinci sırada birden fazla kişi kaldıysa onların koltukları (masada olanlar arasından).
const leaders = (g, seats) => {
  const act = seats.map((_, i) => i).filter((i) => !seats[i].left);
  const best = Math.max(...act.map((i) => g.scores[i]));
  return act.filter((i) => g.scores[i] === best);
};
const MAX_EXTRA = 5;

function finish(g, seats) {
  const ranking = seats.map((_, i) => i).sort((a, b) => (Number(seats[a].left) - Number(seats[b].left)) || (g.scores[b] - g.scores[a]));
  const best = g.scores[ranking[0]];
  const tops = ranking.filter((i) => g.scores[i] === best && !seats[i].left);
  const text = tops.length === 0 ? 'Oyuncular masadan ayrıldığı için oyun bitti.' : tops.length > 1 ? `Berabere! ${tops.map((i) => seats[i].name).join(' ve ')} ${best} puanla birinci.` : `${seats[ranking[0]].name} kazandı! (${best} puan)`;
  return { ...g, phase: 'over', endsAt: 0, over: { ranking, text }, note: text };
}

// Turu kapatır, kelimeyi herkese açar.
function endRound(g, seats, now, why) {
  const word = WORDS[g.word];
  const text = g.got.length === 0 ? `${why || 'Süre doldu'}. Kelime: ${word}` : `Kelime: ${word}`;
  return {
    ...g,
    phase: 'reveal',
    endsAt: now + REVEAL_MS,
    last: { word, gains: g.got.map((x) => ({ seat: x.seat, pts: x.pts })), drawerGain: g.got.length * DRAWER_GAIN },
    chat: [...g.chat, { k: 'sys', t: text }].slice(-40),
    note: text,
  };
}

function nextTurn(g, seats, now) {
  const n = { ...g, turnNo: g.turnNo + 1 };
  if (active(seats) < 2) return finish(n, seats);
  if (n.turnNo >= n.total) {
    // Beraberlik: fark çıkana kadar (en fazla 5) uzatma turu çizilir.
    if (leaders(n, seats).length > 1 && (n.extra || 0) < MAX_EXTRA) return startTurn({ ...n, total: n.total + 1, extra: (n.extra || 0) + 1 }, seats, now);
    return finish(n, seats);
  }
  return startTurn(n, seats, now);
}

// Süresi dolan çizimi ya da gösterimi kapatır; henüz dolmadıysa durum değişmez.
export function timeout(g, seats, now = Date.now()) {
  if (g.over || now < g.endsAt) return g;
  return g.phase === 'draw' ? endRound(g, seats, now, 'Süre doldu') : nextTurn(g, seats, now);
}

export function guess(g, seats, idx, text, now = Date.now()) {
  if (g.over || g.phase !== 'draw') return { error: 'Şu an tahmin edilemez.' };
  if (idx === g.drawer) return { error: 'Çizen tahmin edemez.' };
  if (!seats[idx] || seats[idx].left) return { error: 'Bu oyuncu tahmin edemez.' };
  if (g.got.some((x) => x.seat === idx)) return { error: 'Kelimeyi zaten buldun.' };
  const t = String(text ?? '').replace(/[<>]/g, '').trim().slice(0, 40);
  if (!t) return { error: 'Bir tahmin yazın.' };
  const a = norm(t);
  const w = norm(WORDS[g.word]);
  if (a && a === w) {
    const pts = CORRECT_BASE + Math.round(100 * Math.max(0, g.endsAt - now) / TURN_MS);
    const scores = [...g.scores];
    scores[idx] += pts;
    scores[g.drawer] += DRAWER_GAIN;
    const n = { ...g, scores, got: [...g.got, { seat: idx, pts }], chat: [...g.chat, { k: 'ok', seat: idx, pts }].slice(-40) };
    return guessers(n, seats).every((i) => n.got.some((x) => x.seat === i)) ? endRound(n, seats, now, 'Herkes buldu') : n;
  }
  const chat = [...g.chat, { k: 'g', seat: idx, t }];
  if (w.length >= 4 && near(a, w)) chat.push({ k: 'close', seat: idx, to: idx });
  return { ...g, chat: chat.slice(-40) };
}

// Çizen çizime başlamadan kelimeyi bir kez değiştirebilir.
export function swap(g, idx) {
  if (g.over || g.phase !== 'draw' || idx !== g.drawer) return { error: 'Bunu yalnızca çizen yapabilir.' };
  if (g.swapped) return { error: 'Kelimeyi zaten değiştirdin.' };
  if (g.strokes.length || g.got.length) return { error: 'Kelimeyi çizmeye başlamadan değiştirebilirsin.' };
  return { ...setWord(g), swapped: true };
}

const int = (v) => Math.max(0, Math.min(GRID, Math.round(Number(v))));
const count = (strokes) => strokes.reduce((n, s) => n + s.p.length, 0);

// Çizenden gelen çizgi parçalarını ekler. Bir çizgi, kimliği (id) ve kaçıncı sayıdan devam ettiği (start) ile
// tanımlanır; böylece aynı parça iki kez gelse bile çizgi bozulmaz.
export function draw(g, idx, pieces) {
  if (g.over || g.phase !== 'draw' || idx !== g.drawer) return { error: 'Şu an çizemezsin.' };
  if (!Array.isArray(pieces) || pieces.length === 0 || pieces.length > MAX_PIECES) return { error: 'Geçersiz çizim.' };
  const strokes = g.strokes.map((s) => ({ ...s, p: [...s.p] }));
  let total = count(strokes);
  for (const pc of pieces) {
    if (!pc || !Number.isInteger(pc.id) || !Number.isInteger(pc.start) || pc.start < 0) return { error: 'Geçersiz çizim.' };
    if (!Number.isInteger(pc.c) || pc.c < 0 || pc.c >= COLORS || !Number.isInteger(pc.w) || pc.w < 0 || pc.w >= SIZES) return { error: 'Geçersiz çizim.' };
    if (!Array.isArray(pc.p) || pc.p.length === 0 || pc.p.length > MAX_PIECE || pc.p.length % 2) return { error: 'Geçersiz çizim.' };
    // Koordinatlar sonlu sayı ve başlangıç (koordinat sayısı) çifttir; aksi halde nokta çiftleri kayar.
    if (pc.start % 2 || !pc.p.every((v) => Number.isFinite(v))) return { error: 'Geçersiz çizim.' };
    let s = strokes.find((x) => x.id === pc.id);
    if (!s) {
      if (pc.start !== 0) continue; // başı kaybolmuş parça: istemci eşitlenince yeniden gönderir
      s = { id: pc.id, c: pc.c, w: pc.w, p: [] };
      strokes.push(s);
    }
    if (pc.start > s.p.length) continue;
    const fresh = pc.p.slice(s.p.length - pc.start).map(int);
    if (total + fresh.length > MAX_NUMS) return { error: 'Tuval doldu, silip yeniden çizin.' };
    s.p.push(...fresh);
    total += fresh.length;
  }
  return { ...g, strokes };
}

// Geri al / temizle: çizim yalnızca ilk "keep" çizgiye indirilir.
export function keep(g, idx, n) {
  if (g.over || g.phase !== 'draw' || idx !== g.drawer) return { error: 'Şu an çizemezsin.' };
  if (!Number.isInteger(n) || n < 0) return { error: 'Geçersiz işlem.' };
  return n >= g.strokes.length ? g : { ...g, strokes: g.strokes.slice(0, n) };
}

// Oyuncu masadan ayrıldı (seats'te left işaretlendikten sonra çağrılır).
export function onLeave(g, seats, idx, now = Date.now()) {
  if (g.over) return g;
  if (active(seats) < 2) return finish(g, seats);
  if (g.phase !== 'draw') return g;
  if (idx === g.drawer) return endRound(g, seats, now, 'Çizen ayrıldı');
  const rest = guessers(g, seats);
  return rest.length === 0 || rest.every((i) => g.got.some((x) => x.seat === i)) ? endRound(g, seats, now, 'Herkes buldu') : g;
}

// Bir oyuncuya giden görünüm: kelime yalnızca çizene, bilenlere ve tur bitince herkese açılır.
export function viewFor(g, idx, now = Date.now()) {
  if (!g) return null;
  const word = WORDS[g.word];
  const knows = g.phase !== 'draw' || idx === g.drawer || g.got.some((x) => x.seat === idx);
  const leftMs = g.phase === 'over' ? 0 : Math.max(0, g.endsAt - now);
  let hint = null;
  if (!knows) {
    // Süre ilerledikçe birkaç harf açılır.
    const used = 1 - leftMs / TURN_MS;
    const reveal = Math.min(Math.floor(g.hintOrder.length / 2), used >= 0.8 ? 3 : used >= 0.6 ? 2 : used >= 0.35 ? 1 : 0);
    const shown = new Set(g.hintOrder.slice(0, reveal));
    hint = [...word].map((ch, i) => (ch === ' ' ? ' ' : shown.has(i) ? ch : '_'));
  }
  return {
    phase: g.phase,
    drawer: g.drawer,
    turnNo: g.turnNo,
    total: g.total,
    extra: g.extra || 0,
    scores: g.scores,
    got: g.got.map((x) => x.seat),
    leftMs,
    word: knows ? word : null,
    hint,
    swapped: g.swapped,
    strokes: g.strokes,
    chat: g.chat.filter((c) => c.k !== 'close' || c.to === idx),
    last: g.last,
    note: g.note,
    over: g.over,
  };
}
