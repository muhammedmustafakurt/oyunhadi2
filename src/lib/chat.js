import { randomBytes } from 'node:crypto';
import { all, get, run } from '@/lib/db';
import { getVenueBySlug } from '@/lib/venues';
import { hasTable, nearCafe, MASA_RE, PID_RE } from '@/lib/rooms';

// Masalar arası sohbetin sunucu mantığı. İstemci yalnızca oturum belirtecini taşır; işletme, masa ve
// yetki bilgisi her istekte oturum satırından okunur (istemciden gelen kimliklere güvenilmez).

const NICK_MAX = 24;
const BIO_MAX = 140;
const MSG_MAX = 500;
const IDLE_MS = 10 * 60 * 1000; // bu süre boyunca yoklama yoksa oturum düşer (sayfa açıkken 2 sn'de bir yoklanır)
const MSG_WINDOW = 60 * 1000;
const MSG_LIMIT = 20; // dakikada en fazla mesaj
const REQ_WINDOW = 60 * 60 * 1000;
const REQ_LIMIT = 10; // saatte en fazla istek
const PENDING_MAX = 5; // aynı anda bekleyen giden istek
const REJECT_COOLDOWN = 10 * 60 * 1000;
const REPORT_HOURLY = 3;
const TABLE_SESSION_MAX = 20; // bir masada aynı anda canlı en fazla oturum
const VENUE_SESSION_MAX = 400; // bir mekânda aynı anda canlı en fazla oturum
const TOKEN_RE = /^[a-f0-9]{64}$/;
const SLUG_RE = /^[a-z0-9-]{1,50}$/;

