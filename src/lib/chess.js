// Satranç kuralları (FIDE Satranç Kanunları 2023 esas alınmıştır).
// Tahta 8x8 dizi: 'wP', 'bK' gibi, boş kare null. y=0 siyahın ilk sırası, y=7 beyazın ilk sırası.
//
// Otomatik sonlanmalar: şah mat, pat (durma), ölü pozisyon (yetersiz materyal), beşinci tekrar (5.),
// 75 hamle kuralı (150 yarım hamle). Talep edilebilenler (talep edilmeden bitmez): üçlü tekrar,
// 50 hamle kuralı, beraberlik teklifi. Teslim (terk) de act() ile yapılır.
//
// Hamle bağlamı (ctx): { castle: { wK, wQ, bK, bQ }, ep: [y, x] | null }
//   castle: o rok hâlâ yapılabilir mi (şah ya da kale oynamadıysa);
//   ep: bir önceki hamle piyon çift adımıysa, atlanan kare (geçerken alma hedefi).
const BACK = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
const inb = (y, x) => y >= 0 && y < 8 && x >= 0 && x < 8;

export const PROMO = ['Q', 'R', 'B', 'N'];
export const PIECE_TR = { Q: 'Vezir', R: 'Kale', B: 'Fil', N: 'At' };
export const ALL_CASTLE = { wK: true, wQ: true, bK: true, bQ: true };
const NOCTX = { castle: { wK: false, wQ: false, bK: false, bQ: false }, ep: null };
const NOCLAIM = { threefold: false, fifty: false };

export const startBoard = () => [
  BACK.map((p) => 'b' + p),
  Array(8).fill('bP'),
  ...Array.from({ length: 4 }, () => Array(8).fill(null)),
  Array(8).fill('wP'),
  BACK.map((p) => 'w' + p),
];

// Eski kayıtlarda (rok/ep/sayaç alanı yokken başlamış oyunlar) varsayılanlarla çalışır.
export const ctxOf = (g) => ({ castle: g.castle ?? ALL_CASTLE, ep: g.ep ?? null });

// Kendi şahını açıkta bırakma kuralına bakmadan taşın gidebileceği kareler (rok hariç).
export function pseudo(b, r, c, ctx = NOCTX) {
  const p = b[r][c];
  const col = p[0], t = p[1], out = [];
  const add = (y, x) => {
    if (!inb(y, x)) return false;
    const q = b[y][x];
    if (q && q[0] === col) return false;
    out.push([y, x]);
    return !q;
  };
  const slide = (ds) => {
    for (const [dy, dx] of ds) {
      let y = r + dy, x = c + dx;
      while (add(y, x)) { y += dy; x += dx; }
    }
  };
  const ROOK = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const BISHOP = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  if (t === 'N') for (const [dy, dx] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) add(r + dy, c + dx);
  else if (t === 'K') for (const [dy, dx] of [...ROOK, ...BISHOP]) add(r + dy, c + dx);
  else if (t === 'R') slide(ROOK);
  else if (t === 'B') slide(BISHOP);
  else if (t === 'Q') slide([...ROOK, ...BISHOP]);
  else {
    const dy = col === 'w' ? -1 : 1;
    const home = col === 'w' ? 6 : 1;
    if (inb(r + dy, c) && !b[r + dy][c]) {
      out.push([r + dy, c]);
      if (r === home && !b[r + 2 * dy][c]) out.push([r + 2 * dy, c]);
    }
    for (const dx of [-1, 1]) {
      const q = inb(r + dy, c + dx) && b[r + dy][c + dx];
      if (q && q[0] !== col) out.push([r + dy, c + dx]);
      // geçerken alma: rakibin az önce çift adım attığı piyonun atladığı kareye çapraz gidiş
      else if (!q && ctx.ep && ctx.ep[0] === r + dy && ctx.ep[1] === c + dx) out.push([r + dy, c + dx]);
    }
  }
  return out;
}

export function inCheck(b, col) {
  let ky = -1, kx = -1;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (b[y][x] === col + 'K') { ky = y; kx = x; }
  const en = col === 'w' ? 'b' : 'w';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const p = b[y][x];
      if (!p || p[0] !== en) continue;
      if (p[1] === 'P') {
        const dy = en === 'w' ? -1 : 1;
        if (y + dy === ky && Math.abs(x - kx) === 1) return true;
      } else if (pseudo(b, y, x).some(([a, c]) => a === ky && c === kx)) return true;
    }
  }
  return false;
}

// Hamleyi uygular. Şah iki kare giderse rok (kale de taşınır), piyon boş kareye çapraz giderse
// geçerken alma (atlanan piyon kaldırılır), piyon son sıraya ulaşırsa seçilen taşa (promo) dönüşür.
export function move(b, fy, fx, ty, tx, promo = 'Q') {
  const nb = b.map((row) => row.slice());
  let p = nb[fy][fx];
  if (p[1] === 'K' && Math.abs(tx - fx) === 2) {
    const rx = tx > fx ? 7 : 0, nx = tx > fx ? 5 : 3;
    nb[fy][nx] = nb[fy][rx];
    nb[fy][rx] = null;
  }
  if (p[1] === 'P' && fx !== tx && !nb[ty][tx]) nb[fy][tx] = null;
  if (p[1] === 'P' && (ty === 0 || ty === 7)) p = p[0] + (PROMO.includes(promo) ? promo : 'Q');
  nb[ty][tx] = p;
  nb[fy][fx] = null;
  return nb;
}

