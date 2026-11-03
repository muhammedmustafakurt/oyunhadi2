// Mekân kayıtları (venues tablosu). Oyuncu ekranı ve panel buradan okur; panel kaydetme işlemleri
// updateVenue ile yapılır. Şema src/lib/db.js'te, tip src/lib/venue-types.ts'te tanımlı.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHmac, scryptSync, timingSafeEqual, randomBytes } from 'node:crypto';
import { get, all, run } from './db';
// Venue tipi veren dosya TS olduğu için JS dosyasında yalnızca JSDoc ile Referanslı tip kullanılır:

const COLS = 'id, slug, name, city, initials, logo_url, color, accent, ntables, lat, lng, games, welcome, ann_title, ann_body, email';
export const VENUE_GAMES = 'monopoly satranc spyfall ajanlar vampir tabu kimim cizim bil azul cluedo scrabble risk ticket carcassonne catan kadro futbolcu pisti okey tavla g2048 adam'.split(' ');
const SCRYPT = { N: 16384, r: 8, p: 1 }; // db.js hashPassword ile aynı olmalı

function deg(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n !== 0 ? n / 1_000_000 : null;
}

// Satırı Venue tipine dönüştürür; duyuru boşsa null olur, konum yarımlıysa tamamen null.
export function shapeVenue(r) {
  const v = {
    id: r.id, slug: r.slug, name: r.name, city: r.city, initials: r.initials,
    logoUrl: r.logo_url, color: r.color, accent: r.accent, tables: r.ntables,
    lat: deg(r.lat), lng: deg(r.lng),
    games: String(r.games || '').split(',').filter((x) => VENUE_GAMES.includes(x)),
    welcome: r.welcome, email: r.email,
    announcement: r.ann_title && r.ann_body ? { title: r.ann_title, body: r.ann_body } : null,
  };
  if (v.lat == null) v.lng = null;
  if (v.lng == null) v.lat = null;
  return v;
}

export async function listVenues() {
  return (await all(`SELECT ${COLS} FROM venues ORDER BY id`, [])).map(shapeVenue);
}

export async function getVenueBySlug(slug) {
  const r = await get(`SELECT ${COLS} FROM venues WHERE slug = ?`, slug);
  return r ? shapeVenue(r) : null;
}

export async function getVenue(id) {
  const r = await get(`SELECT ${COLS} FROM venues WHERE id = ?`, id);
  return r ? shapeVenue(r) : null;
}

// Panel sayfalarından gelen yamayı uygular; yalnızca izinli alanlar yazılır.
export async function updateVenue(id, patch = {}) {
  const SET = {
    name: 'name', city: 'city', welcome: 'welcome', logoUrl: 'logo_url', color: 'color', accent: 'accent', initials: 'initials',
  };
  const clean = (s, max) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, max);
  const parts = [];
  const params = [];

  const HEX = /^#[0-9a-fA-F]{6}$/;
  const SAFE_URL = /^https:\/\/[^\s"'<>()\\]{1,190}$/;
  for (const [k, col] of Object.entries(SET)) {
    if (!(k in patch)) continue;
    const val = clean(patch[k], 200);
    // Renkler oyuncu sayfalarında CSS değişkenine, logo adresi resme gider: biçimi doğrulanmayan değer yazılmaz
    // (CSS/URL enjeksiyonu ve misafir tarayıcısını dış adrese yönlendirme).
    if ((k === 'color' || k === 'accent') && !HEX.test(val)) continue;
    if (k === 'logoUrl' && val && !SAFE_URL.test(val)) continue;
    parts.push([col, val]);
  }
  if ('tables' in patch) {
    const n = Math.max(1, Math.min(500, Math.floor(Number(patch.tables) || 1)));
    parts.push(['ntables', n]);
  }
  if ('lat' in patch || 'lng' in patch) {
    const lat = Number(patch.lat), lng = Number(patch.lng);
    const ok = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    if (ok) parts.push(['lat', Math.round(lat * 1e6)], ['lng', Math.round(lng * 1e6)]);
    else parts.push(['lat', null], ['lng', null]);
  }
  if ('games' in patch && Array.isArray(patch.games)) {
    parts.push(['games', patch.games.filter((x) => VENUE_GAMES.includes(x)).join(',')]);
  }
  if ('announcement' in patch) {
    const a = patch.announcement;
    if (a && clean(a.title, 60)) parts.push(['ann_title', clean(a.title, 60)], ['ann_body', clean(a.body ?? '', 200)]);
    else parts.push(['ann_title', null], ['ann_body', null]);
  }
  if (!parts.length) return getVenue(id);
  parts.push(['updated_at', Date.now()]);
  const set = parts.map(([c], i) => `${c} = $${i + 1}`).join(', ');
  await run(`UPDATE venues SET ${set} WHERE id = $${parts.length + 1}`, ...parts.map(([, v]) => v), id);
  return getVenue(id);
}

