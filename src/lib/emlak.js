// Emlak Krallığı: resmi tahta oyunu kurallarının uygulaması (Hasbro klasik kural kitabı).
// 24 kareli tahta (telefon için); renk grupları, tek renk bonusu (2 kat kira), ev/otel (eşit inşa, 5. ev = otel),
// ipotek (yarı değer; kaldırırken %10 faiz), garlar (25/50/100/200), işletmeler (zarın 4x / 10x'i),
// Şans / Kamu Fonu desteleri (hapisten çıkma kartı desteye geri döner), hapis (3 deneme, çift zar
// çıkışı, 3 çift = hapis), satın almayınca açık artırma, iflas (borç alacaklıya, yoksa bankaya).
// Akış: zar -> (hapis/kart/kira/satın alma) -> sıra devri. Çift atan tekrar atar.
// Tüm paralar PARA_CARPANI ile ölçeklenir (fiyat/kira tablosu resmi değerlerle aynı oran).
//
// Her eylem (roll, buy, skipBuy, bid, passBid, payJail, useJailCard, forfeit) yeni durum nesnesini döndürür.
// Geçersiz bir eylemde durum değişmez; yalnızca msg, nedenini anlatan bir metinle güncellenir.
export const PARA_CARPANI = 100;
export const fmt = (n) => `₺${Math.round(n).toLocaleString('tr-TR')}`;
const X = (n) => n * PARA_CARPANI;
export const GO_PRIMI = X(150);
export const JAIL_KEFARET = X(50);
// Açık artırmada hazır teklif artışları (gerçek parayla değil, oyun parası).
export const BID_STEPS = [X(10), X(50), X(100)];

// Renk grupları ve tahta renkleri.
export const GROUPS = {
  kahve: '#8b5a2b', acikmavi: '#4fb3e8', pembe: '#e0559b', turuncu: '#f08a24',
  kirmizi: '#d64545', sari: '#e8c230', yesil: '#2e9e5b', lacivert: '#1d2a8f',
};
// Oyuncunun seçtiği piyon simgeleri (oyuna girerken seçilir).
export const TOKENS = ['🚗', '🎩', '🐕', '🚢', '🐈', '🛵', '👢', '🦆'];
export const COLORS = ['#2438e8', '#c0261e', '#1f9d6b', '#d98a00'];
// Masalarda 10 kişiye kadar oyuncu rengi (ilk dördü taş renkleriyle aynı).
export const PALETTE = [...COLORS, '#8a3fd1', '#0e8fa8', '#d6407f', '#5a6b1f', '#7a4b2a', '#3a4a7a'];

const P = (n, group, price, rent, rents, hc) => ({ t: 'p', n, group, price: X(price), rent: X(rent), rents: rents.map(X), hc: X(hc) });
const RR = (n) => ({ t: 'rr', n, price: X(200) });
const U = (n) => ({ t: 'util', n, price: X(150) });
const CH = (n) => ({ t: 'chance', n });
const CC = (n) => ({ t: 'chest', n });

// Telefon için kısaltılmış 24 kareli tahta: 4 köşe, 14 mülk (7 renk grubu, her grupta 2), 2 gar, 2 Şans, 2 Kamu Fonu.
// Tapu ve kira değerleri resmi tablodan alınmıştır; isimler Türkiye şehirleridir.
export const TILES = [
  { t: 'go', n: 'Başlangıç' },
  P('Kahramanmaraş', 'kahve', 60, 2, [10, 30, 90, 160, 250], 50),
  CC('Kamu Fonu'),
  P('Şanlıurfa', 'kahve', 60, 4, [20, 60, 180, 320, 450], 50),
  RR('Haydarpaşa Garı'),
  P('Mersin', 'acikmavi', 100, 6, [30, 90, 270, 400, 550], 50),
  { t: 'jail', n: 'Hapishane' },
  P('Antalya', 'acikmavi', 120, 8, [40, 100, 300, 450, 600], 50),
  CH('Şans'),
  P('Bursa', 'pembe', 140, 10, [50, 150, 450, 625, 750], 100),
  P('İzmir', 'pembe', 160, 12, [60, 180, 500, 700, 900], 100),
  RR('Ankara Garı'),
  { t: 'park', n: 'Serbest Park' },
  P('Ankara', 'turuncu', 180, 14, [70, 200, 550, 750, 950], 100),
  CC('Kamu Fonu'),
  P('Konya', 'turuncu', 200, 16, [80, 220, 600, 800, 1000], 100),
  P('Samsun', 'kirmizi', 220, 18, [90, 250, 700, 875, 1050], 150),
  CH('Şans'),
  { t: 'gojail', n: 'Hapse Git' },
  P('Trabzon', 'kirmizi', 240, 20, [100, 300, 750, 925, 1100], 150),
  P('Bodrum', 'sari', 260, 22, [110, 330, 800, 975, 1150], 150),
  P('Kaş', 'sari', 280, 24, [120, 360, 850, 1025, 1200], 150),
  P('Göcek', 'lacivert', 350, 35, [175, 500, 1100, 1300, 1500], 200),
  P('Nişantaşı', 'lacivert', 400, 50, [200, 600, 1400, 1700, 2000], 200),
];

