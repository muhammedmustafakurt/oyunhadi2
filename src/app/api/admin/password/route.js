import { NextResponse } from 'next/server';
import { adminCookie, adminIp, adminGate, adminGateSuccess, changeOwnPassword, currentAdminId, fail, guardApi, readJson, NO_STORE } from '@/lib/admin';

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
    // Mevcut şifre denemesi giriş kapısından geçer (hesap = "pw:<id>" + IP); yanlışsa sayaç kalır, doğruysa silinir.
    const gate = await adminGate(`pw:${me}`, ip);
    if (!gate.ok) return fail(429, 'Çok fazla başarısız deneme. Biraz sonra tekrar deneyin.');
    const r = await changeOwnPassword(me, body.current, body.next);
    if (r.error) {
      if (!r.bad) await adminGateSuccess(gate); // mevcut şifre doğruydu (yalnız yeni şifre geçersiz): deneme sayılmaz
      return fail(r.bad ? 403 : 400, r.error);
    }
    await adminGateSuccess(gate);
    // Şifre değişti: diğer oturumlar düşer; bu oturum yeni sürümle yenilenir.
    const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
    res.cookies.set(adminCookie(me, r.hash));
    return res;
  } catch (e) {
    console.error('[admin password]', e);
    return fail(500, 'Sunucu hatası.');
  }
}