const now = () => Date.now();
const clean = (s, max) =>
  String(s ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
const makeToken = () => randomBytes(32).toString('hex');
const pair = (a, b) => (a < b ? [a, b] : [b, a]);

const ADJ = ['Mavi', 'Turuncu', 'Yeşil', 'Mor', 'Altın', 'Gümüş', 'Kırmızı', 'Limon', 'Deniz', 'Gece'];
const ANIMAL = ['Kedi', 'Tilki', 'Baykuş', 'Panda', 'Karga', 'Sincap', 'Kaplumbağa', 'Yunus', 'Kurt', 'Penguen'];
export const randomNick = () =>
  `${ADJ[Math.floor(Math.random() * ADJ.length)]} ${ANIMAL[Math.floor(Math.random() * ANIMAL.length)]} ${10 + Math.floor(Math.random() * 90)}`;

const settingsOf = async (bizId) => {
  const row = await get('SELECT enabled, open_mode, retention_hours FROM chat_settings WHERE biz_id = ?', bizId);
  return {
    enabled: row ? !!row.enabled : true,
    open_mode: row ? !!row.open_mode : false,
    retention_hours: row ? Number(row.retention_hours) : 24,
  };
};

const pubMe = (s) => ({ tbl: s.tbl, nick: s.nick, bio: s.bio, status: s.status });
const online = (seen) => now() - Number(seen) < 60 * 1000;

// Süresi geçen oturumları düşür, katılımcısı ayrılan odaları kapat, saklama süresi dolan veriyi sil.
export async function prune(bizId) {
  const t = now();
  await run("UPDATE chat_sessions SET status = 'left' WHERE biz_id = ? AND status = 'active' AND seen_at < ?", bizId, t - IDLE_MS);
  await run(
    "UPDATE chat_rooms SET status = 'closed', closed_at = ? WHERE biz_id = ? AND status = 'active' AND EXISTS (SELECT 1 FROM chat_sessions s WHERE s.id IN (chat_rooms.a_id, chat_rooms.b_id) AND s.status IN ('left', 'kicked'))",
    t, bizId,
  );
  const st = await settingsOf(bizId);
  const cut = t - Math.max(1, st.retention_hours) * 3600 * 1000;
  await run("DELETE FROM chat_messages WHERE room_id IN (SELECT id FROM chat_rooms WHERE biz_id = ? AND status = 'closed' AND closed_at < ?)", bizId, cut);
  await run("DELETE FROM chat_rooms WHERE biz_id = ? AND status = 'closed' AND closed_at < ?", bizId, cut);
  await run("DELETE FROM chat_requests WHERE biz_id = ? AND status <> 'pending' AND decided_at < ?", bizId, cut);
}

async function sessionByToken(token) {
  if (!TOKEN_RE.test(String(token))) return null;
  return get('SELECT * FROM chat_sessions WHERE token = ?', String(token));
}

// Yalnızca aktif oturumlar istek gönderebilir/kabul edebilir; duraklatılmış oturum sohbeti okuyabilir.
const allowed = (s) => !!s && (s.status === 'active' || s.status === 'paused');
const liveSession = async (token) => {
  const s = await sessionByToken(token);
  return s && s.status === 'active' ? s : null;
};
const sessionFor = async (token) => {
  const s = await sessionByToken(token);
  return allowed(s) ? s : null;
};

async function blockedPair(bizId, a, b) {
  const row = await get(
    'SELECT id FROM chat_blocks WHERE biz_id = ? AND ((by_id = ? AND target_id = ?) OR (by_id = ? AND target_id = ?)) LIMIT 1',
    bizId, a, b, b, a,
  );
  return !!row;
}

async function activeRoom(a, b) {
  const [x, y] = pair(a, b);
  return get("SELECT * FROM chat_rooms WHERE a_id = ? AND b_id = ? AND status = 'active'", x, y);
}

async function ensureRoom(bizId, a, b) {
  const found = await activeRoom(a, b);
  if (found) return found;
  const [x, y] = pair(a, b);
  const t = now();
  const row = await get(
    'INSERT INTO chat_rooms (biz_id, a_id, b_id, status, created_at, last_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING RETURNING *',
    bizId, x, y, 'active', t, t,
  );
  return row ?? (await activeRoom(a, b));
}

// Ziyaretçi oturumu açar (ya da aynı cihaz geri döndüyse tazeler) ve belirteci döndürür.
export async function join({ cafe, masa, pid, nick, bio, geo }) {
  if (!SLUG_RE.test(String(cafe)) || !MASA_RE.test(String(masa)) || !PID_RE.test(String(pid))) {
    return { error: 'Geçersiz istek.', status: 400 };
  }
  const venue = await getVenueBySlug(String(cafe));
  if (!venue || !hasTable(venue, String(masa))) return { error: 'Mekân bulunamadı.', status: 404 };
  const st = await settingsOf(venue.id);
  if (!st.enabled) return { error: 'Bu mekânda sohbet kapalı.', status: 403 };
  // Konum kilidi açık mekânda sohbete yalnızca mekândaki telefonlar katılabilir (oyun masalarıyla aynı kural).
  if (nearCafe(venue, geo) === false) {
    return geo
      ? { error: 'Sohbete yalnızca mekândayken katılabilirsiniz.', status: 403 }
      : { error: 'Sohbete katılmak için konum izni vermeniz gerekir (mekânda olduğunuz doğrulanır).', status: 403, needGeo: true };
  }

  const t = now();
  const existing = await get('SELECT * FROM chat_sessions WHERE biz_id = ? AND tbl = ? AND pid = ?', venue.id, String(masa), String(pid));
  let row;
  if (existing) {
    if (existing.status === 'kicked') return { error: 'Bu oturum işletme tarafından kapatıldı.', status: 403 };
    row = await get(
      "UPDATE chat_sessions SET nick = ?, bio = ?, status = 'active', seen_at = ? WHERE id = ? RETURNING *",
      clean(nick, NICK_MAX) || existing.nick,
      bio === undefined ? existing.bio : clean(bio, BIO_MAX),
      t, existing.id,
    );
  } else {
    // Rastgele pid'lerle oturum şişirmeyi sınırla: masa başına ve mekân başına canlı oturum üst sınırı.
    const alive = t - IDLE_MS;
    const perTable = Number((await get('SELECT count(*)::int AS n FROM chat_sessions WHERE biz_id = ? AND tbl = ? AND seen_at >= ?', venue.id, String(masa), alive))?.n) || 0;
    const perVenue = Number((await get('SELECT count(*)::int AS n FROM chat_sessions WHERE biz_id = ? AND seen_at >= ?', venue.id, alive))?.n) || 0;
    if (perTable >= TABLE_SESSION_MAX || perVenue >= VENUE_SESSION_MAX) {
      return { error: 'Şu an çok fazla bağlantı var. Biraz sonra tekrar deneyin.', status: 429 };
    }
    row = await get(
      "INSERT INTO chat_sessions (biz_id, tbl, pid, token, nick, bio, status, seen_at, created_at) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?) RETURNING *",
      venue.id, String(masa), String(pid), makeToken(), clean(nick, NICK_MAX) || randomNick(), clean(bio, BIO_MAX), t, t,
    );
  }
  return { token: row.token, me: pubMe(row), settings: st };
}

// Sohbet ekranının tek yoklama ucu: masalar, istekler, odalar ve (varsa) açık odanın yeni mesajları.
export async function state(token, roomId, after) {
  const me = await sessionFor(token);
  if (!me) return { gone: true };
  const t = now();
  await run('UPDATE chat_sessions SET seen_at = ? WHERE id = ?', t, me.id);
  const st = await settingsOf(me.biz_id);
  if (!st.enabled) return { me: pubMe(me), settings: st, disabled: true, tables: [], requestsIn: [], requestsOut: [], rooms: [], current: null, messages: [] };
  if (Math.random() < 0.15) await prune(me.biz_id).catch(() => {});

  const blocks = await all('SELECT by_id, target_id FROM chat_blocks WHERE biz_id = ? AND (by_id = ? OR target_id = ?)', me.biz_id, me.id, me.id);
  const hidden = new Set(blocks.map((b) => (b.by_id === me.id ? b.target_id : b.by_id)));
  hidden.delete(me.id);

  const live = await all(
    "SELECT * FROM chat_sessions WHERE biz_id = ? AND id <> ? AND status = 'active' AND seen_at >= ? ORDER BY tbl, id LIMIT 400",
    me.biz_id, me.id, t - IDLE_MS,
  );
  const pendingOut = await all("SELECT * FROM chat_requests WHERE from_id = ? AND status = 'pending'", me.id);
  const pendingIn = await all("SELECT * FROM chat_requests WHERE to_id = ? AND status = 'pending'", me.id);
  const roomRows = await all(
     `SELECT r.*, s.id AS p_id, s.nick AS p_nick, s.bio AS p_bio, s.tbl AS p_tbl, s.seen_at AS p_seen,
       (SELECT count(*)::int FROM chat_messages m WHERE m.room_id = r.id AND m.from_id <> ? AND m.seen_at IS NULL) AS unread,
       (SELECT m.body FROM chat_messages m WHERE m.room_id = r.id ORDER BY m.id DESC LIMIT 1) AS last_body,
       (SELECT m.at FROM chat_messages m WHERE m.room_id = r.id ORDER BY m.id DESC LIMIT 1) AS last_at,
       (SELECT m.from_id FROM chat_messages m WHERE m.room_id = r.id ORDER BY m.id DESC LIMIT 1) AS last_from
     FROM chat_rooms r JOIN chat_sessions s ON s.id = CASE WHEN r.a_id = ? THEN r.b_id ELSE r.a_id END
     WHERE r.status = 'active' AND (r.a_id = ? OR r.b_id = ?)`,
    me.id, me.id, me.id, me.id,
  );

  const outBy = new Map(pendingOut.map((r) => [r.to_id, r.id]));
  const inBy = new Map(pendingIn.map((r) => [r.from_id, r.id]));
  const roomBy = new Map(roomRows.map((r) => [r.a_id === me.id ? r.b_id : r.a_id, r.id]));

  const tables = live
    .filter((s) => !hidden.has(s.id))
    .map((s) => ({
      id: s.id, tbl: s.tbl, nick: s.nick, bio: s.bio, online: online(s.seen_at),
      room: roomBy.get(s.id) ?? null,
      request: roomBy.get(s.id) ? null : outBy.has(s.id) ? 'out' : inBy.has(s.id) ? 'in' : null,
    }));

  const byId = new Map(live.map((s) => [s.id, s]));
  const reqIn = await all(
    "SELECT r.id, r.created_at, s.id AS sid, s.nick, s.bio, s.tbl FROM chat_requests r JOIN chat_sessions s ON s.id = r.from_id WHERE r.to_id = ? AND r.status = 'pending' ORDER BY r.id DESC",
    me.id,
  );
  const reqOut = await all(
    "SELECT r.id, r.created_at, s.id AS sid, s.nick, s.bio, s.tbl FROM chat_requests r JOIN chat_sessions s ON s.id = r.to_id WHERE r.from_id = ? AND r.status = 'pending' ORDER BY r.id DESC",
    me.id,
  );

  const rooms = roomRows
    .map((r) => ({
      id: r.id,
      peer: { id: r.p_id, nick: r.p_nick, bio: r.p_bio, tbl: r.p_tbl, online: online(r.p_seen) },
      unread: Number(r.unread) || 0,
      last: r.last_body == null ? null : { body: r.last_body, at: Number(r.last_at), mine: r.last_from === me.id },
    }))
    .sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0));

  let current = null;
  let messages = [];
  const rid = Number(roomId) || 0;
  if (rid) {
    const room = await get('SELECT * FROM chat_rooms WHERE id = ? AND biz_id = ?', rid, me.biz_id);
    if (room && (room.a_id === me.id || room.b_id === me.id)) {
      current = { id: room.id, status: room.status };
      if (room.status === 'active') {
        await run('UPDATE chat_messages SET seen_at = ? WHERE room_id = ? AND from_id <> ? AND seen_at IS NULL', t, room.id, me.id);
        const rows = await all('SELECT id, from_id, body, at, seen_at FROM chat_messages WHERE room_id = ? AND id > ? ORDER BY id LIMIT 200', room.id, Number(after) || 0);
        messages = rows.map((m) => ({ id: m.id, body: m.body, at: Number(m.at), mine: m.from_id === me.id, seen: m.seen_at != null }));
      }
    }
  }

  return {
    me: pubMe(me), settings: st, tables,
    requestsIn: reqIn.map((r) => ({ id: r.id, at: Number(r.created_at), from: { id: r.sid, nick: r.nick, bio: r.bio, tbl: r.tbl } })),
    requestsOut: reqOut.map((r) => ({ id: r.id, at: Number(r.created_at), to: { id: r.sid, nick: r.nick, bio: r.bio, tbl: r.tbl } })),
    rooms, current, messages,
  };
}

