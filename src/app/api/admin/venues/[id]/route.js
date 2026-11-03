import { NextResponse } from 'next/server';
import { deleteVenue, editVenue, fail, guardApi, readJson, NO_STORE } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const idOf = async (ctx) => {
  const raw = (await ctx.params).id;
  return /^\d{1,9}$/.test(String(raw)) ? Number(raw) : null;
};

export async function PATCH(req, ctx) {
  try {
    const g = await guardApi(req);
    if (g) return g;
    const id = await idOf(ctx);
    const body = await readJson(req);
    if (!id || !body) return fail(400, 'Geçersiz istek.');
    const r = await editVenue(id, body);
    if (r.error) return fail(r.status ?? 400, r.error);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (e) {
    console.error('[admin venue edit]', e);
    return fail(500, 'Sunucu hatası.');
  }
}

export async function DELETE(req, ctx) {
  try {
    const g = await guardApi(req);
    if (g) return g;
    const id = await idOf(ctx);
    const body = await readJson(req);
    if (!id || !body) return fail(400, 'Geçersiz istek.');
    const r = await deleteVenue(id, body.confirmName);
    if (r.error) return fail(r.status ?? 400, r.error);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (e) {
    console.error('[admin venue delete]', e);
    return fail(500, 'Sunucu hatası.');
  }
}
