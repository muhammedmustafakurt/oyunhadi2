// Masalar arası sohbet: uçtan uca güvenlik ve akış testleri.
// Kullanım: npm run test:chat   (BASE_URL=http://localhost:3002, DATABASE_URL .env'den gelir)
// Testler gerçek API'yi ve gerçek veritabanını kullanır; sonunda oluşturduğu veriyi siler.
import { signToken, passwordVersion } from '../src/lib/session-token.js';
import { neon } from '@neondatabase/serverless';

const BASE = process.env.BASE_URL || 'http://localhost:3002';
const URL = process.env.DATABASE_URL;
if (!URL) { console.error('DATABASE_URL yok. npm run test:chat .env dosyasından okur.'); process.exit(1); }
const sql = neon(URL);

let pass = 0;
let fail = 0;
const ok = (cond, name, extra) => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${extra ? ` — ${extra}` : ''}`); }
};
const section = (t) => console.log(`\n${t}`);

const rnd = () => Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 12);
const pid = (p) => `${p}${rnd()}`.padEnd(20, 'x').slice(0, 24);
const RUN = rnd();
const PIDS = [];

async function post(body) {
  const r = await fetch(`${BASE}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json() };
}
async function get(q) {
  const r = await fetch(`${BASE}/api/chat?${new URLSearchParams(q)}`, { cache: 'no-store' });
  return { status: r.status, body: await r.json() };
}
const join = (cafe, masa, p, nick) => post({ type: 'join', cafe, masa, pid: p, nick });
const state = (token, room = '', after = 0) => get({ token, room, after });
const act = (token, type, extra = {}) => post({ token, type, ...extra });

// Panel çerezi: "<id>.<bitiş>.<parolaSürümü>.<HMAC>" (src/lib/session-token.js; sürüm mekânın parola karmasından türer).
// SESSION_SECRET yoksa geliştirme sunucusunun sabit anahtarı kullanılır; üretim sunucusuna karşı çalıştırırken SESSION_SECRET gerekir.
const SECRET = (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32)
  ? process.env.SESSION_SECRET
  : 'dev-only-session-secret-not-for-production';
