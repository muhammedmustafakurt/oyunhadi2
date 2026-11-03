import { NextResponse } from 'next/server';
import { panelVenue } from '@/lib/venues';
import { createEvent, updateEvent, setStatus, deleteEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// Panelin etkinlik işlemleri: { op: 'create' | 'update' | 'status' | 'delete', ... }.
// Mekân numarası ASLA istekten alınmaz; yalnızca panel oturumundaki mekâna (panelVenue) yazılır, başka mekânın
// etkinlik numarası verilse bile events.js sorguları biz_id ile sınırlı olduğundan bulunamadı döner.
export async function POST(req) {
  try {
    const v = await panelVenue();
    if (!v) return json({ error: 'Oturum yok.' }, 401);
    const b = await req.json().catch(() => null);
    if (!b || typeof b !== 'object' || Array.isArray(b)) return json({ error: 'Geçersiz istek.' }, 400);
    const id = Number(b.id);
    const needId = () => Number.isInteger(id) && id > 0;
    let r;
    switch (b.op) {
      case 'create': r = await createEvent(v.id, b); break;
      case 'update': if (!needId()) return json({ error: 'Geçersiz etkinlik.' }, 400); r = await updateEvent(v.id, id, b); break;
      case 'status': if (!needId()) return json({ error: 'Geçersiz etkinlik.' }, 400); r = await setStatus(v.id, id, b.status); break;
      case 'delete': if (!needId()) return json({ error: 'Geçersiz etkinlik.' }, 400); r = await deleteEvent(v.id, id); break;
      default: return json({ error: 'Bilinmeyen işlem.' }, 400);
    }
    if (r.error) return json({ error: r.error }, r.status || 400);
    return json(r);
  } catch (e) {
    console.error('[panel events]', e);
    return json({ error: 'Kaydedilemedi.' }, 500);
  }
}
