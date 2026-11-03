// Adam Asmaca: sunucu rastgele bir kelime seçer, oyuncular sırayla harf tahmin eder; 7 yanlış hak ortaktır.
// Doğru harf: bulunan harf başına 10 puan. Kelimeyi tamamlayan: 25 + kalan hak başına 5 bonus. 5 tur; toplam puana göre kazanan.
export const CONFIG = { min: 2, max: 8 };
export const PREFIX = 'ad';
export const ROUNDS = 5;
export const MAX_WRONG = 7;
export const TURN_MS = 40 * 1000; // sırası gelen yanıt vermezse herkes sırayı atlatabilir (sunucu saatiyle)
export const ALPHABET = ['A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'Ğ', 'H', 'I', 'İ', 'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R', 'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z'];

const RAW = {
  'Hayvan': 'aslan kaplan kartal papağan kaplumbağa zürafa penguen yunus balina karınca arı kelebek tavşan geyik tilki kurt ayı maymun timsah leylek serçe güvercin horoz inek koyun keçi ördek',
  'Meyve ve sebze': 'elma armut kiraz çilek karpuz kavun şeftali üzüm muz portakal mandalina limon incir nar erik domates salatalık biber patlıcan havuç soğan sarımsak ıspanak kabak patates',
  'Şehir': 'ankara istanbul izmir bursa antalya adana konya trabzon samsun erzurum eskişehir mersin diyarbakır gaziantep malatya kayseri sivas rize edirne bodrum çanakkale ordu bolu kars',
  'Eşya': 'bardak tabak çatal kaşık sandalye masa televizyon bilgisayar telefon şemsiye ayna saat anahtar valiz çanta gözlük kalem defter makas halı yastık battaniye dolap ütü süpürge radyo',
  'Yiyecek': 'baklava mantı lahmacun kebap pilav çorba börek simit gözleme dondurma lokum künefe pide menemen köfte dolma sarma karnıyarık mercimek helva kadayıf aşure revani tulumba mücver',
  'Meslek': 'doktor öğretmen mühendis avukat pilot garson berber terzi aşçı çiftçi itfaiyeci gazeteci mimar ressam müzisyen polis hemşire eczacı marangoz tamirci kuaför şoför bakkal kasap fırıncı',
  'Doğa': 'dağ deniz nehir orman çöl göl ada şelale vadi yağmur kar fırtına gökkuşağı yıldız güneş bulut rüzgar deprem volkan mağara plaj çiçek ağaç yaprak çimen buzul',
};

// Türkçe büyük harf: i -> İ, ı -> I.
export const upperTr = (s) => s.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();

export const WORDS = Object.entries(RAW).flatMap(([cat, list]) => list.split(' ').map((w) => ({ cat, w: upperTr(w) })));

const rnd = (n) => {
  const c = globalThis.crypto;
  if (c && c.getRandomValues) {
    const b = new Uint32Array(1);
    c.getRandomValues(b);
    return Math.floor((b[0] / 4294967296) * n);
  }
  return Math.floor(Math.random() * n);
};

const isLeft = (seats, i) => !!seats[i]?.left;
function nextAlive(seats, from) {
  const n = seats.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (!isLeft(seats, i)) return i;
  }
  return -1;
}

function pickWord(used) {
  for (let t = 0; t < 50; t++) {
    const i = rnd(WORDS.length);
    if (!used.includes(i)) return i;
  }
  return rnd(WORDS.length);
}

function startRound(g, seats, round, now) {
  const wi = pickWord(g.used);
  let first = round % seats.length;
  if (isLeft(seats, first)) first = nextAlive(seats, first);
  return {
    ...g,
    used: [...g.used, wi],
    round,
    word: WORDS[wi].w,
    cat: WORDS[wi].cat,
    guessed: [],
    wrong: 0,
    state: 'play',
    solver: -1,
    turn: first,
    turnAt: now,
  };
}

export function newGame(seats, now = Date.now()) {
  const g = { used: [], scores: seats.map(() => 0), note: '', last: null, over: null, round: 0, word: '', cat: '', guessed: [], wrong: 0, state: 'play', solver: -1, turn: 0, turnAt: now };
  return { ...startRound(g, seats, 0, now), note: 'Bol şans! Harf seçerek tahmin edin.' };
}

const uniq = (w) => [...new Set(w.split(''))];