const idxOf = (pred) => TILES.flatMap((t, i) => (pred(t) ? [i] : []));
const JAIL_POS = TILES.findIndex((t) => t.t === 'jail');
const RRS = idxOf((t) => t.t === 'rr');
const UTILS = idxOf((t) => t.t === 'util');
const RR_RENT = [25, 50, 100, 200];
// Gar kirası tablosu (oyun parası biçiminde), arayüzde gösterim için.
export const RR_RENTS = RR_RENT.map(X);

// Şans destesi: metinler, tutarlarla birebir (X(n) = n*100 oyun parası; ekranda ₺ ile gösterilir).
const CHANCE_DECK = [
  { txt: 'Başlangıç karesine ilerle, 15.000₺ al.', goto: 0 },
  { txt: 'Hapse gidin!', gotoJail: true },
  { txt: 'Hapisten çıkma kartı. Saklayın ya da kullanın.', jailCard: true },
  { txt: 'Trabzon’a ilerleyin.', goto: TILES.findIndex((t) => t.n === 'Trabzon') },
  { txt: 'Bursa’ya ilerleyin.', goto: TILES.findIndex((t) => t.n === 'Bursa') },
  { txt: 'En yakın Gara ilerleyin ve sahibine çift kira ödeyin. Sahibiyse satın alabilirsiniz.', nearestRR: true },
  { txt: 'Banka temettü ödüyor: 5.000₺ alın.', money: X(50) },
  { txt: 'Genel onarım: her ev için 2.500₺, her otel için 10.000₺ ödeyin.', perHouse: X(25), perHotel: X(100) },
  { txt: '3 kare geri gidin.', back3: true },
  { txt: 'Yoksulluk vergisi: 1.500₺ ödeyin.', money: -X(15) },
  { txt: 'Başkan seçildiniz: her oyuncuya 5.000₺ ödeyin.', each: X(50) },
  { txt: 'Yapı kredisi ödendi: 15.000₺ alın.', money: X(150) },
  { txt: 'Haydarpaşa Garı’na gidin.', goto: TILES.findIndex((t) => t.n === 'Haydarpaşa Garı') },
  { txt: 'Nişantaşı’na yürüyün.', goto: TILES.length - 1 },
  { txt: 'Hız cezası: 1.500₺ ödeyin.', money: -X(15) },
];
const CHEST_DECK = [
  { txt: 'Banka hatası lehinize: 20.000₺ alın.', money: X(200) },
  { txt: 'Doktor ücreti: 5.000₺ ödeyin.', money: -X(50) },
  { txt: 'Hapisten çıkma kartı. Saklayın ya da kullanın.', jailCard: true },
  { txt: 'Hapse gidin!', gotoJail: true },
  { txt: 'Tatil fonunuz ödendi: 10.000₺ alın.', money: X(100) },
  { txt: 'Gelir vergisi iadesi: 2.000₺ alın.', money: X(20) },
  { txt: 'Doğum gününüz: her oyuncudan 1.000₺ alın.', each: X(10), collect: true },
  { txt: 'Hayat sigortanız ödendi: 10.000₺ alın.', money: X(100) },
  { txt: 'Hastane ücreti: 10.000₺ ödeyin.', money: -X(100) },
  { txt: 'Okul ücreti: 5.000₺ ödeyin.', money: -X(50) },
  { txt: 'Danışmanlık geliri: 2.500₺ alın.', money: X(25) },
  { txt: 'Cadde tadilatı: her ev için 4.000₺, her otel için 11.500₺ ödeyin.', perHouse: X(40), perHotel: X(115) },
  { txt: 'Başlangıç karesine ilerle, 15.000₺ al.', goto: 0 },
  { txt: 'Miras kaldı: 10.000₺ alın.', money: X(100) },
  { txt: 'Güzellik yarışmasında ikinci oldunuz: 1.000₺ alın.', money: X(10) },
  { txt: 'Hisse satış geliri: 5.000₺ alın.', money: X(50) },
];
const JAIL_CARD = { chance: CHANCE_DECK.findIndex((c) => c.jailCard), chest: CHEST_DECK.findIndex((c) => c.jailCard) };

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const rnd2 = () => [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];

