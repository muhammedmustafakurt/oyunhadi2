// Ben Kimim?: her oyuncunun alnında (sahibine kapalı) bir kart vardır; kendi kartını görmez, diğerlerininkini görür.
// Sırası gelen oyuncu diğerlerine evet/hayır soruları sorar (sözlü), bildiğini düşününce yüksek sesle tahmin eder;
// diğerleri tahmini "Doğru" ya da "Yanlış" diye onaylar. Doğru tahmin kartı bulduğu anlamına gelir; sıra bir sonrakine geçer.
// Kart havuzu türler arasında dengeli dağıtılır, böylece masadaki kartların çoğu aynı türden olmaz.
export const TURN_MS = 45 * 1000;
export const TURNS_EACH = 6; // oyuncu başına en fazla bu kadar sıra; sonra oyun biter

export const CARDS = [
  { c: 'Türk ünlü', n: 'Sezen Aksu' }, { c: 'Türk ünlü', n: 'Tarkan' }, { c: 'Türk ünlü', n: 'Kemal Sunal' },
  { c: 'Türk ünlü', n: 'Cem Yılmaz' }, { c: 'Türk ünlü', n: 'Barış Manço' }, { c: 'Türk ünlü', n: 'Ajda Pekkan' },
  { c: 'Türk ünlü', n: 'Şener Şen' }, { c: 'Türk ünlü', n: 'Müslüm Gürses' }, { c: 'Türk ünlü', n: 'Aziz Nesin' },
  { c: 'Türk ünlü', n: 'Nazım Hikmet' }, { c: 'Türk ünlü', n: 'Orhan Gencebay' },
  { c: 'Tarihten', n: 'Mustafa Kemal Atatürk' }, { c: 'Tarihten', n: 'Fatih Sultan Mehmet' }, { c: 'Tarihten', n: 'Kanuni Sultan Süleyman' },
  { c: 'Tarihten', n: 'Mimar Sinan' }, { c: 'Tarihten', n: 'Napolyon' }, { c: 'Tarihten', n: 'Kleopatra' },
  { c: 'Tarihten', n: 'Cengiz Han' }, { c: 'Tarihten', n: 'Mevlana' }, { c: 'Tarihten', n: 'Nasreddin Hoca' },
  { c: 'Tarihten', n: 'Piri Reis' }, { c: 'Tarihten', n: 'Evliya Çelebi' }, { c: 'Tarihten', n: 'Hürrem Sultan' },
  { c: 'Bilim ve sanat', n: 'Albert Einstein' }, { c: 'Bilim ve sanat', n: 'Isaac Newton' }, { c: 'Bilim ve sanat', n: 'Leonardo da Vinci' },
  { c: 'Bilim ve sanat', n: 'Mozart' }, { c: 'Bilim ve sanat', n: 'Beethoven' }, { c: 'Bilim ve sanat', n: 'Pablo Picasso' },
  { c: 'Bilim ve sanat', n: 'Van Gogh' }, { c: 'Bilim ve sanat', n: 'Aziz Sancar' }, { c: 'Bilim ve sanat', n: 'Cahit Arf' },
  { c: 'Bilim ve sanat', n: 'Elon Musk' }, { c: 'Bilim ve sanat', n: 'Bill Gates' }, { c: 'Bilim ve sanat', n: 'Charlie Chaplin' },
  { c: 'Müzik', n: 'Michael Jackson' }, { c: 'Müzik', n: 'Elvis Presley' }, { c: 'Müzik', n: 'Shakira' },
  { c: 'Müzik', n: 'Beyoncé' }, { c: 'Müzik', n: 'Freddie Mercury' }, { c: 'Müzik', n: 'Bob Marley' },
  { c: 'Müzik', n: 'Madonna' }, { c: 'Müzik', n: 'Adele' }, { c: 'Müzik', n: 'Ed Sheeran' }, { c: 'Müzik', n: 'Johnny Cash' },
  { c: 'Sporcu', n: 'Lionel Messi' }, { c: 'Sporcu', n: 'Cristiano Ronaldo' }, { c: 'Sporcu', n: 'Hakan Şükür' },
  { c: 'Sporcu', n: 'Zlatan Ibrahimović' }, { c: 'Sporcu', n: 'Kobe Bryant' },
  { c: 'Sporcu', n: 'Arda Turan' }, { c: 'Sporcu', n: 'Rüştü Reçber' }, { c: 'Sporcu', n: 'Muhammed Ali' },
  { c: 'Sporcu', n: 'Usain Bolt' }, { c: 'Sporcu', n: 'Michael Jordan' }, { c: 'Sporcu', n: 'Naim Süleymanoğlu' },
  { c: 'Çizgi film', n: 'Mickey Mouse' }, { c: 'Çizgi film', n: 'Tom' }, { c: 'Çizgi film', n: 'Jerry' },
  { c: 'Çizgi film', n: 'Sünger Bob' }, { c: 'Çizgi film', n: 'Temel Reis' }, { c: 'Çizgi film', n: 'Pikachu' },
  { c: 'Çizgi film', n: 'Shrek' }, { c: 'Çizgi film', n: 'Elsa' }, { c: 'Çizgi film', n: 'Simba' },
  { c: 'Çizgi film', n: 'Woody' }, { c: 'Çizgi film', n: 'Nemo' }, { c: 'Çizgi film', n: 'Garfield' },
  { c: 'Çizgi film', n: 'Bugs Bunny' }, { c: 'Çizgi film', n: 'Red Kit' }, { c: 'Çizgi film', n: 'Maya Arı' },
  { c: 'Çizgi film', n: 'Heidi' }, { c: 'Çizgi film', n: 'Donald Duck' }, { c: 'Çizgi film', n: 'Pamuk Prenses' },
  { c: 'Film ve dizi', n: 'Harry Potter' }, { c: 'Film ve dizi', n: 'Batman' }, { c: 'Film ve dizi', n: 'Spider-Man' },
  { c: 'Film ve dizi', n: 'Süpermen' }, { c: 'Film ve dizi', n: 'Darth Vader' }, { c: 'Film ve dizi', n: 'Yoda' },
  { c: 'Film ve dizi', n: 'Joker' }, { c: 'Film ve dizi', n: 'Sherlock Holmes' }, { c: 'Film ve dizi', n: 'James Bond' },
  { c: 'Film ve dizi', n: 'Jack Sparrow' }, { c: 'Film ve dizi', n: 'Gandalf' }, { c: 'Film ve dizi', n: 'Iron Man' },
  { c: 'Film ve dizi', n: 'Polat Alemdar' }, { c: 'Film ve dizi', n: 'Recep İvedik' }, { c: 'Film ve dizi', n: 'Mr. Bean' },
  { c: 'Film ve dizi', n: 'Forrest Gump' }, { c: 'Film ve dizi', n: 'Indiana Jones' }, { c: 'Film ve dizi', n: 'Tarzan' },
  { c: 'Hayvan', n: 'Penguen' }, { c: 'Hayvan', n: 'Zürafa' }, { c: 'Hayvan', n: 'Kaplumbağa' },
  { c: 'Hayvan', n: 'Fil' }, { c: 'Hayvan', n: 'Papağan' }, { c: 'Hayvan', n: 'Zebra' },
  { c: 'Hayvan', n: 'Kanguru' }, { c: 'Hayvan', n: 'Yunus' }, { c: 'Hayvan', n: 'Baykuş' },
  { c: 'Hayvan', n: 'Kutup ayısı' }, { c: 'Hayvan', n: 'Maymun' }, { c: 'Hayvan', n: 'Timsah' },
  { c: 'Hayvan', n: 'Aslan' }, { c: 'Hayvan', n: 'Kedi' }, { c: 'Hayvan', n: 'Kartal' },
  { c: 'Meslek', n: 'Berber' }, { c: 'Meslek', n: 'Pilot' }, { c: 'Meslek', n: 'Garson' },
  { c: 'Meslek', n: 'Terzi' }, { c: 'Meslek', n: 'Fırıncı' }, { c: 'Meslek', n: 'Gemi kaptanı' },
  { c: 'Meslek', n: 'Gazeteci' }, { c: 'Meslek', n: 'Mimar' }, { c: 'Meslek', n: 'Çoban' },
  { c: 'Meslek', n: 'Ressam' }, { c: 'Meslek', n: 'Postacı' }, { c: 'Meslek', n: 'Diş hekimi' },
  { c: 'Meslek', n: 'Öğretmen' }, { c: 'Meslek', n: 'Polis' }, { c: 'Meslek', n: 'Hemşire' },
];

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Sıradaki oyuncu: çözenler ve ayrılanlar atlanır; kimse kalmadıysa -1.
function pickNext(g, seats, from) {
  const n = seats.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (!seats[i].left && !g.solved.includes(i)) return i;
  }
  return -1;
}