const fail = (error, status = 409) => ({ error, status });

async function openRoom(me, target) {
  if (await blockedPair(me.biz_id, me.id, target.id)) return fail('Bu masa ile sohbet başlatılamaz.');
  const room = await ensureRoom(me.biz_id, me.id, target.id);
  return { roomId: room.id };
}

// Sohbet isteği gönder (açık moddaysa doğrudan oda açar).
export async function sendRequest(token, targetId) {
  const me = await sessionFor(token);
  if (!me) return fail('Oturum bulunamadı. Sayfayı yenileyin.', 401);
  if (me.status !== 'active') return fail('Sohbetiniz kapalı. Profilden sohbeti açın.');
  const st = await settingsOf(me.biz_id);
  if (!st.enabled) return fail('Bu mekânda sohbet kapalı.', 403);
  const target = await get('SELECT * FROM chat_sessions WHERE id = ? AND biz_id = ?', Number(targetId) || 0, me.biz_id);
  if (!target || target.id === me.id || target.status !== 'active') return fail('Bu masa şu an uygun değil.');
  if (await blockedPair(me.biz_id, me.id, target.id)) return fail('Bu masa ile sohbet başlatılamaz.', 403);
  if (st.open_mode) return openRoom(me, target);

  const room = await activeRoom(me.id, target.id);
  if (room) return { roomId: room.id };

  // Karşı taraf zaten istek göndermişse isteği kabul et (karşılıklı ilgi).
  const rev = await get("SELECT * FROM chat_requests WHERE from_id = ? AND to_id = ? AND status = 'pending'", target.id, me.id);
  if (rev) return decideRequest(token, rev.id, true);

  const dup = await get("SELECT id FROM chat_requests WHERE from_id = ? AND to_id = ? AND status = 'pending'", me.id, target.id);
  if (dup) return { request: { id: dup.id } };

  const t = now();
  const out = Number((await get("SELECT count(*)::int AS n FROM chat_requests WHERE from_id = ? AND status = 'pending'", me.id)).n) || 0;
  if (out >= PENDING_MAX) return fail('Aynı anda çok fazla bekleyen isteğiniz var. Yanıtları bekleyin.');
  const hour = Number((await get('SELECT count(*)::int AS n FROM chat_requests WHERE from_id = ? AND created_at > ?', me.id, t - REQ_WINDOW)).n) || 0;
  if (hour >= REQ_LIMIT) return fail('Çok fazla istek gönderdiniz. Biraz sonra tekrar deneyin.');
  const rej = await get(
    "SELECT id FROM chat_requests WHERE from_id = ? AND to_id = ? AND status = 'rejected' AND decided_at > ? ORDER BY id DESC LIMIT 1",
    me.id, target.id, t - REJECT_COOLDOWN,
  );
  if (rej) return fail('Bu masa isteğinizi yeni reddetti. Biraz sonra tekrar deneyin.');

  const row = await get(
    "INSERT INTO chat_requests (biz_id, from_id, to_id, status, created_at) VALUES (?, ?, ?, 'pending', ?) RETURNING id",
    me.biz_id, me.id, target.id, t,
  );
  return { request: { id: row.id } };
}

