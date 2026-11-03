import { NextResponse } from 'next/server';
import { findCafe, hasTable, readRoom, MASA_RE, PID_RE } from '@/lib/rooms';
import { settleRoom, rewardFor } from '@/lib/rewards';
import { isRewardGame } from '@/lib/reward-games';
import { clientIp, floodOk } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// Oyuncunun KENDİ ödül kodu. Oda bitmişse (ör. 2048'de süre dolmuşsa, kimse son hamleyi göndermemiş olsa da) kodlar burada da
// üretilir; üretim idempotenttir. Yanıt yalnızca isteyen pid'in kodunu içerir.
export async function GET(req) {
  try {
    const q = Object.fromEntries(new URL(req.url).searchParams);
    if (!/^[a-z0-9-]{1,50}$/.test(String(q.cafe)) || !MASA_RE.test(String(q.masa)) || !isRewardGame(q.game) || !PID_RE.test(String(q.pid))) {
      return json({ error: 'Geçersiz istek.' }, 400);
    }
    if (!floodOk(`rw:${clientIp(req)}`, 240, 60_000)) return json({ error: 'Çok fazla istek.' }, 429);
    const biz = await findCafe(q.cafe);
    if (!biz || !hasTable(biz, q.masa) || !biz.games.includes(q.game)) return json({ error: 'Bulunamadı.' }, 404);
    const room = await readRoom(biz.id, q.masa, q.game);
    if (room.state.phase !== 'play') return json({ reward: null });
    await settleRoom(biz, q.masa, q.game, room).catch((e) => console.error('[reward settle]', e));
    return json({ reward: await rewardFor(biz.id, q.masa, q.game, room, q.pid) });
  } catch (e) {
    console.error('[room reward]', e);
    return json({ error: 'Sunucu hatası.' }, 500);
  }
}