export function newGame(count, toks = []) {
  return {
    // cards: elde tutulan hapisten çıkma kartlarının destesi adları ('chance' | 'chest').
    players: Array.from({ length: count }, (_, i) => ({ name: `Oyuncu ${i + 1}`, tok: Number.isInteger(toks[i]) ? toks[i] : i, money: X(1000), pos: 0, jail: 0, cards: [], out: false })),
    owner: {}, houses: {}, mort: [],
    chance: shuffle(CHANCE_DECK.map((_, i) => i)), chest: shuffle(CHEST_DECK.map((_, i) => i)),
    // phase: 'roll' (zar / hapiste deneme), 'buy' (satın alma kararı), 'auction', 'over'.
    turn: 0, phase: 'roll', dice: null, lastRoll: 0, dbl: 0, again: false,
    auction: null, winner: null, msg: 'Oyuncu 1 zar atsın.',
  };
}

// ---- Yardımcılar ----

const reject = (g, text) => ({ ...g, msg: text });
const GROUP_TILES = Object.fromEntries(Object.keys(GROUPS).map((grp) => [grp, TILES.flatMap((t, i) => (t.group === grp ? [i] : []))]));
const groupTiles = (grp) => GROUP_TILES[grp];
const isMort = (g, i) => g.mort.includes(i);
const ownedBy = (g, o) => Object.keys(g.owner).filter((k) => g.owner[k] === o).map(Number);
export const ownsGroup = (g, grp, o) => groupTiles(grp).every((i) => g.owner[i] === o);
const isOwnable = (t) => !!t && (t.t === 'p' || t.t === 'rr' || t.t === 'util');

// Kira: resmi tablo. Boş arsa tek renkliyse 2 kat; evlerde tapu tablosu; gar kademeli; işletme zar katı.
// utilTen: şans kartında zarın her durumda 10 katı.
export function rentOf(g, idx, o, dice, utilTen = false) {
  const t = TILES[idx];
  if (!isOwnable(t) || isMort(g, idx)) return 0;
  if (t.t === 'rr') {
    const c = RRS.filter((i) => g.owner[i] === o && !isMort(g, i)).length;
    return c ? X(RR_RENT[Math.min(c, 4) - 1]) : 0;
  }
  if (t.t === 'util') {
    const c = UTILS.filter((i) => g.owner[i] === o && !isMort(g, i)).length;
    if (!c) return 0;
    const mult = utilTen || c === 2 ? 10 : 4;
    return mult * X(dice || g.lastRoll || 7);
  }
  const h = g.houses[idx] || 0;
  if (h > 0) return t.rents[h - 1];
  return ownsGroup(g, t.group, o) ? t.rent * 2 : t.rent;
}

// ---- Durum geçişleri (iç) ----

function checkWinner(g) {
  const alive = g.players.filter((p) => !p.out);
  if (alive.length <= 1) {
    g.phase = 'over'; g.auction = null;
    if (alive.length === 1) { g.winner = g.players.indexOf(alive[0]); g.msg += ` ${alive[0].name} kazandı!`; }
    return true;
  }
  return false;
}

