import { NextResponse } from 'next/server';
import { fail, guardApi, resetVenuePassword, NO_STORE } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// Şifre sıfırlama: yeni rastgele şifre üretilir, karması kaydedilir, düz hali yalnızca bu yanıtta döner.
export async function POST(req, ctx) {
  try {
    const g = await guardApi(req);
    if (g) return g;
    const raw = (await ctx.params).id;
    if (!/^\d{1,9}$/.test(String(raw))) return fail(400, 'Geçersiz istek.');
    const r = await resetVenuePassword(Number(raw));
    if (r.error) return fail(r.status ?? 400, r.error);
    return NextResponse.json({ password: r.password }, { headers: NO_STORE });
  } catch (e) {
    console.error('[admin password reset]', e);
    return fail(500, 'Sunucu hatası.');
  }
}
