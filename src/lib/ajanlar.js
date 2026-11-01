// Gizli Ajanlar: iki takım (Kırmızı, Mavi), her takımda bir ajan şefi. 5x5 tahtada 25 kelime var;
// yalnızca ajan şefleri hangi kelimenin kime ait olduğunu bilir (anahtar). Şef tek kelimelik ipucu ve sayı verir,
// takımı tahtadan kendi ajanlarını bulur. Masum kelimeye ya da rakip ajanına dokunmak turu bitirir;
// suikastçıya dokunan takım anında kaybeder. Anahtar yalnızca sunucuda tutulur (viewFor).
export const TEAM = { r: 'Kırmızı', b: 'Mavi' };
const other = (t) => (t === 'r' ? 'b' : 'r');

export const WORDS = Array.from(new Set([
  'Deniz', 'Köprü', 'Kale', 'Ay', 'Güneş', 'Yıldız', 'Tren', 'Uçak', 'Gemi', 'Araba', 'Bisiklet', 'Ev', 'Kapı', 'Pencere',
  'Anahtar', 'Kilit', 'Masa', 'Sandalye', 'Kitap', 'Kalem', 'Defter', 'Çanta', 'Saat', 'Ayna', 'Lamba', 'Mum', 'Ateş', 'Su',
  'Buz', 'Kar', 'Yağmur', 'Bulut', 'Rüzgâr', 'Fırtına', 'Dağ', 'Nehir', 'Göl', 'Orman', 'Çöl', 'Ada', 'Plaj', 'Kum', 'Taş',
  'Altın', 'Gümüş', 'Elmas', 'Demir', 'Cam', 'Kâğıt', 'İp', 'Bal', 'Süt', 'Peynir', 'Ekmek', 'Elma', 'Portakal', 'Limon',
  'Üzüm', 'Çilek', 'Karpuz', 'Domates', 'Patates', 'Soğan', 'Fındık', 'Çay', 'Kahve', 'Şeker', 'Tuz', 'Pasta', 'Çorba',
  'Kedi', 'Köpek', 'At', 'Kuş', 'Balık', 'Kartal', 'Aslan', 'Kaplan', 'Fil', 'Maymun', 'Yılan', 'Kurt', 'Tavşan', 'Arı',
  'Kelebek', 'Örümcek', 'Kaplumbağa', 'Yunus', 'Balina', 'Kral', 'Kraliçe', 'Prens', 'Şövalye', 'Korsan', 'Hırsız', 'Polis',
  'Doktor', 'Hemşire', 'Öğretmen', 'Aşçı', 'Pilot', 'Astronot', 'Dedektif', 'Casus', 'Sihirbaz', 'Cadı', 'Ejderha',
  'Hayalet', 'Dev', 'Cüce', 'Peri', 'Robot', 'Uzaylı', 'Bomba', 'Silah', 'Kılıç', 'Kalkan', 'Ok', 'Top', 'Roket', 'Uydu',
  'Gezegen', 'Dünya', 'Mars', 'Kıta', 'Harita', 'Pusula', 'Hazine', 'Bayrak', 'Taç', 'Yüzük', 'Kolye', 'Maske', 'Şapka',
  'Ceket', 'Ayakkabı', 'Eldiven', 'Gözlük', 'Şemsiye', 'Piyano', 'Gitar', 'Davul', 'Keman', 'Flüt', 'Tiyatro', 'Sinema',
  'Müze', 'Hastane', 'Okul', 'Banka', 'Pazar', 'Park', 'Havuz', 'Stadyum', 'Kule', 'Tünel', 'Mağara', 'Gece', 'Rüya',
  'Gölge', 'Sis', 'Zaman', 'Harf', 'Sayı', 'Oyun', 'Zar', 'Kart', 'Satranç', 'Balon', 'Çiçek', 'Gül', 'Ağaç', 'Yaprak',
  'Tohum', 'Köy', 'Şehir', 'Yol', 'Duvar', 'Merdiven', 'Çatı', 'Bahçe', 'Çit', 'Kuyu', 'Fener', 'Çan', 'Zil', 'Telefon',
]));

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const operativesOf = (g, seats, team) => seats.map((s, i) => i).filter((i) => g.teams[i] === team && !seats[i].left && g.spies[team] !== i);

// Koltukları rastgele iki takıma böler; her takımın ilk kişisi ajan şefi olur.
export function newGame(n) {
  const order = shuffle([...Array(n).keys()]);
  const teams = Array(n);
  order.forEach((seat, k) => { teams[seat] = k % 2 === 0 ? 'r' : 'b'; });
  const spies = { r: order.find((s) => teams[s] === 'r'), b: order.find((s) => teams[s] === 'b') };
  const start = Math.random() < 0.5 ? 'r' : 'b';
  // başlayan takımın 9, diğerinin 8 ajanı; 7 masum kelime; 1 suikastçı
  const key = shuffle([...Array(9).fill(start), ...Array(8).fill(other(start)), ...Array(7).fill('n'), 'a']);
  return {
    words: shuffle([...WORDS]).slice(0, 25),
    key,
    revealed: Array(25).fill(false),
    teams,
    spies,
    turn: start,
    start,
    clue: null, // { word, num, by }
    guessesLeft: 0,
    guessed: 0, // bu turda açılan kart sayısı
    remaining: { [start]: 9, [other(start)]: 8 },
    note: `${TEAM[start]} takım başlıyor. Ajan şefi ipucu verecek.`,
    over: null, // { winner: 'r' | 'b' | 'none', text }
  };
}

