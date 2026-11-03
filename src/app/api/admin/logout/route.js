import { NextResponse } from 'next/server';
import { clearAdminCookie, guardApi, NO_STORE } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const g = await guardApi(req, { auth: false });
  if (g) return g;
  const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
  res.cookies.set(clearAdminCookie());
  return res;
}
