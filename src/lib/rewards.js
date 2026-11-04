// Ödül sistemi: mekânın kuralları (reward_rules) ve oyun bitince üretilen tek kullanımlık kodlar (reward_codes).
// Şema src/lib/db.js'te. Kod ÜRETİMİ yalnızca sunucudaki oda durumunun nihai puanından yapılır (settleRoom); istemciden
// gelen hiçbir puan/iddia kullanılmaz. Hangi oyunların puanı güvenilir: src/lib/reward-games.js.
import { createHash, randomInt } from 'node:crypto';
import { get, all, run } from './db';
import { REWARD_GAMES, isRewardGame, DEFAULT_DAILY_CODE_LIMIT } from './reward-games';

export { DEFAULT_DAILY_CODE_LIMIT };

export const CODE_TTL_MS = 4 * 60 * 60 * 1000; // kod 4 saat geçerli
export const MAX_RULES = 30; // mekân başına en çok kural
const HOUR = 60 * 60 * 1000;
const TR_OFFSET = 3 * HOUR; // Türkiye UTC+3 (yaz saati yok); "gün" ve "ay" sınırları bu saate göre
// Karışmayan alfabe: 0/O, 1/I/L yok.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const clean = (s, max) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, max);
export const dayStart = (now = Date.now()) => Math.floor((now + TR_OFFSET) / (24 * HOUR)) * 24 * HOUR - TR_OFFSET;
export const monthStart = (now = Date.now(), back = 0) => {
  const d = new Date(now + TR_OFFSET);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - back, 1) - TR_OFFSET;
};

// ---------- Kurallar ----------
const RULE_COLS = 'id, biz_id, game, target, prize, daily_limit, cost_try, active, created_at';
const shapeRule = (r) => ({
  id: r.id, game: r.game, target: Number(r.target), prize: r.prize,
  dailyLimit: r.daily_limit == null ? null : Number(r.daily_limit),
  costTry: r.cost_try == null ? null : Number(r.cost_try),
  active: !!r.active, createdAt: Number(r.created_at),
});

/** @typedef {{ id: number, game: string, target: number, prize: string, dailyLimit: number | null, costTry: number | null, active: boolean, createdAt: number }} Rule */
/** @typedef {{ code: string, masa: string, game: string, prize: string, score: number, issuedAt: number, expiresAt: number, usedAt: number | null, status: 'bekliyor' | 'kullanildi' | 'suresi-doldu' }} RewardCode */

/** @returns {Promise<Rule[]>} */
export async function listRules(bizId) {
  return (await all(`SELECT ${RULE_COLS} FROM reward_rules WHERE biz_id = ? ORDER BY id`, bizId)).map(shapeRule);
}

// Mekânın açık kurallarından oyun -> { target, prize } (oyuncu ekranındaki "ödüllü oyun" ve oyun içi ipucu için).
/** @returns {Promise<Record<string, { target: number, prize: string }>>} */
export async function activeRuleMap(bizId) {
  const rows = await all('SELECT game, target, prize FROM reward_rules WHERE biz_id = ? AND active', bizId);
  return Object.fromEntries(rows.map((r) => [r.game, { target: Number(r.target), prize: r.prize }]));
}

const optInt = (v, min, max) => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : NaN;
};

// Panel girdisini doğrular: { game, target, prize, dailyLimit, costTry } -> { data } ya da { error }.
// venue: oyunun mekânda açık olduğunu denetlemek için (yalnızca yeni kuralda).
function ruleInput(raw, venue, { creating }) {
  const game = String(raw?.game ?? '');
  if (!isRewardGame(game)) return { error: 'Bu oyun ödül kuralına uygun değil (puanı sunucuda güvenilir tutulmuyor).' };
  if (creating && !venue.games.includes(game)) return { error: 'Önce bu oyunu Oyunlar sayfasından açın.' };
  const target = Number(raw?.target);
  if (!Number.isInteger(target) || target < 1 || target > 1_000_000_000) return { error: 'Hedef puan 1 ile 1.000.000.000 arasında bir tam sayı olmalı.' };
  const prize = clean(raw?.prize, 60);
  if (!prize) return { error: 'Ödül (ikram) gerekli.' };
  const dailyLimit = optInt(raw?.dailyLimit, 1, 100000);
  if (Number.isNaN(dailyLimit)) return { error: `Günlük sınır 1 ya da daha büyük bir tam sayı olmalı (boş = varsayılan: günde ${DEFAULT_DAILY_CODE_LIMIT}).` };
  const costTry = optInt(raw?.costTry, 0, 1_000_000);
  if (Number.isNaN(costTry)) return { error: 'İkram maliyeti geçersiz.' };
  return { data: { game, target, prize, dailyLimit, costTry } };
}