const finish = (g, winner, text) => ({ ...g, clue: null, over: { winner, text }, note: text });
const passTurn = (g) => ({ ...g, turn: other(g.turn), clue: null, guessesLeft: 0, guessed: 0 });

export function giveClue(g, seats, idx, word, num) {
  if (g.over) return { error: 'Tur bitti.' };
  if (g.clue) return { error: 'Bu tur için ipucu zaten verildi.' };
  if (g.spies[g.turn] !== idx) return { error: 'İpucu vermek sırası gelen takımın ajan şefine ait.' };
  const w = String(word ?? '').trim();
  if (!/^[\p{L}'-]{1,24}$/u.test(w)) return { error: 'İpucu tek bir kelime olmalı (en fazla 24 harf, boşluksuz).' };
  const lw = w.toLocaleLowerCase('tr');
  // Kurala göre ipucu, tahtadaki HERHANGİ bir kelime (açık ya da kapalı) olamaz.
  if (g.words.some((x) => x.toLocaleLowerCase('tr') === lw)) return { error: 'İpucu, tahtadaki bir kelime olamaz.' };
  const n = Number(num);
  if (!Number.isInteger(n) || n < 0 || n > 9) return { error: 'Sayı 0 ile 9 arasında olmalı (0: sınırsız).' };
  return {
    ...g,
    clue: { word: w, num: n, by: idx },
    // Kurala göre tahmin hakkı = sayı + 1. Sınırsız (0) için guessesLeft null: tahmin sınırı yok.
    guessesLeft: n === 0 ? null : n + 1,
    guessed: 0,
    note: `${seats[idx].name} ipucu verdi: "${w}" ${n === 0 ? '∞' : n}`,
  };
}

export function pick(g, seats, idx, card) {
  if (g.over) return { error: 'Tur bitti.' };
  if (!g.clue) return { error: 'Önce ajan şefinin ipucu vermesi gerekir.' };
  const team = g.teams[idx];
  if (team !== g.turn || g.spies[team] === idx) return { error: 'Tahmin sırası sizin takımınızın ajanlarında değil.' };
  if (!Number.isInteger(card) || card < 0 || card > 24 || g.revealed[card]) return { error: 'Geçersiz kart.' };

  const revealed = [...g.revealed];
  revealed[card] = true;
  const c = g.key[card];
  const word = g.words[card];
  const n = { ...g, revealed, guessed: g.guessed + 1 };

  if (c === 'a') return finish(n, other(team), `${TEAM[team]} takım suikastçıya dokundu ("${word}"). ${TEAM[other(team)]} takım kazandı!`);
  if (c === 'r' || c === 'b') {
    n.remaining = { ...g.remaining, [c]: g.remaining[c] - 1 };
    if (n.remaining[c] === 0) return finish(n, c, `${TEAM[c]} takım tüm ajanlarını buldu ve kazandı!`);
  }
  if (c === team) {
    if (g.guessesLeft !== null) {
      n.guessesLeft = g.guessesLeft - 1;
      if (n.guessesLeft <= 0) return passTurn({ ...n, note: `"${word}": doğru! Tahmin hakkı bitti, sıra ${TEAM[other(team)]} takımda.` });
    }
    return { ...n, note: `"${word}": ${TEAM[team]} ajan, doğru!` };
  }
  return passTurn({ ...n, note: c === 'n' ? `"${word}": masum kelime. Sıra ${TEAM[other(team)]} takımda.` : `"${word}": ${TEAM[c]} takımın ajanı! Sıra ${TEAM[other(team)]} takımda.` });
}

export function endTurn(g, seats, idx) {
  if (g.over) return { error: 'Tur bitti.' };
  if (!g.clue) return { error: 'Henüz ipucu verilmedi.' };
  if (g.teams[idx] !== g.turn || g.spies[g.turn] === idx) return { error: 'Turu yalnızca sırası gelen takımın ajanları bitirebilir.' };
  if (g.guessed < 1) return { error: 'En az bir kart açmadan tur bitirilemez.' };
  return passTurn({ ...g, note: `${TEAM[g.turn]} takım turu bitirdi. Sıra ${TEAM[other(g.turn)]} takımda.` });
}

// Oyuncu masadan ayrıldı (seats'te left işaretlendikten sonra çağrılır).
export function onLeave(g, seats, idx) {
  if (g.over) return g;
  const team = g.teams[idx];
  if (g.spies[team] === idx || operativesOf(g, seats, team).length === 0) {
    return finish(g, 'none', `${TEAM[team]} takım dağıldı (${seats[idx].name} ayrıldı), tur iptal edildi.`);
  }
  return g;
}

// Bir oyuncuya giden görünüm: renkler yalnızca ajan şeflerine ve tur bitince herkese açılır.
export function viewFor(g, idx) {
  if (!g) return null;
  const team = idx < 0 ? null : g.teams[idx];
  const spy = team ? g.spies[team] === idx : false;
  const showAll = !!g.over || spy;
  return {
    cards: g.words.map((w, i) => ({ w, rev: g.revealed[i], c: g.revealed[i] || showAll ? g.key[i] : null })),
    teams: g.teams,
    spies: g.spies,
    turn: g.turn,
    clue: g.clue,
    guessesLeft: g.guessesLeft,
    guessed: g.guessed,
    remaining: g.remaining,
    note: g.note,
    over: g.over,
    me: team ? { team, spy } : null,
  };
}
