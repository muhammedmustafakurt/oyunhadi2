// Hız sınırı yardımcıları. İki katman:
//  - floodOk: bellekte, örnek (instance) başına kaba taşkın koruması. Her istekte veritabanına yazmaz.
//  - hit: veritabanında sayaç; sunucusuz ortamda örnekler arasında paylaşılır. Pahalı/kötüye kullanıma açık
//    işlemler (masaya katılma, sohbet oturumu açma) için kullanılır.
import { get, run } from '@/lib/db';

// İstemci adresi. Proxy arkasında x-forwarded-for'un ilk girdisi; sahte başlık IP sınırını aşabilir, bu yüzden
// kritik işlemlerde IP'den bağımsız (masa/mekân bazlı) ikinci bir sınır da uygulanır.
export function clientIp(req) {
  const h = req.headers;
  const ip = ((h.get('x-forwarded-for') ?? '').split(',')[0] || h.get('x-real-ip') || '').trim();
  return ip.slice(0, 64) || 'unknown';
}

const mem = (globalThis.__rlMem ??= new Map());

export function floodOk(key, limit, windowMs) {
  const t = Date.now();
  const e = mem.get(key);
  if (!e || t - e.t > windowMs) {
    if (mem.size > 5000) mem.clear();
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