// ---------- Panel oturumu ----------
// Oturum çerezi: "<mekânId>.<bitişZamanı>.<HMAC>". İmza SESSION_SECRET ile atılır ve id + bitiş zamanını kapsar.
const CO = 'oh-panel';
const SESSION_MS = 60 * 60 * 24 * 30 * 1000;
const IS_PROD = process.env.NODE_ENV === 'production';

// İmza anahtarı: üretimde SESSION_SECRET zorunlu (yoksa oturum açılmaz/doğrulanmaz); yerelde sabit geliştirme anahtarı.
function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (IS_PROD) throw new Error('SESSION_SECRET ayarlanmamış (en az 32 karakter).');
  return 'dev-only-session-secret-not-for-production';
}
const sign = (payload) => createHmac('sha256', secret()).update(payload).digest('hex');
const stamp = (id) => {
  const payload = `${id}.${Date.now() + SESSION_MS}`;
  return `${payload}.${sign(payload)}`;
};
function verify(raw) {
  const m = /^(\d{1,10})\.(\d{10,16})\.([a-f0-9]{64})$/.exec(String(raw));
  if (!m) return null;
  const a = Buffer.from(sign(`${m[1]}.${m[2]}`), 'hex');
  const b = Buffer.from(m[3], 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(m[2]) < Date.now()) return null;
  return Number(m[1]);
}

// Oturum çerezinden güncel mekânı döndürür; girişli değilse null. Oturum yoksa panelleri /panel/giris'e atar.
export async function panelVenue() {
  try {
    const raw = (await cookies()).get(CO)?.value ?? '';
    const id = verify(raw);
    if (!id) return null;
    return await getVenue(id);
  } catch {
    return null;
  }
}

// Panel sayfaları için: mutlaka oturumlu mekân; yoksa giriş ekranına yönlendirilir.
export async function requireVenue() {
  const v = await panelVenue();
  if (!v) redirect('/panel/giris');
  return v;
}

export function cookieFor(id) {
  return { name: CO, value: stamp(String(id)), httpOnly: true, secure: IS_PROD, sameSite: 'lax', maxAge: SESSION_MS / 1000, path: '/' };
}

// Giriş: e-posta + şifre venues tablosundaki kayıtla karşılaştırılır (scrypt). Başarılıysa mekân id'si.
// Kayıt ya da şifre yoksa da scrypt çalışır; yanıt süresinden e-postanın var olup olmadığı anlaşılmasın.
const DUMMY_SALT = randomBytes(16).toString('hex');
export async function loginVenue(email, password) {
  const em = String(email ?? '').trim().toLowerCase().slice(0, 200);
  const r = await get('SELECT id, password FROM venues WHERE lower(email) = ? LIMIT 1', em);
  const [salt, h] = String(r?.password ?? '').split(':');
  const got = scryptSync(String(password ?? '').slice(0, 256), salt || DUMMY_SALT, 32, SCRYPT);
  if (!r || !salt || !h || !/^[a-f0-9]{64}$/.test(h)) return null;
  return timingSafeEqual(got, Buffer.from(h, 'hex')) ? r.id : null;
}

// Giriş denemesi sınırı (15 dakikada başarısız deneme): e-posta + IP çifti başına 8, yalnızca e-posta başına 40,
// IP başına 30. Çift sınırı, hesap sahibini üçüncü kişinin kilitlemesini zorlaştırır (sahibin kendi IP'si ayrı
// sayılır); e-posta toplamı ise sahte IP başlıklarıyla kaba kuvveti sınırlar. Sayaç veritabanında tutulur.
const LOGIN_WINDOW = 15 * 60 * 1000;
export async function loginBlocked(email, ip) {
  const since = Date.now() - LOGIN_WINDOW;
  const count = async (key) => Number((await get('SELECT count(*)::int AS n FROM login_attempts WHERE key = ? AND at > ?', key, since))?.n) || 0;
  return (await count(`p:${email}|${ip}`)) >= 8 || (await count(`e:${email}`)) >= 40 || (await count(`i:${ip}`)) >= 30;
}
export async function recordLoginFailure(email, ip) {
  const t = Date.now();
  await run('INSERT INTO login_attempts (key, at) VALUES (?, ?), (?, ?), (?, ?)', `e:${email}`, t, `i:${ip}`, t, `p:${email}|${ip}`, t);
  await run('DELETE FROM login_attempts WHERE at < ?', t - 24 * 60 * 60 * 1000);
}