function nextTurn(g) {
  if (checkWinner(g)) return;
  g.dbl = 0; g.again = false; g.auction = null;
  do g.turn = (g.turn + 1) % g.players.length; while (g.players[g.turn].out);
  g.phase = 'roll';
  g.msg += ` Sıra: ${g.players[g.turn].name}.`;
}

// Sıra bitince: çift attıysa aynı oyuncu tekrar atar (hapis, iflas ya da kart yüzünden değilse), yoksa sıra devreder.
function resolve(g) {
  if (g.phase === 'over') return;
  const p = g.players[g.turn];
  if (g.again && !p.out && p.jail === 0) {
    g.again = false; g.phase = 'roll';
    g.msg += ` ${p.name} çift attı, tekrar atıyor.`;
    return;
  }
  nextTurn(g);
}

// Zar sonrası: satın alma ya da açık artırma bekleniyorsa sıra bekletilir; değilse hemen çözülür.
function finishTurn(g, doubles) {
  if (g.phase === 'over') return;
  const p = g.players[g.turn];
  g.again = !!doubles && !p.out && p.jail === 0;
  if (g.phase === 'buy' || g.phase === 'auction') return;
  resolve(g);
}

function goToJail(g, i) {
  const p = g.players[i];
  p.pos = JAIL_POS;
  p.jail = 1; // 1 = henüz deneme yok; her başarısız denemede artar (3. denemede kefaret)
  g.dbl = 0;
}

// Mülkü bankaya değil alacaklıya devreder; alacaklı yoksa (bankaya borç/ayrılma) mülk sahipsiz kalır.
function bankrupt(g, i, to) {
  const p = g.players[i];
  p.out = true; p.money = 0; p.jail = 0;
  for (const k of Object.keys(g.owner)) {
    if (g.owner[k] !== i) continue;
    if (to !== undefined) g.owner[k] = to;
    else { delete g.owner[k]; delete g.houses[k]; g.mort = g.mort.filter((x) => x !== Number(k)); }
  }
  if (to !== undefined) g.players[to].cards.push(...p.cards);
  p.cards = [];
}

// Varlıklarını nakde çevir: önce evler (yarı değerine bankaya), sonra ipotek (yarı değerine bankaya).
// need: hedef nakit; Infinity verilirse mümkün olan her şey satılır/ipotek edilir.
function raise(g, i, need) {
  const p = g.players[i];
  for (;;) {
    if (p.money >= need) break;
    const cands = ownedBy(g, i).filter((x) => canSell(g, x, i));
    if (!cands.length) break;
    cands.sort((a, b) => (g.houses[b] || 0) - (g.houses[a] || 0));
    const idx = cands[0];
    p.money += TILES[idx].hc / 2;
    g.houses[idx]--;
    g.msg += ` ${TILES[idx].n}'daki bir bina satıldı.`;
  }
  for (const idx of ownedBy(g, i)) {
    if (p.money >= need) break;
    if (canMortgage(g, idx, i)) { doMortgage(g, idx, i); g.msg += ` ${TILES[idx].n} ipotek edildi.`; }
  }
}

// Ödeme: yetmezse nakde çevirme; yine yetmezse iflas (kalan nakit ve mülkler alacaklıya ya da bankaya). İflas olduysa true döner.
function pay(g, i, amount, to) {
  const p = g.players[i];
  if (amount <= 0) return false;
  if (p.money < amount) raise(g, i, amount);
  if (p.money >= amount) {
    p.money -= amount;
    if (to !== undefined) g.players[to].money += amount;
    return false;
  }
  raise(g, i, Infinity);
  if (to !== undefined) g.players[to].money += Math.max(p.money, 0);
  bankrupt(g, i, to);
  return true;
}

