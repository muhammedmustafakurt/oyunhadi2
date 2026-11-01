// Scrabble (Türkçe). 15x15 tahta, 100 taş (29 harf + 2 joker). Sözlük gömülü değildir: bir hamlenin
// kelimeleri geçerli mi sorusu oyuncu itirazı (challenge) ve çoğunluk oylamasıyla çözülür.
//
// Akış: oyuncu hamle yapar -> puan hemen yazılır ama hamle "beklemededir" (pending). Sıradaki oyuncu hamle
// yapana kadar (ya da onaylayana kadar) diğer oyuncular itiraz edebilir. İtiraz olursa diğer oyuncular oy verir
// (geçerli / geçersiz). Geçersiz çıkarsa hamle geri alınır (taşlar rafa döner, puan yazılmaz). Geçerli çıkarsa
// itiraz eden 10 puan kaybeder. Eşitlikte kelime geçerli sayılır. Oylama 60 sn'de dolarsa oy vermeyenler
// "geçerli" sayılır.
//
// Saf fonksiyonlar: act(g, seats, idx, type, a) yeni bir durum ya da { error } döner.

export const N = 15;
export const RACK = 7;
export const BINGO = 50;
export const VOTE_MS = 60 * 1000;
export const CHALLENGE_PENALTY = 10;
export const END_PASSES = 6; // art arda bu kadar puansız tur (pas/değişim) oyunu bitirir
export const SWAP_MIN_BAG = 7; // torbada bu kadar taş yoksa değişim yapılamaz

// Türkçe harf seti: [harf, adet, puan]. DİKKAT: adet ve puanlar resmî kaynaktan doğrulanamadı; tek yerden
// değiştirilebilir. Toplam 98 harf + 2 joker (*) = 100 taş (test ile doğrulanır).
export const TILES = [
  ['A', 9, 1], ['B', 3, 3], ['C', 3, 4], ['Ç', 2, 4], ['D', 3, 3], ['E', 8, 1], ['F', 2, 7], ['G', 3, 5],
  ['Ğ', 1, 8], ['H', 2, 5], ['I', 3, 2], ['İ', 6, 1], ['J', 1, 10], ['K', 5, 1], ['L', 5, 1], ['M', 4, 2],
  ['N', 5, 1], ['O', 3, 2], ['Ö', 2, 7], ['P', 2, 5], ['R', 5, 1], ['S', 4, 2], ['Ş', 2, 4], ['T', 4, 1],
  ['U', 3, 2], ['Ü', 2, 7], ['V', 2, 7], ['Y', 2, 3], ['Z', 2, 4],
];
export const JOKER = '*';
const VAL = new Map(TILES.map(([l, , p]) => [l, p]));
const LETTERS = new Set(TILES.map(([l]) => l));

// Standart yerleşim (simetrik). T: üçlü kelime, D: ikili kelime, t: üçlü harf, d: ikili harf, *: merkez.
// Merkez ilk hamlede ikili kelime sayılır (resmî kural).
const ROWS = [
  'T..d...T...d..T',
  '.D...t...t...D.',
  '..D...d.d...D..',
  'd..D...d...D..d',
  '....D.....D....',
  '.t...t...t...t.',
  '..d...d.d...d..',
  'T..d...*...d..T',
];

export function premium(r, c) {
  return ROWS[Math.min(r, N - 1 - r)][Math.min(c, N - 1 - c)];
}

const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
const up = (s) => String(s ?? '').toLocaleUpperCase('tr');
const fail = (error) => ({ error });
const emptyBoard = () => Array.from({ length: N }, () => Array(N).fill(null));
const pts = (rack) => rack.reduce((sum, t) => sum + (t === JOKER ? 0 : VAL.get(t)), 0);

export function fullBag() {
  const bag = [];
  for (const [l, n] of TILES) for (let i = 0; i < n; i++) bag.push(l);
  bag.push(JOKER, JOKER);
  return bag;
}

