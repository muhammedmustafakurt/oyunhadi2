// Futbolcuyu Bul: bir oyuncu (tutan) bir futbolcu seçer ve adını oyuna yazar (yalnızca sunucuda tutulur, tutan dışında
// kimseye gönderilmez). Diğer oyuncular sırayla sözlü soru sorar, tutan yalnızca EVET / HAYIR der. Sırası gelen soran
// "soruyu sordum" diyebilir ya da adı yazarak tahmin eder; tahmini oyun karşılaştırır (büyük/küçük harf, boşluk,
// noktalama ve Türkçe karakter farkı sayılmaz; soyadı tek başına da kabul edilir). Doğru tahmin eden turu kazanır (3 puan).
export const WIN_POINTS = 3;
const LOG_MAX = 120;
const NAME_MAX = 60;

// Karşılaştırma için ad: küçük harf (Türkçe), aksan ve Türkçe karakterler ASCII'ye, harf/rakam dışı her şey silinir.
const FOLD = { 'ı': 'i', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ç': 'c', 'ø': 'o', 'ł': 'l', 'đ': 'd', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe' };
export const norm = (s) =>
  String(s ?? '').toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[ışğüöçøłđßæœ]/g, (c) => FOLD[c]).replace(/[^a-z0-9]/g, '');
