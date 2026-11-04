import { NextResponse } from 'next/server';
import { originOk, readBody, BODY_ERRORS } from '@/lib/guard';
import { panelVenue, updateVenue } from '@/lib/venues';

export const dynamic = 'force-dynamic';

// Uygulamalı panel kaydetmesi: marka, oyun listesi, konum, duyuru, ödül ve masa sayısı.
// Oturumu olmayan istekler reddedilir.
export async function POST(req) {
  const NS = { 'Cache-Control': 'no-store' };
  if (!originOk(req)) return NextResponse.json({ error: 'İstek reddedildi.' }, { status: 403, headers: NS });
  try {
    const v = await panelVenue();
    if (!v) return NextResponse.json({ error: 'Oturum yok.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    const rb = await readBody(req, 64 * 1024);
    if (rb.status) return NextResponse.json({ error: BODY_ERRORS[rb.status] }, { status: rb.status, headers: NS });
    const patch = rb.body;
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }
    const venue = await updateVenue(v.id, patch);
    return NextResponse.json({ venue }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('[panel venue]', e);
    return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