const PW = {}; // mekân id -> parola karması (main içinde veritabanından doldurulur)
function cookie(id) {
  return `oh-panel=${signToken(SECRET, 'panel', id, Date.now() + 60 * 60 * 1000, passwordVersion(SECRET, PW[id]))}`;
}
const panelPost = async (id, body) => {
  const r = await fetch(`${BASE}/api/panel/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie(id), Origin: BASE }, body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
};

async function main() {
  const [demo] = await sql.query("SELECT id FROM venues WHERE slug = 'demo'", []);
  const [lav] = await sql.query("SELECT id FROM venues WHERE slug = 'lavanta-bistro'", []);
  ok(!!demo && !!lav, 'seed mekânları bulundu');
  for (const v of [demo, lav]) PW[v.id] = (await sql.query('SELECT password FROM venues WHERE id = $1', [v.id]))[0]?.password;

  // --- Oturumlar ---
  section('1. Oturum ve aynı mekân görünürlüğü');
  const aPid = pid('a'), bPid = pid('b'), cPid = pid('c');
  PIDS.push(aPid, bPid, cPid);
  const A = (await join('demo', 'masa-1', aPid, `TestA${RUN}`)).body;
  const B = (await join('demo', 'masa-1', bPid, `TestB${RUN}`)).body;
  const C = (await join('lavanta-bistro', 'masa-1', cPid, `TestC${RUN}`)).body;
  ok(!!A.token && !!B.token && !!C.token, 'üç oturum açıldı');
  ok(/^[a-f0-9]{64}$/.test(A.token), 'belirteç 32 bayt rastgele');
  const aId = (await sql.query('SELECT id FROM chat_sessions WHERE token = $1', [A.token]))[0].id;
  const cId = (await sql.query('SELECT id FROM chat_sessions WHERE token = $1', [C.token]))[0].id;

  let sa = (await state(A.token)).body;
  ok(sa.tables.some((t) => t.nick === `TestB${RUN}`), 'aynı mekândaki masa listede');
  const bSid = sa.tables.find((t) => t.nick === `TestB${RUN}`).id;
  ok(!sa.tables.some((t) => t.nick === `TestC${RUN}`), 'başka mekânın masası görünmüyor');

  const sc = (await state(C.token)).body;
  ok(!sc.tables.some((t) => t.nick === `TestA${RUN}`), 'karşı yönde de mekân yalıtımı var');

  section('2. İstek akışı ve yetki');
  const noRoom = await act(A.token, 'send', { room: 999999, body: 'deneme' });
  ok(!!noRoom.body.error, 'kabul edilmemiş sohbete mesaj gönderilemiyor', JSON.stringify(noRoom.body));

  const cross = await act(A.token, 'request', { target: cId });
  ok(!!cross.body.error, 'başka mekânın oturumuna istek gönderilemiyor', JSON.stringify(cross.body));

  const req = await act(A.token, 'request', { target: bSid });
  ok(req.status === 200 && !!req.body.request?.id, 'sohbet isteği gönderildi', JSON.stringify(req.body));

  const dup = await act(A.token, 'request', { target: bSid });
  ok(dup.body.request?.id === req.body.request.id, 'yinelenen bekleyen istek oluşmadı');

  let sb = (await state(B.token)).body;
  ok(sb.requestsIn.some((r) => r.from.nick === `TestA${RUN}`), 'karşı masa isteği gördü');
  ok(sb.requestsIn.find((r) => r.from.nick === `TestA${RUN}`).from.id === aId, 'istek doğru oturumdan geldi');

  const acc = await act(B.token, 'accept', { id: req.body.request.id });
  const roomId = acc.body.roomId;
  ok(acc.status === 200 && !!roomId, 'istek kabul edildi, oda açıldı', JSON.stringify(acc.body));

  sb = (await state(B.token, roomId)).body;
  ok(sb.current?.status === 'active', 'oda iki taraf için açık');

  const msg1 = await act(A.token, 'send', { room: roomId, body: 'Merhaba masa 5!' });
  ok(msg1.status === 200 && msg1.body.message?.mine, 'A mesaj gönderdi');

  const unseen = (await state(B.token)).body;
  ok(unseen.rooms.find((r) => r.id === roomId)?.unread >= 1, 'okunmamış sayacı arttı');

  const read = (await state(B.token, roomId)).body;
  ok(read.messages.some((m) => m.body === 'Merhaba masa 5!' && !m.mine), 'B mesajı gördü');

  const posted = (await state(A.token, roomId)).body;
  const mineSeen = posted.messages.find((m) => m.body === 'Merhaba masa 5!');
  ok(mineSeen?.seen === true, 'okundu bilgisi A tarafına yansıdı');

  const reply = await act(B.token, 'send', { room: roomId, body: 'Merhaba, buyrun!' });
  ok(reply.status === 200, 'B yanıtladı');
  const aAfter = (await state(A.token, roomId, msg1.body.message.id)).body;
  ok(aAfter.messages.length === 1 && aAfter.messages[0].body === 'Merhaba, buyrun!', 'mesaj geçmişi kontrollü yüklendi (after)');

  section('3. Yalıtım ve yetkisiz erişim');
  const cTry = (await state(C.token, roomId)).body;
  ok(!cTry.current && cTry.messages.length === 0, 'başka mekân oda kimliğiyle mesaj okuyamıyor');
  const cSend = await act(C.token, 'send', { room: roomId, body: 'sızma' });
  ok(!!cSend.body.error, 'başka mekân odaya mesaj gönderemiyor');

  const dPid = pid('d');
  PIDS.push(dPid);
  const D = (await join('demo', 'masa-2', dPid, `TestD${RUN}`)).body;
  const dTry = (await state(D.token, roomId)).body;
  ok(!dTry.current && dTry.messages.length === 0, 'katılımcı olmayan aynı mekân oturumu odayı okuyamıyor');

  section('4. Red, cooldown ve engelleme');
  const dSid = (await state(A.token)).body.tables.find((t) => t.nick === `TestD${RUN}`)?.id;
  const req2 = await act(A.token, 'request', { target: dSid });
  ok(!!req2.body.request?.id, 'yeni masaya istek gitti');
  await act(D.token, 'reject', { id: req2.body.request.id });
  const again = await act(A.token, 'request', { target: dSid });
  ok(!!again.body.error, 'reddeden masaya hemen yeniden istek engelli', JSON.stringify(again.body));

  await act(A.token, 'block', { target: dSid });
  const blockedTry = await act(D.token, 'request', { target: aId });
  ok(!!blockedTry.body.error, 'engellenen taraftan istek engellendi', JSON.stringify(blockedTry.body));
  const afterBlock = (await state(A.token)).body;
  ok(!afterBlock.tables.some((t) => t.nick === `TestD${RUN}`), 'engellenen masa listeden düştü');

  section('5. Hız limitleri');
  const targets = [];
  for (let i = 3; i <= 8; i++) {
    const p = pid('s');
    PIDS.push(p);
    const s = await join('demo', `masa-${i}`, p, `TestS${i}${RUN}`);
    const sid = (await state(A.token)).body.tables.find((t) => t.nick === `TestS${i}${RUN}`)?.id;
    targets.push({ token: s.body.token, sid });
  }
  let reqErrs = 0;
  for (const t of targets) if (t.sid) { const r = await act(A.token, 'request', { target: t.sid }); if (r.body.error) reqErrs++; }
  ok(reqErrs >= 1, 'bekleyen istek sınırı uygulandı', `${reqErrs} istek reddedildi`);

  let msgErrs = 0;
  for (let i = 0; i < 26; i++) {
    const r = await act(A.token, 'send', { room: roomId, body: `flood ${i}` });
    if (r.body.error) msgErrs++;
  }
  ok(msgErrs >= 1, 'dakikalık mesaj sınırı uygulandı', `${msgErrs} mesaj reddedildi`);

  section('6. Oturum sonlandırma ve işletme kapatması');
  await act(D.token, 'leave');
  const dGone = (await state(D.token)).body;
  ok(dGone.gone === true, 'ayrılan oturum erişimini kaybetti');

  await sql.query("UPDATE chat_sessions SET status = 'kicked' WHERE token = $1", [B.token]);
  const bGone = (await state(B.token)).body;
  ok(bGone.gone === true, 'işletme oturumu kapatınca erişim düşüyor');
  const bRejoin = await join('demo', 'masa-1', bPid, `TestB${RUN}`);
  ok(bRejoin.status === 403, 'kapatılan oturum yeniden açılamıyor');

  await sql.query('INSERT INTO chat_settings (biz_id, enabled, updated_at) VALUES ($1, false, $2) ON CONFLICT (biz_id) DO UPDATE SET enabled = false', [demo.id, Date.now()]);
  const offPid = pid('o');
  PIDS.push(offPid);
  const off = await join('demo', 'masa-9', offPid, `TestOff${RUN}`);
  ok(off.status === 403, 'işletme sohbeti kapatınca yeni oturum açılamıyor');
  await sql.query('INSERT INTO chat_settings (biz_id, enabled, updated_at) VALUES ($1, true, $2) ON CONFLICT (biz_id) DO UPDATE SET enabled = true', [demo.id, Date.now()]);

  section('7. Panel yetkisi');
  const noAuth = await fetch(`${BASE}/api/panel/chat`);
  ok(noAuth.status === 401, 'panelsiz istek 401 döndü');
  const panel = await fetch(`${BASE}/api/panel/chat`, { headers: { Cookie: cookie(demo.id) } });
  ok(panel.status === 200, 'panel oturumu kendi verisini okuyor');
  const sidOfA = (await sql.query('SELECT id FROM chat_sessions WHERE token = $1', [A.token]))[0]?.id;
  const kickOther = await panelPost(demo.id, { action: 'kick', id: 999999 });
  ok(kickOther.status === 404, 'olmayan oturum kapatılamıyor');
  const kickA = await panelPost(demo.id, { action: 'kick', id: sidOfA });
  ok(kickA.status === 200, 'panel oturumu kapatabildi');
  const aGone = (await state(A.token)).body;
  ok(aGone.gone === true, 'panelin kapattığı oturum düştü');
  const crossKick = await panelPost(lav.id, { action: 'kick', id: sidOfA });
  ok(crossKick.status === 404, 'panel başka işletmenin oturumuna erişemiyor');
}

async function cleanup() {
  try {
    const rows = await sql.query('SELECT id FROM chat_sessions WHERE token IS NOT NULL AND pid = ANY($1::text[])', [PIDS]);
    const ids = rows.map((r) => r.id);
    if (!ids.length) return;
    const rooms = await sql.query('SELECT id FROM chat_rooms WHERE a_id = ANY($1::int[]) OR b_id = ANY($1::int[])', [ids]);
    const rids = rooms.map((r) => r.id);
    if (rids.length) await sql.query('DELETE FROM chat_messages WHERE room_id = ANY($1::int[])', [rids]);
    await sql.query('DELETE FROM chat_rooms WHERE a_id = ANY($1::int[]) OR b_id = ANY($1::int[])', [ids]);
    await sql.query('DELETE FROM chat_requests WHERE from_id = ANY($1::int[]) OR to_id = ANY($1::int[])', [ids]);
    await sql.query('DELETE FROM chat_blocks WHERE by_id = ANY($1::int[]) OR target_id = ANY($1::int[])', [ids]);
    await sql.query('DELETE FROM chat_reports WHERE by_id = ANY($1::int[]) OR target_id = ANY($1::int[])', [ids]);
    await sql.query('DELETE FROM chat_sessions WHERE id = ANY($1::int[])', [ids]);
  } catch (e) { console.error('temizlik hatası:', e.message); }
}

try {
  await main();
} catch (e) {
  fail++;
  console.error('\nBeklenmeyen hata:', e);
} finally {
  await cleanup();
  console.log(`\nSonuç: ${pass} geçti, ${fail} başarısız`);
  process.exit(fail ? 1 : 0);
}