const isUnique = (e) => e?.code === '23505' || /duplicate key|unique constraint/i.test(String(e?.message ?? ''));
const DUP = { error: 'Bu oyun için zaten açık bir kural var. Önce onu kapatın ya da düzenleyin.', status: 409 };

export async function createRule(venue, raw) {
  const r = ruleInput(raw, venue, { creating: true });
  if (r.error) return r;
  const n = Number((await get('SELECT count(*)::int AS n FROM reward_rules WHERE biz_id = ?', venue.id))?.n) || 0;
  if (n >= MAX_RULES) return { error: `En çok ${MAX_RULES} kural oluşturabilirsiniz.` };
  const d = r.data;
  try {
    const row = await get(
      `INSERT INTO reward_rules (biz_id, game, target, prize, daily_limit, cost_try, active, created_at) VALUES (?, ?, ?, ?, ?, ?, true, ?) RETURNING ${RULE_COLS}`,
      venue.id, d.game, d.target, d.prize, d.dailyLimit, d.costTry, Date.now(),
    );
    return { rule: shapeRule(row) };
  } catch (e) {
    if (isUnique(e)) return DUP;
    throw e;
  }
}

// Oyun değiştirilemez (geçmiş kodlar karışmasın); hedef, ödül, sınır ve maliyet güncellenir. Her sorgu biz_id ile sınırlı.
export async function updateRule(venue, id, raw) {
  const cur = await get('SELECT game FROM reward_rules WHERE id = ? AND biz_id = ?', id, venue.id);
  if (!cur) return { error: 'Kural bulunamadı.', status: 404 };
  const r = ruleInput({ ...raw, game: cur.game }, venue, { creating: false });
  if (r.error) return r;
  const d = r.data;
  const row = await get(
    `UPDATE reward_rules SET target = ?, prize = ?, daily_limit = ?, cost_try = ? WHERE id = ? AND biz_id = ? RETURNING ${RULE_COLS}`,
    d.target, d.prize, d.dailyLimit, d.costTry, id, venue.id,
  );
  return { rule: shapeRule(row) };
}

export async function setRuleActive(venue, id, active) {
  if (typeof active !== 'boolean') return { error: 'Geçersiz istek.' };
  try {
    const row = await get(`UPDATE reward_rules SET active = ? WHERE id = ? AND biz_id = ? RETURNING ${RULE_COLS}`, active, id, venue.id);
    return row ? { rule: shapeRule(row) } : { error: 'Kural bulunamadı.', status: 404 };
  } catch (e) {
    if (isUnique(e)) return DUP;
    throw e;
  }
}

// Kural silinince verilmiş kodlar (ve ikram bilgisi) kalır; yalnızca rule_id boşta kalır.
export async function deleteRule(venue, id) {
  const row = await get('DELETE FROM reward_rules WHERE id = ? AND biz_id = ? RETURNING id', id, venue.id);
  return row ? { ok: true } : { error: 'Kural bulunamadı.', status: 404 };
}

// ---------- Kod üretimi ----------
// Mekân baş harfleri (A-Z, en çok 3; Türkçe harfler sadeleştirilir) + '-' + 4 karakter. Kriptografik rastgele.
export function makeCode(initials) {
  const map = { Ç: 'C', Ğ: 'G', İ: 'I', Ö: 'O', Ş: 'S', Ü: 'U' };
  const pre = String(initials ?? '').toLocaleUpperCase('tr').replace(/[ÇĞİÖŞÜ]/g, (c) => map[c]).replace(/[^A-Z]/g, '').slice(0, 3) || 'OH';
  let tail = '';
  for (let i = 0; i < 4; i++) tail += ALPHABET[randomInt(ALPHABET.length)];
  return `${pre}-${tail}`;
}

// Kullanıcının yazdığı kodu 'XX-ABCD' biçimine getirir (boşluk, tire, küçük harf fark etmez); geçersizse null.
export function normCode(raw) {
  const s = String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length < 5 || s.length > 7) return null;
  return `${s.slice(0, -4)}-${s.slice(-4)}`;
}

const roundKey = (tbl, game, round, pid) => createHash('sha256').update(`${tbl}|${game}|${round}|${pid}`).digest('hex').slice(0, 40);

