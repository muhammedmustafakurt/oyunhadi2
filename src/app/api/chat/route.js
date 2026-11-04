import { NextResponse } from 'next/server';
import { clientIp, floodOk, hit } from '@/lib/ratelimit';
import { readBody, BODY_ERRORS } from '@/lib/guard';
import {
  join, state, sendRequest, decideRequest, cancelRequest, sendMessage, closeRoom, blockUser, unblockUser, reportUser, leave, profile, setOpen,
} from '@/lib/chat';

export const dynamic = 'force-dynamic';

// Sohbet gövdesindeki alan türleri.
const STR_FIELDS = ['type', 'token', 'cafe', 'masa', 'pid', 'nick', 'bio', 'body', 'reason'];
const ID_FIELDS = ['target', 'id', 'room'];
const json = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// Sohbet durumu yoklaması. Belirteç yoksa/geçersizse { gone } döner; istemci yeni oturum açar.
export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    return json(await state(q.get('token'), q.get('room'), q.get('after')));
  } catch (e) {
    console.error('[chat GET]', e);
    return json({ error: 'Sunucu hatası.' }, 500);
  }
}

export async function POST(req) {
  const rb = await readBody(req, 32 * 1024);
  if (rb.status) return json({ error: BODY_ERRORS[rb.status] }, rb.status);
  const body = rb.body;
  // Tür sıkılığı: metin alanları dize, kimlik alanları dize/sayı olmalı (dizi/nesne String() ile geçerli görünürdü).
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || STR_FIELDS.some((k) => body[k] != null && typeof body[k] !== 'string')
    || ID_FIELDS.some((k) => body[k] != null && typeof body[k] !== 'string' && typeof body[k] !== 'number')) {
    return json({ error: 'Geçersiz istek.' }, 400);
  }
  try {
    const type = String(body?.type ?? '');
    const ip = clientIp(req);
    // Kaba taşkın koruması (örnek başına); oturum açmada ayrıca veritabanı sayacı.
    if (!floodOk(`chat:${ip}`, 600, 60_000)) return json({ error: 'Çok fazla istek. Biraz yavaşlayın.' }, 429);
    if (type === 'join') {
      if (!(await hit(`cj:i:${ip}`, 60, 10 * 60_000))) return json({ error: 'Çok fazla deneme. Biraz sonra tekrar deneyin.' }, 429);
      const res = await join(body);
      return json(res, res.status ?? 200);
    }
    const token = String(body?.token ?? '');
    const act = {
      request: () => sendRequest(token, body.target),
      accept: () => decideRequest(token, body.id, true),
      reject: () => decideRequest(token, body.id, false),
      cancel: () => cancelRequest(token, body.id),
      send: () => sendMessage(token, body.room, body.body),
      close: () => closeRoom(token, body.room),
      block: () => blockUser(token, body.target),
      unblock: () => unblockUser(token, body.target),
      report: () => reportUser(token, { targetId: body.target, roomId: body.room, reason: body.reason }),
      profile: () => profile(token, body.nick, body.bio),
      open: () => setOpen(token, true),
      pause: () => setOpen(token, false),
      leave: () => leave(token),
    }[type];
    if (!act) return json({ error: 'Bilinmeyen işlem.' }, 400);
    const res = await act();
    return json(res, res.status ?? 200);
  } catch (e) {
    console.error('[chat POST]', e);
    return json({ error: 'Sunucu hatası.' }, 500);
  }
}
