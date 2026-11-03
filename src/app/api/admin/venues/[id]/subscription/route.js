import { NextResponse } from 'next/server';
import { fail, guardApi, readJson, NO_STORE } from '@/lib/admin';
import { getVenue } from '@/lib/venues';
import { saveSubscription, addPayment, deletePayment } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

// Süper-admin abonelik girişi (ödeme entegrasyonu gelene kadar tek yol). Her istek guardApi'den geçer:
// oturum + Origin/CSRF denetimi. Mekân numarası yoldan gelir ve varlığı doğrulanır; girdiler lib/subscriptions.js'te doğrulanır.
//   PUT    { plan, status, start, end, totalTry, vatNote, method, renewal }  -> kaydı oluştur/güncelle
//   POST   { date, description, amountTry, status, invoiceUrl }              -> ödeme ekle
//   DELETE { paymentId }                                                     -> ödeme sil
async function ctxVenue(req, ctx) {
  const g = await guardApi(req);
  if (g) return { err: g };
  const raw = (await ctx.params).id;
  if (!/^\d{1,9}$/.test(String(raw))) return { err: fail(400, 'Geçersiz istek.') };
  const body = await readJson(req);
  if (!body) return { err: fail(400, 'Geçersiz istek.') };
  const v = await getVenue(Number(raw));
  if (!v) return { err: fail(404, 'Mekân bulunamadı.') };
  return { id: v.id, body };
}
const done = (r) => (r.error ? fail(r.status ?? 400, r.error) : NextResponse.json({ ok: true }, { headers: NO_STORE }));

export async function PUT(req, ctx) {
  try {
    const c = await ctxVenue(req, ctx);
    if (c.err) return c.err;
    return done(await saveSubscription(c.id, c.body));
  } catch (e) {
    console.error('[admin subscription save]', e);
    return fail(500, 'Sunucu hatası.');
  }
}

export async function POST(req, ctx) {
  try {
    const c = await ctxVenue(req, ctx);
    if (c.err) return c.err;
    return done(await addPayment(c.id, c.body));
  } catch (e) {
    console.error('[admin payment add]', e);
    return fail(500, 'Sunucu hatası.');
  }
}

export async function DELETE(req, ctx) {
  try {
    const c = await ctxVenue(req, ctx);
    if (c.err) return c.err;
    return done(await deletePayment(c.id, Number(c.body.paymentId)));
  } catch (e) {
    console.error('[admin payment delete]', e);
    return fail(500, 'Sunucu hatası.');
  }
}