// Tek oyuncu için kod yazar. İdempotent: (biz_id, round_key) benzersiz olduğundan aynı turdan aynı oyuncuya ikinci satır
// oluşmaz (ON CONFLICT DO NOTHING). Günlük sınır aynı INSERT içinde denetlenir. Kod çakışırsa yeni kodla yeniden dener.
async function insertCode(biz, rule, { tbl, game, key, score }, now) {
  for (let i = 0; i < 6; i++) {
    const code = makeCode(biz.initials);
    const lim = rule.dailyLimit; // null: kural sınırsız bırakılmış -> mekân genelinde varsayılan üst sınır uygulanır
    const params = [biz.id, rule.id, key, code, tbl, game, rule.prize, score, rule.costTry, now, now + CODE_TTL_MS];
    let sql = `INSERT INTO reward_codes (biz_id, rule_id, round_key, code, masa, game, prize, score, cost_try, status, issued_at, expires_at)
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, 'bekliyor', ?, ?`;
    // Sayma + ekleme tek ifade. Açık limitli kural kendi kural sayacına, limitsiz kural mekân genelindeki varsayılan
    // üst sınıra bağlanır. (READ COMMITTED: eşzamanlı iki ekleme aynı sayıyı görebilir; aşım istek eşzamanlılığıyla sınırlıdır.)
    if (lim != null) {
      sql += ' WHERE (SELECT count(*) FROM reward_codes WHERE rule_id = ? AND issued_at >= ?) < ?';
      params.push(rule.id, dayStart(now), lim);
    } else {
      sql += ' WHERE (SELECT count(*) FROM reward_codes WHERE biz_id = ? AND issued_at >= ?) < ?';
      params.push(biz.id, dayStart(now), DEFAULT_DAILY_CODE_LIMIT);
    }
    sql += ' ON CONFLICT (biz_id, round_key) DO NOTHING RETURNING id';
    try {
      return !!(await get(sql, ...params));
    } catch (e) {
      if (!isUnique(e)) throw e; // kod çakışması: yeni kod dene
    }
  }
  return false;
}

// Oda bitmişse, o mekân/oyun için açık kuralın hedefini geçen her (masada kalan) oyuncuya bir kod üretir.
// Oda durumu sunucudan okunur (room.state); puan oyun motorunun kendi kaydıdır. Birden çok kez çağrılabilir (idempotent):
//  - tur kimliği (state.round) 'start' eyleminde sunucuda üretilir; (masa, oyun, tur, pid) başına en çok bir kod,
//  - önce kodu olanlar tek SELECT ile elenir, kalanlar için ON CONFLICT korumalı INSERT çalışır.
// Mekân Sınavı (etkinlik) odaları kapsam dışıdır; çağıran yalnızca etkinliksiz odayı verir.
export async function settleRoom(biz, tbl, game, room, now = Date.now()) {
  const def = REWARD_GAMES[game];
  const s = room?.state;
  if (!def || !s || s.phase !== 'play' || !s.round || !s.game) return;
  const scores = def.final(s.game, now);
  if (!scores) return;
  const winners = [];
  s.seats.forEach((seat, i) => {
    const sc = Number(scores[i]);
    if (seat && !seat.left && seat.pid && Number.isFinite(sc)) winners.push({ pid: seat.pid, score: Math.trunc(sc) });
  });
  if (!winners.length) return;
  const rule = await get('SELECT id, game, target, prize, daily_limit, cost_try, active, biz_id, created_at FROM reward_rules WHERE biz_id = ? AND game = ? AND active', biz.id, game).then((r) => r && shapeRule(r));
  if (!rule) return;
  const hit = winners.filter((w) => w.score >= rule.target).map((w) => ({ ...w, key: roundKey(tbl, game, s.round, w.pid) }));
  if (!hit.length) return;
  const have = new Set((await all(`SELECT round_key FROM reward_codes WHERE biz_id = ? AND round_key IN (${hit.map(() => '?').join(',')})`, biz.id, ...hit.map((h) => h.key))).map((r) => r.round_key));
  for (const h of hit) {
    if (!have.has(h.key)) await insertCode(biz, rule, { tbl, game, key: h.key, score: h.score }, now);
  }
}

// Oyuncunun KENDİ kodu (başkasınınkini döndürmez: anahtar pid'e bağlıdır).
export async function rewardFor(bizId, tbl, game, room, pid) {
  const round = room?.state?.round;
  if (!round) return null;
  const r = await get('SELECT code, prize, score, status, expires_at FROM reward_codes WHERE biz_id = ? AND round_key = ?', bizId, roundKey(tbl, game, round, pid));
  return r ? { code: r.code, prize: r.prize, score: Number(r.score), used: r.status === 'kullanildi', expiresAt: Number(r.expires_at) } : null;
}