// n kartı tür bazında tur tur dağıtır: önce her türden bir kart, sonra yeniden; böylece tür tekrarı en aza iner.
function dealCards(n) {
  const byCat = {};
  for (const i of shuffle([...Array(CARDS.length).keys()])) {
    const c = CARDS[i].c;
    if (!byCat[c]) byCat[c] = [];
    byCat[c].push(i);
  }
  const cats = shuffle(Object.keys(byCat));
  const out = [];
  while (out.length < n) {
    let took = false;
    for (const c of cats) {
      if (out.length >= n) break;
      if (byCat[c].length) { out.push(byCat[c].pop()); took = true; }
    }
    if (!took) break;
  }
  return shuffle(out);
}

export function newGame(n, now = Date.now()) {
  return {
    cards: dealCards(n),
    solved: [],
    turn: Math.floor(Math.random() * n),
    endsAt: now + TURN_MS,
    turnNo: 0,
    maxTurns: n * TURNS_EACH,
    history: [],
    note: '',
    over: null,
  };
}

function finish(g, seats) {
  const rest = seats.map((_, i) => i).filter((i) => !g.solved.includes(i) && !seats[i].left);
  const text = g.solved.length === 0
    ? 'Kimse kartını bulamadı!'
    : `${seats[g.solved[0]].name} kartını ilk buldu!`;
  return { ...g, turn: -1, endsAt: 0, over: { ranking: [...g.solved, ...rest], text }, note: text };
}

