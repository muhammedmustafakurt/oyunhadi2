import { NextResponse } from 'next/server';
import { panelVenue } from '@/lib/venues';
import { originOk, readBody, BODY_ERRORS } from '@/lib/guard';
import { panelChat, panelSettings, panelAction } from '@/lib/chat';

export const dynamic = 'force-dynamic';

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// Panel sohbet yönetimi: yalnızca oturumlu işletmenin kendi verisi (panelVenue çerezden çözer).
export async function GET() {
  try {
    const venue = await panelVenue();
    if (!venue) return json({ error: 'Yetkisiz.' }, 401);
    return json(await panelChat(venue.id));
  } catch (e) {
    console.error('[panel chat GET]', e);
    return json({ error: 'Sunucu hatası.' }, 500);
  }
}

export async function POST(req) {
  if (!originOk(req)) return json({ error: 'İstek reddedildi.' }, 403);
  try {
    const venue = await panelVenue();
    if (!venue) return json({ error: 'Yetkisiz.' }, 401);
    const r = await readBody(req, 32 * 1024);
    if (r.status) return json({ error: BODY_ERRORS[r.status] }, r.status);
    const body = r.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Geçersiz istek.' }, 400);
    if (body?.type === 'settings') {
      return json(await panelSettings(venue.id, body.patch && typeof body.patch === 'object' ? body.patch : {}));
    }
    const res = await panelAction(venue.id, String(body?.action ?? ''), body?.id);
    return json(res, res.status ?? 200);
  } catch (e) {
    console.error('[panel chat POST]', e);
    return json({ error: 'Sunucu hatası.' }, 500);
  }
}
