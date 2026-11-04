import { NextResponse } from 'next/server';
import { panelVenue } from '@/lib/venues';
import { createEvent, updateEvent, setStatus, deleteEvent, gateEvent } from '@/lib/events';
import { originOk, readBody, BODY_ERRORS } from '@/lib/guard';
import { loadState, panelAct, panelView } from '@/lib/eventgames';

export const dynamic = 'force-dynamic';

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// Panelin etkinlik işlemleri: { op: 'create' | 'update' | 'status' | 'delete', ... }.
// Mekân numarası ASLA istekten alınmaz; yalnızca panel oturumundaki mekâna (panelVenue) yazılır, başka mekânın
// etkinlik numarası verilse bile events.js sorguları biz_id ile sınırlı olduğundan bulunamadı döner.
export async function POST(req) {
  if (!originOk(req)) return json({ error: 'İstek reddedildi.' }, 403);
  try {
    const v = await panelVenue();
    if (!v) return json({ error: 'Oturum yok.' }, 401);
    const rb = await readBody(req, 64 * 1024);
    if (rb.status) return json({ error: BODY_ERRORS[rb.status] }, rb.status);
    const b = rb.body;
    if (!b || typeof b !== 'object' || Array.isArray(b)) return json({ error: 'Geçersiz istek.' }, 400);
    const id = Number(b.id);
    const needId = () => Number.isInteger(id) && id > 0;
    let r;
    switch (b.op) {
      case 'create': r = await createEvent(v.id, b); break;
      case 'update': if (!needId()) return json({ error: 'Geçersiz etkinlik.' }, 400); r = await updateEvent(v.id, id, b); break;
      case 'status': if (!needId()) return json({ error: 'Geçersiz etkinlik.' }, 400); r = await setStatus(v.id, id, b.status); break;
      case 'delete': if (!needId()) return json({ error: 'Geçersiz etkinlik.' }, 400); r = await deleteEvent(v.id, id); break;
      // Toplu oyun yönetimi: state (canlı görünüm), draw, auto, reset, score. Etkinlik oturumdaki mekâna ait olmalı (biz_id denetimi);
      // oyunu ilerleten işlemler (draw/auto/score) yalnızca etkinlik 'acik' iken kabul edilir.
      case 'state': case 'draw': case 'auto': case 'reset': case 'score': {
        if (!needId()) return json({ error: 'Geçersiz etkinlik.' }, 400);
        const g = await gateEvent(v.id, id, { mass: true, results: true, leave: true });
        if (g.error) return json({ error: g.error }, g.status);
        const ev = g.ev;
        if (b.op === 'state') {
          const row = await loadState(v.id, ev);
          return json({ view: panelView(ev, row) });
        }
        if (ev.status === 'bitti' || (b.op !== 'reset' && ev.status !== 'acik')) {
          return json({ error: ev.status === 'bitti' ? 'Etkinlik bitti.' : 'Önce etkinliği açın.' }, 409);
        }
        const out = await panelAct(v.id, ev, b.op, b, v.tables);
        if (out.error) return json({ error: out.error }, 409);
        return json({ ok: true, view: panelView(ev, await loadState(v.id, ev)) });
      }
      default: return json({ error: 'Bilinmeyen işlem.' }, 400);
    }
    if (r.error) return json({ error: r.error }, r.status || 400);
    return json(r);
  } catch (e) {
    console.error('[panel events]', e);
    return json({ error: 'Kaydedilemedi.' }, 500);
  }
}