const NOTE = {
  ok: (n, card) => `${n} kartını buldu: ${card}!`,
  no: (n) => `${n} yanlış tahmin etti.`,
  skip: (n) => `${n} sırayı bitirdi.`,
  time: (n) => `${n} için süre doldu.`,
};

// Mevcut sırayı kapatır, oyun bitmediyse sırayı bir sonraki oyuncuya verir.
function advance(g, seats, r, now) {
  const who = g.turn;
  const card = CARDS[g.cards[who]].n;
  const n = {
    ...g,
    turnNo: g.turnNo + 1,
    history: [...g.history, { seat: who, r, card: r === 'ok' ? card : null }].slice(-8),
    note: NOTE[r](seats[who].name, card),
  };
  const alive = seats.filter((s, i) => !s.left && !n.solved.includes(i)).length;
  if (alive <= 1 || n.turnNo >= n.maxTurns) return finish(n, seats);
  return { ...n, turn: pickNext(n, seats, who), endsAt: now + TURN_MS };
}

// type: 'kok' (tahmin doğru), 'kno' (yanlış) — sırası gelen dışındakiler; 'kskip' — yalnızca sırası gelen.
export function act(g, seats, idx, type, now = Date.now()) {
  if (g.over) return { error: 'Oyun bitti.' };
  if (type === 'kskip') {
    if (g.turn !== idx) return { error: 'Sıra sende değil.' };
    return advance(g, seats, 'skip', now);
  }
  if (g.turn === idx) return { error: 'Kendi tahminini başkaları onaylar.' };
  if (type === 'kno') return advance(g, seats, 'no', now);
  if (type === 'kok') return advance({ ...g, solved: [...g.solved, g.turn] }, seats, 'ok', now);
  return { error: 'Bilinmeyen işlem.' };
}

// Süre dolmadıysa durum değişmez (birden çok telefon aynı anda isteyebilir).
export function timeout(g, seats, now = Date.now()) {
  if (g.over || now < g.endsAt) return g;
  return advance(g, seats, 'time', now);
}

// Oyuncu masadan ayrıldı (seats'te left işaretlendikten sonra çağrılır).
export function onLeave(g, seats, idx, now = Date.now()) {
  if (g.over) return g;
  const alive = seats.filter((s, i) => !s.left && !g.solved.includes(i)).length;
  if (alive <= 1) return finish(g, seats);
  if (g.turn === idx) return { ...g, turn: pickNext(g, seats, idx), endsAt: now + TURN_MS, note: `${seats[idx].name} masadan ayrıldı.` };
  return g;
}

// Bir oyuncuya giden görünüm: kendi kartının adı, bulana ya da oyun bitene kadar gönderilmez.
export function viewFor(g, idx, now = Date.now()) {
  if (!g) return null;
  return {
    cards: g.cards.map((c, i) => {
      // İzleyiciler (idx < 0) hiçbir açık olmayan kartı görmez; oyuncu yalnızca kendi kartı dışındakileri görür.
      const reveal = !!g.over || g.solved.includes(i);
      const show = reveal || (idx >= 0 && i !== idx);
      return { c: reveal || idx >= 0 ? CARDS[c].c : null, n: show ? CARDS[c].n : null };
    }),
    solved: g.solved,
    turn: g.turn,
    leftMs: g.over ? 0 : Math.max(0, g.endsAt - now),
    turnNo: g.turnNo,
    maxTurns: g.maxTurns,
    history: g.history,
    note: g.note,
    over: g.over,
  };
}
