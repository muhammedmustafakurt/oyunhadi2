// Süper-admin (platform sahibi) kodu tek yerde: host denetimi, tek hesaplı kimlik doğrulama, imzalı oturum,
// CSRF denetimi, giriş sınırı ve mekân yönetimi sorguları. Mekân paneli (venues.js) ile çerez, imza ve oturum
// tamamen ayrıdır: panel çerezi burada geçerli sayılmaz.
// Hesaplar admins tablosunda. ADMIN_EMAIL + ADMIN_PASSWORD_HASH ("salt:hash", scripts/admin-hash.mjs) yalnızca tablo
// boşken ilk yöneticiyi tohumlamak içindir; tablo doluysa yok sayılır. Ortam: SESSION_SECRET.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { all, get, run, hashPassword } from './db';
import { VENUE_GAMES, getVenue, updateVenue } from './venues';
import { clientIp } from './ratelimit';

const IS_PROD = process.env.NODE_ENV === 'production';
const SCRYPT = { N: 16384, r: 8, p: 1 }; // db.js hashPassword ile aynı
export const ADMIN_COOKIE = IS_PROD ? '__Host-oh-admin' : 'oh-admin';
const SESSION_MS = 8 * 60 * 60 * 1000;
export const NO_STORE = { 'Cache-Control': 'no-store' };


// ---------- Yapılandırma ----------
const HASH_RE = /^[a-f0-9]{16,128}:[a-f0-9]{64}$/;
function sessionSecret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (IS_PROD) return null;
  return 'dev-only-session-secret-not-for-production';
}
// Ortamdaki ilk yönetici tohumu (geçerli değilse null).
function envSeed() {
  const email = String(process.env.ADMIN_EMAIL ?? '').trim().toLowerCase().slice(0, 200);
  const hash = String(process.env.ADMIN_PASSWORD_HASH ?? '').trim();
  return email && HASH_RE.test(hash) ? { email, hash } : null;
}
// Giriş açık mı: imza anahtarı var ve (tabloda yönetici var ya da tohum ortamda ayarlı).
export async function adminConfigured() {
  if (!sessionSecret()) return false;
  if (envSeed()) return true;
  return Number((await get('SELECT count(*)::int AS n FROM admins'))?.n) > 0;
}

// ---------- Oturum ----------
// Çerez: "<adminId>.<bitiş>.<HMAC>". İmza anahtarı SESSION_SECRET'tan ayrı bir önekle türetilir ve yük "admin|" ile
// başlar. Her istekte admin satırının hâlâ var olduğu doğrulanır (silinen yöneticinin oturumu düşer).
const sig = (payload) => createHmac('sha256', `oyunhadi-admin-v1|${sessionSecret()}`).update(`admin|${payload}`).digest('hex');

export function adminCookie(id) {
  const payload = `${id}.${Date.now() + SESSION_MS}`;
  return { name: ADMIN_COOKIE, value: `${payload}.${sig(payload)}`, httpOnly: true, secure: IS_PROD, sameSite: 'strict', maxAge: SESSION_MS / 1000, path: '/' };
}
export function clearAdminCookie() {
  return { name: ADMIN_COOKIE, value: '', httpOnly: true, secure: IS_PROD, sameSite: 'strict', maxAge: 0, path: '/' };
}

// Geçerli oturumun yönetici id'si; yoksa null.
export async function currentAdminId() {
  try {
    if (!sessionSecret()) return null;
    const m = /^(\d{1,9})\.(\d{10,16})\.([a-f0-9]{64})$/.exec((await cookies()).get(ADMIN_COOKIE)?.value ?? '');
    if (!m) return null;
    const a = Buffer.from(sig(`${m[1]}.${m[2]}`), 'hex');
    const b = Buffer.from(m[3], 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b) || Number(m[2]) <= Date.now()) return null;
    const row = await get('SELECT id FROM admins WHERE id = ?', Number(m[1]));
    return row ? Number(row.id) : null;
  } catch {
    return null;
  }
}
const sessionOk = async () => (await currentAdminId()) != null;

// Sayfalar için: oturum yoksa /admin/giris.
export async function requireAdminPage() {
  if (!(await sessionOk())) redirect('/admin/giris');
}
// Giriş sayfası için: oturum açıksa true döner.
export async function adminLoginPageState() {
  return { signedIn: await sessionOk(), configured: await adminConfigured() };
}