export async function decideRequest(token, requestId, accept) {
  const me = await sessionFor(token);
  if (!me) return fail('Oturum bulunamadı. Sayfayı yenileyin.', 401);
  if (me.status !== 'active') return fail('Sohbetiniz kapalı. Profilden sohbeti açın.');
  const st = await settingsOf(me.biz_id);
  if (!st.enabled) return fail('Bu mekânda sohbet kapalı.', 403);
  const req = await get("SELECT * FROM chat_requests WHERE id = ? AND to_id = ? AND status = 'pending'", Number(requestId) || 0, me.id);
  if (!req) return fail('İstek bulunamadı.');
  const t = now();
  const other = await get('SELECT * FROM chat_sessions WHERE id = ?', req.from_id);
  if (!other || other.status !== 'active' || (await blockedPair(me.biz_id, me.id, other.id))) {
    await run("UPDATE chat_requests SET status = 'rejected', decided_at = ? WHERE id = ?", t, req.id);
    return fail('Bu masa artık uygun değil.');
  }
  if (!accept) {
    await run("UPDATE chat_requests SET status = 'rejected', decided_at = ? WHERE id = ?", t, req.id);
    return { rejected: true };
  }
  await run("UPDATE chat_requests SET status = 'accepted', decided_at = ? WHERE id = ?", t, req.id);
  const room = await ensureRoom(me.biz_id, me.id, other.id);
  return { roomId: room.id };
}

