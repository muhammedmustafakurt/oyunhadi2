import { NextResponse } from 'next/server';
import { adminCookie, adminConfigured, adminIp, adminLoginBlocked, adminLoginFailure, checkAdminLogin, fail, guardApi, readJson, NO_STORE } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// Süper-admin girişi. Hesap ortam değişkenlerinden gelir; ayarlı değilse giriş kapalıdır.
export async function POST(req) {
  try {
    const g = await guardApi(req, { auth: false });
    if (g) return g;
    if (!adminConfigured()) return fail(503, 'Yönetici girişi yapılandırılmamış.');
    const body = await readJson(req);
    if (!body) return fail(400, 'Geçersiz istek.');
    const ip = adminIp(req);
    if (await adminLoginBlocked(ip)) {
      return NextResponse.json({ error: 'Çok fazla başarısız deneme. Biraz sonra tekrar deneyin.' }, { status: 429, headers: { ...NO_STORE, 'Retry-After': '900' } });
    }
    if (!checkAdminLogin(body.email, body.password)) {
      await adminLoginFailure(ip);
      return fail(401, 'E-posta ya da şifre hatalı.');
    }
    const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
    res.cookies.set(adminCookie());
    return res;
  } catch (e) {
    console.error('[admin login]', e);
    return fail(500, 'Sunucu hatası.');
  }
}