// Bir kareye gelince olanlar (kartlardan gelen ilerlemelerde de kullanılır). Dönüş: durum.
function landOn(g, msg, opt = {}) {
  const me = g.turn, p = g.players[me];
  const idx = p.pos, tile = TILES[idx];
  if (isOwnable(tile)) {
    const o = g.owner[idx];
    if (o === undefined) {
      g.phase = 'buy';
      msg += ` ${tile.n} satılık: ${fmt(tile.price)}.`;
    } else if (o !== me) {
      const rent = rentOf(g, idx, o, g.lastRoll, !!opt.utilTen) * (opt.rrTwice ? 2 : 1);
      if (rent > 0) {
        const broke = pay(g, me, rent, o);
        msg += ` ${g.players[o].name}'e ${fmt(rent)} kira ödedi${broke ? ' — iflas etti!' : ''}.`;
      } else {
        msg += ' Kira yok (ipotekli).';
      }
    } else {
      msg += ' (Kendi mülkünüz.)';
    }
  } else if (tile.t === 'tax') {
    const broke = pay(g, me, tile.amount);
    msg += ` ${fmt(tile.amount)} vergi ödedi${broke ? ' — iflas etti!' : ''}.`;
  } else if (tile.t === 'gojail') {
    goToJail(g, me);
    msg += ' Hapse gönderildi!';
  } else if (tile.t === 'chance' || tile.t === 'chest') {
    return drawCard(g, tile.t, msg);
  } else if (tile.t === 'go') {
    msg += ' Başlangıç karesi.';
  }
  g.msg = msg;
  return g;
}

// Kart çekme: üstten çek, etkiyi uygula; hapisten çıkma kartı oyuncuda kalır, diğerleri destenin sonuna döner.
function drawCard(g, type, msg) {
  const deck = g[type];
  const me = g.turn, p = g.players[me];
  if (!deck.length) { g.msg = `${msg} Deste boş.`; return g; }
  const ci = deck.shift();
  const card = (type === 'chance' ? CHANCE_DECK : CHEST_DECK)[ci];
  g.card = { deck: type, txt: card.txt };
  g.cardN = (g.cardN || 0) + 1;
  msg += ` ${type === 'chance' ? 'Şans' : 'Kamu Fonu'}: ${card.txt}`;
  if (card.jailCard) {
    p.cards.push(type);
    g.msg = `${msg} (Kartı aldınız.)`;
    return g;
  }
  deck.push(ci);
  if (card.goto !== undefined) {
    const old = p.pos;
    p.pos = card.goto;
    if (card.goto < old) p.money += GO_PRIMI;
    return landOn(g, msg);
  }
  if (card.gotoJail) { goToJail(g, me); g.msg = `${msg} Hapse girdiniz.`; return g; }
  if (card.nearestRR || card.nearestUtil) {
    const targets = card.nearestRR ? RRS : UTILS;
    const t = targets.find((x) => x > p.pos) ?? targets[0];
    if (t < p.pos) p.money += GO_PRIMI;
    p.pos = t;
    // Hizmet kartında zar yeniden atılır (zarın 10 katı kira için).
    if (card.nearestUtil) { const [d1, d2] = rnd2(); g.dice = [d1, d2]; g.lastRoll = d1 + d2; }
    return landOn(g, msg, { rrTwice: !!card.nearestRR, utilTen: !!card.nearestUtil });
  }
  if (card.back3) {
    p.pos = (p.pos + TILES.length - 3) % TILES.length;
    return landOn(g, msg);
  }
  let broke = false;
  if (card.money) {
    if (card.money > 0) p.money += card.money;
    else broke = pay(g, me, -card.money);
  }
  if (!broke && card.each) {
    for (let k = 0; k < g.players.length && !broke; k++) {
      if (k === me || g.players[k].out) continue;
      if (card.collect) pay(g, k, card.each, me); // herkes bu oyuncuya öder
      else if (pay(g, me, card.each, k)) broke = true; // bu oyuncu herkese öder
    }
  }
  if (!broke && card.perHouse) {
    let total = 0;
    for (const idx of ownedBy(g, me)) {
      const h = g.houses[idx] || 0;
      total += h === 5 ? card.perHotel : h * card.perHouse;
    }
    if (total > 0) broke = pay(g, me, total);
  }
  g.msg = `${msg}${broke ? ' — iflas etti!' : ''}`;
  return g;
}

function moveAndLand(g, me, steps, prefix = '') {
  const p = g.players[me], old = p.pos;
  p.pos = (old + steps) % TILES.length;
  let msg = `${prefix}${p.name} ${steps} ilerledi: ${TILES[p.pos].n}.`;
  if (p.pos < old) { p.money += GO_PRIMI; msg += ` Başlangıç karesini geçti (+${fmt(GO_PRIMI)}).`; }
  return landOn(g, msg);
}

