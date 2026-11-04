// Hız sınırı yardımcıları. İki katman:
//  - floodOk: bellekte, örnek (instance) başına kaba taşkın koruması. Her istekte veritabanına yazmaz.
//  - hit: veritabanında sayaç; sunucusuz ortamda örnekler arasında paylaşılır. Pahalı/kötüye kullanıma açık
//    işlemler (masaya katılma, sohbet oturumu açma) için kullanılır.
import { all, get, run } from '@/lib/db';
import { pickClientIp } from '@/lib/client-ip';

// İstemci adresi: güven modeli ve gerekçe src/lib/client-ip.js içinde.
export function clientIp(req) {
  return pickClientIp((n) => req.headers.get(n), { vercel: !!process.env.VERCEL, prod: process.env.NODE_ENV === 'production' });
}

const mem = (globalThis.__rlMem ??= new Map());

export function floodOk(key, limit, windowMs) {
  const t = Date.now();
  const e = mem.get(key);
  if (!e || t - e.t > windowMs) {
    // Harita dolunca tümünü sıfırlamak sayaçları da sıfırlardı (saldırgan sınırı aşabilirdi): yalnızca en eski girdileri at.
    if (mem.size >= 5000) {
      let drop = Math.ceil(mem.size * 0.1);
      for (const k of mem.keys()) { // Map ekleme sırasını korur: ilk anahtarlar en eskidir
        if (drop-- <= 0) break;
        mem.delete(k);
      }
    }
    mem.set(key, { t, n: 1 });
    return true;
  }
  e.n++;
  return e.n <= limit;
}

// Pencere içinde `limit` kadar izin verir; aşılırsa false döner ve sayaç artmaz.
export async function hit(key, limit, windowMs) {
  const t = Date.now();
  const row = await get('SELECT count(*)::int AS n FROM rate_hits WHERE key = ? AND at > ?', key, t - windowMs);
  if (Number(row?.n) >= limit) return false;
  await run('INSERT INTO rate_hits (key, at) VALUES (?, ?)', key, t);
  if (Math.random() < 0.02) await run('DELETE FROM rate_hits WHERE at < ?', t - 24 * 60 * 60 * 1000).catch(() => {});
  return true;
}

// İki adımlı sayaç: hitUnder yalnızca bakar (artırmaz), hitRecord sayar. Yalnızca BAŞARILI işlemleri saymak için
// (ör. koltuk alan katılma): başarısız denemeler sayaca girmez, böylece başkası sınırı doldurup masayı kilitleyemez.
export async function hitUnder(key, limit, windowMs) {
  const row = await get('SELECT count(*)::int AS n FROM rate_hits WHERE key = ? AND at > ?', key, Date.now() - windowMs);
  return !(Number(row?.n) >= limit);
}
export async function hitRecord(key) {
  const t = Date.now();
  await run('INSERT INTO rate_hits (key, at) VALUES (?, ?)', key, t);
  if (Math.random() < 0.02) await run('DELETE FROM rate_hits WHERE at < ?', t - 24 * 60 * 60 * 1000).catch(() => {});
}

// ---------- Giriş kilidi (panel + süper-admin) ----------
// İki sayaç, ikisi de login_attempts tablosunda: (hesap+IP) çifti ve yalnız IP. GLOBAL (hesap-toplam) sayaç YOKTUR:
// başkasının hatalı denemeleri gerçek sahibin başka IP'den girişini kilitlemez. Kilit artan gecikmedir: ücretsiz
// hak (free) bittikten sonra her ardışık denemede bekleme katlanır (base * 2^(n-free)), üst sınır LOGIN_CAP_MS.
// Sayaç penceresi LOGIN_WINDOW_MS (yarım kalan gecikme bir saat sonra sönümlenir); başarılı girişte çift sayacı silinir.
export const LOGIN_WINDOW_MS = 60 * 60 * 1000;
export const LOGIN_CAP_MS = 15 * 60 * 1000;
export const LOGIN_PAIR = { free: 3, base: 30_000 }; // 3 hatadan sonra 30 sn, 1 dk, 2 dk ... 15 dk
export const LOGIN_IP = { free: 10, base: 15_000, hard: 60 }; // IP başına: 10 hatadan sonra 15 sn'den katlanır; saatte 60 üst sınır

