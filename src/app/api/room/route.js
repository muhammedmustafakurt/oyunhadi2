import { NextResponse } from 'next/server';
import { findCafe, hasTable, nearCafe, readRoom, mutate, view, ROOM_GAMES, MASA_RE, PID_RE } from '@/lib/rooms';
import { run } from '@/lib/db';
import { clientIp, floodOk, hit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const ACTIONS = new Set(['rdeploy', 'rtrade', 'rattack', 'rmove', 'rendattack', 'rfortify', 'rendturn', 'scplay', 'scpass', 'scswap', 'scchallenge', 'scvote', 'sctimeout', 'sccommit', 'join', 'token', 'leave', 'start', 'roll', 'buy', 'skip', 'move', 'accuse', 'vote', 'guess', 'timeout', 'clue', 'pick', 'endturn', 'kill', 'protect', 'inspect', 'begin', 'right', 'pass', 'taboo', 'kok', 'kno', 'kskip', 'ktimeout', 'ddraw', 'dset', 'dguess', 'dswap', 'dtimeout', 'bpick', 'btimeout', 'wipe', 'ping', 'kick', 'reset', 'bid', 'build', 'sell', 'mortgage', 'unmortgage', 'payJail', 'jailCard', 'offer', 'accept', 'decline', 'claim', 'resign', 'atake', 'clroll', 'clstay', 'clpassage', 'clmove', 'clsuggest', 'clshow', 'claccuse', 'clend', 'ccplace', 'ccmeeple', 'csettle', 'ccity', 'croad', 'cdev', 'croll', 'cdrop', 'crobber', 'cplay', 'cend', 'cbank', 'coffer', 'cacc', 'cpick', 'cclose', 'tkdraw', 'tkclaim', 'tktickets', 'tkkeep', 'kdformasyon', 'kdpick', 'kdswap', 'kdlock', 'kdtimeout', 'fbready', 'fbask', 'fbanswer', 'fbguess', 'fbverdict', 'fbnext']);

async function resolve({ cafe, masa, game, pid }) {
  if (!/^[a-z0-9-]{1,50}$/.test(String(cafe)) || !MASA_RE.test(String(masa)) || !ROOM_GAMES.has(game) || !PID_RE.test(String(pid))) {
    return { err: json({ error: 'Geçersiz istek.' }, 400) };
  }
  const biz = await findCafe(cafe);
  if (!biz) return { err: json({ error: 'Mekân bulunamadı.' }, 404) };
  if (!hasTable(biz, String(masa))) return { err: json({ error: 'Bu masa kayıtlı değil.' }, 404) };
  if (!biz.games.includes(game)) return { err: json({ error: 'Bu oyun bu mekânda kapalı.' }, 404) };
  return { biz, cafe: biz };
}

// Sürüm değişmediyse yalnızca { unchanged } döner (sık yoklama ucuz kalsın diye).
export async function GET(req) {
  try {
    const q = Object.fromEntries(new URL(req.url).searchParams);
    const { biz, err } = await resolve(q);
    if (err) return err;
    const room = await readRoom(biz.id, q.masa, q.game);
    if (String(room.version) === q.v) return json({ unchanged: true, version: room.version });
    return json({ ...view(room, q.pid, q.game), locked: biz.lat != null });
  } catch (e) {
    console.error('[room GET]', e);
    return json({ error: 'Sunucu hatası.' }, 500);
  }
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return json({ error: 'Geçersiz istek.' }, 400); }
  try {
    const ip = clientIp(req);
    // Kaba taşkın koruması (örnek başına).
    if (!floodOk(`room:${ip}`, 600, 60_000)) return json({ error: 'Çok fazla istek. Biraz yavaşlayın.' }, 429);
    const { biz, err } = await resolve(body);
    if (err) return err;
    const a = body.action;
    if (!a || !ACTIONS.has(a.type)) return json({ error: 'Bilinmeyen işlem.' }, 400);
    // Masaya katılma kötüye kullanıma açık (rastgele pid'lerle koltuk doldurma): hem IP'ye hem masaya göre sınır.
    // Masa sınırı IP'den bağımsızdır; sahte IP başlığı onu aşamaz.
    if (a.type === 'join') {
      const slot = `${biz.id}:${body.masa}:${body.game}`;
      if (!(await hit(`rj:t:${slot}`, 40, 10 * 60_000)) || !(await hit(`rj:i:${ip}`, 40, 10 * 60_000))) {
        return json({ error: 'Çok fazla katılma denemesi. Biraz sonra tekrar deneyin.' }, 429);
      }
    }
    const res = await mutate(biz.id, body.masa, body.game, body.pid, { type: a.type, t: a.t, n: a.n, cards: a.cards, dice: a.dice, tiles: a.tiles, idxs: a.idxs, name: a.name, tok: a.tok, from: a.from, to: a.to, target: a.target, yes: a.yes, loc: a.loc, word: a.word, num: a.num, card: a.card, strokes: a.strokes, keep: a.keep, text: a.text, choice: a.choice, ms: a.ms, amount: a.amount, prop: a.prop, promo: a.promo, src: a.src, factory: a.factory, color: a.color, line: a.line, sus: a.sus, wpn: a.wpn, rm: a.rm, slot: a.slot, route: a.route, near:nearCafe(biz, a.geo), noGeo: !a.geo, cc: a.cc, cat: a.cat });
    if (a.type === 'start') {
      // İstatistikler için oyun başlangıcını kaydet; başarısızsa odayı etkilemesin.
      run('INSERT INTO play_logs (biz_id, masa, game, players, at) VALUES (?, ?, ?, ?, ?)',
        biz.id, body.masa, body.game, res.room.state.seats.length, Date.now()).catch(() => {});
    }
    return json({ ...view(res.room, body.pid, body.game), locked: biz.lat != null, ...(res.error && { error: res.error }) }, res.error ? 409 : 200);
  } catch (e) {
    console.error('[room POST]', e);
    return json({ error: 'Sunucu hatası.' }, 500);
  }
}
