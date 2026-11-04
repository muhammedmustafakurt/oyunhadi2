// Oturum çerezi imzası (SAF modül: yalnız node:crypto; venues.js ve admin.js kullanır, Node ile doğrudan test edilir).
// Biçim: "<id>.<bitiş>.<sürüm>.<HMAC>". İmza alan adını (ctx), id'yi, bitişi ve SÜRÜMÜ kapsar.
// Sürüm = HMAC(anahtar, parola karması) ilk 16 hex: parola değişince/sıfırlanınca sürüm değişir ve eski çerezler
// doğrulamada düşer (veritabanında yeni sütun gerekmez; karma zaten satırda). Eski 3 parçalı biçim regex'e uymaz,
// sessizce reddedilir (yeniden giriş).
import { createHmac, timingSafeEqual } from 'node:crypto';

const RE = /^(\d{1,10})\.(\d{10,16})\.([a-f0-9]{16})\.([a-f0-9]{64})$/;

const mac = (key, data) => createHmac('sha256', key).update(data).digest('hex');

/** Parola karmasından türetilen oturum sürümü (16 hex). Karma boş/geçersizse yine sabit bir değer döner. */
export function passwordVersion(key, passwordHash) {
  return mac(key, `pwv|${String(passwordHash ?? '')}`).slice(0, 16);
}

/** Çerez değerini üretir. */
export function signToken(key, ctx, id, expiresAt, version) {
  const payload = `${id}.${expiresAt}.${version}`;
  return `${payload}.${mac(key, `${ctx}|${payload}`)}`;
}

/** İmza ve süre geçerliyse { id, version }, değilse null. Sürümün güncel parolayla eşleştiğini ÇAĞIRAN denetler. */
export function parseToken(key, ctx, raw, now = Date.now()) {
  const m = RE.exec(typeof raw === 'string' ? raw : '');
  if (!m) return null;
  const a = Buffer.from(mac(key, `${ctx}|${m[1]}.${m[2]}.${m[3]}`), 'hex');
  const b = Buffer.from(m[4], 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(m[2]) <= now) return null;
  return { id: Number(m[1]), version: m[3] };
}

/** Sürüm eşleşmesi (sabit zamanlı). */
export function versionMatches(version, key, passwordHash) {
  const a = Buffer.from(version, 'utf8');
  const b = Buffer.from(passwordVersion(key, passwordHash), 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