function shuffle(a, rnd = Math.random) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sıradaki (koltukta olan) oyuncu.
function nextTurn(seats, from) {
  const n = seats.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (!seats[i]?.left) return i;
  }
  return from;
}

export function newGame(names, rnd = Math.random) {
  const bag = shuffle(fullBag(), rnd);
  const players = names.map((name) => ({ name, score: 0, rack: [] }));
  for (const p of players) p.rack = bag.splice(0, RACK);
  const turn = Math.floor(rnd() * names.length);
  return {
    board: emptyBoard(),
    players,
    bag,
    turn,
    scoreless: 0,
    over: null,
    pending: null,
    vote: null,
    lastMove: null,
    msg: `${players[turn].name} başlar.`,
  };
}

// Bir yerleşimin kelimelerini ve puanını hesaplar. tiles doğrulanmış olmalıdır: [{r,c,ch,blank}].
function analyze(board, tiles) {
  const grid = board.map((row) => row.slice());
  for (const t of tiles) grid[t.r][t.c] = { ch: t.ch, blank: t.blank };
  const isNew = (r, c) => tiles.some((t) => t.r === r && t.c === c);
  const at = (r, c) => (inb(r, c) && grid[r][c] ? grid[r][c] : null);
  // (r,c) noktasından (dr,dc) yönünde bitişik dolu kareler (kelimenin tamamı).
  const run = (r, c, dr, dc) => {
    let x = r, y = c;
    while (at(x - dr, y - dc)) { x -= dr; y -= dc; }
    const cells = [];
    while (at(x, y)) { cells.push([x, y]); x += dr; y += dc; }
    return cells;
  };

  const rows = new Set(tiles.map((t) => t.r));
  const cols = new Set(tiles.map((t) => t.c));
  if (rows.size > 1 && cols.size > 1) return fail('Taşlar tek bir satır ya da sütun üzerinde olmalı.');

  const words = [];
  if (tiles.length === 1) {
    const t = tiles[0];
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const cells = run(t.r, t.c, dr, dc);
      if (cells.length >= 2) words.push(cells);
    }
  } else {
    const [dr, dc] = rows.size === 1 ? [0, 1] : [1, 0];
    const main = run(tiles[0].r, tiles[0].c, dr, dc);
    if (!tiles.every((t) => main.some(([x, y]) => x === t.r && y === t.c))) return fail('Taşlar arasında boş kare bırakılamaz.');
    words.push(main);
    for (const t of tiles) {
      const cross = run(t.r, t.c, dc, dr);
      if (cross.length >= 2) words.push(cross);
    }
  }
  if (!words.length) return fail('Kelime en az iki harf olmalı.');

  const wordScore = (cells) => {
    let sum = 0, mult = 1;
    for (const [r, c] of cells) {
      const cell = grid[r][c];
      let v = cell.blank ? 0 : VAL.get(cell.ch);
      if (isNew(r, c)) {
        const p = premium(r, c);
        if (p === 't') v *= 3;
        else if (p === 'd') v *= 2;
        else if (p === 'T') mult *= 3;
        else if (p === 'D' || p === '*') mult *= 2;
      }
      sum += v;
    }
    return sum * mult;
  };

  const out = words.map((cells) => ({
    text: cells.map(([r, c]) => grid[r][c].ch).join(''),
    cells,
    score: wordScore(cells),
  }));
  const bingo = tiles.length === RACK;
  const score = out.reduce((sum, w) => sum + w.score, 0) + (bingo ? BINGO : 0);
  return { words: out, score, bingo };
}

