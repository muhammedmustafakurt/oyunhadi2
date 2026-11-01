import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Panel çıkışı: oturum çerezini siler.
export async function POST() {
  const res = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  res.cookies.set({ name: 'oh-panel', value: '', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
  return res;
}
