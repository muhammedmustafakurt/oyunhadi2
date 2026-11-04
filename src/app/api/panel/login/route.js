import { NextResponse } from 'next/server';
import { readBody } from '@/lib/guard';
import { loginVenue, cookieFor, loginGate, loginSuccess, loginKeys } from '@/lib/venues';
import { clientIp } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

// Panel girişi: e-posta + şifre DB'deki mekân kaydıyla karşılaştırılır; başarılıysa imzalı çerez yazılır.
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(req) {
  try {
    const body = (await readBody(req, 8 * 1024)).body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400, headers: NO_STORE });
    }
    const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200);
    const ip = clientIp(req);
    // Kapı denemeyi baştan sayar (sayma+ekleme tek ifade); başarıda sayaç silinir. Hata varsa 401'de sayaç kalır.
    const gate = await loginGate(...loginKeys(email, ip));
    if (!gate.ok) {
      return NextResponse.json({ error: 'Çok fazla başarısız deneme. Biraz sonra tekrar deneyin.' }, { status: 429, headers: { ...NO_STORE, 'Retry-After': String(gate.retryAfter) } });
    }
    const venue = await loginVenue(email, body.password);
    if (!venue) {
      return NextResponse.json({ error: 'E-posta ya da şifre hatalı.' }, { status: 401, headers: NO_STORE });
    }
    await loginSuccess(gate);
    const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
    res.cookies.set(cookieFor(venue.id, venue.password));
    return res;
  } catch (e) {
    console.error('[panel login]', e);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500, headers: NO_STORE });
  }
}