const cleanName = (s) => String(s ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
// Tahmin doğru mu: tam ad ya da (en az 3 harfli) soyadı eşleşirse doğru.
export function isMatch(secret, guess) {
  const g = norm(guess);
  if (g.length < 2) return false;
  if (g === norm(secret)) return true;
  const parts = String(secret).trim().split(/[\s]+/).map(norm).filter(Boolean);
  const last = parts[parts.length - 1];
  return parts.length > 1 && !!last && last.length >= 3 && g === last;
}

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const activeOf = (seats) => seats.map((s, i) => (s.left ? -1 : i)).filter((i) => i >= 0);

// Yeni tur: tutan 'holder', geri kalan (ayrılmamış) oyuncular rastgele sırayla sorar.
function startRound(prev, seats, holder, note = '') {
  const act = activeOf(seats);
  const order = shuffle(act.filter((i) => i !== holder));
  return {
    round: (prev?.round ?? 0) + 1,
    holder,
    order,
    turn: order[0],
    secret: null, // futbolcunun adı (yalnızca sunucuda; viewFor yalnızca tutana verir)
    phase: 'hold', // hold: tutan adı yazmalı | ask | answer | over
    log: [], // { by, a: 'yes' | 'no' } sırayla cevaplanmış sorular
    guessLog: [], // { by, ok, w } (w: söylenen ad)
    questions: 0,
    guesses: 0,
    yes: 0,
    no: 0,
    scores: prev?.scores ?? Array(seats.length).fill(0),
    wins: prev?.wins ?? Array(seats.length).fill(0),
    history: prev?.history ?? [],
    note,
    over: null, // { kind: 'win' | 'cancel' | 'end', winner, text }
  };
}

export function newGame(seats) {
  const act = activeOf(seats);
  const holder = act[Math.floor(Math.random() * act.length)];
  return startRound(null, seats, holder);
}

// Sıra, sonraki ayrılmamış soranda; turun sonuna gelince başa döner.
function advance(g, seats) {
  const order = g.order;
  const at = order.indexOf(g.turn);
  for (let k = 1; k <= order.length; k++) {
    const c = order[(at + k) % order.length];
    if (!seats[c]?.left) return c;
  }
  return g.turn;
}

const finishRound = (g, seats, winner, word) => {
  const scores = [...g.scores];
  const wins = [...g.wins];
  scores[winner] = (scores[winner] ?? 0) + WIN_POINTS;
  wins[winner] = (wins[winner] ?? 0) + 1;
  const history = [...g.history, { round: g.round, holder: g.holder, winner, q: g.questions, g: g.guesses + 1 }].slice(-30);
  return {
    ...g, phase: 'over', scores, wins, history, guesses: g.guesses + 1,
    guessLog: [...g.guessLog, { by: winner, ok: true, w: word }],
    over: { kind: 'win', winner, answer: g.secret, text: `${seats[winner].name} futbolcuyu buldu: ${g.secret}!` },
  };
};

// Eylemler: fbready (a.name), fbask, fbanswer (a.yes), fbguess (a.word), fbnext
export function act(g, seats, idx, type, a = {}) {
  if (!g) return { error: 'Oyun yok.' };
  if (idx < 0 || seats[idx]?.left) return { error: 'Oyunda değilsiniz.' };
  const isHolder = idx === g.holder;
  switch (type) {
    case 'fbready':
      if (!isHolder) return { error: 'Yalnızca futbolcuyu tutan oyuncu onaylayabilir.' };
      if (g.phase !== 'hold') return { error: 'Tur zaten başladı.' };
      { const name = cleanName(a.name); if (norm(name).length < 2) return { error: 'Futbolcunun adını yazın.' }; return { ...g, phase: 'ask', secret: name, note: '' }; }
    case 'fbask': {
      if (isHolder) return { error: 'Futbolcuyu tutan oyuncu soru soramaz.' };
      if (g.phase !== 'ask') return { error: 'Şu an soru sorulamaz.' };
      if (g.turn !== idx) return { error: 'Sıra sizde değil.' };
      return { ...g, phase: 'answer' };
    }
    case 'fbguess': {
      if (isHolder) return { error: 'Futbolcuyu tutan oyuncu tahmin edemez.' };
      if (g.phase !== 'ask') return { error: 'Şu an tahmin edilemez.' };
      if (g.turn !== idx) return { error: 'Sıra sizde değil.' };
      const word = cleanName(a.word);
      if (norm(word).length < 2) return { error: 'Tahmininizi yazın.' };
      if (isMatch(g.secret, word)) return finishRound(g, seats, idx, word);
      return {
        ...g, guesses: g.guesses + 1,
        guessLog: [...g.guessLog, { by: idx, ok: false, w: word }].slice(-LOG_MAX),
        note: `${seats[idx].name} "${word}" dedi, yanlış.`,
        turn: advance(g, seats),
      };
    }
    case 'fbanswer': {
      if (!isHolder) return { error: 'Yalnızca futbolcuyu tutan oyuncu cevap verebilir.' };
      if (g.phase !== 'answer') return { error: 'Şu an cevaplanacak soru yok.' };
      const yes = a.yes === true;
      return {
        ...g, phase: 'ask',
        log: [...g.log, { by: g.turn, a: yes ? 'yes' : 'no' }].slice(-LOG_MAX),
        questions: g.questions + 1, yes: g.yes + (yes ? 1 : 0), no: g.no + (yes ? 0 : 1),
        turn: advance(g, seats),
      };
    }
    case 'fbnext': {
      if (g.phase !== 'over') return { error: 'Tur henüz bitmedi.' };
      return nextRound(g, seats);
    }
    default:
      return { error: 'Bilinmeyen işlem.' };
  }
}

// Sıradaki oyuncu tutan olur.
function nextRound(g, seats, note = '') {
  const act = activeOf(seats);
  if (act.length < 2) return { error: 'Devam etmek için en az 2 oyuncu gerekir.' };
  const after = act.find((i) => i > g.holder) ?? act[0];
  return startRound(g, seats, after, note);
}

// Oyuncu masadan ayrıldı (seats'te left işaretlendikten sonra çağrılır).
export function onLeave(g, seats, idx) {
  if (!g) return g;
  const act = activeOf(seats);
  if (g.phase === 'over') {
    return g.over?.kind === 'end' || act.length >= 2 ? g : { ...g, over: { kind: 'end', winner: null, text: 'Oyuncu sayısı 2\'nin altına indi.' } };
  }
  if (act.length < 2) return { ...g, phase: 'over', over: { kind: 'end', winner: null, text: 'Oyuncu sayısı 2\'nin altına indi, oyun bitti.' } };
  if (idx === g.holder) {
    // Tutan ayrıldı: tur iptal, sıradaki oyuncunun tutmasıyla yeni tur başlar.
    return nextRound(g, seats, `Tutan (${seats[idx].name}) ayrıldı, tur iptal edildi. Yeni tur başladı.`);
  }
  if (g.turn === idx) {
    // Sırası gelen soran ayrıldı: bekleyen soru/tahmin iptal, sıra atlanır.
    return { ...g, phase: g.phase === 'hold' ? 'hold' : 'ask', turn: advance(g, seats), note: `${seats[idx].name} ayrıldı, sıra atlandı.` };
  }
  return g;
}

// Futbolcunun adı yalnızca tutana gider; tur bitince (over.answer) herkes görür.
export function viewFor(g, idx) {
  if (!g) return null;
  return {
    round: g.round, holder: g.holder, turn: g.turn, phase: g.phase,
    log: g.log, guessLog: g.guessLog, questions: g.questions, guesses: g.guesses, yes: g.yes, no: g.no,
    scores: g.scores, wins: g.wins, history: g.history, note: g.note, over: g.over,
    me: idx < 0 ? null : { holder: idx === g.holder, turn: idx === g.turn && idx !== g.holder },
    secret: idx >= 0 && idx === g.holder && g.phase !== 'over' ? g.secret : null,
  };
}
