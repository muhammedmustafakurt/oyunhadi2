// API güvenlik testi: yalnızca fetch kullanır; veritabanına DOĞRUDAN erişmez (yalnız yerel geliştirme sunucusunun API'si).
// Kullanım: npm run test:security   (BASE_URL varsayılan http://localhost:3002)
// Yerel dev sunucusu DATABASE_URL'siz (bellek içi PGlite, demo mekânı ve elif@hadikafe.com / demo1234 tohumlu) çalışmalıdır.
// Rastgele pid'ler kullanılır; sonunda masalardan ayrılınır / sohbet oturumları kapatılır.
import { createHmac } from 'node:crypto';
import { signToken, passwordVersion } from '../src/lib/session-token.js';

const BASE = process.env.BASE_URL || 'http://localhost:3002';
const ORIGIN = new URL(BASE).origin;

let pass = 0;
let fail = 0;
const ok = (cond, name, extra) => {
  if (cond) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}${extra !== undefined ? ` -- ${typeof extra === 'string' ? extra : JSON.stringify(extra)}` : ''}`); }
};
const section = (t) => console.log(`\n== ${t}`);
const rnd = () => Math.random().toString(36).replace(/[^a-z0-9]/g, '').padEnd(12, 'x').slice(0, 12);
const RUN = rnd();
const pid = (p) => `${p}${RUN}${rnd()}`.slice(0, 28).padEnd(20, 'x');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, path, { body, headers = {}, raw } = {}) {
  const r = await fetch(`${BASE}${path}`, {
    method, cache: 'no-store',
    headers: { ...(body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await r.json(); } catch {}
  return { status: r.status, body: data, res: r };
}
const withOrigin = (h = {}) => ({ Origin: ORIGIN, ...h });

async function main() {
  try { await fetch(BASE, { method: 'HEAD' }); } catch { console.log(`FAIL  sunucuya ulasilamadi: ${BASE}`); process.exit(1); }

  // ---------- 1. Oturumsuz uçlar ----------
  section('1. Oturumsuz panel/admin uçları');
  const unauth = [
    ['POST', '/api/panel/venue', {}], ['POST', '/api/panel/events', { op: 'create' }], ['POST', '/api/panel/rewards', { op: 'verify', code: 'AB-CDEF' }],
    ['POST', '/api/panel/chat', { type: 'settings', patch: {} }], ['GET', '/api/panel/chat'],
    ['POST', '/api/admin/venues', {}], ['POST', '/api/admin/admins', {}], ['POST', '/api/admin/password', {}],
  ];
  for (const [m, p, b] of unauth) {
    const r = await call(m, p, { body: b, headers: withOrigin() });
    ok(r.status === 401, `${m} ${p} oturumsuz (doğru Origin) -> 401`, r.status);
  }

  // ---------- 2. Origin denetimi ----------
  section('2. Origin denetimi (CSRF)');
  const adm = await call('POST', '/api/admin/venues', { body: {} });
  ok(adm.status === 403, 'admin POST Origin/Sec-Fetch-Site olmadan -> 403', adm.status);
  const admEvil = await call('POST', '/api/admin/venues', { body: {}, headers: { Origin: 'https://evil.example' } });
  ok(admEvil.status === 403, 'admin POST sahte Origin -> 403', admEvil.status);

  const login = await call('POST', '/api/panel/login', { body: { email: 'elif@hadikafe.com', password: 'demo1234' }, headers: withOrigin() });
  const setCookie = login.res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c) => c.split(';')[0]).find((c) => c.startsWith('oh-panel='));
  ok(login.status === 200 && !!cookie, 'panel girişi (yerel tohum hesabı) -> 200 + oturum çerezi', login.status);
  if (cookie) {
    const H = (extra = {}) => ({ Cookie: cookie, ...extra });
    const evil = { Origin: 'https://evil.example' };
    for (const [p, b] of [['/api/panel/venue', {}], ['/api/panel/events', { op: 'state', id: 1 }], ['/api/panel/rewards', { op: 'verify', code: 'AB-CDEF' }], ['/api/panel/chat', { type: 'settings', patch: {} }]]) {
      const bad = await call('POST', p, { body: b, headers: H(evil) });
      ok(bad.status === 403, `oturumlu ${p} sahte Origin -> 403`, bad.status);
      const none = await call('POST', p, { body: b, headers: H() });
      ok(none.status === 403, `oturumlu ${p} Origin yok -> 403`, none.status);
    }
    const good = await call('POST', '/api/panel/venue', { body: {}, headers: H(withOrigin()) });
    ok(good.status === 200 && !!good.body?.venue, 'oturumlu /api/panel/venue doğru Origin -> 200', good.status);
    const sf = await call('POST', '/api/panel/venue', { body: {}, headers: H({ 'Sec-Fetch-Site': 'same-origin' }) });
    ok(sf.status === 200, 'Origin yok ama Sec-Fetch-Site: same-origin -> 200', sf.status);
    const goodChat = await call('POST', '/api/panel/chat', { body: { type: 'settings', patch: {} }, headers: H(withOrigin()) });
    ok(goodChat.status === 200, 'oturumlu /api/panel/chat doğru Origin -> 200', goodChat.status);
    const goodRw = await call('POST', '/api/panel/rewards', { body: { op: 'verify', code: 'AB-CDEF' }, headers: H(withOrigin()) });
    ok(goodRw.status === 200 || goodRw.status === 400, 'oturumlu /api/panel/rewards doğru Origin -> kabul (200/400)', goodRw.status);
    const goodEv = await call('POST', '/api/panel/events', { body: { op: 'bogus' }, headers: H(withOrigin()) });
    ok(goodEv.status === 400, 'oturumlu /api/panel/events doğru Origin, bilinmeyen op -> 400 (Origin geçti)', goodEv.status);
    const big = await call('POST', '/api/panel/venue', { raw: JSON.stringify({ welcome: 'x'.repeat(200 * 1024) }), headers: H(withOrigin()) });
    ok(big.status === 413, 'panel POST 200 KB gövde -> 413', big.status);
  }

  // ---------- 3. Girdi türü ----------
  section('3. Dizi/nesne girdi -> 400');
  const P0 = pid('t');
  const roomBase = { cafe: 'demo', masa: 'masa-9', game: 'satranc', pid: P0, action: { type: 'ping' } };
  for (const [k, v] of [['cafe', ['demo']], ['masa', ['masa-9']], ['game', ['satranc']], ['pid', [P0]], ['masa', { a: 1 }], ['cafe', { a: 1 }]]) {
    const r = await call('POST', '/api/room', { body: { ...roomBase, [k]: v } });
    ok(r.status === 400, `/api/room ${k}=${Array.isArray(v) ? 'dizi' : 'nesne'} -> 400`, r.status);
  }
  const ra = await call('POST', '/api/room', { body: { ...roomBase, action: [1] } });
  ok(ra.status === 400, '/api/room action=dizi -> 400', ra.status);
  const rb = await call('POST', '/api/room', { body: [1, 2] });
  ok(rb.status === 400, '/api/room gövde=dizi -> 400', rb.status);
  const rbad = await call('POST', '/api/room', { raw: '{bozuk' });
  ok(rbad.status === 400, '/api/room bozuk JSON -> 400', rbad.status);

  const chatJoin = { type: 'join', cafe: 'demo', masa: 'masa-9', pid: pid('c') };
  for (const [k, v] of [['cafe', ['demo']], ['masa', { a: 1 }], ['pid', [chatJoin.pid]], ['nick', { a: 1 }]]) {
    const r = await call('POST', '/api/chat', { body: { ...chatJoin, [k]: v } });
    ok(r.status === 400, `/api/chat join ${k}=${Array.isArray(v) ? 'dizi' : 'nesne'} -> 400`, r.status);
  }
  for (const t of ['send', 'report', 'request', 'leave']) {
    const r = await call('POST', '/api/chat', { body: { type: t, token: { a: 1 }, target: { a: 1 } } });
    ok(r.status === 400, `/api/chat ${t} token=nesne -> 400`, r.status);
  }
  const cArr = await call('POST', '/api/chat', { body: [1] });
  ok(cArr.status === 400, '/api/chat gövde=dizi -> 400', cArr.status);

  const evBase = { cafe: 'demo', masa: 'masa-9', event: 1, pid: pid('e'), action: { type: 'join' } };
  for (const [k, v] of [['cafe', ['demo']], ['masa', { a: 1 }], ['pid', [evBase.pid]], ['event', { a: 1 }], ['event', [1]]]) {
    const r = await call('POST', '/api/event', { body: { ...evBase, [k]: v } });
    ok(r.status === 400, `/api/event ${k}=${Array.isArray(v) ? 'dizi' : 'nesne'} -> 400`, r.status);
  }
  const eact = await call('POST', '/api/event', { body: { ...evBase, action: [1] } });
  ok(eact.status === 400 || eact.status === 404, '/api/event action=dizi -> 400/404 (500 değil)', eact.status);
  const eArr = await call('POST', '/api/event', { body: [1] });
  ok(eArr.status === 400, '/api/event gövde=dizi -> 400', eArr.status);

  // ---------- 4. Gövde boyutu ----------
  section('4. Aşırı büyük gövde -> 413');
  const mk = (n) => 'x'.repeat(n);
  const r1 = await call('POST', '/api/room', { raw: JSON.stringify({ ...roomBase, junk: mk(400 * 1024) }) });
  ok(r1.status === 413, '/api/room 400 KB -> 413', r1.status);
  const r2 = await call('POST', '/api/chat', { raw: JSON.stringify({ type: 'send', token: 'a', body: mk(100 * 1024) }) });
  ok(r2.status === 413, '/api/chat 100 KB -> 413', r2.status);
  const r3 = await call('POST', '/api/event', { raw: JSON.stringify({ ...evBase, junk: mk(100 * 1024) }) });
  ok(r3.status === 413, '/api/event 100 KB -> 413', r3.status);
  const r4 = await call('POST', '/api/admin/venues', { raw: JSON.stringify({ junk: mk(100 * 1024) }), headers: withOrigin() });
  ok(r4.status === 413 || r4.status === 401, '/api/admin/venues 100 KB -> 413 (ya da önce 401)', r4.status);
  // Meşru en büyük çizim yükü (30 parça x 600 koordinat) sınırın altında kalmalı.
  const piece = (id) => ({ id, c: 0, w: 0, start: 0, p: Array.from({ length: 600 }, () => 1000) });
  const legit = JSON.stringify({ ...roomBase, game: 'cizim', action: { type: 'ddraw', strokes: Array.from({ length: 30 }, (_, i) => piece(i)) } });
  const rl = await call('POST', '/api/room', { raw: legit });
  ok(legit.length < 256 * 1024 && rl.status !== 413, `/api/room meşru en büyük çizim yükü (${legit.length} bayt) 413 değil`, rl.status);

  // ---------- 5. Ping / sürüm ----------
  section('5. ping ve sürüm');
  const table = `masa-${3 + Math.floor(Math.random() * 3)}`;
  const A = pid('a'), B = pid('b'), C = pid('c');
  const q = (p) => `/api/room?cafe=demo&masa=${table}&game=satranc&pid=${p}`;
  const act = (p, action) => call('POST', '/api/room', { body: { cafe: 'demo', masa: table, game: 'satranc', pid: p, action } });
  const ver = async (p = C) => (await call('GET', q(p))).body?.version;
  let v0 = await ver();
  const room0 = (await call('GET', q(C))).body;
  if (room0?.phase !== 'lobby' || room0.seats.length) {
    console.log(`  (uyarı: ${table} boş değil, sürüm testleri atlandı)`);
  } else {
    await act(C, { type: 'ping' });
    await act(C, { type: 'ping' });
    ok((await ver()) === v0, 'koltuksuz pid ping -> sürüm artmaz', { before: v0, after: await ver() });
    const j = await act(A, { type: 'join', name: 'TestA' });
    const v1 = await ver();
    ok(j.status === 200 && v1 === v0 + 1, 'join -> sürüm +1', { v0, v1, st: j.status });
    await sleep(1300);
    const idleBefore = (await call('GET', q(A))).body.seats[0].idleMs;
    const pg = await act(A, { type: 'ping' });
    const v2 = await ver();
    const idleAfter = (await call('GET', q(A))).body.seats[0].idleMs;
    ok(pg.status === 200 && v2 === v1, 'koltuklu pid ping -> sürüm artmaz', { v1, v2 });
    ok(idleBefore >= 1000 && idleAfter < idleBefore - 500, "koltuklu pid ping -> 'seen' yazılır (idleMs düşer)", { idleBefore, idleAfter });
    const jb = await act(B, { type: 'join', name: 'TestB' });
    ok(jb.status === 200 && (await ver()) === v2 + 1, '2. oyuncu join -> sürüm +1');

    // ---------- 6. Yabancı pid ile hamle ----------
    section('6. Yabancı pid ile hamle (satranç)');
    const st = await act(A, { type: 'start' });
    ok(st.status === 200 && st.body?.phase === 'play', 'oyun başlatıldı', st.status);
    const move = { type: 'move', from: [6, 4], to: [4, 4] };
    const foreign = await act(C, move);
    ok(foreign.status === 409, 'koltuğu olmayan pid hamlesi -> 409', foreign.status);
    const wrongTurn = await act(B, { type: 'move', from: [1, 4], to: [3, 4] });
    ok(wrongTurn.status === 409, 'sırası olmayan oyuncu hamlesi -> 409', wrongTurn.status);
    const vMove = await ver();
    const goodMove = await act(A, move);
    ok(goodMove.status === 200 && (await ver()) === vMove + 1, 'sırası gelen oyuncunun hamlesi -> 200 (sürüm +1)', goodMove.status);
    const foreignReset = await act(C, { type: 'reset' });
    ok(foreignReset.status === 409, 'oyun bitmeden reset -> 409', foreignReset.status);

    // ---------- 7. Ödül ucu ----------
    section('7. Ödül ucu');
    const rw = await call('GET', `/api/room/reward?cafe=demo&masa=${table}&game=pisti&pid=${C}`);
    ok(rw.status === 200 || rw.status === 404, 'başka pid için ödül sorgusu geçerli yanıt', rw.status);
    ok(!rw.body?.reward?.code, 'başka/yabancı pid ödül kodu görmez', rw.body);
    const rwArr = await call('GET', `/api/room/reward?cafe=demo&masa=${table}&game=pisti&pid[]=${C}`);
    ok(rwArr.status === 400, 'ödül ucu pid dizi biçiminde -> 400', rwArr.status);

    // ---------- leave: sürümü artırır ----------
    section('8. leave ve temizlik');
    const vl = await ver();
    const lv = await act(B, { type: 'leave' });
    ok(lv.status === 200 && (await ver()) === vl + 1, 'leave -> sürüm +1', lv.status);
    await act(A, { type: 'leave' });
    const wipe = await act(A, { type: 'wipe' });
    ok([200, 409].includes(wipe.status), 'temizlik (wipe) isteği işlendi', wipe.status);
  }

  // ---------- 9. Sohbet şikâyeti ----------
  section('9. Sohbet şikâyeti: yalnızca etkileşimli hedef');
  const tokens = [];
  const join = async (tbl) => {
    const p = pid('h');
    const r = await call('POST', '/api/chat', { body: { type: 'join', cafe: 'demo', masa: tbl, pid: p, nick: `T${rnd().slice(0, 5)}` } });
    if (r.body?.token) tokens.push(r.body.token);
    return r.body?.token;
  };
  const tA = await join('masa-7'), tB = await join('masa-8'), tC = await join('masa-10'), tD = await join('masa-11');
  if (!tA || !tB || !tC || !tD) {
    ok(false, 'sohbet oturumları açıldı', { tA: !!tA, tB: !!tB, tC: !!tC, tD: !!tD });
  } else {
    const chat = (token, type, extra = {}) => call('POST', '/api/chat', { body: { token, type, ...extra } });
    const listOf = async (token) => (await call('GET', `/api/chat?token=${token}&room=&after=0`)).body;
    const idOf = async (viewer, tbl) => (await listOf(viewer)).tables.find((t) => t.tbl === tbl)?.id;
    const idB = await idOf(tA, 'masa-8');
    ok(!!idB, "hedef oturumun id'si listede bulundu");
    const stranger = await chat(tA, 'report', { target: idB, reason: 'etkilesimsiz sikayet' });
    ok(stranger.status === 403, 'hiç etkileşimi olmayan hedef şikâyet -> 403', stranger);
    // C, B'ye istek atar; B kabul eder -> B-C odası.
    const idBfromC = await idOf(tC, 'masa-8');
    const reqCB = await chat(tC, 'request', { target: idBfromC });
    const reqId = reqCB.body?.request?.id;
    const accepted = reqId ? await chat(tB, 'accept', { id: reqId }) : null;
    const roomBC = accepted?.body?.roomId;
    ok(!!roomBC, 'B-C odası kuruldu', reqCB.body);
    // A, B'ye istek atar (etkileşim doğar) ve B-C odasının id'sini şikâyete eklemeye çalışır.
    const reqAB = await chat(tA, 'request', { target: idB });
    ok(reqAB.status === 200 && !!reqAB.body?.request?.id, 'A -> B istek gönderildi', reqAB);
    const foreignRoom = await chat(tA, 'report', { target: idB, room: roomBC, reason: 'baskasinin odasi' });
    ok(foreignRoom.status === 403, 'başkasının oda id\'siyle şikâyet -> 403', foreignRoom);
    const legit2 = await chat(tA, 'report', { target: idB, reason: 'gercek bir sikayet' });
    ok(legit2.status === 200 && legit2.body?.ok, 'etkileşimli hedef (istek var) şikâyet -> 200', legit2);
    const idDfromC = await idOf(tC, 'masa-11');
    const noInter = await chat(tC, 'report', { target: idDfromC, reason: 'etkilesimsiz sikayet' });
    ok(noInter.status === 403, 'C -> D etkileşimsiz şikâyet -> 403', noInter);
    const roomOk = await chat(tC, 'report', { target: idBfromC, room: roomBC, reason: 'ortak oda sikayeti' });
    ok(roomOk.status === 200, 'ortak oda üzerinden şikâyet -> 200', roomOk);
  }
  for (const t of tokens) await call('POST', '/api/chat', { body: { type: 'leave', token: t } });

  // ---------- 10. Giriş kilidi: (hesap+IP) ve IP sayaçları, artan gecikme ----------
  // Yerel geliştirme modunda IP, X-Forwarded-For'un ilk girdisinden okunur (clientIp); testler IP ayrımını böyle simüle eder.
  section('10. Panel girişi: artan gecikme, IP ayrımı, global kilit yok');
  const rndIp = (pre) => `${pre}.${1 + Math.floor(Math.random() * 250)}`;
  const ipA = rndIp('203.0.113');
  const ipB = rndIp('198.51.100');
  const OWNER = { email: 'elif@hadikafe.com', password: 'demo1234' };
  const tryLogin = (ip, email, password) => call('POST', '/api/panel/login', { body: { email, password }, headers: withOrigin({ 'X-Forwarded-For': ip }) });
  const lockMail = `kilit-${RUN}@example.com`;
  const f = [];
  for (let i = 0; i < 4; i++) f.push(await tryLogin(ipA, lockMail, 'yanlis-sifre'));
  ok(f.slice(0, 3).every((r) => r.status === 401), '(hesap+IP) ilk 3 hatalı deneme -> 401', f.map((r) => r.status));
  const ra1 = Number(f[3].res.headers.get('retry-after'));
  ok(f[3].status === 429 && ra1 >= 1 && ra1 <= 30, '4. deneme -> 429 + Retry-After <= 30 sn (ilk gecikme)', { st: f[3].status, ra1 });
  // Saldırgan IP (A) sahibin hesabında kilitlenir; sahibin kendi IP'si (B) etkilenmez.
  const o1 = await tryLogin(ipA, OWNER.email, 'yanlis');
  const o2 = await tryLogin(ipA, OWNER.email, 'yanlis');
  const o3 = await tryLogin(ipA, OWNER.email, 'yanlis');
  const o4 = await tryLogin(ipA, OWNER.email, 'yanlis');
  ok([o1, o2, o3].every((r) => r.status === 401) && o4.status === 429, 'saldırgan IP (A) sahibin hesabında 3 hata sonrası 429', [o1.status, o2.status, o3.status, o4.status]);
  const ownerFromA = await tryLogin(ipA, OWNER.email, OWNER.password);
  ok(ownerFromA.status === 429, 'kilitli (hesap+IP) çiftinde doğru şifre de 429', ownerFromA.status);
  const ownerFromB = await tryLogin(ipB, OWNER.email, OWNER.password);
  ok(ownerFromB.status === 200 && ownerFromB.res.headers.getSetCookie().some((c) => c.startsWith('oh-panel=')), 'aynı hesap, başka IP (B): doğru şifre girer (global/hesap-toplam kilit yok)', ownerFromB.status);
  const otherAcctFromA = await tryLogin(ipA, OWNER.email.replace('elif', 'baska'), 'x');
  ok(otherAcctFromA.status === 401, 'aynı IP, başka hesap: ayrı çift sayacı (401, kilitli değil)', otherAcctFromA.status);
  // Başarılı giriş çift sayacını sıfırlar: 2 hata + başarı + 3 hata hâlâ 401 (sıfırlanmasaydı 2. hatada 429 olurdu).
  const ipC = rndIp('192.0.2');
  await tryLogin(ipC, OWNER.email, 'yanlis'); await tryLogin(ipC, OWNER.email, 'yanlis');
  const okC = await tryLogin(ipC, OWNER.email, OWNER.password);
  const after = [];
  for (let i = 0; i < 3; i++) after.push((await tryLogin(ipC, OWNER.email, 'yanlis')).status);
  ok(okC.status === 200 && after.every((x) => x === 401), 'başarılı giriş (hesap+IP) sayacını sıfırlar', { okC: okC.status, after });
  // Paralel patlama: kapı sayma+ekleme tek ifade olduğundan 12 eşzamanlı denemeden yalnızca birkaçı geçer.
  const ipD = rndIp('192.0.2');
  const burst = await Promise.all(Array.from({ length: 12 }, () => tryLogin(ipD, lockMail, 'yanlis')));
  const passed = burst.filter((r) => r.status === 401).length;
  ok(passed >= 1 && passed <= 4 && burst.every((r) => r.status === 401 || r.status === 429), '12 paralel hatalı deneme: kapıdan en çok 4 geçer (TOCTOU yarışı daraltıldı)', { passed, codes: burst.map((r) => r.status) });
  // IP başına toplam: farklı hesaplarla tek IP'den 10 hatadan sonra IP kilidi.
  const ipE = rndIp('192.0.2');
  const ipRes = [];
  for (let i = 0; i < 12; i++) ipRes.push((await tryLogin(ipE, `kimse${i}-${RUN}@example.com`, 'x')).status);
  ok(ipRes.slice(0, 10).every((x) => x === 401) && ipRes.slice(10).every((x) => x === 429), 'IP başına: farklı hesaplarla 10 hatadan sonra IP 429', ipRes);
  // Gecikme katlanır: ilk bekleme (30 sn) dolduktan sonra tek deneme serbest, ardından bekleme > 30 sn.
  console.log('  (artan gecikme testi: 31 sn bekleniyor)');
  await sleep(31_000);
  const again = await tryLogin(ipA, lockMail, 'yanlis');
  const blockedAgain = await tryLogin(ipA, lockMail, 'yanlis');
  const ra2 = Number(blockedAgain.res.headers.get('retry-after'));
  ok(again.status === 401 && blockedAgain.status === 429 && ra2 > 30, 'gecikme katlandı: bekleme sonrası 1 deneme, sonra Retry-After > 30 sn', { again: again.status, st: blockedAgain.status, ra2 });

  // ---------- 11. Oturum çerezi: eski biçim, parola sürümü, çıkış ----------
  section('11. Oturum çerezi biçimi ve iptali');
  const SECRET = 'dev-only-session-secret-not-for-production'; // yerel dev anahtarı (src/lib/venues.js)
  const goodCookie = ownerFromB.res.headers.getSetCookie().map((c) => c.split(';')[0]).find((c) => c.startsWith('oh-panel='));
  const venueCall = (c) => call('POST', '/api/panel/venue', { body: {}, headers: withOrigin(c ? { Cookie: c } : {}) });
  ok((await venueCall(goodCookie)).status === 200, 'yeni biçimli çerez kabul edilir', null);
  const exp = Date.now() + 3600_000;
  const oldPayload = `1.${exp}`;
  const oldCookie = `oh-panel=${oldPayload}.${createHmac('sha256', SECRET).update(oldPayload).digest('hex')}`;
  const oldRes = await venueCall(oldCookie);
  ok(oldRes.status === 401, 'eski (3 parçalı, geçerli imzalı) çerez -> 401 (yeniden giriş), çökme yok', oldRes.status);
  const staleCookie = `oh-panel=${signToken(SECRET, 'panel', 1, exp, passwordVersion(SECRET, 'eski-parola-karmasi'))}`;
  ok((await venueCall(staleCookie)).status === 401, 'parola sürümü uyuşmayan (şifre değişmiş gibi) çerez -> 401', null);
  ok((await venueCall(goodCookie.slice(0, -2) + '00')).status === 401, 'imzası bozuk çerez -> 401', null);
  ok((await venueCall(null)).status === 401, 'çerezsiz -> 401', null);
  const out = await call('POST', '/api/panel/logout', { headers: withOrigin({ Cookie: goodCookie }) });
  const cleared = (out.res.headers.getSetCookie?.() ?? []).some((c) => /^oh-panel=;/.test(c));
  ok(out.status < 400 && cleared, 'çıkış çerezi temizler', { st: out.status });

  // ---------- 12. Masa katılma sayacı: başarısız denemeler masayı kilitlemez ----------
  section('12. join hız sayacı yalnız başarılı joinde artar');
  const jIp = rndIp('203.0.113');
  const jt = 'masa-10';
  const jpost = (p, action, ip = jIp, tbl = jt) => call('POST', '/api/room', { body: { cafe: 'demo', masa: tbl, game: 'satranc', pid: p, action }, headers: { 'X-Forwarded-For': ip } });
  const j1 = pid('j'), j2 = pid('j');
  const fill1 = await jpost(j1, { type: 'join', name: 'J1' });
  const fill2 = await jpost(j2, { type: 'join', name: 'J2' });
  const jr0 = (await call('GET', `/api/room?cafe=demo&masa=${jt}&game=satranc&pid=${j1}`)).body;
  if (fill1.status !== 200 || fill2.status !== 200 || jr0?.seats?.length !== 2) {
    ok(false, 'join testi için masa doldurulamadı (masa boş değil olabilir)', { a: fill1.status, b: fill2.status, seats: jr0?.seats?.length });
  } else {
    const fails = [];
    for (let i = 0; i < 50; i++) fails.push((await jpost(pid('j'), { type: 'join', name: 'X' })).status);
    ok(fails.every((x) => x === 409), '50 başarısız (masa dolu) join -> hepsi 409, hiçbiri 429 değil', [...new Set(fails)]);
    await jpost(j2, { type: 'leave' });
    const legit = await jpost(pid('j'), { type: 'join', name: 'Legit' });
    ok(legit.status === 200, 'başarısız denemelerden sonra meşru oyuncu masaya girer (masa kilitlenmedi)', legit.status);
    // Koruma zayıflamadı: başarılı joinler (katıl + ayrıl döngüsü, farklı IP'lerle) masa sınırına dayanınca 429.
    let blocked = 0, okJ = 0;
    const jt2 = 'masa-11';
    for (let i = 0; i < 46; i++) {
      const p = pid('k');
      const r = await jpost(p, { type: 'join', name: 'S' }, `198.51.100.${1 + Math.floor(Math.random() * 250)}`, jt2);
      if (r.status === 429) blocked++; else if (r.status === 200) okJ++;
      await jpost(p, { type: 'leave' }, '198.51.100.251', jt2);
    }
    ok(okJ >= 30 && blocked >= 1, 'masa başına 40 başarılı join sınırı sürüyor (farklı IP’lerle bile 429)', { okJ, blocked });
  }

  // ---------- 13. 2048: hamle aralığı ----------
  section('13. 2048 hızlı hamle reddi');
  const gt = 'masa-12';
  const gIp = rndIp('203.0.113');
  const g1 = pid('g'), g2 = pid('g');
  const gpost = (p, action) => call('POST', '/api/room', { body: { cafe: 'demo', masa: gt, game: 'g2048', pid: p, action }, headers: { 'X-Forwarded-For': gIp } });
  const gj1 = await gpost(g1, { type: 'join', name: 'G1' });
  const gj2 = await gpost(g2, { type: 'join', name: 'G2' });
  const gst = await gpost(g1, { type: 'start' });
  if (gj1.status !== 200 || gj2.status !== 200 || gst.status !== 200 || gst.body?.phase !== 'play') {
    ok(false, '2048 oyunu başlatılamadı', { j1: gj1.status, j2: gj2.status, st: gst.status, ph: gst.body?.phase, e: gst.body?.error });
  } else {
    const mv = (p, dir) => gpost(p, { type: 'gxmove', pl: { dir } });
    // Yavaş hamle: 200 ms aralıkla kabul edilir; kaymayan yönde 'kayma yok' hatası olabilir ama 'Çok hızlı' olmaz.
    let accepted = 0, tries = 0, tooFastSlow = 0;
    for (const d of ['l', 'u', 'r', 'd', 'l', 'u', 'r', 'd']) {
      await sleep(200);
      const r = await mv(g1, d); tries++;
      if (r.status === 200) accepted++;
      if (r.body?.error === 'Çok hızlı.') tooFastSlow++;
      if (accepted >= 2) break;
    }
    ok(tooFastSlow === 0, "yavaş (200 ms aralıklı) hamleler hiç 'Çok hızlı' ile reddedilmez", tooFastSlow);
    ok(accepted >= 2, 'yavaş hamleler kabul edilir (200)', { accepted, tries });
    // Hızlı: 8 eşzamanlı hamle; en çok biri kabul edilir, diğerleri 'Çok hızlı.' ile reddedilir.
    await sleep(200);
    const burst2 = await Promise.all(['l', 'r', 'u', 'd', 'l', 'r', 'u', 'd'].map((d) => mv(g2, d)));
    const acc = burst2.filter((r) => r.status === 200).length;
    const fast = burst2.filter((r) => r.body?.error === 'Çok hızlı.').length;
    ok(acc <= 1 && fast >= 1, 'hızlı ikinci ve sonraki hamleler reddedilir: en çok 1 kabul, diğerleri Çok hızlı.', { acc, fast, errs: burst2.map((r) => r.body?.error ?? 'ok') });
    const viewG = (await call('GET', `/api/room?cafe=demo&masa=${gt}&game=g2048&pid=${g2}`)).body;
    ok(!JSON.stringify(viewG).includes('"t":'), 'hamle zaman damgası (t) istemciye sızmaz', null);
    await gpost(g2, { type: 'leave' });
    await gpost(g1, { type: 'leave' });
  }

  // ---------- 14. Mekâna özel görünüm: kapak, başlık, tema ----------
  section('14. Kapak görseli, başlık ve hazır tema (panel -> oyuncu sayfası)');
  const lg = await call('POST', '/api/panel/login', { body: { email: 'elif@hadikafe.com', password: 'demo1234' }, headers: withOrigin() });
  const ck = (lg.res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).find((c) => c.startsWith('oh-panel='));
  ok(!!ck, 'görünüm testi için panel girişi', lg.status);
  if (ck) {
    const PH = withOrigin({ Cookie: ck });
    const save = (patch) => call('POST', '/api/panel/venue', { body: patch, headers: PH });
    const before = (await save({})).body?.venue;
    const orig = { color: before.color, accent: before.accent, themeId: before.themeId ?? '', coverUrl: before.coverUrl ?? '', coverTitle: before.coverTitle ?? '' };
    try {
      const GOOD = 'https://example.com/kapak/test-gorsel.jpg?v=1';
      let r = await save({ coverUrl: GOOD, coverTitle: 'Turnuva & Gece', themeId: 'okyanus', color: '#0369a1', accent: '#67e8f9' });
      ok(r.status === 200 && r.body?.venue?.coverUrl === GOOD, 'geçerli https kapak adresi kabul edilir', r.body?.venue?.coverUrl);
      ok(r.body?.venue?.themeId === 'okyanus' && r.body?.venue?.color === '#0369a1', 'bilinen theme_id ve renkler kaydedilir', r.body?.venue);
      const bads = ['javascript:alert(1)', 'data:image/svg+xml;base64,PHN2Zz4=', 'http://example.com/a.jpg', 'https://example.com/a b.jpg', 'https://example.com/a"onerror="x', "https://example.com/a'x", 'https://example.com/a(1).jpg', 'https://' + 'a'.repeat(200) + '.com/x.jpg', '//example.com/a.jpg'];
      for (const u of bads) {
        const b = await save({ coverUrl: u });
        ok(b.status === 200 && b.body?.venue?.coverUrl === GOOD, `reddedilen kapak adresi (önceki değer korunur): ${u.slice(0, 40)}`, b.body?.venue?.coverUrl);
      }
      const nonStr = await save({ coverUrl: ['https://example.com/x.jpg'], coverTitle: { a: 1 } });
      ok(nonStr.status === 200 && nonStr.body?.venue?.coverUrl === GOOD && nonStr.body?.venue?.coverTitle === 'Turnuva & Gece', 'dizi/nesne kapak alanları yok sayılır', nonStr.body?.venue);
      const long = await save({ coverTitle: 'ABCDEFGHIJ'.repeat(10) });
      ok(long.body?.venue?.coverTitle?.length === 60, 'başlık 60 karaktere kısaltılır', long.body?.venue?.coverTitle?.length);
      const lt = await save({ coverTitle: '<script>alert(1)</script>Kapak' });
      ok(!/[<>]/.test(lt.body?.venue?.coverTitle ?? '<'), 'başlıktaki < > temizlenir', lt.body?.venue?.coverTitle);
      const badTheme = await save({ themeId: 'kotu-tema' });
      ok(badTheme.body?.venue?.themeId === 'okyanus', 'bilinmeyen theme_id reddedilir (önceki değer korunur)', badTheme.body?.venue?.themeId);
      const badTheme2 = await save({ themeId: "x'; DROP TABLE venues;--" });
      ok(badTheme2.body?.venue?.themeId === 'okyanus', 'enjeksiyon denemesi theme_id reddedilir', badTheme2.body?.venue?.themeId);
      const badColor = await save({ color: 'red;background:url(x)' });
      ok(badColor.body?.venue?.color === '#0369a1', 'geçersiz HEX renk reddedilir', badColor.body?.venue?.color);

      await save({ coverTitle: 'Turnuva & Gece' });
      const page = await fetch(`${BASE}/demo/masa-1/oyunlar`, { cache: 'no-store' });
      const html = await page.text();
      ok(page.status === 200 && html.includes(GOOD), 'oyuncu oyunlar sayfasında kapak adresi görünür', page.status);
      ok(html.includes('Turnuva &amp; Gece'), 'başlık kaçışlı görünür (&amp;)');
      ok(!html.includes('<script>alert(1)'), 'sayfada ham <script> enjeksiyonu yok');
      ok(/referrerpolicy="no-referrer"/i.test(html) && html.includes('loading="lazy"'), 'kapak görseli no-referrer + lazy ile yazılır');
      ok(/--brand:\s*#0369a1/.test(html), 'oyuncu sayfası yeni ana rengi kullanır (--brand)');
      ok(!html.includes('elif@hadikafe.com') && !/[a-f0-9]{16,}:[a-f0-9]{64}/.test(html), 'oyunlar sayfasında e-posta/parola karması yok');
      const room = await call('GET', '/api/room?cafe=demo&masa=masa-1&game=satranc');
      ok(!JSON.stringify(room.body ?? {}).includes('elif@hadikafe.com'), 'oyuncu oda yanıtında e-posta yok');

      r = await save({ coverUrl: '', coverTitle: '', themeId: '' });
      ok(r.body?.venue?.coverUrl === null && r.body?.venue?.coverTitle === null && r.body?.venue?.themeId === null, 'boş değerler kapak/başlık/tema alanlarını temizler', r.body?.venue);
      const html2 = await (await fetch(`${BASE}/demo/masa-1/oyunlar`, { cache: 'no-store' })).text();
      ok(!html2.includes('felt-cover'), 'kapak yokken band çizilmez (mevcut görünüm korunur)');
    } finally {
      await save({ ...orig });
      const after = (await save({})).body?.venue;
      ok(after?.color === orig.color && (after?.coverUrl ?? '') === orig.coverUrl && (after?.coverTitle ?? '') === orig.coverTitle && (after?.themeId ?? '') === orig.themeId, 'demo mekânın ayarları eski haline döndürüldü', after);
    }
  }

  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.log(`FAIL  beklenmeyen hata: ${e?.stack || e}`); process.exit(1); });
