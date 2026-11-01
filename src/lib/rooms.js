// Kafe masası odaları: bir (kafe, masa, oyun) için tek oda. Oyun kuralları ve zarlar sunucuda işlenir;
// telefonlar yalnızca kendi sırasında hamle isteyebilir. Durum veritabanında tutulur (sunucusuz ortamda
// bellek paylaşılmadığı için), istemciler kısa aralıkla sürüm numarasını sorar.
import { get, run } from './db';
import { getVenueBySlug } from './venues';
import * as E from './emlak';
import * as C from './chess';
import * as S from './spyfall';
import * as A from './ajanlar';
import * as V from './vampir';
import * as T from './tabu';
import * as K from './kimim';
import * as P from './cizim';
import * as B from './bil';
import * as R from './risk';
import * as Z from './azul';
import * as CL from './cluedo';
import * as SC from './scrabble';
import * as CC from './carcassonne';
import * as CA from './catan';
import * as TK from './ticket';
import * as KD from './kadro';
import * as FB from './futbolcu';

// Oyun başına koltuk sayısı; satrançta 1. koltuk Beyaz, 2. koltuk Siyah.
const CONFIG = { monopoly: { max: 4, min: 2 }, satranc: { max: 2, min: 2 }, spyfall: { max: 8, min: 3 }, ajanlar: { max: 8, min: 4 }, vampir: { max: 10, min: 5 }, tabu: { max: 10, min: 4 }, kimim: { max: 10, min: 3 }, cizim: { max: 10, min: 3 }, bil: { max: 10, min: 2 }, azul: { max: 4, min: 2 }, cluedo: { max: 6, min: 3 }, scrabble: { max: 4, min: 2 }, risk: { max: 6, min: 2 }, carcassonne: { max: 5, min: 2 }, catan: { max: 4, min: 3 }, ticket: { max: 5, min: 2 }, kadro: { max: 8, min: 2 }, futbolcu: { max: 10, min: 2 } };
export const ROOM_GAMES = new Set(Object.keys(CONFIG));
export const MASA_RE = /^masa-\d{1,3}$/;
export const PID_RE = /^[a-zA-Z0-9]{16,64}$/;
export const IDLE_MS = 45 * 1000; // bu kadar süredir yoklamayan oyuncu masadan çıkarılabilir
const STALE_MS = 6 * 60 * 60 * 1000; // 6 saat işlem görmeyen oda sıfırlanır
const VAMP_MS = 90 * 1000; // vampirde her gece/gündüz evresinin süresi; aşılırsa zaman aşımı eylemi evreyi ilerletir
const MONO_ACTS = new Set(['bid', 'pass', 'build', 'sell', 'mortgage', 'unmortgage', 'payJail', 'jailCard']);
const MONO_OWN = new Set(['build', 'sell', 'mortgage', 'unmortgage', 'payJail', 'jailCard']); // yalnızca sıra sahibi yapabilir
const CHESS_ACTS = new Set(['offer', 'accept', 'decline', 'claim', 'resign']);
const CAT_ACTS = new Set(['csettle', 'ccity', 'croad', 'cdev', 'croll', 'cdrop', 'crobber', 'cplay', 'cend', 'cbank', 'coffer', 'cacc', 'cpick', 'cclose']);
const RISK_ACTS = new Set(['rdeploy', 'rtrade', 'rattack', 'rmove', 'rendattack', 'rfortify', 'rendturn']);

// Seçilen piyon simgesi boşsa onu, doluysa ilk boş simgeyi ver.
const freeTok = (s, want) => {
  const used = new Set(s.seats.filter((x) => !x.left).map((x) => x.tok));
  const w = Number(want);
  if (Number.isInteger(w) && w >= 0 && w < E.TOKENS.length && !used.has(w)) return w;
  return E.TOKENS.findIndex((_, i) => !used.has(i));
};
const fresh = () => ({ phase: 'lobby', seats: [], game: null });
const clean = (n) => String(n ?? '').replace(/[<>]/g, '').trim().slice(0, 16);
const die = () => 1 + Math.floor(Math.random() * 6);
const sq = (p) => Array.isArray(p) && p.length === 2 && p.every((n) => Number.isInteger(n) && n >= 0 && n < 8);