// Yasal hamleler: şahı açıkta bırakmayanlar + rok (şah tehdit altında değilse, geçtiği ve vardığı kare güvenliyse).
export function legal(b, y, x, ctx = NOCTX) {
  const p = b[y][x], col = p[0];
  const out = pseudo(b, y, x, ctx).filter(([ty, tx]) => !inCheck(move(b, y, x, ty, tx), col));
  if (p[1] === 'K' && x === 4 && y === (col === 'w' ? 7 : 0) && !inCheck(b, col)) {
    const safe = (tx) => !inCheck(move(b, y, x, y, tx), col);
    if (ctx.castle[col + 'K'] && b[y][7] === col + 'R' && !b[y][5] && !b[y][6] && safe(5) && safe(6)) out.push([y, 6]);
    if (ctx.castle[col + 'Q'] && b[y][0] === col + 'R' && !b[y][1] && !b[y][2] && !b[y][3] && safe(3) && safe(2)) out.push([y, 2]);
  }
  return out;
}

export function hasMoves(b, col, ctx = NOCTX) {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (b[y][x]?.[0] === col && legal(b, y, x, ctx).length) return true;
  return false;
}

// Piyon son sıraya mı gidiyor (terfi seçimi gerekir mi)?
export const isPromotion = (g, fy, fx, ty) => g.board[fy]?.[fx]?.[1] === 'P' && (ty === 0 || ty === 7);

// Ölü pozisyon (FIDE 5.2.2): hiçbir taraf rakibi matlayamaz. Taş yoksa, tek hafif taş kalmışsa,
// ya da yalnız fillerin hepsi aynı renk karede ise (hafif taşlar yalnız fil) berabere.
export function deadPosition(b) {
  const minors = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const p = b[y][x];
    if (!p || p[1] === 'K') continue;
    if (p[1] === 'P' || p[1] === 'R' || p[1] === 'Q') return false;
    minors.push({ t: p[1], sq: (y + x) % 2 });
  }
  if (minors.length <= 1) return true;
  return minors.every((m) => m.t === 'B' && m.sq === minors[0].sq);
}

// Konum anahtarı (FIDE 9.2.3): taşlar, sırası gelen taraf, rok hakları ve kullanılabilir geçerken alma.
export function keyOf(b, turn, castle, ep) {
  const rows = b.map((r) => r.map((p) => p || '.').join('')).join('/');
  const rights = ['wK', 'wQ', 'bK', 'bQ'].filter((k) => castle[k]).join('') || '-';
  return `${rows} ${turn} ${rights} ${ep ? ep.join(',') : '-'}`;
}

// Geçerken alma gerçekten yapılabiliyorsa atlanan kare, yoksa null (tekrar karşılaştırması için).
function epUsable(b, turn, castle, ep) {
  if (!ep) return null;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    if (b[y][x] === turn + 'P' && legal(b, y, x, { castle, ep }).some(([ty, tx]) => ty === ep[0] && tx === ep[1])) return ep;
  }
  return null;
}

// ---- Oyun durumu: tek telefonda da masada (sunucuda) da aynı işlevler kullanılır ----
const FILES = 'abcdefgh';
const NAMES = { w: 'Beyaz', b: 'Siyah' };

export const newGame = () => {
  const board = startBoard();
  return {
    board, turn: 'w', over: null, draw: false, winner: null, last: null,
    lost: { w: [], b: [] }, moves: [], castle: { ...ALL_CASTLE }, ep: null,
    clock: 0, reps: { [keyOf(board, 'w', ALL_CASTLE, null)]: 1 }, claim: NOCLAIM, offer: null,
  };
};

