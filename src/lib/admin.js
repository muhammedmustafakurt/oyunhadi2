// Süper-admin (platform sahibi) kodu tek yerde: host denetimi, tek hesaplı kimlik doğrulama, imzalı oturum,
// CSRF denetimi, giriş sınırı ve mekân yönetimi sorguları. Mekân paneli (venues.js) ile çerez, imza ve oturum
// tamamen ayrıdır: panel çerezi burada geçerli sayılmaz.
// Ortam: ADMIN_EMAIL, ADMIN_PASSWORD_HASH ("salt:hash", scripts/admin-hash.mjs), SESSION_SECRET, ADMIN_HOST.
import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { all, get, run, hashPassword } from './db';
import { VENUE_GAMES, getVenue, updateVenue } from './venues';
import { clientIp } from './ratelimit';

const IS_PROD = process.env.NODE_ENV === 'production';
const SCRYPT = { N: 16384, r: 8, p: 1 }; // db.js hashPassword ile aynı
export const ADMIN_COOKIE = IS_PROD ? '__Host-oh-admin' : 'oh-admin';
const SESSION_MS = 8 * 60 * 60 * 1000;
export const NO_STORE = { 'Cache-Control': 'no-store' };

// ---------- Host ----------
export function adminHost() {
  return (process.env.ADMIN_HOST || 'admin.oyunhadi.com').trim().toLowerCase();
}
// Yalnızca admin host'ta çalışır. Geliştirmede admin.localhost da kabul edilir (üretimde edilmez).
export function isAdminHost(host) {
  const h = String(host ?? '').toLowerCase().replace(/:\d+$/, '');
  return h === adminHost().replace(/:\d+$/, '') || (!IS_PROD && h === 'admin.localhost');
}

// ---------- Yapılandırma ----------
const HASH_RE = /^[a-f0-9]{16,128}:[a-f0-9]{64}$/;
function sessionSecret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (IS_PROD) return null;
  return 'dev-only-session-secret-not-for-production';
}
function config() {
  const email = String(process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const hash = String(process.env.ADMIN_PASSWORD_HASH ?? '').trim();
  if (!email || !HASH_RE.test(hash) || !sessionSecret()) return null;
  return { email, hash };
}
export const adminConfigured = () => !!config();

// ---------- Oturum ----------
// Çerez: "<bitiş>.<HMAC>". İmza anahtarı SESSION_SECRET'tan ayrı bir önekle türetilir ve yük "admin|" ile başlar.
const sig = (payload) => createHmac('sha256', `oyunhadi-admin-v1|${sessionSecret()}`).update(`admin|${payload}`).digest('hex');

export function adminCookie() {
  const payload = String(Date.now() + SESSION_MS);
  return { name: ADMIN_COOKIE, value: `${payload}.${sig(payload)}`, httpOnly: true, secure: IS_PROD, sameSite: 'strict', maxAge: SESSION_MS / 1000, path: '/' };
}
export function clearAdminCookie() {
  return { name: ADMIN_COOKIE, value: '', httpOnly: true, secure: IS_PROD, sameSite: 'strict', maxAge: 0, path: '/' };
}

async function sessionOk() {
  try {
    if (!config()) return false;
    const m = /^(\d{10,16})\.([a-f0-9]{64})$/.exec((await cookies()).get(ADMIN_COOKIE)?.value ?? '');
    if (!m) return false;
    const a = Buffer.from(sig(m[1]), 'hex');
    const b = Buffer.from(m[2], 'hex');
    return a.length === b.length && timingSafeEqual(a, b) && Number(m[1]) > Date.now();
  } catch {
    return false;
  }
}

// Sayfalar için: yanlış host'ta 404, oturum yoksa /giris (admin host'ta kök /yonetim'e yeniden yazılır).
export async function requireAdminPage() {
  if (!isAdminHost((await headers()).get('host'))) notFound();
  if (!(await sessionOk())) redirect('/giris');
}
// Giriş sayfası için: yalnızca host denetimi; oturum açıksa true döner.
export async function adminLoginPageState() {
  if (!isAdminHost((await headers()).get('host'))) notFound();
  return { signedIn: await sessionOk(), configured: adminConfigured() };
}

// API'ler için: host + (durum değiştirenlerde) Origin + oturum. Geçerliyse null, değilse hazır Response döner.
function deny(status, error) {
  return Response.json({ error }, { status, headers: NO_STORE });
}
export const fail = deny;
export async function guardApi(req, { auth = true } = {}) {
  if (!isAdminHost(req.headers.get('host'))) return new Response(null, { status: 404, headers: NO_STORE });
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // CSRF: Origin başlığı varsa host'la aynı olmalı; yoksa tarayıcı same-origin bildirmeli.
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

// scrypt her zaman çalışır (hesap yapılandırılmamış olsa da); e-posta ve şifre sabit zamanlı karşılaştırılır.
export function checkAdminLogin(email, password) {
  const cfg = config();
  const [salt, h] = (cfg?.hash ?? '').split(':');
  const got = scryptSync(String(password ?? '').slice(0, 256), salt || DUMMY_SALT, 32, SCRYPT);
  const want = h ? Buffer.from(h, 'hex') : Buffer.alloc(32);
  const emailOk = timingSafeEqual(digest(String(email ?? '').trim().toLowerCase().slice(0, 200)), digest(cfg?.email ?? '\u0000'));
  const passOk = timingSafeEqual(got, want);
  return !!cfg && emailOk && passOk;
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