// Mekân bilgisi veritabanından gelir (src/lib/venues.js); kayıtlı olmayan masa numarasında oda açılmaz.
export const findCafe = async (slug) => getVenueBySlug(slug);
export const hasTable = (venue, masa) => MASA_RE.test(masa) && Number(masa.slice(5)) >= 1 && Number(masa.slice(5)) <= venue.tables;

// Kafenin konumu girilmişse oyuncunun telefonu bu yarıçap (metre) içinde olmalı; GPS sapması kadar pay bırakılır.
export const NEAR_M = 250;
const rad = (d) => (d * Math.PI) / 180;
const distM = (a, b) => {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};
// true: kafede, false: uzakta ya da konum yok, null: bu kafede konum kontrolü yok.
export function nearCafe(cafe, geo) {
  if (cafe.lat == null || cafe.lng == null) return null;
  const lat = Number(geo?.lat), lng = Number(geo?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  const acc = Math.min(Math.max(Number(geo.acc) || 0, 0), 100);
  return distM({ lat: Number(cafe.lat), lng: Number(cafe.lng) }, { lat, lng }) <= NEAR_M + acc;
}

// biz_id sütunu kafe numarasını (cafes.id) tutar.
const SELECT = 'SELECT id, state, version, updated_at FROM game_rooms WHERE biz_id = ? AND tbl = ? AND game = ?';

export async function readRoom(biz, tbl, game) {
  let r = await get(SELECT, biz, tbl, game);
  if (!r) {
    await run(
      'INSERT INTO game_rooms (biz_id, tbl, game, state, version, updated_at) VALUES (?, ?, ?, ?, 0, ?) ON CONFLICT (biz_id, tbl, game) DO NOTHING',
      biz, tbl, game, JSON.stringify(fresh()), Date.now(),
    );
    r = await get(SELECT, biz, tbl, game);
  }
  const stale = Date.now() - Number(r.updated_at) > STALE_MS;
  let state = stale ? fresh() : JSON.parse(r.state);
  // Eski tahtadan kalan (kare sayısı uyuşmayan) Emlak oyunu varsa masa sıfırlanır.
  if (game === 'monopoly' && state.game && !E.validGame(state.game)) state = fresh();
  return { id: r.id, version: r.version, state };
}

// İstemciye giden görünüm: başkalarının kimlik kodları (pid) gönderilmez.
export function view(room, pid, game) {
  const s = room.state;
  const me = s.seats.findIndex((x) => x.pid === pid);
  return {
    version: room.version,
    phase: s.phase,
    seats: s.seats.map((x) => ({ name: x.name, tok: x.tok, left: !!x.left, idleMs: x.seen ? Math.max(0, Date.now() - x.seen) : 0 })),
    me,
    // Vampirde kalan süre (ms); istemci geri sayım gösterebilsin diye.
    leftMs: game === 'vampir' && s.game?.endsAt ? Math.max(0, s.game.endsAt - Date.now()) : null,
    // Casus oyununda mekân ve casus sunucuda kalır; her oyuncuya yalnızca kendi kartı gider.
    game: game === 'spyfall' ? S.viewFor(s.game, me) : game === 'ajanlar' ? A.viewFor(s.game, me) : game === 'vampir' ? V.viewFor(s.game, me) : game === 'tabu' ? T.viewFor(s.game, me) : game === 'kimim' ? K.viewFor(s.game, me) : game === 'cizim' ? P.viewFor(s.game, me) : game === 'bil' ? B.viewFor(s.game, me) : game === 'azul' ? Z.viewFor(s.game, me) : game === 'cluedo' ? CL.viewFor(s.game, me) : game === 'scrabble' ? SC.viewFor(s.game, me) : game === 'risk' ? R.viewFor(s.game, me) : game === 'carcassonne' ? CC.viewFor(s.game, me) : game === 'catan' ? CA.viewFor(s.game, me) : game === 'ticket' ? TK.viewFor(s.game, me) : game === 'kadro' ? KD.viewFor(s.game, me) : game === 'futbolcu' ? FB.viewFor(s.game, me) : s.game,
  };
}

// Koltuktaki oyuncuyu masadan çıkarır; oyun başladıysa o oyunun ayrılma kuralı işler.
function leaveSeat(s, idx, game) {
  if (s.phase === 'lobby') { s.seats.splice(idx, 1); return; }
  const g = s.game;
  s.seats[idx].left = true;
  if (game === 'monopoly') s.game = E.forfeit(g, idx);
  else if (game === 'spyfall') s.game = S.onLeave(g, s.seats, idx);
  else if (game === 'ajanlar') s.game = A.onLeave(g, s.seats, idx);
  else if (game === 'vampir') s.game = V.onLeave(g, s.seats, idx);
  else if (game === 'tabu') s.game = T.onLeave(g, s.seats, idx);
  else if (game === 'kimim') s.game = K.onLeave(g, s.seats, idx);
  else if (game === 'cizim') s.game = P.onLeave(g, s.seats, idx);
  else if (game === 'bil') s.game = B.onLeave(g, s.seats, idx);
  else if (game === 'ticket') s.game = TK.onLeave(g, s.seats, idx);
  else if (game === 'kadro') s.game = KD.onLeave(g, s.seats, idx);
  else if (game === 'futbolcu') s.game = FB.onLeave(g, s.seats, idx);
  else if (game === 'risk') s.game = R.onLeave(g, s.seats, idx);
  else if (game === 'azul') s.game = Z.onLeave(g, s.seats, idx);
  else if (game === 'cluedo') s.game = CL.onLeave(g, s.seats, idx);
  else if (game === 'scrabble') s.game = SC.onLeave(g, s.seats, idx);
  else if (game === 'carcassonne') s.game = CC.onLeave(g, s.seats, idx);
  else if (game === 'catan') s.game = CA.onLeave(g, s.seats, idx);
  // Satrançta ayrılan oyuncu teslim olmuş sayılır; oyun rakip lehine biter.
  else if (game === 'satranc') { if (!g.over) s.game = C.act(g, idx === 0 ? 'w' : 'b', 'resign', { w: s.seats[0].name, b: s.seats[1].name }); }
  else if (!g.over) {
    const other = s.seats[1 - idx];
    s.game = { ...g, over: `${other.name} kazandı (rakip masadan ayrıldı).`, draw: false };
  }
}

// Emlak: açık artırma ve mülk yönetimi. Kuralları (sıra, teklif sırası, paralar) emlak.js denetler. emlak.js bir
// hamleyi reddettiğinde giriş durumunun kopyasını (yalnızca msg'si değişmiş) döndürür; bu hata sayılır, masa
// durumuna yazılmaz ve nedeni yalnızca hamleyi gönderen oyuncuya gider.
function monoAct(s, idx, a, g) {
  if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
  if (MONO_OWN.has(a.type) && g.turn !== idx) return { error: 'Sıra sizde değil.' };
  let r;
  switch (a.type) {
    case 'bid': r = E.bid(g, idx, Number(a.amount)); break;
    case 'pass': r = E.passBid(g, idx); break;
    case 'payJail': r = E.payJail(g); break;
    case 'jailCard': r = E.useJailCard(g); break;
    default: {
      const prop = a.prop;
      if (!Number.isInteger(prop) || prop < 0 || prop >= E.TILES.length) return { error: 'Geçersiz arsa.' };
      r = a.type === 'build' ? E.build(g, prop) : a.type === 'sell' ? E.sellHouse(g, prop)
        : a.type === 'mortgage' ? E.mortgage(g, prop) : E.unmortgage(g, prop);
    }
  }
  // Ret: msg dışında giriş durumuyla aynı (reject() böyle döner). Kayıt yapılmaz, hata olarak dönülür.
  const stripMsg = (x) => JSON.stringify({ ...x, msg: undefined });
  if (stripMsg(r) === stripMsg(g)) return { error: r.msg };
  s.game = r;
  return { state: s };
}

// Carcassonne: karo yerleştirme ve meeple. Kurallar carcassonne.js'te denetlenir; eylem adları 'cc' önekli.
function ccAct(s, idx, a, g) {
  if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
  const r = CC.act(g, idx, { type: a.type === 'ccplace' ? 'place' : 'meeple', ...(a.cc || {}) });
  if (r.error) return { error: r.error };
  s.game = r;
  return { state: s };
}

// Satranç: beraberlik teklifi/kabulü/reddi, talep edilen beraberlik ve teslim. Renk, koltuktan gelir (1. Beyaz, 2. Siyah).
function chessAct(s, idx, a, g) {
  if (s.phase !== 'play' || idx < 0 || idx > 1 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
  const r = C.act(g, idx === 0 ? 'w' : 'b', a.type, { w: s.seats[0].name, b: s.seats[1].name });
  if (r.error) return { error: r.error };
  s.game = r;
  return { state: s };
}

// Risk: kurallar risk.js'te denetlenir (zarlar sunucuda atılır); yalnızca sırası gelen oyuncu hamle yapabilir.
function riskAct(s, idx, a, g) {
  if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
  const r = R.act(g, idx, a.type, a);
  if (r.error) return { error: r.error };
  s.game = r;
  return { state: s };
}

// Vampir zaman aşımı (süre dolunca): gecede seçim yapmayanlar o gece etkisiz sayılır (V.nightTimeout),
// gündüzde oy vermeyenler çekimser sayılır (castVote -1). Her iki durumda evre ilerler.
function vampTimeout(s, g) {
  if (g.over) return { error: 'Tur bitti.' };
  if (Date.now() < Number(g.endsAt ?? 0)) return { error: 'Süre henüz dolmadı.' };
  if (g.phase === 'night') {
    const r = V.nightTimeout(g, s.seats);
    if (r.error) return { error: r.error };
    s.game = r;
    return { state: s };
  }
  let cur = g;
  for (let i = 0; i < cur.alive.length; i++) {
    if (cur.phase !== 'day' || cur.over) break;
    if (!cur.alive[i] || cur.votes[i] !== undefined) continue;
    const r = V.castVote(cur, s.seats, i, -1);
    if (r.error) return { error: r.error };
    cur = r;
  }
  s.game = cur;
  return { state: s };
}

// Vampirde her evre (gece/gündüz) başında süre yeniden başlar; aynı evrede yapılan seçimler süreyi uzatmaz.
function vampStamp(next, prev) {
  if (!next || next.over) return;
  const key = (x) => `${x?.phase}:${x?.day}`;
  if (!prev || key(prev) !== key(next) || next.endsAt == null) next.endsAt = Date.now() + VAMP_MS;
}

// Scrabble: hamle ve itiraz kuralları scrabble.js'te denetlenir. Eylem adları 'sc' önekli (diğer oyunlarla çakışmaz).
const SC_ACTS = new Set(['scplay', 'scpass', 'scswap', 'scchallenge', 'scvote', 'sctimeout', 'sccommit']);
function scrabbleAct(s, idx, a, g) {
  if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
  const r = SC.act(g, s.seats, idx, a.type, a);
  if (r.error) return { error: r.error };
  s.game = r;
  return { state: s };
}

function apply(s, pid, a, game) {
  const cfg = CONFIG[game];
  const idx = s.seats.findIndex((x) => x.pid === pid);
  const g = s.game;
  if (game === 'monopoly' && MONO_ACTS.has(a.type)) return monoAct(s, idx, a, g);
  if (game === 'satranc' && CHESS_ACTS.has(a.type)) return chessAct(s, idx, a, g);
  if (game === 'risk' && RISK_ACTS.has(a.type)) return riskAct(s, idx, a, g);
  if (game === 'scrabble' && SC_ACTS.has(a.type)) return scrabbleAct(s, idx, a, g);
  if (game === 'carcassonne' && (a.type === 'ccplace' || a.type === 'ccmeeple')) return ccAct(s, idx, a, g);
  if (game === 'catan' && CAT_ACTS.has(a.type)) {
    if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
    const r = CA.act(g, idx, { ...a.cat, type: a.type });
    if (r.error) return { error: r.error };
    s.game = r;
    return { state: s };
  }
  switch (a.type) {
    case 'join': {
      if (idx >= 0) {
        s.seats[idx].name = clean(a.name) || s.seats[idx].name;
        return { state: s };
      }
      if (a.near === false) return { error: a.noGeo ? 'Masaya katılmak için konum izni vermeniz gerekir (kafede olduğunuz doğrulanır).' : 'Masaya yalnızca kafedeyken katılabilirsiniz.' };
      if (s.phase !== 'lobby') return { error: 'Oyun başladı, bu oyuna sonradan katılınamaz. İzleyebilirsiniz.' };
      if (s.seats.length >= cfg.max) return { error: `Masa dolu (en fazla ${cfg.max} kişi).` };
      s.seats.push({ pid, name: clean(a.name) || `Oyuncu ${s.seats.length + 1}`, tok: freeTok(s, a.tok), seen: Date.now() });
      return { state: s };
    }
    // Lobide piyon simgesini değiştir (başkasında olan simge alınamaz).
    case 'token': {
      if (idx < 0 || s.phase !== 'lobby') return { error: 'Önce masaya katılmalısınız.' };
      const t = Number(a.tok);
      if (!Number.isInteger(t) || t < 0 || t >= E.TOKENS.length) return { error: 'Geçersiz simge.' };
      if (s.seats.some((x, k) => k !== idx && !x.left && x.tok === t)) return { error: 'Bu simgeyi başka bir oyuncu seçti.' };
      s.seats[idx].tok = t;
      return { state: s };
    }
    case 'leave': {
      if (idx < 0) return { state: s };
      leaveSeat(s, idx, game);
      return { state: s };
    }
    // Oyuncu sayfayı kapatıp gittiyse (bir süredir yoklamıyorsa) masadaki herhangi biri onu masadan çıkarabilir.
    case 'ping':
      // Kafeden uzaklaşan (evine giden) oyuncu masadan düşer.
      if (a.near === false && idx >= 0 && !s.seats[idx].left && !a.noGeo) leaveSeat(s, idx, game);
      return { state: s };
    case 'kick': {
      if (idx < 0 || s.seats[idx].left) return { error: 'Önce masaya katılmalısınız.' };
      const t = Number(a.target);
      if (!Number.isInteger(t) || t < 0 || t >= s.seats.length || t === idx) return { error: 'Geçersiz oyuncu.' };
      if (s.seats[t].left) return { state: s };
      if (Date.now() - (s.seats[t].seen ?? Date.now()) < IDLE_MS) return { error: 'Bu oyuncu hâlâ masada görünüyor.' };
      leaveSeat(s, t, game);
      return { state: s };
    }
    case 'start': {
      if (idx < 0 || s.phase !== 'lobby') return { error: 'Oyunu yalnızca masaya katılmış oyuncular başlatabilir.' };
      if (s.seats.length < cfg.min) return { error: `Başlamak için en az ${cfg.min} kişi gerekir.` };
      if (game === 'monopoly') {
        const ng = E.newGame(s.seats.length, s.seats.map((x) => x.tok));
        ng.players.forEach((p, i) => { p.name = s.seats[i].name; });
        ng.msg = `${ng.players[0].name} zar atsın.`;
        s.game = ng;
      } else if (game === 'scrabble') {
        s.game = SC.newGame(s.seats.map((x) => x.name));
      } else if (game === 'carcassonne') {
        s.game = CC.newGame(s.seats);
      } else if (game === 'risk') {
        s.game = R.newGame(s.seats.length);
      } else if (game === 'ticket') {
        s.game = TK.newGame(s.seats.length);
      } else if (game === 'kadro') {
        s.game = KD.newGame(s.seats.length);
      } else if (game === 'futbolcu') {
        s.game = FB.newGame(s.seats);
      } else if (game === 'bil') {
        s.game = B.newGame(s.seats.length);
      } else if (game === 'cluedo') {
        s.game = CL.newGame(s.seats.length);
      } else if (game === 'azul') {
        s.game = Z.newGame(s.seats.length);
      } else if (game === 'cizim') {
        s.game = P.newGame(s.seats);
      } else if (game === 'kimim') {
        s.game = K.newGame(s.seats.length);
        s.game.note = `${s.seats[s.game.turn].name} ilk soruyu soruyor.`;
      } else if (game === 'tabu') {
        s.game = T.newGame(s.seats.length, s.seats, a.ms);
      } else if (game === 'vampir') {
        s.game = V.newGame(s.seats.length);
      } else if (game === 'ajanlar') {
        s.game = A.newGame(s.seats.length);
      } else if (game === 'spyfall') {
        s.game = S.newGame(s.seats.length);
        s.game.note = `${s.seats[s.game.first].name} ilk soruyu soruyor.`;
      } else if (game === 'catan') {
        s.game = CA.newGame(s.seats.length);
        s.game.names = s.seats.map((x) => x.name);
      } else {
        s.game = C.newGame();
      }
      s.phase = 'play';
      return { state: s };
    }
    case 'roll':
    case 'buy':
    case 'skip': {
      if (game !== 'monopoly') return { error: 'Bilinmeyen işlem.' };
      if (s.phase !== 'play' || idx < 0) return { error: 'Oyunda değilsiniz.' };
      if (g.turn !== idx) return { error: 'Sıra sizde değil.' };
      const need = a.type === 'roll' ? 'roll' : 'buy';
      if (g.phase !== need) return { error: 'Şu an bu hamle yapılamaz.' };
      s.game = a.type === 'roll'
        ? E.roll(g, die(), die(), Math.floor(Math.random() * 4))
        : a.type === 'buy' ? E.buy(g) : E.skipBuy(g);
      return { state: s };
    }
    case 'move': {
      if (game !== 'satranc') return { error: 'Bilinmeyen işlem.' };
      if (s.phase !== 'play' || idx < 0 || idx > 1) return { error: 'Oyunda değilsiniz.' };
      if (g.turn !== (idx === 0 ? 'w' : 'b')) return { error: 'Sıra sizde değil.' };
      if (!sq(a.from) || !sq(a.to)) return { error: 'Geçersiz hamle.' };
      const r = C.play(g, a.from[0], a.from[1], a.to[0], a.to[1], { w: s.seats[0].name, b: s.seats[1].name }, a.promo);
      if (r.error) return { error: r.error };
      s.game = r;
      return { state: s };
    }
    case 'begin':
    case 'right':
    case 'pass':
    case 'taboo': {
      if (game !== 'tabu') return { error: 'Bilinmeyen işlem.' };
      if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
      const r = a.type === 'begin' ? T.begin(g, s.seats, idx) : T.act(g, s.seats, idx, a.type);
      if (r.error) return { error: r.error };
      s.game = r;
      return { state: s };
    }
    case 'tkdraw':
    case 'tkclaim':
    case 'tktickets':
    case 'tkkeep': {
      if (game !== 'ticket') return { error: 'Bilinmeyen işlem.' };
      if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
      const r = TK.act(g, idx, a);
      if (r.error) return { error: r.error };
      s.game = r;
      return { state: s };
    }
    case 'kdformasyon':
    case 'kdpick':
    case 'kdswap':
    case 'kdlock':
    case 'kdtimeout': {
      if (game !== 'kadro') return { error: 'Bilinmeyen işlem.' };
      if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
      const r = KD.act(g, s.seats, idx, a.type, a);
      if (r.error) return { error: r.error };
      s.game = r;
      return { state: s };
    }
    case 'fbready':
    case 'fbask':
    case 'fbanswer':
    case 'fbguess':
    case 'fbverdict':
    case 'fbnext': {
      if (game !== 'futbolcu') return { error: 'Bilinmeyen işlem.' };
      if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
      const r = FB.act(g, s.seats, idx, a.type, { yes: a.yes });
      if (r.error) return { error: r.error };
      s.game = r;
      return { state: s };
    }
    case 'bpick':
    case 'btimeout': {
      if (game !== 'bil') return { error: 'Bilinmeyen işlem.' };
      if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
      const r = a.type === 'bpick' ? B.pick(g, s.seats, idx, a.choice) : B.timeout(g, s.seats);
      if (r.error) return { error: r.error };
      s.game = r;
      return { state: s };
    }
    case 'atake': {
      if (game !== 'azul') return { error: 'Bilinmeyen işlem.' };
      if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
      const r = Z.act(g, idx, { ...a, type: 'take' });
      if (r.error) return { error: r.error };
      s.game = r;
      return { state: s };
    }
    case 'ddraw':
    case 'dset':
    case 'dguess':
    case 'dswap':
    case 'dtimeout': {
      if (game !== 'cizim') return { error: 'Bilinmeyen işlem.' };
      if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
      const r = a.type === 'ddraw' ? P.draw(g, idx, a.strokes)
        : a.type === 'dset' ? P.keep(g, idx, a.keep)
        : a.type === 'dguess' ? P.guess(g, s.seats, idx, a.text)
        : a.type === 'dswap' ? P.swap(g, idx)
        : P.timeout(g, s.seats);
      if (r.error) return { error: r.error };
      s.game = r;
      return { state: s };
    }
    case 'kok':
    case 'kno':
    case 'kskip':
    case 'ktimeout': {
      if (game !== 'kimim') return { error: 'Bilinmeyen işlem.' };
      if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
      s.game = a.type === 'ktimeout' ? K.timeout(g, s.seats) : K.act(g, s.seats, idx, a.type);
      if (s.game.error) return { error: s.game.error };
      return { state: s };
    }
    case 'kill':
    case 'protect':
    case 'inspect': {
      if (game !== 'vampir') return { error: 'Bilinmeyen işlem.' };
      if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
      const r = V.nightAction(g, s.seats, idx, a.type, a.target);
      if (r.error) return { error: r.error };
      s.game = r;
      return { state: s };
    }
    case 'accuse':
    case 'vote':
    case 'guess':
    case 'timeout': {
      if (game === 'tabu' && a.type === 'timeout') {
        if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
        const r = T.timeout(g, s.seats);
        if (r.error) return { error: r.error };
        s.game = r;
        return { state: s };
      }
      if (game === 'vampir' && a.type === 'timeout') {
        if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
        return vampTimeout(s, g);
      }
      if (game === 'vampir' && a.type === 'vote') {
        if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
        const r = V.castVote(g, s.seats, idx, a.target);
        if (r.error) return { error: r.error };
        s.game = r;
        return { state: s };
      }
      if (game !== 'spyfall') return { error: 'Bilinmeyen işlem.' };
      if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
      const r = a.type === 'accuse' ? S.accuse(g, s.seats, idx, a.target)
        : a.type === 'vote' ? S.castVote(g, s.seats, idx, a.yes === true)
        : a.type === 'guess' ? S.guess(g, s.seats, idx, a.loc)
        : S.timeout(g);
      if (r.error) return { error: r.error };
      s.game = r;
      return { state: s };
    }
    case 'clue':
    case 'pick':
    case 'endturn': {
      if (game !== 'ajanlar') return { error: 'Bilinmeyen işlem.' };
      if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
      const r = a.type === 'clue' ? A.giveClue(g, s.seats, idx, a.word, a.num)
        : a.type === 'pick' ? A.pick(g, s.seats, idx, a.card)
        : A.endTurn(g, s.seats, idx);
      if (r.error) return { error: r.error };
      s.game = r;
      return { state: s };
    }
    // Cluedo: zar, hareket, tahmin, çürütme, suçlama. Kurallar cluedo.js'te denetlenir; geçersiz hamle {error} döner.
    case 'clroll':
    case 'clstay':
    case 'clpassage':
    case 'clmove':
    case 'clsuggest':
    case 'clshow':
    case 'claccuse':
    case 'clend': {
      if (game !== 'cluedo') return { error: 'Bilinmeyen işlem.' };
      if (s.phase !== 'play' || idx < 0 || s.seats[idx].left) return { error: 'Oyunda değilsiniz.' };
      const r = CL.act(g, idx, a, s.seats);
      if (r.error) return { error: r.error };
      s.game = r.state;
      return { state: s };
    }
    // Masadakiler gidip oyun açık kalmışsa herkes (izleyici dahi) odayı baştan kurabilir.
    // Yalnızca masada o an kimse yoksa (herkes ayrıldı ya da IDLE_MS'dir yoklamıyor): aksi halde dışarıdan
    // bir istek devam eden oyunu herhangi bir anda silebilirdi.
    case 'wipe': {
      const present = s.seats.some((x) => !x.left && Date.now() - Number(x.seen ?? 0) < IDLE_MS);
      if (present) return { error: 'Masada hâlâ oyuncular var.' };
      return { state: fresh() };
    }
    case 'reset': {
      const over = game === 'monopoly' ? g?.phase === 'over'
        : game === 'spyfall' ? !!g?.over || Date.now() >= g.endsAt
        : !!g?.over;
      if (s.phase !== 'play' || !over) return { error: 'Oyun henüz bitmedi.' };
      // Masada kalan oyuncu yeniden oynamak için koltuğunu korur. İzleyici ya da ayrılmış biri sıfırlarsa, kimsenin
      // beklemediği (sayfayı kapatmış) oyuncular masada takılı kalmasın diye koltuklar boşaltılır.
      const here = idx >= 0 && !s.seats[idx].left;
      s.seats = here ? s.seats.filter((x) => !x.left) : [];
      // Satrançta rövanşta renkler değişir.
      if (game === 'satranc' && s.seats.length === 2) s.seats.reverse();
      s.phase = 'lobby';
      s.game = null;
      return { state: s };
    }
    default:
      return { error: 'Bilinmeyen işlem.' };
  }
}

// Hamleyi uygular; aynı anda iki telefon yazarsa sürüm denetimiyle yeniden dener.
export async function mutate(biz, tbl, game, pid, action) {
  for (let i = 0; i < 4; i++) {
    const r = await readRoom(biz, tbl, game);
    const res = apply(structuredClone(r.state), pid, action, game);
    if (res.error) return { error: res.error, room: r };
    if (game === 'vampir') vampStamp(res.state.game, r.state.game);
    const me = res.state.seats.findIndex((x) => x.pid === pid);
    if (me >= 0 && (action.near !== false || action.type === 'leave')) res.state.seats[me].seen = Date.now();
    const ok = await get(
      'UPDATE game_rooms SET state = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ? RETURNING version',
      JSON.stringify(res.state), Date.now(), r.id, r.version,
    );
    if (ok) return { room: { id: r.id, version: ok.version, state: res.state } };
  }
  return { error: 'Masa şu an meşgul, tekrar deneyin.' };
}