const waitMs = (n, { free, base }) => (n < free ? 0 : Math.min(LOGIN_CAP_MS, base * 2 ** Math.min(n - free, 20)));

/**
 * Deneme kapısı: sayma + ekleme TEK SQL ifadesidir (okuma-sonra-yaz yarışı yok). Engelli değilse hem çift hem IP
 * satırı eklenir (deneme baştan sayılır; paralel istekler kapıdan toplu geçemez). Engelliyse hiçbir şey eklenmez.
 * Dönüş: { ok: true, ids } ya da { ok: false, retryAfter (sn) }.
 */
export async function loginGate(pairKey, ipKey) {
  const t = Date.now();
  const since = t - LOGIN_WINDOW_MS;
  const rows = await all(
    `WITH lim(key, free, base) AS (VALUES (?::text, ?::int, ?::bigint), (?::text, ?::int, ?::bigint)),
     s AS (SELECT a.key, count(*)::int AS n, max(a.at) AS last FROM login_attempts a WHERE a.key IN (?, ?) AND a.at > ? GROUP BY a.key),
     blocked AS (
       SELECT 1 FROM s JOIN lim USING (key)
       WHERE (s.n >= lim.free AND ? < s.last + LEAST(?::bigint, (lim.base * power(2, LEAST(s.n - lim.free, 20)))::bigint))
          OR (s.key = ? AND s.n >= ?::int)
     )
     INSERT INTO login_attempts (key, at) SELECT k, ?::bigint FROM (VALUES (?::text), (?::text)) v(k)
     WHERE NOT EXISTS (SELECT 1 FROM blocked) RETURNING id, key`,
    pairKey, LOGIN_PAIR.free, LOGIN_PAIR.base, ipKey, LOGIN_IP.free, LOGIN_IP.base,
    pairKey, ipKey, since,
    t, LOGIN_CAP_MS, ipKey, LOGIN_IP.hard,
    t, pairKey, ipKey,
  );
  if (rows.length) {
    if (Math.random() < 0.02) await run('DELETE FROM login_attempts WHERE at < ?', t - 24 * 60 * 60 * 1000).catch(() => {});
    return { ok: true, ids: rows.map((r) => Number(r.id)), pairKey };
  }
  // Engelli: bekleme süresini hesapla (yalnızca yanıt başlığı için; kapı kararı yukarıdaki ifadeyle verildi).
  const st = await all('SELECT key, count(*)::int AS n, max(at) AS last, min(at) AS first FROM login_attempts WHERE key IN (?, ?) AND at > ? GROUP BY key', pairKey, ipKey, since);
  let until = t;
  for (const r of st) {
    const lim = r.key === pairKey ? LOGIN_PAIR : LOGIN_IP;
    until = Math.max(until, Number(r.last) + waitMs(r.n, lim));
    if (r.key === ipKey && r.n >= LOGIN_IP.hard) until = Math.max(until, Number(r.first) + LOGIN_WINDOW_MS); // en eski deneme pencereden düşene dek
  }
  return { ok: false, retryAfter: Math.max(1, Math.min(LOGIN_WINDOW_MS / 1000, Math.ceil((until - t) / 1000))) };
}

/** Başarılı giriş: bu denemenin rezervasyonlarını ve (hesap+IP) çiftinin tüm sayacını siler. */
export async function loginSuccess(gate) {
  if (!gate?.ids?.length) return;
  await run(`DELETE FROM login_attempts WHERE key = ? OR id IN (${gate.ids.map(() => '?').join(',')})`, gate.pairKey, ...gate.ids);
}