// ---- Yönetim (sıra oyuncusu, zar atmadan önce ya da satın alma kararı sırasında) ----

const canManage = (g) => g.phase === 'roll' || g.phase === 'buy';

export function canBuild(g, idx, o) {
  const t = TILES[idx];
  if (!t || t.t !== 'p' || g.owner[idx] !== o || isMort(g, idx)) return false;
  const grp = groupTiles(t.group);
  if (!grp.every((i) => g.owner[i] === o)) return false;
  if (grp.some((i) => isMort(g, i))) return false;
  const hs = grp.map((i) => g.houses[i] || 0);
  const h = g.houses[idx] || 0;
  return h < 5 && h === Math.min(...hs);
}
export function canSell(g, idx, o) {
  const t = TILES[idx];
  if (!t || t.t !== 'p' || g.owner[idx] !== o) return false;
  const hs = groupTiles(t.group).map((i) => g.houses[i] || 0);
  const h = g.houses[idx] || 0;
  return h > 0 && h === Math.max(...hs);
}
export function canMortgage(g, idx, o) {
  const t = TILES[idx];
  if (!isOwnable(t) || g.owner[idx] !== o || isMort(g, idx)) return false;
  if (t.t === 'p' && groupTiles(t.group).some((i) => (g.houses[i] || 0) > 0)) return false;
  return true;
}
export function canUnmortgage(g, idx, o) {
  const t = TILES[idx];
  if (!isOwnable(t) || g.owner[idx] !== o || !isMort(g, idx)) return false;
  return g.players[o].money >= t.price / 2 * 1.1;
}
function doMortgage(g, idx, o) {
  g.mort.push(idx);
  g.players[o].money += TILES[idx].price / 2;
}

export function build(g, idx) {
  if (!canManage(g)) return reject(g, 'Bina yalnızca kendi turunuzda yapılabilir.');
  const n = structuredClone(g), o = n.turn, p = n.players[o];
  if (!canBuild(n, idx, o)) return reject(g, 'Bu arsaya bina yapılamaz (renk grubunun tamamı size ait, ipotek yok ve eşit inşa kuralına uyulmalı).');
  const t = TILES[idx];
  if (p.money < t.hc) return reject(g, 'Bina için paranız yetmiyor.');
  p.money -= t.hc;
  n.houses[idx] = (n.houses[idx] || 0) + 1;
  n.msg = `${p.name} ${t.n}'a ${n.houses[idx] === 5 ? 'otel' : 'ev'} yaptı (−${fmt(t.hc)}).`;
  return n;
}
export function sellHouse(g, idx) {
  if (!canManage(g)) return reject(g, 'Bina yalnızca kendi turunuzda satılabilir.');
  const n = structuredClone(g), o = n.turn, p = n.players[o];
  if (!canSell(n, idx, o)) return reject(g, 'Eşit inşa kuralı gereği bu binayı şu an satamazsınız.');
  const t = TILES[idx];
  p.money += t.hc / 2;
  n.houses[idx]--;
  n.msg = `${p.name} ${t.n}'daki bir binayı sattı (+${fmt(t.hc / 2)}).`;
  return n;
}
export function mortgage(g, idx) {
  if (!canManage(g)) return reject(g, 'İpotek yalnızca kendi turunuzda yapılır.');
  const n = structuredClone(g), o = n.turn;
  if (!canMortgage(n, idx, o)) return reject(g, 'Bu mülk ipotek edilemez (üzerinde ya da grubunda bina var ya da zaten ipotekli).');
  doMortgage(n, idx, o);
  n.msg = `${n.players[o].name} ${TILES[idx].n}'ı ipotek etti (+${fmt(TILES[idx].price / 2)}).`;
  return n;
}
export function unmortgage(g, idx) {
  if (!canManage(g)) return reject(g, 'İpotek kaldırma yalnızca kendi turunuzda yapılır.');
  const n = structuredClone(g), o = n.turn;
  if (!canUnmortgage(n, idx, o)) return reject(g, 'İpoteği kaldırmak için %10 faiziyle birlikte ödeme yapmanız gerekir.');
  const t = TILES[idx], cost = t.price / 2 * 1.1;
  n.players[o].money -= cost;
  n.mort = n.mort.filter((i) => i !== idx);
  n.msg = `${n.players[o].name} ${t.n}'ın ipoteğini kaldırdı (−${fmt(cost)}).`;
  return n;
}