export async function cancelRequest(token, requestId) {
  const me = await sessionFor(token);
  if (!me) return fail('Oturum bulunamadı. Sayfayı yenileyin.', 401);
  await run("UPDATE chat_requests SET status = 'cancelled', decided_at = ? WHERE id = ? AND from_id = ? AND status = 'pending'", now(), Number(requestId) || 0, me.id);
  return { ok: true };
}

export async function sendMessage(token, roomId, body) {
  const me = await sessionFor(token);
  if (!me) return fail('Oturum bulunamadı. Sayfayı yenileyin.', 401);
  const st = await settingsOf(me.biz_id);
  if (!st.enabled) return fail('Bu mekânda sohbet kapalı.', 403);
  const text = clean(body, MSG_MAX);
  if (!text) return fail('Boş mesaj gönderilemez.', 400);
  const room = await get('SELECT * FROM chat_rooms WHERE id = ? AND biz_id = ?', Number(roomId) || 0, me.biz_id);
  if (!room || (room.a_id !== me.id && room.b_id !== me.id)) return fail('Sohbet bulunamadı.', 404);
  if (room.status !== 'active') return fail('Bu sohbet kapatıldı.');
  const peerId = room.a_id === me.id ? room.b_id : room.a_id;
  const peer = await get('SELECT * FROM chat_sessions WHERE id = ?', peerId);
  if (!peer || peer.status === 'left' || peer.status === 'kicked') {
    await run("UPDATE chat_rooms SET status = 'closed', closed_at = ? WHERE id = ?", now(), room.id);
    return fail('Karşı taraf sohbetten ayrıldı. Sohbet kapatıldı.');
  }
  if (await blockedPair(me.biz_id, me.id, peerId)) return fail('Bu sohbete mesaj gönderilemiyor.', 403);

  const t = now();
  const n = Number((await get('SELECT count(*)::int AS n FROM chat_messages WHERE from_id = ? AND at > ?', me.id, t - MSG_WINDOW)).n) || 0;
  if (n >= MSG_LIMIT) return fail('Çok hızlı yazıyorsunuz. Bir dakika bekleyin.');
  const m = await get('INSERT INTO chat_messages (room_id, from_id, body, at) VALUES (?, ?, ?, ?) RETURNING id, body, at', room.id, me.id, text, t);
  await run('UPDATE chat_rooms SET last_at = ? WHERE id = ?', t, room.id);
  return { message: { id: m.id, body: m.body, at: Number(m.at), mine: true } };
}

