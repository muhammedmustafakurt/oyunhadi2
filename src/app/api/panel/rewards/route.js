import { NextResponse } from 'next/server';
import { panelVenue } from '@/lib/venues';
import { createRule, updateRule, setRuleActive, deleteRule, checkCode, redeemCode } from '@/lib/rewards';
import { originOk, readBody, BODY_ERRORS } from '@/lib/guard';
import { clientIp, hit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// Panelin ödül işlemleri: { op: 'create' | 'update' | 'active' | 'delete' | 'verify' | 'redeem', ... }.
// Mekân numarası ASLA istekten alınmaz; yalnızca panel oturumundaki mekâna (panelVenue) yazılır, rewards.js sorguları
// biz_id ile sınırlıdır. Girdiler rewards.js'te sunucuda doğrulanır.
export async function POST(req) {
  if (!originOk(req)) return json({ error: 'İstek reddedildi.' }, 403);
  try {
    const v = await panelVenue();
    if (!v) return json({ error: 'Oturum yok.' }, 401);
    const rb = await readBody(req, 32 * 1024);
    if (rb.status) return json({ error: BODY_ERRORS[rb.status] }, rb.status);
    const b = rb.body;
    if (!b || typeof b !== 'object' || Array.isArray(b)) return json({ error: 'Geçersiz istek.' }, 400);
    const id = Number(b.id);
    const needId = () => Number.isInteger(id) && id > 0 && id <= 2_000_000_000;
    let r;
    switch (b.op) {
      case 'create': r = await createRule(v, b); break;
      case 'update': if (!needId()) return json({ error: 'Geçersiz kural.' }, 400); r = await updateRule(v, id, b); break;
      case 'active': if (!needId()) return json({ error: 'Geçersiz kural.' }, 400); r = await setRuleActive(v, id, b.active); break;
      case 'delete': if (!needId()) return json({ error: 'Geçersiz kural.' }, 400); r = await deleteRule(v, id); break;
      case 'verify':
      case 'redeem': {
        // Kod tahmini kaba kuvvetine karşı: mekân başına ve IP başına sınır (IP başlığı sahte olabilir, mekân sınırı ondan bağımsız).
        const ip = clientIp(req);
        if (!(await hit(`rwv:b:${v.id}`, 60, 10 * 60_000)) || !(await hit(`rwv:i:${ip}`, 60, 10 * 60_000))) {
          return json({ error: 'Çok fazla deneme. Birkaç dakika sonra tekrar deneyin.' }, 429);
        }
        if (typeof b.code !== 'string' || b.code.length > 24) return json({ error: 'Geçersiz kod.' }, 400);
        return json(b.op === 'verify' ? await checkCode(v.id, b.code) : await redeemCode(v.id, b.code));
      }
      default: return json({ error: 'Bilinmeyen işlem.' }, 400);
    }
    if (r.error) return json({ error: r.error }, r.status || 400);
    return json(r);
  } catch (e) {
    console.error('[panel rewards]', e);
    return json({ error: 'Kaydedilemedi.' }, 500);
  }
}