// Durum kopyası üzerinde çalışır (s zaten klon). Hata durumunda { error } döner.
function doPlay(s, seats, idx, raw) {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > RACK) return fail('Geçersiz yerleşim.');
  const rack = s.players[idx].rack.slice();
  const tiles = [];
  const seen = new Set();
  for (const t of raw) {
    if (!t || !Number.isInteger(t.r) || !Number.isInteger(t.c) || !inb(t.r, t.c)) return fail('Geçersiz kare.');
    const key = t.r * N + t.c;
    if (seen.has(key)) return fail('Aynı kareye iki taş konamaz.');
    seen.add(key);
    if (s.board[t.r][t.c]) return fail('Dolu kareye taş konamaz.');
    const ch = up(t.ch);
    if (!LETTERS.has(ch)) return fail('Geçersiz harf.');
    const blank = t.blank === true;
    const i = rack.indexOf(blank ? JOKER : ch);
    if (i < 0) return fail(blank ? 'Rafınızda joker yok.' : `Rafınızda ${ch} harfi yok.`);
    rack.splice(i, 1);
    tiles.push({ r: t.r, c: t.c, ch, blank });
  }

  const first = s.board.every((row) => row.every((cell) => !cell));
  if (first) {
    if (!seen.has(7 * N + 7)) return fail('İlk hamle merkez kareden geçmeli.');
  } else {
    const touches = tiles.some((t) => [[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dr, dc]) => {
      const x = t.r + dr, y = t.c + dc;
      return inb(x, y) && s.board[x][y];
    }));
    if (!touches) return fail('Kelime mevcut taşlara bağlanmalı.');
  }

  const res = analyze(s.board, tiles);
  if (res.error) return fail(res.error);

  // Geri alma için hamle öncesi durum (taşlar, torba, paralar, puansız sayaç).
  const undo = structuredClone({ board: s.board, bag: s.bag, scoreless: s.scoreless, players: s.players });
  for (const t of tiles) s.board[t.r][t.c] = { ch: t.ch, blank: t.blank };
  const me = s.players[idx];
  me.rack = rack;
  while (me.rack.length < RACK && s.bag.length) me.rack.push(s.bag.shift());
  me.score += res.score;
  s.scoreless = res.score > 0 ? 0 : s.scoreless + 1;
  const end = me.rack.length === 0 && s.bag.length === 0;
  const words = res.words.map((w) => w.text);
  s.pending = { by: idx, undo, words, score: res.score, end };
  s.lastMove = { by: idx, tiles, words, score: res.score, bingo: res.bingo, pass: false };
  s.turn = nextTurn(seats, idx);
  s.msg = `${me.name} ${words.join(', ')} ile ${res.score} puan aldı.`;
  return s;
}

function doPass(s, seats, idx) {
  s.scoreless += 1;
  s.lastMove = { by: idx, tiles: [], words: [], score: 0, bingo: false, pass: true };
  s.msg = `${s.players[idx].name} pas geçti.`;
  if (s.scoreless >= END_PASSES) return finish(s, -1, 'Art arda puansız turlar oldu.');
  s.turn = nextTurn(seats, idx);
  return s;
}

function doSwap(s, seats, idx, idxs) {
  const rack = s.players[idx].rack;
  if (!Array.isArray(idxs) || idxs.length < 1 || idxs.length > RACK || new Set(idxs).size !== idxs.length
    || idxs.some((i) => !Number.isInteger(i) || i < 0 || i >= rack.length)) return fail('Geçersiz taş seçimi.');
  if (s.bag.length < SWAP_MIN_BAG) return fail(`Torbada en az ${SWAP_MIN_BAG} taş yokken değişim yapılamaz.`);
  const out = idxs.map((i) => rack[i]);
  s.players[idx].rack = rack.filter((_, i) => !idxs.includes(i));
  s.bag.push(...out);
  shuffle(s.bag);
  while (s.players[idx].rack.length < RACK && s.bag.length) s.players[idx].rack.push(s.bag.shift());
  s.scoreless += 1;
  s.lastMove = { by: idx, tiles: [], words: [], score: 0, bingo: false, pass: true };
  s.msg = `${s.players[idx].name} taşlarını değiştirdi.`;
  if (s.scoreless >= END_PASSES) return finish(s, -1, 'Art arda puansız turlar oldu.');
  s.turn = nextTurn(seats, idx);
  return s;
}