export async function closeRoom(token, roomId) {
  const me = await sessionFor(token);
  if (!me) return fail('Oturum bulunamadı. Sayfayı yenileyin.', 401);
  await run(
    "UPDATE chat_rooms SET status = 'closed', closed_at = ? WHERE id = ? AND biz_id = ? AND status = 'active' AND (a_id = ? OR b_id = ?)",
    now(), Number(roomId) || 0, me.biz_id, me.id, me.id,
  );
  return { ok: true };
}

export async function blockUser(token, targetId) {
  const me = await sessionFor(token);
  if (!me) return fail('Oturum bulunamadı. Sayfayı yenileyin.', 401);
  const target = await get('SELECT * FROM chat_sessions WHERE id = ? AND biz_id = ?', Number(targetId) || 0, me.biz_id);
  if (!target || target.id === me.id) return fail('Kullanıcı bulunamadı.', 404);
  const t = now();
  await run('INSERT INTO chat_blocks (biz_id, by_id, target_id, created_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING', me.biz_id, me.id, target.id, t);
  await run("UPDATE chat_rooms SET status = 'closed', closed_at = ? WHERE status = 'active' AND ((a_id = ? AND b_id = ?) OR (a_id = ? AND b_id = ?))", t, me.id, target.id, target.id, me.id);
  await run("UPDATE chat_requests SET status = 'cancelled', decided_at = ? WHERE status = 'pending' AND ((from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?))", t, me.id, target.id, target.id, me.id);
  return { ok: true };
}

export async function unblockUser(token, targetId) {
  const me = await sessionFor(token);
  if (!me) return fail('Oturum bulunamadı. Sayfayı yenileyin.', 401);
  await run('DELETE FROM chat_blocks WHERE biz_id = ? AND by_id = ? AND target_id = ?', me.biz_id, me.id, Number(targetId) || 0);
  return { ok: true };
}

