import { NextResponse } from 'next/server';
import { currentAdminId, deleteAdmin, fail, guardApi, NO_STORE } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function DELETE(req, ctx) {
  try {
    const g = await guardApi(req);
    if (g) return g;
    const raw = (await ctx.params).id;
    if (!/^\d{1,9}$/.test(String(raw))) return fail(400, 'Geçersiz istek.');
    const me = await currentAdminId();
    if (!me) return fail(401, 'Oturum gerekli.');
    const r = await deleteAdmin(me, Number(raw));
    if (r.error) return fail(r.status ?? 400, r.error);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (e) {
    console.error('[admin delete]', e);
    return fail(500, 'Sunucu hatası.');
  }
}