// API'ler için: (durum değiştirenlerde) Origin + oturum. Geçerliyse null, değilse hazır Response döner.
function deny(status, error) {
  return Response.json({ error }, { status, headers: NO_STORE });
}
export const fail = deny;
export async function guardApi(req, { auth = true } = {}) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // CSRF: Origin başlığı varsa sitenin kendi Host'uyla aynı olmalı; yoksa tarayıcı same-origin bildirmeli.
    const origin = req.headers.get('origin');
    let ok = false;
    if (origin) {
      try { ok = new URL(origin).host.toLowerCase() === String(req.headers.get('host') ?? '').toLowerCase(); } catch { ok = false; }
    } else ok = req.headers.get('sec-fetch-site') === 'same-origin';
    if (!ok) return deny(403, 'İstek reddedildi.');
  }
  if (auth && !(await sessionOk())) return deny(401, 'Oturum gerekli.');
  return null;
}
export async function readJson(req) {
  const b = await req.json().catch(() => null);
  return b && typeof b === 'object' && !Array.isArray(b) ? b : null;
}

// ---------- Giriş ----------
const DUMMY_SALT = randomBytes(16).toString('hex');
const digest = (s) => createHash('sha256').update(String(s)).digest();

// scrypt her zaman çalışır (hesap yoksa sahte salt ile); karşılaştırma sabit zamanlı.
function verifyPw(stored, password) {
  const [salt, h] = String(stored ?? '').split(':');
  const valid = !!salt && /^[a-f0-9]{64}$/.test(h ?? '');
  const got = scryptSync(String(password ?? '').slice(0, 256), salt || DUMMY_SALT, 32, SCRYPT);
  return timingSafeEqual(got, valid ? Buffer.from(h, 'hex') : Buffer.alloc(32)) && valid;
}

// Tablo boşsa ve ortam tohumu varsa ilk yöneticiyi ekler (tek ifade, yarışa karşı ON CONFLICT DO NOTHING).
async function seedFirstAdmin() {
  const cfg = envSeed();
  if (!cfg) return;
  await run('INSERT INTO admins (email, password, created_at) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM admins) ON CONFLICT DO NOTHING', cfg.email, cfg.hash, Date.now());
}

// Başarılıysa yönetici id'si, değilse null.
export async function checkAdminLogin(email, password) {
  if (!sessionSecret()) return null;
  await seedFirstAdmin();
  const em = String(email ?? '').trim().toLowerCase().slice(0, 200);
  const row = await get('SELECT id, password FROM admins WHERE lower(email) = ? LIMIT 1', em);
  const ok = verifyPw(row?.password, password);
  if (!row || !ok) return null;
  await run('UPDATE admins SET last_login_at = ? WHERE id = ?', Date.now(), row.id);
  return Number(row.id);
}

// ---------- Yöneticiler ----------
export async function listAdmins() {
  const rows = await all('SELECT id, email, created_at, last_login_at FROM admins ORDER BY id');
  return rows.map((r) => ({ id: Number(r.id), email: String(r.email), createdAt: Number(r.created_at), lastLogin: r.last_login_at == null ? null : Number(r.last_login_at) }));
}

export async function createAdmin(b) {
  const email = String(b.email ?? '').trim().toLowerCase().slice(0, 200);
  if (!EMAIL_RE.test(email)) return { error: 'Geçerli bir e-posta girin.' };
  const password = generatePassword();
  const rows = await all('INSERT INTO admins (email, password, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING RETURNING id', email, hashPassword(password), Date.now());
  if (!rows.length) return { error: 'Bu e-posta zaten yönetici.' };
  return { id: Number(rows[0].id), email, password };
}

// Kendi şifresini değiştirir; mevcut şifre doğrulanır (scrypt, sabit zamanlı).
export async function changeOwnPassword(id, current, next) {
  const row = await get('SELECT password FROM admins WHERE id = ?', id);
  if (!row || !verifyPw(row.password, current)) return { error: 'Mevcut şifre hatalı.', bad: true };
  const n = String(next ?? '');
  if (n.length < 12 || n.length > 256) return { error: 'Yeni şifre 12-256 karakter olmalı.' };
  await run('UPDATE admins SET password = ? WHERE id = ?', hashPassword(n), id);
  return { ok: true };
}

// Başka bir yöneticiyi siler; kendini ve son yöneticiyi silemez (kural tek ifadede uygulanır).
export async function deleteAdmin(actingId, targetId) {
  if (actingId === targetId) return { error: 'Kendinizi silemezsiniz.' };
  const rows = await all('DELETE FROM admins WHERE id = $1 AND id <> $2 AND (SELECT count(*) FROM admins) > 1 RETURNING id', targetId, actingId);
  if (rows.length) return { ok: true };
  const exists = await get('SELECT id FROM admins WHERE id = ?', targetId);
  return exists ? { error: 'Son yönetici silinemez.' } : { error: 'Yönetici bulunamadı.', status: 404 };
}

