// Futbolcuyu Bul: bir oyuncu (tutan) aklından bir futbolcu tutar; adı hiçbir yere yazılmaz.
// Diğer oyuncular sırayla sözlü soru sorar, tutan yalnızca EVET / HAYIR der. Sırası gelen soran
// "soruyu sordum" ya da "tahmin ediyorum" diyebilir. Doğru tahmin eden turu kazanır (3 puan).
// Sunucuda gizli bilgi yoktur (futbolcu kimsenin telefonuna girilmez); sunucu yalnızca sıra ve yetkiyi denetler.
export const WIN_POINTS = 3;
const LOG_MAX = 120;

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
    phase: 'hold', // hold: tutan "tuttum" demeli | ask | answer | verdict | over
    log: [], // { by, a: 'yes' | 'no' } sırayla cevaplanmış sorular
    guessLog: [], // { by, ok }
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

const finishRound = (g, seats, winner) => {
  const scores = [...g.scores];
  const wins = [...g.wins];
  scores[winner] = (scores[winner] ?? 0) + WIN_POINTS;
  wins[winner] = (wins[winner] ?? 0) + 1;
  const history = [...g.history, { round: g.round, holder: g.holder, winner, q: g.questions, g: g.guesses + 1 }].slice(-30);
  return {
    ...g, phase: 'over', scores, wins, history, guesses: g.guesses + 1,
    guessLog: [...g.guessLog, { by: winner, ok: true }],
    over: { kind: 'win', winner, text: `${seats[winner].name} futbolcuyu buldu!` },
  };
};

// Eylemler: fbready, fbask, fbanswer (a.yes), fbguess, fbverdict (a.yes), fbnext
export function act(g, seats, idx, type, a = {}) {
  if (!g) return { error: 'Oyun yok.' };
  if (idx < 0 || seats[idx]?.left) return { error: 'Oyunda değilsiniz.' };
  const isHolder = idx === g.holder;
  switch (type) {
    case 'fbready':
      if (!isHolder) return { error: 'Yalnızca futbolcuyu tutan oyuncu onaylayabilir.' };
      if (g.phase !== 'hold') return { error: 'Tur zaten başladı.' };
      return { ...g, phase: 'ask', note: '' };
    case 'fbask':
    case 'fbguess': {
      if (isHolder) return { error: 'Futbolcuyu tutan oyuncu soru soramaz.' };
      if (g.phase !== 'ask') return { error: 'Şu an soru sorulamaz.' };
      if (g.turn !== idx) return { error: 'Sıra sizde değil.' };
      return { ...g, phase: type === 'fbask' ? 'answer' : 'verdict' };
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
    case 'fbverdict': {
      if (!isHolder) return { error: 'Yalnızca futbolcuyu tutan oyuncu karar verebilir.' };
      if (g.phase !== 'verdict') return { error: 'Şu an değerlendirilecek tahmin yok.' };
      if (a.yes === true) return finishRound(g, seats, g.turn);
      return {
        ...g, phase: 'ask', guesses: g.guesses + 1,
        guessLog: [...g.guessLog, { by: g.turn, ok: false }].slice(-LOG_MAX),
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

// Gizli bilgi olmadığı için herkese aynı görünüm gider; yalnızca kendi rolü eklenir.
export function viewFor(g, idx) {
  if (!g) return null;
  return {
    round: g.round, holder: g.holder, turn: g.turn, phase: g.phase,
    log: g.log, guessLog: g.guessLog, questions: g.questions, guesses: g.guesses, yes: g.yes, no: g.no,
    scores: g.scores, wins: g.wins, history: g.history, note: g.note, over: g.over,
    me: idx < 0 ? null : { holder: idx === g.holder, turn: idx === g.turn && idx !== g.holder },
  };
}