// Hamleyi doğrular ve uygular; geçersizse { error } döner.
// names: sonuç yazısında kullanılacak adlar. promo: piyon terfisinde seçilen taş (Q, R, B, N; varsayılan vezir).
export function play(g, fy, fx, ty, tx, names = NAMES, promo = 'Q') {
  if (g.over) return { error: 'Oyun bitti.' };
  const piece = g.board[fy]?.[fx];
  if (!piece || piece[0] !== g.turn) return { error: 'Bu taşı oynayamazsınız.' };
  const ctx = ctxOf(g);
  if (!legal(g.board, fy, fx, ctx).some(([a, b]) => a === ty && b === tx)) return { error: 'Geçersiz hamle.' };

  const col = piece[0], home = col === 'w' ? 7 : 0;
  const enPassant = piece[1] === 'P' && fx !== tx && !g.board[ty][tx];
  const taken = enPassant ? g.board[fy][tx] : g.board[ty][tx];
  const castling = piece[1] === 'K' && Math.abs(tx - fx) === 2;
  const pr = isPromotion(g, fy, fx, ty) ? (PROMO.includes(promo) ? promo : 'Q') : null;

  // rok hakları: şah ya da kale oynadıysa, ya da kale kendi köşesinde alındıysa kaybolur
  const castle = { ...ctx.castle };
  if (piece[1] === 'K') { castle[col + 'K'] = false; castle[col + 'Q'] = false; }
  if (piece[1] === 'R' && fy === home) { if (fx === 7) castle[col + 'K'] = false; if (fx === 0) castle[col + 'Q'] = false; }
  if (taken && taken[1] === 'R') {
    const eh = taken[0] === 'w' ? 7 : 0;
    if (ty === eh) { if (tx === 7) castle[taken[0] + 'K'] = false; if (tx === 0) castle[taken[0] + 'Q'] = false; }
  }
  const ep = piece[1] === 'P' && Math.abs(ty - fy) === 2 ? [(fy + ty) / 2, fx] : null;

  const board = move(g.board, fy, fx, ty, tx, pr || 'Q');
  const turn = col === 'w' ? 'b' : 'w';

  // 50 hamle sayacı: piyon hareketi ya da alma olunca sıfırlanır; tekrar tablosu da o zaman sıfırlanır.
  const clock = piece[1] === 'P' || taken ? 0 : (g.clock ?? 0) + 1;
  const key = keyOf(board, turn, castle, epUsable(board, turn, castle, ep));
  const reps = clock === 0 ? {} : { ...(g.reps ?? {}) };
  reps[key] = (reps[key] || 0) + 1;

  const check = inCheck(board, turn);
  const mate = !hasMoves(board, turn, { castle, ep });
  let over = null, draw = false, winner = null;
  if (mate) {
    if (check) { over = `Şah mat! ${names[col]} kazandı.`; winner = col; }
    else { over = 'Pat: berabere.'; draw = true; }
  } else if (deadPosition(board)) {
    over = 'Yetersiz materyal (ölü pozisyon): berabere.'; draw = true;
  } else if (reps[key] >= 5) {
    over = 'Beşinci tekrar: otomatik berabere.'; draw = true;
  } else if (clock >= 150) {
    over = '75 hamle kuralı: otomatik berabere.'; draw = true;
  }
  // Talep edilebilen berabereliklerin koşulları (sıradaki oyuncu talep edebilir).
  const claim = over ? NOCLAIM : { threefold: reps[key] >= 3, fifty: clock >= 100 };

  const PN = { K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N', P: '' };
  let text = castling ? (tx > fx ? 'O-O' : 'O-O-O')
    : `${PN[piece[1]]}${FILES[fx]}${8 - fy}${taken ? '×' : '–'}${FILES[tx]}${8 - ty}${pr ? '=' + pr : ''}${enPassant ? ' e.p.' : ''}`;
  if (check) text += mate ? '#' : '+';

  return {
    board, turn, over, draw, winner, last: [fy, fx, ty, tx], castle, ep, clock, reps, claim, offer: null,
    lost: taken ? { ...g.lost, [taken[0]]: [...g.lost[taken[0]], taken[1]] } : g.lost,
    moves: [...g.moves, text],
  };
}

// Oyun dışı eylemler: beraberlik teklifi/kabul/red, talep edilen berabere, teslim.
// col: eylemi yapan taraf. Kabul/red için col, teklifi yapanın karşısındaki taraftır.
export function act(g, col, type, names = NAMES) {
  if (g.over) return { error: 'Oyun bitti.' };
  const opp = col === 'w' ? 'b' : 'w';
  const ended = (over, extra = {}) => ({ ...g, over, draw: !!extra.draw, winner: extra.winner ?? null, offer: null });
  switch (type) {
    case 'offer':
      if (g.offer) return { error: 'Bekleyen bir beraberlik teklifi var.' };
      return { ...g, offer: col };
    case 'decline':
      if (!g.offer || g.offer === col) return { error: 'Reddedilecek teklif yok.' };
      return { ...g, offer: null };
    case 'accept':
      if (!g.offer || g.offer === col) return { error: 'Kabul edilecek teklif yok.' };
      return ended('Beraberlik teklifi kabul edildi: berabere.', { draw: true });
    case 'claim':
      if (col !== g.turn) return { error: 'Berabere ilan etmek için sıra sizde olmalı.' };
      if (!g.claim?.threefold && !g.claim?.fifty) return { error: 'Şu an berabere ilan etmek için koşul yok.' };
      return ended(g.claim.threefold ? 'Üçlü tekrar: berabere ilan edildi.' : '50 hamle kuralı: berabere ilan edildi.', { draw: true });
    case 'resign':
      return ended(`${names[col]} teslim oldu. ${names[opp]} kazandı.`, { winner: opp });
    default:
      return { error: 'Bilinmeyen işlem.' };
  }
}
