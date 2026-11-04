// Saf modül testleri (sunucu/DB gerekmez): oturum belirteci (src/lib/session-token.js) ve istemci IP seçimi (src/lib/client-ip.js).
// Kullanım: node scripts/session-token-test.mjs
import { createHmac } from 'node:crypto';
import { signToken, parseToken, passwordVersion, versionMatches } from '../src/lib/session-token.js';
import { pickClientIp } from '../src/lib/client-ip.js';

let pass = 0, fail = 0;
const ok = (c, n, x) => { if (c) { pass++; console.log(`PASS  ${n}`); } else { fail++; console.log(`FAIL  ${n}${x !== undefined ? ` -- ${JSON.stringify(x)}` : ''}`); } };

const KEY = 'k'.repeat(40);
const HASH1 = `${'a'.repeat(32)}:${'1'.repeat(64)}`;
const HASH2 = `${'a'.repeat(32)}:${'2'.repeat(64)}`;
const now = Date.now();

console.log('== Oturum belirteci');
const v1 = passwordVersion(KEY, HASH1);
ok(/^[a-f0-9]{16}$/.test(v1), 'sürüm 16 hex', v1);
ok(passwordVersion(KEY, HASH1) === v1, 'sürüm deterministik');
ok(passwordVersion(KEY, HASH2) !== v1, 'farklı parola karması -> farklı sürüm');
const tok = signToken(KEY, 'panel', 7, now + 60_000, v1);
const p = parseToken(KEY, 'panel', tok, now);
ok(p?.id === 7 && p.version === v1, 'geçerli belirteç çözülür', p);
ok(versionMatches(p.version, KEY, HASH1), 'aynı parola karmasıyla sürüm eşleşir');
ok(!versionMatches(p.version, KEY, HASH2), 'PAROLA DEĞİŞTİ (karma değişti): eski belirteç geçersiz');
ok(parseToken(KEY, 'panel', tok, now + 120_000) === null, 'süresi dolmuş belirteç reddedilir');
ok(parseToken('z'.repeat(40), 'panel', tok, now) === null, 'yanlış anahtar reddedilir');
ok(parseToken(KEY, 'admin', tok, now) === null, 'başka alan adı (panel belirteci admin olarak) reddedilir');
ok(parseToken(KEY, 'panel', tok.replace(/^7\./, '8.'), now) === null, 'id değiştirilmiş belirteç reddedilir');
const parts = tok.split('.');
const swapVer = [parts[0], parts[1], passwordVersion(KEY, HASH2), parts[3]].join('.');
ok(parseToken(KEY, 'panel', swapVer, now) === null, 'sürüm değiştirilmiş (imza aynı) belirteç reddedilir');
// Eski biçim: "<id>.<bitiş>.<HMAC>" (3 parça) güvenle reddedilir, çökme yok.
const oldPayload = `7.${now + 60_000}`;
const oldTok = `${oldPayload}.${createHmac('sha256', KEY).update(oldPayload).digest('hex')}`;
ok(parseToken(KEY, 'panel', oldTok, now) === null, 'eski 3 parçalı çerez biçimi reddedilir');
for (const bad of [undefined, null, '', 'x', 123, {}, [], 'a.b.c.d', `${'9'.repeat(11)}.1.2.3`]) {
  let r; try { r = parseToken(KEY, 'panel', bad, now); } catch (e) { r = 'THROW'; }
  ok(r === null, `bozuk girdi çökmeden reddedilir: ${JSON.stringify(bad)}`, r);
}

console.log('\n== İstemci IP seçimi');
const H = (o) => (n) => o[n] ?? null;
const forged = { 'x-forwarded-for': '6.6.6.6, 1.2.3.4, 9.9.9.9' };
ok(pickClientIp(H({ 'x-real-ip': '5.5.5.5', 'x-forwarded-for': '6.6.6.6' }), { vercel: true, prod: true }) === '5.5.5.5', 'Vercel: x-real-ip önce');
ok(pickClientIp(H({ 'x-vercel-forwarded-for': '4.4.4.4', 'x-forwarded-for': '6.6.6.6' }), { vercel: true, prod: true }) === '4.4.4.4', 'Vercel: x-vercel-forwarded-for ikinci');
ok(pickClientIp(H(forged), { vercel: true, prod: true }) === '6.6.6.6', 'Vercel: yalnız XFF -> ilk girdi');
ok(pickClientIp(H(forged), { vercel: false, prod: true }) === '9.9.9.9', 'Vercel dışı üretim: sahte ilk XFF girdisine güvenilmez, SON girdi');
ok(pickClientIp(H({ ...forged, 'x-real-ip': '5.5.5.5' }), { vercel: false, prod: true }) === '5.5.5.5', 'Vercel dışı üretim: x-real-ip tercih edilir');
ok(pickClientIp(H({}), { vercel: false, prod: true }) === 'unknown', 'başlık yoksa unknown');
ok(pickClientIp(H(forged), { vercel: false, prod: false }) === '6.6.6.6', 'geliştirme: ilk XFF girdisi (test için IP simülasyonu)');
ok(pickClientIp(H({ 'x-forwarded-for': 'x'.repeat(300) }), { vercel: true, prod: true }).length === 64, 'IP 64 karaktere kırpılır');

console.log(`\n${pass} PASS, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
