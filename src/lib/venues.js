// Mekân kayıtları (venues tablosu). Oyuncu ekranı ve panel buradan okur; panel kaydetme işlemleri
// updateVenue ile yapılır. Şema src/lib/db.js'te, tip src/lib/venue-types.ts'te tanımlı.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { scrypt, timingSafeEqual, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { get, all, run } from './db';
import { passwordVersion, signToken, parseToken, versionMatches } from './session-token';
// Venue tipi veren dosya TS olduğu için JS dosyasında yalnızca JSDoc ile Referanslı tip kullanılır:

const COLS = 'id, slug, name, city, initials, logo_url, color, accent, ntables, lat, lng, games, welcome, ann_title, ann_body, email';
export const VENUE_GAMES = 'monopoly satranc spyfall ajanlar vampir tabu kimim cizim bil azul cluedo scrabble risk ticket carcassonne catan kadro futbolcu pisti okey g2048 adam'.split(' ');
const SCRYPT = { N: 16384, r: 8, p: 1 }; // db.js hashPassword ile aynı olmalı
const scryptAsync = promisify(scrypt); // olay döngüsünü bloke etmez

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
  globalThis.__venueCache?.clear();
  return getVenue(id);
}

// ---------- Panel oturumu ----------
// Oturum çerezi: "<mekânId>.<bitiş>.<parolaSürümü>.<HMAC>" (src/lib/session-token.js). İmza SESSION_SECRET ile atılır;
// sürüm mekânın parola karmasından türer, bu yüzden şifre değişince/sıfırlanınca eski çerezler doğrulamada düşer.
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
const stamp = (id, passwordHash) => signToken(secret(), 'panel', id, Date.now() + SESSION_MS, passwordVersion(secret(), passwordHash));

// Oturum çerezinden güncel mekânı döndürür; girişli değilse null. Oturum yoksa panelleri /panel/giris'e atar.
export async function panelVenue() {
  try {
    const raw = (await cookies()).get(CO)?.value ?? '';
    const t = parseToken(secret(), 'panel', raw);
    if (!t) return null; // eski 3 parçalı biçim de burada düşer
    // Parola karması değiştiyse (şifre sıfırlandı) oturum geçersiz.
    const row = await get('SELECT password FROM venues WHERE id = ?', t.id);
    if (!row || !versionMatches(t.version, secret(), row.password)) return null;
    return await getVenue(t.id);
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

export function cookieFor(id, passwordHash) {
  return { name: CO, value: stamp(String(id), passwordHash), httpOnly: true, secure: IS_PROD, sameSite: 'lax', maxAge: SESSION_MS / 1000, path: '/' };
}

// Giriş: e-posta + şifre venues tablosundaki kayıtla karşılaştırılır (scrypt). Başarılıysa { id, password (karma) }.
// Kayıt ya da şifre yoksa da scrypt çalışır; yanıt süresinden e-postanın var olup olmadığı anlaşılmasın.
const DUMMY_SALT = randomBytes(16).toString('hex');
export async function loginVenue(email, password) {
  const em = String(email ?? '').trim().toLowerCase().slice(0, 200);
  const r = await get('SELECT id, password FROM venues WHERE lower(email) = ? LIMIT 1', em);
  const [salt, h] = String(r?.password ?? '').split(':');
  const got = await scryptAsync(String(password ?? '').slice(0, 256), salt || DUMMY_SALT, 32, SCRYPT);
  if (!r || !salt || !h || !/^[a-f0-9]{64}$/.test(h)) return null;
  return timingSafeEqual(got, Buffer.from(h, 'hex')) ? { id: r.id, password: r.password } : null;
}

// Giriş denemesi sınırı: artan gecikmeli (hesap+IP) ve IP sayaçları, src/lib/ratelimit.js loginGate. Anahtarlar
// "p:<e-posta>|<ip>" ve "i:<ip>"; GLOBAL (yalnız e-posta) sayaç yoktur.
export { loginGate, loginSuccess } from './ratelimit';
export const loginKeys = (email, ip) => [`p:${email}|${ip}`, `i:${ip}`];