// ---------- Doğrulama (garson) ----------
const shapeCode = (r) => ({
  code: r.code, masa: r.masa, game: r.game, prize: r.prize, score: Number(r.score),
  issuedAt: Number(r.issued_at), expiresAt: Number(r.expires_at), usedAt: r.used_at == null ? null : Number(r.used_at),
  status: r.status === 'kullanildi' ? 'kullanildi' : Number(r.expires_at) <= Date.now() ? 'suresi-doldu' : 'bekliyor',
});
const CODE_COLS = 'code, masa, game, prize, score, status, issued_at, expires_at, used_at';

// Sonuç türleri: ok (geçerli, bekliyor), used (kullanılmış), expired (süresi dolmuş), none (böyle kod yok).
function verdict(row) {
  if (!row) return { kind: 'none' };
  const c = shapeCode(row);
  return { kind: c.status === 'bekliyor' ? 'ok' : c.status === 'kullanildi' ? 'used' : 'expired', reward: c };
}

// Yalnızca bakar, kodu kapatmaz.
export async function checkCode(bizId, raw) {
  const code = normCode(raw);
  if (!code) return { kind: 'none' };
  return verdict(await get(`SELECT ${CODE_COLS} FROM reward_codes WHERE biz_id = ? AND code = ?`, bizId, code));
}

// Atomik kapatma: tek UPDATE ... WHERE status='bekliyor' AND expires_at > şimdi. İki garson aynı anda denese de yalnızca
// biri satırı döndürür; diğeri 'used' görür.
export async function redeemCode(bizId, raw) {
  const code = normCode(raw);
  if (!code) return { kind: 'none' };
  const now = Date.now();
  const row = await get(
    `UPDATE reward_codes SET status = 'kullanildi', used_at = ? WHERE biz_id = ? AND code = ? AND status = 'bekliyor' AND expires_at > ? RETURNING ${CODE_COLS}`,
    now, bizId, code, now,
  );
  if (row) return { kind: 'ok', reward: shapeCode(row), redeemed: true };
  return checkCode(bizId, code);
}

// ---------- Panel verileri ----------
/** @returns {Promise<RewardCode[]>} */
export async function recentCodes(bizId, limit = 20) {
  const rows = await all(`SELECT ${CODE_COLS} FROM reward_codes WHERE biz_id = ? ORDER BY issued_at DESC, id DESC LIMIT ${Math.min(Math.max(limit | 0, 1), 100)}`, bizId);
  return rows.map(shapeCode);
}

// İstatistikler. Tahmini maliyet YALNIZCA kuralda ikram maliyeti girilmişse (kod üretilirken koda kopyalanır) ve kod
// kullanıldıysa toplanır; hiç maliyet girilmemişse costTry null döner (uydurma yok).
/** @returns {Promise<{ issued: number, prev: number, used: number, changePct: number | undefined, usedPct: number | null, costTry: number | null, costedCount: number }>} */
export async function rewardStats(bizId, now = Date.now()) {
  const m0 = monthStart(now), p0 = monthStart(now, 1);
  const r = await get(
    `SELECT
       count(*) FILTER (WHERE issued_at >= ?)::int AS issued,
       count(*) FILTER (WHERE issued_at >= ? AND issued_at < ?)::int AS prev,
       count(*) FILTER (WHERE issued_at >= ? AND status = 'kullanildi')::int AS used,
       coalesce(sum(cost_try) FILTER (WHERE issued_at >= ? AND status = 'kullanildi'), 0)::bigint AS cost,
       count(*) FILTER (WHERE issued_at >= ? AND status = 'kullanildi' AND cost_try IS NOT NULL)::int AS costed
     FROM reward_codes WHERE biz_id = ?`,
    m0, p0, m0, m0, m0, m0, bizId,
  );
  const issued = Number(r?.issued) || 0, prev = Number(r?.prev) || 0, used = Number(r?.used) || 0, costed = Number(r?.costed) || 0;
  return {
    issued, prev, used,
    changePct: prev > 0 ? Math.round(((issued - prev) / prev) * 100) : undefined,
    usedPct: issued > 0 ? Math.round((used / issued) * 100) : null,
    costTry: costed > 0 ? Number(r.cost) : null,
    costedCount: costed,
  };
}