export async function reportUser(token, { targetId, roomId, reason }) {
  const me = await sessionFor(token);
  if (!me) return fail('Oturum bulunamadı. Sayfayı yenileyin.', 401);
  const target = await get('SELECT id FROM chat_sessions WHERE id = ? AND biz_id = ?', Number(targetId) || 0, me.biz_id);
  if (!target || target.id === me.id) return fail('Kullanıcı bulunamadı.', 404);
  const text = clean(reason, 300);
  if (text.length < 3) return fail('Şikâyet nedenini yazın.', 400);
  const t = now();
  const n = Number((await get('SELECT count(*)::int AS n FROM chat_reports WHERE by_id = ? AND created_at > ?', me.id, t - REQ_WINDOW)).n) || 0;
  if (n >= REPORT_HOURLY) return fail('Çok fazla şikâyet gönderdiniz.');
  // Yalnızca gerçekten etkileşim olan hedef şikâyet edilebilir: ortak oda ya da (iki yönden biri) sohbet isteği (CHT-03).
  const pairRoom = await get(
    'SELECT id FROM chat_rooms WHERE biz_id = ? AND ((a_id = ? AND b_id = ?) OR (a_id = ? AND b_id = ?)) ORDER BY id DESC LIMIT 1',
    me.biz_id, me.id, target.id, target.id, me.id,
  );
  const hadReq = pairRoom ? null : await get(
    'SELECT id FROM chat_requests WHERE biz_id = ? AND ((from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)) LIMIT 1',
    me.biz_id, me.id, target.id, target.id, me.id,
  );
  if (!pairRoom && !hadReq) return fail('Bu kullanıcıyla etkileşiminiz yok.', 403);
  let rid = Number(roomId) || null;
  if (rid) {
    // Oda numarası yalnızca şikâyet edenle hedef arasındaki odaysa kabul edilir; başkasının odası reddedilir.
    const room = await get(
      'SELECT id FROM chat_rooms WHERE id = ? AND biz_id = ? AND ((a_id = ? AND b_id = ?) OR (a_id = ? AND b_id = ?))',
      rid, me.biz_id, me.id, target.id, target.id, me.id,
    );
    if (!room) return fail('Bu odayla ilgili şikâyet gönderemezsiniz.', 403);
  }
  await run('INSERT INTO chat_reports (biz_id, by_id, target_id, room_id, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', me.biz_id, me.id, target.id, rid, text, 'open', t);
  return { ok: true };
}

// Takma ad ve kısa profil güncellemesi.
export async function profile(token, nick, bio) {
  const me = await sessionFor(token);
  if (!me) return fail('Oturum bulunamadı. Sayfayı yenileyin.', 401);
  const n = clean(nick, NICK_MAX);
  if (n.length < 2) return fail('Takma ad en az 2 karakter olmalı.', 400);
  const row = await get('UPDATE chat_sessions SET nick = ?, bio = ? WHERE id = ? RETURNING nick, bio', n, clean(bio, BIO_MAX), me.id);
  return { me: { ...pubMe({ ...me, nick: row.nick, bio: row.bio }) } };
}

// "Sohbete açık" durumu: paused iken başkalarının listesinde görünmez, gelen istekler bekler.
export async function setOpen(token, open) {
  const me = await sessionFor(token);
  if (!me) return fail('Oturum bulunamadı. Sayfayı yenileyin.', 401);
  await run('UPDATE chat_sessions SET status = ? WHERE id = ?', open ? 'active' : 'paused', me.id);
  return { ok: true, status: open ? 'active' : 'paused' };
}

// Ziyaretçi ayrıldı: oturum düşer, odaları ve bekleyen istekleri kapanır.
export async function leave(token) {
  const me = await sessionByToken(token);
  if (!me) return { ok: true };
  const t = now();
  await run("UPDATE chat_sessions SET status = 'left' WHERE id = ?", me.id);
  await run("UPDATE chat_rooms SET status = 'closed', closed_at = ? WHERE status = 'active' AND (a_id = ? OR b_id = ?)", t, me.id, me.id);
  await run("UPDATE chat_requests SET status = 'cancelled', decided_at = ? WHERE status = 'pending' AND (from_id = ? OR to_id = ?)", t, me.id, me.id);
  return { ok: true };
}

// ---- İşletme paneli ----