// Oyun sonu: kalan taşların değeri kendi sahibinden düşer; taşları biten oyuncu (goer) diğerlerinin toplamını alır.
function finish(s, goer, reason) {
  let bonus = 0;
  s.players.forEach((p, i) => {
    const v = pts(p.rack);
    p.score -= v;
    if (i !== goer) bonus += v;
    p.rack = [];
  });
  if (goer >= 0) s.players[goer].score += bonus;
  const best = Math.max(...s.players.map((p) => p.score));
  const winners = s.players.filter((p) => p.score === best).map((p) => p.name);
  s.over = `${reason} Kazanan: ${winners.join(' ve ')}.`;
  s.msg = s.over;
  s.pending = null;
  s.vote = null;
  return s;
}

// Oylama sonucu. invalid=true: hamle geri alınır; false: hamle geçerli, itiraz eden ceza alır.
function resolve(s, invalid) {
  const p = s.pending;
  const v = s.vote;
  s.vote = null;
  s.pending = null;
  const words = p.words.join(', ');
  if (invalid) {
    s.board = p.undo.board;
    s.bag = p.undo.bag;
    s.scoreless = p.undo.scoreless;
    s.players = p.undo.players;
    s.lastMove = null;
    s.msg = `${words} geçersiz sayıldı; hamle geri alındı.`;
    return s;
  }
  s.players[v.challenger].score -= CHALLENGE_PENALTY;
  s.msg = `${words} geçerli. İtiraz eden ${s.players[v.challenger].name} ${CHALLENGE_PENALTY} puan kaybetti.`;
  return p.end ? finish(s, p.by, 'Son hamle geçerli bulundu.') : s;
}

function doChallenge(s, seats, idx) {
  if (!s.pending) return fail('İtiraz edilecek hamle yok.');
  if (s.vote) return fail('Oylama zaten sürüyor.');
  if (idx === s.pending.by) return fail('Kendi hamlenize itiraz edemezsiniz.');
  const eligible = seats.map((_, i) => i).filter((i) => !seats[i].left && i !== s.pending.by);
  s.vote = { challenger: idx, eligible, yes: {}, endsAt: Date.now() + VOTE_MS };
  s.msg = `${s.players[idx].name} "${s.pending.words.join(', ')}" kelimesine itiraz etti.`;
  return s;
}

// Oy çoğunluğu: geçersiz oy sayısı oyuncu sayısının yarısından fazlaysa geçersiz; aksi halde (eşitlik dahil) geçerli.
function decide(s) {
  const v = s.vote;
  const n = v.eligible.length;
  const vals = Object.values(v.yes);
  const inv = vals.filter((x) => x === false).length;
  const val = vals.filter((x) => x === true).length;
  if (inv * 2 > n) return resolve(s, true);
  if (val * 2 >= n) return resolve(s, false);
  return s;
}

function doVote(s, seats, idx, yes) {
  if (!s.vote) return fail('Oylama yok.');
  if (!s.vote.eligible.includes(idx)) return fail('Bu oylamada oy kullanamazsınız.');
  if (s.vote.yes[idx] !== undefined) return fail('Zaten oy verdiniz.');
  s.vote.yes[idx] = yes;
  return decide(s);
}

// Süre dolunca: oy vermeyenler "geçerli" sayılır.
function doTimeout(s) {
  if (!s.vote) return fail('Oylama yok.');
  if (Date.now() < s.vote.endsAt) return fail('Oylama süresi dolmadı.');
  const inv = Object.values(s.vote.yes).filter((x) => x === false).length;
  return resolve(s, inv * 2 > s.vote.eligible.length);
}

// Bekleyen hamleyi açıkça onaylar (sıradaki oyuncu hamle yapınca da otomatik onaylanır).
function doCommit(s) {
  if (!s.pending) return fail('Onaylanacak hamle yok.');
  const p = s.pending;
  s.pending = null;
  if (p.end) return finish(s, p.by, 'Taşlar bitti.');
  s.msg = 'Hamle onaylandı.';
  return s;
}

