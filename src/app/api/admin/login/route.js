import { NextResponse } from 'next/server';
import { adminCookie, adminConfigured, adminIp, adminGate, adminGateSuccess, checkAdminLogin, fail, guardApi, readJson, NO_STORE } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// Süper-admin girişi. Hesap ortam değişkenlerinden gelir; ayarlı değilse giriş kapalıdır.
export async function POST(req) {
  try {
    const g = await guardApi(req, { auth: false });
    if (g) return g;
    if (!(await adminConfigured())) return fail(503, 'Yönetici girişi yapılandırılmamış.');
    const body = await readJson(req);
    if (!body) return fail(400, 'Geçersiz istek.');
    const ip = adminIp(req);
    const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200);
    const gate = await adminGate(email, ip);
    if (!gate.ok) {
      return NextResponse.json({ error: 'Çok fazla başarısız deneme. Biraz sonra tekrar deneyin.' }, { status: 429, headers: { ...NO_STORE, 'Retry-After': String(gate.retryAfter) } });
    }
    const admin = await checkAdminLogin(email, body.password);
    if (!admin) return fail(401, 'E-posta ya da şifre hatalı.');
    await adminGateSuccess(gate);
    const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
    res.cookies.set(adminCookie(admin.id, admin.password));
    return res;
  } catch (e) {
    console.error('[admin login]', e);
    return fail(500, 'Sunucu hatası.');
  }
}
