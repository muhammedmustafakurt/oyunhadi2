import { NextResponse } from 'next/server';
import { findCafe, hasTable, nearCafe, MASA_RE, PID_RE } from '@/lib/rooms';
import { gateEvent } from '@/lib/events';
import { loadState, playerAct, playerView } from '@/lib/eventgames';
import { clientIp, floodOk, hit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const ACTIONS = new Set(['join', 'mark', 'claim']);

// Toplu etkinlik oyunları (tombala, masa turnuvası, çekiliş) için oyuncu ucu.
// KAPI: her GET ve POST'ta, durum okunmadan/yazılmadan ÖNCE gateEvent çalışır: etkinlik bu mekâna ait, türü toplu oyun
// ve durumu 'acik' olmalı. Tek istisna GET: bitmiş etkinliğin sonuç ekranı (kazananlar) okunabilir (results);
// kapalı (henüz açılmamış) etkinlik hiçbir istekte geçmez, bitmiş etkinliğe POST ile hiçbir şey yazılamaz.
async function resolve({ cafe, masa, event, pid }, { write }) {
  if (!/^[a-z0-9-]{1,50}$/.test(String(cafe)) || !MASA_RE.test(String(masa)) || !PID_RE.test(String(pid))) {
    return { err: json({ error: 'Geçersiz istek.' }, 400) };
  }
  const biz = await findCafe(cafe);
  if (!biz) return { err: json({ error: 'Mekân bulunamadı.' }, 404) };
  if (!hasTable(biz, String(masa))) return { err: json({ error: 'Bu masa kayıtlı değil.' }, 404) };
  const gate = await gateEvent(biz.id, event, { mass: true, results: !write });
  if (gate.error) return { err: json({ error: gate.error }, gate.status) };
  return { biz, ev: gate.ev };
}

// Sürüm (ve etkinlik durumu) değişmediyse yalnızca { unchanged } döner.
export async function GET(req) {
  try {
    const q = Object.fromEntries(new URL(req.url).searchParams);
    const { biz, ev, err } = await resolve(q, { write: false });
    if (err) return err;
    const row = await loadState(biz.id, ev);
    const ver = `${row.version}-${ev.status}`;
    if (q.v === ver && ev.kind !== 'tombala') return json({ unchanged: true, version: ver });
    const view = playerView(ev, row, q.pid, q.masa);
    if (q.v === ver && ev.kind === 'tombala') return json({ unchanged: true, version: ver, nextMs: view.nextMs });
    return json({ ...view, locked: biz.lat != null });
  } catch (e) {
    console.error('[event GET]', e);
    return json({ error: 'Sunucu hatası.' }, 500);
  }
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return json({ error: 'Geçersiz istek.' }, 400); }
  try {
    if (!body || typeof body !== 'object') return json({ error: 'Geçersiz istek.' }, 400);
    const ip = clientIp(req);
    if (!floodOk(`event:${ip}`, 600, 60_000)) return json({ error: 'Çok fazla istek. Biraz yavaşlayın.' }, 429);
    const { biz, ev, err } = await resolve(body, { write: true });
    if (err) return err;
    const a = body.action;
    if (!a || typeof a.type !== 'string' || !ACTIONS.has(a.type)) return json({ error: 'Bilinmeyen işlem.' }, 400);
    // Katılım (kart alma / çekilişe girme) kötüye kullanıma açık: IP'ye ve etkinliğe göre sınır.
    if (a.type === 'join') {
      if (!(await hit(`ej:e:${ev.id}`, 400, 10 * 60_000)) || !(await hit(`ej:i:${ip}`, 40, 10 * 60_000))) {
        return json({ error: 'Çok fazla katılma denemesi. Biraz sonra tekrar deneyin.' }, 429);
      }
    }
    const res = await playerAct(biz.id, ev, body.pid, body.masa, {
      type: a.type, name: a.name, n: a.n, k: a.k,
    }, { near: nearCafe(biz, a.geo), noGeo: !a.geo });
    if (res.error && !res.state) return json({ error: res.error }, 409);
    const view = playerView(ev, { state: res.state, version: res.version }, body.pid, body.masa);
    return json({ ...view, locked: biz.lat != null, ...(res.error && { error: res.error }) }, res.error ? 409 : 200);
  } catch (e) {
    console.error('[event POST]', e);
    return json({ error: 'Sunucu hatası.' }, 500);
  }
}