// ---- Sıra hamleleri ----

// Zar atma: normal hareket, hapiste çıkış denemesi, üçüncü çift kuralı.
export function roll(g, d1, d2) {
  if (g.phase !== 'roll') return reject(g, 'Şu an zar atılamaz.');
  const n = structuredClone(g);
  const me = n.turn, p = n.players[me];
  const steps = d1 + d2, doubles = d1 === d2;
  n.dice = [d1, d2];
  n.lastRoll = steps;

  if (p.jail > 0) {
    if (doubles) {
      p.jail = 0;
      moveAndLand(n, me, steps, `${p.name} çift attı ve hapisten çıktı. `);
      finishTurn(n, false); // hapisten çıkışta ekstra tur yok
      return n;
    }
    if (p.jail >= 3) {
      // Üçüncü başarısız deneme: kefareti öde ve zar kadar ilerle.
      p.jail = 0;
      if (pay(n, me, JAIL_KEFARET)) {
        n.msg = `${p.name} kefareti ödeyemedi ve iflas etti.`;
        finishTurn(n, false);
        return n;
      }
      moveAndLand(n, me, steps, `3. denemede çift atamadı; ${fmt(JAIL_KEFARET)} kefaret ödedi. `);
      finishTurn(n, false);
      return n;
    }
    p.jail++;
    n.msg = `${p.name} çift atamadı (${p.jail - 1}. başarısız deneme); sıra değişiyor.`;
    finishTurn(n, false);
    return n;
  }

  if (doubles) {
    n.dbl++;
    if (n.dbl === 3) {
      goToJail(n, me);
      n.msg = `${p.name} üst üste 3 çift attı; hapse girdi!`;
      finishTurn(n, false);
      return n;
    }
  } else {
    n.dbl = 0;
  }
  moveAndLand(n, me, steps, `${p.name} ${steps} attı${doubles ? ' (çift!)' : ''}. `);
  finishTurn(n, doubles);
  return n;
}

// Satın alma (sıra oyuncusu, tapulu kare).
export function buy(g) {
  if (g.phase !== 'buy') return reject(g, 'Şu an satın alınacak bir mülk yok.');
  const n = structuredClone(g);
  const p = n.players[n.turn];
  const tile = TILES[p.pos];
  if (p.money < tile.price) return reject(g, 'Satın alacak paranız yok. Geç ile açık artırmaya bırakabilirsiniz.');
  p.money -= tile.price;
  n.owner[p.pos] = n.turn;
  n.msg = `${p.name} ${tile.n}'ı ${fmt(tile.price)}'a aldı.`;
  resolve(n);
  return n;
}

// Satın almayı reddetmek: resmi kurala göre açık artırma başlar; sıra sahibi ilk teklifi verir.
export function skipBuy(g) {
  if (g.phase !== 'buy') return reject(g, 'Şu an açık artırma başlatılamaz.');
  const n = structuredClone(g);
  const tile = TILES[n.players[n.turn].pos];
  n.auction = { tile: n.players[n.turn].pos, bid: 0, high: -1, drop: n.players.map(() => false), ptr: n.turn };
  n.phase = 'auction';
  const k = nextBidder(n, n.auction, n.turn);
  if (k < 0) { endAuction(n, n.auction); return n; }
  n.auction.ptr = k;
  n.msg = `${n.players[n.turn].name} almadı: ${tile.n} açık artırmaya çıktı. ${n.players[k].name} teklif versin.`;
  return n;
}

// Açık artırmada sıradaki kişi: henüz çekilmemiş, en yüksek teklifi olmayan ve teklif verecek parası olan.
function nextBidder(n, a, from) {
  const N = n.players.length;
  for (let s = 0; s < N; s++) {
    const k = (from + s) % N;
    const p = n.players[k];
    if (!p.out && !a.drop[k] && k !== a.high && p.money > a.bid) return k;
  }
  return -1;
}