// Sınır, login_attempts tablosunda "adm:" önekli anahtarlarla (mekân girişiyle karışmaz): 15 dakikada IP başına 8
// ve (tek hesap olduğu için) toplam 40 başarısız deneme.
const WINDOW = 15 * 60 * 1000;
export const adminIp = clientIp;
export async function adminLoginBlocked(ip) {
  const since = Date.now() - WINDOW;
  const count = async (key) => Number((await get('SELECT count(*)::int AS n FROM login_attempts WHERE key = ? AND at > ?', key, since))?.n) || 0;
  return (await count(`adm:i:${ip}`)) >= 8 || (await count('adm:all')) >= 40;
}
export async function adminLoginFailure(ip) {
  const t = Date.now();
  await run('INSERT INTO login_attempts (key, at) VALUES (?, ?), (?, ?)', `adm:i:${ip}`, t, 'adm:all', t);
  await run('DELETE FROM login_attempts WHERE at < ?', t - 24 * 60 * 60 * 1000);
}

// ---------- Girdi temizliği ----------
const clean = (s, max) => String(s ?? '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/;
const SLUG_RE = /^[a-z0-9-]{3,40}$/;
const RESERVED = new Set('panel api oyna yonetim admin blog cozumler fiyat gunluk-test guven kafe-oyunlari-rehberi kampus kurumsal nasil-calisir ortaklik oyuncular-icin oyunlar ozellikler sss teklif yarisma-gecesi yasal'.split(' '));
const cleanGames = (g) => (Array.isArray(g) ? [...new Set(g.filter((x) => VENUE_GAMES.includes(x)))] : []);

// 14 karakterlik, karışan harfleri içermeyen rastgele şifre.
export function generatePassword() {
  const A = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(randomBytes(14), (x) => A[x % A.length]).join('');
}
const initialsOf = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toLocaleUpperCase('tr').slice(0, 3) || 'M';

async function emailTaken(email, exceptId) {
  return !!(await get('SELECT id FROM venues WHERE lower(email) = ? AND id <> ? LIMIT 1', email, exceptId ?? 0));
}

// ---------- Mekân işlemleri ----------
export async function createVenue(b) {
  const slug = String(b.slug ?? '').trim().toLowerCase();
  const name = clean(b.name, 80), city = clean(b.city, 80);
  const email = String(b.email ?? '').trim().toLowerCase().slice(0, 200);
  if (!SLUG_RE.test(slug) || RESERVED.has(slug)) return { error: 'Adres (slug) 3-40 karakter, yalnızca a-z, 0-9 ve tire olmalı; ayrılmış bir ad olamaz.' };
  if (!name) return { error: 'Mekân adı gerekli.' };
  if (!EMAIL_RE.test(email)) return { error: 'Geçerli bir e-posta girin.' };
  if (await emailTaken(email)) return { error: 'Bu e-posta başka bir mekânda kullanılıyor.' };
  const tables = Math.max(1, Math.min(500, Math.floor(Number(b.tables) || 1)));
  const games = ('games' in b ? cleanGames(b.games) : VENUE_GAMES).join(',');
  const password = generatePassword();
  const now = Date.now();
  const rows = await all(
    'INSERT INTO venues (slug, name, city, initials, ntables, games, email, password, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT (slug) DO NOTHING RETURNING id',
    slug, name, city, initialsOf(name), tables, games, email, hashPassword(password), now, now,
  );
  if (!rows.length) return { error: 'Bu adres zaten kullanılıyor.' };
  return { id: Number(rows[0].id), password };
}

export async function editVenue(id, b) {
  const v = await getVenue(id);
  if (!v) return { error: 'Mekân bulunamadı.', status: 404 };
  const patch = {};
  if ('name' in b) { const n = clean(b.name, 80); if (!n) return { error: 'Mekân adı boş olamaz.' }; patch.name = n; }
  if ('city' in b) patch.city = clean(b.city, 80);
  if ('tables' in b) {
    const n = Number(b.tables);
    if (!Number.isInteger(n) || n < 1 || n > 500) return { error: 'Masa sayısı 1-500 arasında olmalı.' };
    patch.tables = n;
  }
  if ('games' in b) {
    if (!Array.isArray(b.games)) return { error: 'Oyun listesi geçersiz.' };
    patch.games = cleanGames(b.games);
  }
  let email = null;
  if ('email' in b) {
    email = String(b.email ?? '').trim().toLowerCase().slice(0, 200);
    if (!EMAIL_RE.test(email)) return { error: 'Geçerli bir e-posta girin.' };
    if (await emailTaken(email, id)) return { error: 'Bu e-posta başka bir mekânda kullanılıyor.' };
  }
  if (Object.keys(patch).length) await updateVenue(id, patch);
  if (email != null) await run('UPDATE venues SET email = ?, updated_at = ? WHERE id = ?', email, Date.now(), id);
  return { ok: true };
}

export async function resetVenuePassword(id) {
  const v = await getVenue(id);
  if (!v) return { error: 'Mekân bulunamadı.', status: 404 };
  const password = generatePassword();
  await run('UPDATE venues SET password = ?, updated_at = ? WHERE id = ?', hashPassword(password), Date.now(), id);
  return { password };
}

// Tek SQL ifadesiyle (atomik) mekân ve ilişkili tüm verisi silinir. Onay: mekân adı birebir yazılmalı.
export async function deleteVenue(id, confirmName) {
  const v = await getVenue(id);
  if (!v) return { error: 'Mekân bulunamadı.', status: 404 };
  if (String(confirmName ?? '').trim() !== v.name) return { error: 'Onay için mekân adını birebir yazın.' };
  await run(
    `WITH rooms AS (SELECT id FROM chat_rooms WHERE biz_id = $1),
     d1 AS (DELETE FROM chat_messages WHERE room_id IN (SELECT id FROM rooms)),
     d2 AS (DELETE FROM chat_rooms WHERE biz_id = $1),
     d3 AS (DELETE FROM chat_requests WHERE biz_id = $1),
     d4 AS (DELETE FROM chat_blocks WHERE biz_id = $1),
     d5 AS (DELETE FROM chat_reports WHERE biz_id = $1),
     d6 AS (DELETE FROM chat_sessions WHERE biz_id = $1),
     d7 AS (DELETE FROM chat_settings WHERE biz_id = $1),
     d8 AS (DELETE FROM game_rooms WHERE biz_id = $1),
     d9 AS (DELETE FROM play_logs WHERE biz_id = $1)
     DELETE FROM venues WHERE id = $1`,
    id,
  );
  return { ok: true };
}

// ---------- Okuma ----------
export async function overview() {
  const t = Date.now(), d = 24 * 60 * 60 * 1000;
  const n = (r) => Number(r?.n) || 0;
  const [v, tb, p7, p30, top] = await Promise.all([
    get('SELECT count(*)::int AS n FROM venues'),
    get('SELECT coalesce(sum(ntables), 0)::int AS n FROM venues'),
    get('SELECT count(*)::int AS n FROM play_logs WHERE at > ?', t - 7 * d),
    get('SELECT count(*)::int AS n FROM play_logs WHERE at > ?', t - 30 * d),
    all('SELECT game, count(*)::int AS n FROM play_logs WHERE at > ? GROUP BY game ORDER BY n DESC, game LIMIT 10', t - 30 * d),
  ]);
  return { venues: n(v), tables: n(tb), plays7: n(p7), plays30: n(p30), top: top.map((r) => ({ game: String(r.game), n: Number(r.n) })) };
}

export async function venueRows() {
  const rows = await all(
    `SELECT v.id, v.slug, v.name, v.city, v.ntables, v.games, v.email,
       (SELECT max(at) FROM play_logs p WHERE p.biz_id = v.id) AS last_play
     FROM venues v ORDER BY v.id`,
  );
  return rows.map((r) => ({
    id: Number(r.id), slug: String(r.slug), name: String(r.name), city: String(r.city), tables: Number(r.ntables), email: String(r.email),
    openGames: String(r.games || '').split(',').filter((x) => VENUE_GAMES.includes(x)).length,
    lastPlay: r.last_play == null ? null : Number(r.last_play),
  }));
}
export const venueDetail = getVenue;

// Tüm mekânlar: son N günün günlük oyun/oyuncu sayısı (panelin weekDocs biçimi; WeekChart'a doğrudan verilir).
export async function dailyPlays(days = 14) {
  const DAY = 86_400_000, GN = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const d0 = new Date(); d0.setUTCHours(0, 0, 0, 0);
  const from = d0.getTime() - (days - 1) * DAY;
  const rows = await all('SELECT at, players FROM play_logs WHERE at >= ?', from);
  const out = Array.from({ length: days }, (_, i) => ({ day: GN[(new Date(from + i * DAY).getUTCDay() + 6) % 7], oyun: 0, oyuncu: 0 }));
  for (const r of rows) {
    const d = out[Math.floor((Number(r.at) - from) / DAY)];
    if (d) { d.oyun++; d.oyuncu += Number(r.players) || 0; }
  }
  return out;
}

// Oturumdaki yöneticinin e-postası (kenar menüsü için); oturum yoksa null.
export async function currentAdminEmail() {
  const id = await currentAdminId();
  if (id == null) return null;
  const r = await get('SELECT email FROM admins WHERE id = ?', id);
  return r ? String(r.email) : null;
}