export async function panelChat(bizId) {
  await prune(bizId).catch(() => {});
  const settings = await settingsOf(bizId);
  const sessions = await all(
    "SELECT id, tbl, nick, bio, status, seen_at, created_at FROM chat_sessions WHERE biz_id = ? AND status IN ('active', 'paused') ORDER BY tbl, id",
    bizId,
  );
  const rooms = await all(
    `SELECT r.id, r.created_at, r.last_at, a.tbl AS a_tbl, a.nick AS a_nick, b.tbl AS b_tbl, b.nick AS b_nick,
       (SELECT count(*)::int FROM chat_messages m WHERE m.room_id = r.id) AS msgs
     FROM chat_rooms r JOIN chat_sessions a ON a.id = r.a_id JOIN chat_sessions b ON b.id = r.b_id
     WHERE r.biz_id = ? AND r.status = 'active' ORDER BY r.last_at DESC`,
    bizId,
  );
  const reports = await all(
    `SELECT r.id, r.reason, r.created_at, r.room_id, s.nick AS by_nick, s.tbl AS by_tbl, t.nick AS target_nick, t.tbl AS target_tbl
     FROM chat_reports r JOIN chat_sessions s ON s.id = r.by_id JOIN chat_sessions t ON t.id = r.target_id
     WHERE r.biz_id = ? AND r.status = 'open' ORDER BY r.id DESC LIMIT 100`,
    bizId,
  );
  return {
    settings,
    sessions: sessions.map((s) => ({ id: s.id, tbl: s.tbl, nick: s.nick, bio: s.bio, status: s.status, seen_at: Number(s.seen_at), created_at: Number(s.created_at) })),
    rooms: rooms.map((r) => ({ id: r.id, a_tbl: r.a_tbl, a_nick: r.a_nick, b_tbl: r.b_tbl, b_nick: r.b_nick, msgs: Number(r.msgs) || 0, last_at: Number(r.last_at) })),
    reports: reports.map((r) => ({ id: r.id, reason: r.reason, at: Number(r.created_at), by_nick: r.by_nick, by_tbl: r.by_tbl, target_nick: r.target_nick, target_tbl: r.target_tbl })),
  };
}

export async function panelSettings(bizId, patch) {
  const cur = await settingsOf(bizId);
  const enabled = patch.enabled === undefined ? cur.enabled : !!patch.enabled;
  const openMode = patch.open_mode === undefined ? cur.open_mode : !!patch.open_mode;
  const retention = Math.min(168, Math.max(1, Number(patch.retention_hours) || cur.retention_hours));
  await run(
    'INSERT INTO chat_settings (biz_id, enabled, open_mode, retention_hours, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (biz_id) DO UPDATE SET enabled = ?, open_mode = ?, retention_hours = ?, updated_at = ?',
    bizId, enabled, openMode, retention, now(), enabled, openMode, retention, now(),
  );
  return { ok: true, settings: { enabled, open_mode: openMode, retention_hours: retention } };
}

export async function panelAction(bizId, action, id) {
  const t = now();
  if (action === 'kick') {
    const s = await get('SELECT id FROM chat_sessions WHERE id = ? AND biz_id = ?', Number(id) || 0, bizId);
    if (!s) return fail('Oturum bulunamadı.', 404);
    await run("UPDATE chat_sessions SET status = 'kicked' WHERE id = ?", s.id);
    await run("UPDATE chat_rooms SET status = 'closed', closed_at = ? WHERE status = 'active' AND (a_id = ? OR b_id = ?)", t, s.id, s.id);
    await run("UPDATE chat_requests SET status = 'cancelled', decided_at = ? WHERE status = 'pending' AND (from_id = ? OR to_id = ?)", t, s.id, s.id);
    return { ok: true };
  }
  if (action === 'close_room') {
    await run("UPDATE chat_rooms SET status = 'closed', closed_at = ? WHERE id = ? AND biz_id = ? AND status = 'active'", t, Number(id) || 0, bizId);
    return { ok: true };
  }
  if (action === 'dismiss_report') {
    await run("UPDATE chat_reports SET status = 'dismissed' WHERE id = ? AND biz_id = ?", Number(id) || 0, bizId);
    return { ok: true };
  }
  return fail('Bilinmeyen işlem.', 400);
}