function passTo(n, a, from) {
  const k = nextBidder(n, a, from);
  if (k < 0) { endAuction(n, a); return; }
  a.ptr = k;
  const top = a.high >= 0 ? ` En yüksek: ${fmt(a.bid)} (${n.players[a.high].name}).` : '';
  n.msg = `Açık artırma — ${TILES[a.tile].n}.${top} Sıra: ${n.players[k].name}.`;
}

function endAuction(n, a) {
  const tile = TILES[a.tile];
  if (a.high >= 0 && a.bid > 0) {
    const w = a.high;
    n.players[w].money -= a.bid;
    n.owner[a.tile] = w;
    n.msg = `${n.players[w].name} ${tile.n}'ı açık artırmada ${fmt(a.bid)}'a aldı!`;
  } else {
    n.msg = `Kimse teklif vermedi: ${tile.n} sahipsiz kaldı.`;
  }
  n.auction = null;
  resolve(n);
}

export function bid(g, i, amount) {
  if (g.phase !== 'auction' || !g.auction) return reject(g, 'Şu an açık artırma yok.');
  if (i !== g.auction.ptr) return reject(g, 'Sıra başka oyuncuda.');
  const n = structuredClone(g), a = n.auction;
  const amt = Math.floor(Number(amount));
  if (!Number.isFinite(amt) || amt <= a.bid) return reject(g, 'Teklif, mevcut tekliften yüksek olmalı.');
  if (amt > n.players[i].money) return reject(g, 'Elinizden geleni aştınız.');
  a.bid = amt; a.high = i;
  passTo(n, a, i + 1);
  return n;
}

export function passBid(g, i) {
  if (g.phase !== 'auction' || !g.auction) return reject(g, 'Şu an açık artırma yok.');
  if (i !== g.auction.ptr) return reject(g, 'Sıra başka oyuncuda.');
  const n = structuredClone(g), a = n.auction;
  a.drop[i] = true;
  passTo(n, a, i + 1);
  return n;
}

// Hapis: kefaret ödeyerek (zar atmadan önce) çıkış.
export function payJail(g) {
  const p = g.players[g.turn];
  if (g.phase !== 'roll' || p.jail <= 0) return reject(g, 'Şu an hapisten çıkmak için ödeme yapılamaz.');
  const n = structuredClone(g), q = n.players[n.turn];
  q.jail = 0;
  if (pay(n, n.turn, JAIL_KEFARET)) {
    n.msg = `${q.name} kefareti ödeyemedi ve iflas etti.`;
    finishTurn(n, false);
    return n;
  }
  n.msg = `${q.name} kefareti ödedi (−${fmt(JAIL_KEFARET)}). Şimdi zar atın.`;
  return n;
}

// Hapisten çıkma kartı: kart desteye geri döner (en alta).
export function useJailCard(g) {
  const p = g.players[g.turn];
  if (g.phase !== 'roll' || p.jail <= 0) return reject(g, 'Şu an kart kullanılamaz.');
  if (!p.cards.length) return reject(g, 'Hapisten çıkma kartınız yok.');
  const n = structuredClone(g), q = n.players[n.turn];
  const deck = q.cards.pop();
  n[deck].push(JAIL_CARD[deck]);
  q.jail = 0;
  n.msg = `${q.name} hapisten çıkma kartını kullandı. Şimdi zar atın.`;
  return n;
}

// Oyuncu masadan ayrıldı: iflas sayılır; mülkleri bankaya döner. Açık artırma varsa iptal edilir.
export function forfeit(g, i) {
  const p0 = g.players[i];
  if (!p0 || p0.out || g.phase === 'over') return g;
  const n = structuredClone(g), p = n.players[i];
  const wasAuction = n.phase === 'auction';
  if (wasAuction) n.auction = null;
  bankrupt(n, i);
  n.msg = `${p.name} masadan ayrıldı; mülkleri bankaya döndü.`;
  if (checkWinner(n)) return n;
  if (wasAuction || n.turn === i) resolve(n);
  return n;
}
