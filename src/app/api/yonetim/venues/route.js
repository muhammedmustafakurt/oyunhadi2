import { NextResponse } from 'next/server';
import { createVenue, fail, guardApi, readJson, NO_STORE } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// Yeni mekân: başlangıç şifresi sunucuda üretilir ve yanıtta yalnızca bir kez döner.
export async function POST(req) {
  try {
    const g = await guardApi(req);
    if (g) return g;
    const body = await readJson(req);
    if (!body) return fail(400, 'Geçersiz istek.');
    const r = await createVenue(body);
    if (r.error) return fail(400, r.error);
    return NextResponse.json(r, { headers: NO_STORE });
  } catch (e) {
    console.error('[admin venue create]', e);
    return fail(500, 'Sunucu hatası.');
  }
}