function finishGame(g, seats, text) {
  const ranking = seats.map((_, i) => i).sort((a, b) => g.scores[b] - g.scores[a]);
  const best = Math.max(...seats.map((s, i) => (isLeft(seats, i) ? -1 : g.scores[i])));
  const winners = seats.map((_, i) => i).filter((i) => !isLeft(seats, i) && g.scores[i] === best);
  const t = text || (winners.length === 1 ? `${seats[winners[0]].name} kazandı!` : `Berabere: ${winners.map((i) => seats[i].name).join(', ')}`);
  return { ...g, state: g.state === 'play' ? 'lost' : g.state, turn: -1, over: { scores: g.scores, ranking, winners, text: t }, note: t };
}

// Tur bittiğinde son tursa oyun biter; değilse 'adnext' ile yeni tura geçilir.
function endRound(g, seats, state, solver) {
  const n = { ...g, state, solver, turn: -1 };
  return n.round + 1 >= ROUNDS ? finishGame(n, seats) : n;
}

export function act(g, seats, idx, type, payload, now = Date.now()) {
  if (g.over) return { error: 'Oyun bitti.' };
  if (!Number.isInteger(idx) || idx < 0 || idx >= seats.length) return { error: 'Masada değilsin.' };
  if (isLeft(seats, idx)) return { error: 'Masadan ayrıldın.' };

  if (type === 'adnext') {
    if (g.state === 'play') return { error: 'Tur sürüyor.' };
    return startRound(g, seats, g.round + 1, now);
  }
  if (g.state !== 'play') return { error: 'Tur bitti; sonraki tura geçin.' };

  if (type === 'adskip') {
    if (g.turn === idx) return { error: 'Sırayı kendin kullan.' };
    if (now - g.turnAt < TURN_MS) return { error: 'Süre henüz dolmadı.' };
    return { ...g, turn: nextAlive(seats, g.turn), turnAt: now, note: `${seats[g.turn].name} için süre doldu.` };
  }
  if (type !== 'adguess') return { error: 'Bilinmeyen işlem.' };
  if (g.turn !== idx) return { error: 'Sıra sende değil.' };
  const letter = payload && payload.letter;
  if (typeof letter !== 'string' || letter.length > 2 || !ALPHABET.includes(letter)) return { error: 'Geçersiz harf.' };
  if (g.guessed.includes(letter)) return { error: 'Bu harf zaten denendi.' };

  const name = seats[idx].name;
  const guessed = [...g.guessed, letter];
  const count = g.word.split('').filter((c) => c === letter).length;
  const last = { seat: idx, letter, hit: count > 0 };
  const scores = [...g.scores];
  let n = { ...g, guessed, scores, last, turnAt: now };

  if (count > 0) {
    scores[idx] += count * 10;
    if (uniq(g.word).every((c) => guessed.includes(c))) {
      const bonus = 25 + 5 * (MAX_WRONG - g.wrong);
      scores[idx] += bonus;
      return endRound({ ...n, note: `${name} kelimeyi tamamladı! +${bonus} bonus` }, seats, 'won', idx);
    }
    n.note = `${name}: "${letter}" harfi ${count} kez geçiyor! +${count * 10}`;
  } else {
    n.wrong = g.wrong + 1;
    if (n.wrong >= MAX_WRONG) return endRound({ ...n, note: `Haklar bitti! Kelime: ${g.word}` }, seats, 'lost', -1);
    n.note = `${name}: "${letter}" harfi yok. Kalan hak: ${MAX_WRONG - n.wrong}`;
  }
  n.turn = nextAlive(seats, idx);
  return n;
}

export function onLeave(g, seats, idx, now = Date.now()) {
  if (g.over) return g;
  const al = seats.filter((_, i) => !isLeft(seats, i)).length;
  if (al <= 1) return finishGame(g, seats, al === 1 ? 'Masada tek oyuncu kaldı.' : 'Herkes ayrıldı.');
  if (g.state === 'play' && g.turn === idx) return { ...g, turn: nextAlive(seats, idx), turnAt: now, note: `${seats[idx].name} masadan ayrıldı.` };
  return g;
}

export function viewFor(g, idx, now = Date.now()) {
  if (!g) return null;
  const reveal = g.state !== 'play' || !!g.over;
  return {
    mask: g.word.split('').map((c) => (reveal || g.guessed.includes(c) ? c : null)),
    word: reveal ? g.word : null,
    cat: g.cat,
    guessed: g.guessed,
    hits: g.guessed.filter((c) => g.word.includes(c)),
    wrong: g.wrong,
    maxWrong: MAX_WRONG,
    round: g.round,
    rounds: ROUNDS,
    state: g.state,
    solver: g.solver,
    scores: g.scores,
    turn: g.turn,
    leftMs: g.state === 'play' && !g.over ? Math.max(0, TURN_MS - (now - g.turnAt)) : 0,
    last: g.last,
    note: g.note,
    over: g.over,
  };
}
