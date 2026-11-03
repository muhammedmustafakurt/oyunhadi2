import { NextResponse } from 'next/server';
import { adminIp, adminLoginBlocked, adminLoginFailure, changeOwnPassword, currentAdminId, fail, guardApi, readJson, NO_STORE } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// Kendi şifreni değiştir: mevcut şifre sorulur; yanlış denemeler giriş sınırına sayılır.
export async function POST(req) {
  try {
    const g = await guardApi(req);
    if (g) return g;
    const me = await currentAdminId();
    const body = await readJson(req);
    if (!me || !body) return fail(400, 'Geçersiz istek.');
    const ip = adminIp(req);
    if (await adminLoginBlocked(ip)) return fail(429, 'Çok fazla başarısız deneme. Biraz sonra tekrar deneyin.');
    const r = await changeOwnPassword(me, body.current, body.next);
    if (r.error) {
      if (r.bad) await adminLoginFailure(ip);
      return fail(r.bad ? 403 : 400, r.error);
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (e) {
    console.error('[admin password]', e);
    return fail(500, 'Sunucu hatası.');
  }
}