// Oyun eylemleri. type: scplay | scpass | scswap | scchallenge | scvote | sctimeout | sccommit.
export function act(g, seats, idx, type, a = {}) {
  if (!g) return fail('Oyun başlamadı.');
  if (g.over) return fail('Oyun bitti.');
  if (idx < 0 || idx >= g.players.length || seats[idx]?.left) return fail('Oyunda değilsiniz.');
  const s = structuredClone(g);
  if (s.vote && type !== 'scvote' && type !== 'sctimeout') return fail('İtiraz oylaması sürüyor.');
  switch (type) {
    case 'scplay':
    case 'scpass':
    case 'scswap': {
      if (s.turn !== idx) return fail('Sıra sizde değil.');
      if (s.pending) {
        if (s.pending.end) return fail('Son hamle onaylanmalı.');
        s.pending = null; // sıradaki oyuncu hamle yaptı: önceki hamle artık itiraz edilemez
      }
      if (type === 'scplay') return doPlay(s, seats, idx, a.tiles);
      if (type === 'scpass') return doPass(s, seats, idx);
      return doSwap(s, seats, idx, a.idxs);
    }
    case 'scchallenge': return doChallenge(s, seats, idx);
    case 'scvote': return doVote(s, seats, idx, a.yes === true);
    case 'sctimeout': return doTimeout(s);
    case 'sccommit': return doCommit(s);
    default: return fail('Bilinmeyen işlem.');
  }
}

// Koltuktan ayrılan oyuncu: taşları torbaya döner; sırası ona geldiyse sıra ilerler. Oylamadaki oyu düşer.
export function onLeave(g, seats, idx) {
  if (!g || g.over) return g;
  const s = structuredClone(g);
  const p = s.players[idx];
  if (p) {
    s.bag.push(...p.rack);
    p.rack = [];
    shuffle(s.bag);
  }
  if (seats.filter((x) => !x.left).length < 2) return finish(s, -1, 'Rakipler masadan ayrıldı.');
  if (s.turn === idx) s.turn = nextTurn(seats, idx);
  if (s.vote && s.vote.eligible.includes(idx)) {
    s.vote.eligible = s.vote.eligible.filter((i) => i !== idx);
    if (!s.vote.eligible.length) return resolve(s, false);
    return decide(s);
  }
  return s;
}

// İstemciye giden görünüm: yalnızca kendi rafı; torba ve diğer raflar yalnızca adet olarak.
export function viewFor(g, me) {
  if (!g) return null;
  return {
    board: g.board,
    players: g.players.map((p, i) => ({ name: p.name, score: p.score, count: p.rack.length, turn: i === g.turn && !g.over })),
    me,
    myRack: me >= 0 && g.players[me] ? g.players[me].rack : [],
    bag: g.bag.length,
    turn: g.turn,
    over: g.over,
    scoreless: g.scoreless,
    msg: g.msg,
    lastMove: g.lastMove,
    pending: g.pending ? { by: g.pending.by, words: g.pending.words, score: g.pending.score, end: g.pending.end } : null,
    vote: g.vote
      ? {
        challenger: g.vote.challenger,
        eligible: g.vote.eligible,
        words: g.pending ? g.pending.words : [],
        valid: Object.values(g.vote.yes).filter((x) => x === true).length,
        invalid: Object.values(g.vote.yes).filter((x) => x === false).length,
        myVote: me >= 0 && g.vote.yes[me] !== undefined ? g.vote.yes[me] : null,
        // Kalan süre (ms): istemci saatinden bağımsız olsun diye mutlak zaman yerine gönderilir.
        leftMs: Math.max(0, g.vote.endsAt - Date.now()),
      }
      : null,
  };
}

export const pointsOf = (ch) => (ch === JOKER ? 0 : VAL.get(ch) ?? 0);
