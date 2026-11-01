import { NextResponse } from 'next/server';
import { loginVenue, cookieFor, loginBlocked, recordLoginFailure } from '@/lib/venues';

export const dynamic = 'force-dynamic';

// Panel girişi: e-posta + şifre DB'deki mekân kaydıyla karşılaştırılır; başarılıysa imzalı çerez yazılır.
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400, headers: NO_STORE });
    }
    const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200);
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim().slice(0, 64) || 'unknown';
    if (await loginBlocked(email, ip)) {
      return NextResponse.json({ error: 'Çok fazla başarısız deneme. Biraz sonra tekrar deneyin.' }, { status: 429, headers: { ...NO_STORE, 'Retry-After': '900' } });
    }
    const id = await loginVenue(email, body.password);
    if (!id) {
      await recordLoginFailure(email, ip);
      return NextResponse.json({ error: 'E-posta ya da şifre hatalı.' }, { status: 401, headers: NO_STORE });
    }
    const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
    res.cookies.set(cookieFor(id));
    return res;
  } catch (e) {
    console.error('[panel login]', e);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500, headers: NO_STORE });
  }
}
