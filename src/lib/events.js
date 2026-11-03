// Mekâna özel etkinlikler ve "Mekân Sınavı" (events tablosu). Mekân sahibi panelden etkinlik oluşturur, sınav sorularını
// yazar ve etkinliği elle Açar / Kapatır / Bitirir. Oyuncular yalnızca durumu 'acik' olan etkinliği görür ve girer;
// kapı sunucuda uygulanır (api/room/route.js -> gateEvent). Şema src/lib/db.js'te.
import { get, all, run } from './db';

// sinav: Mekân Sınavı (soru-cevap). tombala / skor (masa turnuvası) / cekilis: tüm mekânın oynadığı toplu oyunlar (eventgames.js).
// turnuva ve diger: eski kategori etiketleri (soru ekleyip sınav gibi de kullanılabilir).
export const MASS_KINDS = ['tombala', 'skor', 'cekilis'];
export const KINDS = ['sinav', 'tombala', 'skor', 'cekilis', 'turnuva', 'diger'];
export const STATUSES = ['kapali', 'acik', 'bitti'];
export const QUIZ_MIN = 5;
export const QUIZ_MAX = 30;
export const MAX_EVENTS = 40; // mekân başına en çok etkinlik
export const QUIZ_CAT = 'Mekân Sınavı';

const COLS = 'id, biz_id, title, body, kind, status, quiz, cfg, created_at, updated_at';
const clean = (s, max) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, max);

// Soru listesini doğrular ve temizler. Boş liste geçerlidir (sınavsız etkinlik); 1-4 soru ya da hatalı soru reddedilir.
// Her soru: { q, a: [4 şık] }, ilk şık doğru cevap.
export function sanitizeQuiz(raw) {
  if (raw == null || (Array.isArray(raw) && raw.length === 0)) return { quiz: [] };
  if (!Array.isArray(raw)) return { error: 'Sorular geçersiz.' };
  if (raw.length < QUIZ_MIN) return { error: `Sınav için en az ${QUIZ_MIN} soru gerekir.` };
  if (raw.length > QUIZ_MAX) return { error: `Sınav en çok ${QUIZ_MAX} soru içerebilir.` };
  const quiz = [];
  for (let i = 0; i < raw.length; i++) {
    const it = raw[i];
    const q = clean(it?.q, 140);
    const a = Array.isArray(it?.a) ? it.a.slice(0, 4).map((x) => clean(x, 60)) : [];
    if (!q || a.length !== 4 || a.some((x) => !x)) return { error: `${i + 1}. soruda soru metni ve 4 şık dolu olmalı.` };
    if (new Set(a.map((x) => x.toLocaleLowerCase('tr'))).size !== 4) return { error: `${i + 1}. sorunun şıkları birbirinden farklı olmalı.` };
    quiz.push({ q, a });
  }
  return { quiz };
}

function parseQuiz(text) {
  try {
    const r = sanitizeQuiz(JSON.parse(text || '[]'));
    return r.quiz ?? [];
  } catch {
    return [];
  }
}

// cfg: türe özel ayar (şimdilik yalnızca masa turnuvasının oyun adı).
function parseCfg(text) {
  try {
    return { game: clean(JSON.parse(text || '{}')?.game, 40) };
  } catch {
    return { game: '' };
  }
}

// withQuiz: sorular (ve doğru cevap) yalnızca panelde ve sunucudaki oyun başlangıcında gerekir; oyuncu sayfasına gitmez.
function shape(r, withQuiz) {
  const quiz = parseQuiz(r.quiz);
  return {
    id: r.id, bizId: r.biz_id, title: r.title, body: r.body, kind: r.kind, status: r.status,
    cfg: parseCfg(r.cfg), questions: quiz.length, createdAt: Number(r.created_at), updatedAt: Number(r.updated_at),
    ...(withQuiz && { quiz }),
  };
}

// Panel listesi: bu mekânın tüm etkinlikleri, soruları dahil.
export async function listEvents(bizId) {
  return (await all(`SELECT ${COLS} FROM events WHERE biz_id = ? ORDER BY id DESC`, bizId)).map((r) => shape(r, true));
}

// Oyuncu tarafı: yalnızca açık etkinlikler, soru içeriği olmadan.
export async function listOpenEvents(bizId) {
  return (await all(`SELECT ${COLS} FROM events WHERE biz_id = ? AND status = 'acik' ORDER BY updated_at DESC LIMIT 5`, bizId)).map((r) => shape(r, false));
}

export async function getEvent(id, withQuiz = false) {
  if (!Number.isInteger(id) || id < 1 || id > 2_000_000_000) return null;
  const r = await get(`SELECT ${COLS} FROM events WHERE id = ?`, id);
  return r ? shape(r, withQuiz) : null;
}

// Oyun kapısı: etkinlik bu mekâna ait ve açık olmalı. Dönüş { ev } ya da { status, error }.
//  - Varsayılan (Mekân Sınavı odası, api/room): sınavlı bir etkinlik olmalı; toplu oyun türleri buradan girilmez.
//  - mass: toplu oyun (api/event): tür tombala/skor/cekilis olmalı.
//  - leave: kapanmış etkinlikte yalnızca masadan ayrılmaya izin vermek için durum denetimi atlanır.
//  - results: yalnızca okuma; BİTMİŞ etkinliğin sonuç ekranı (kazananlar) görülebilsin diye 'bitti' de geçer.
//    Henüz açılmamış (kapalı) etkinlik her durumda reddedilir; yazma işlemlerinde results hiç verilmez.
export async function gateEvent(bizId, rawId, { leave = false, mass = false, results = false } = {}) {
  const s = String(rawId ?? '');
  if (!/^\d{1,10}$/.test(s)) return { status: 400, error: 'Geçersiz etkinlik.' };
  const ev = await getEvent(Number(s), true);
  if (!ev || ev.bizId !== bizId) return { status: 404, error: 'Etkinlik bulunamadı.' };
  if (mass ? !MASS_KINDS.includes(ev.kind) : (MASS_KINDS.includes(ev.kind) || !ev.quiz.length)) return { status: 404, error: 'Bu etkinlikte oyun yok.' };
  if (!leave) {
    if (ev.status === 'kapali') return { status: 403, error: 'Bu etkinlik henüz açılmadı.' };
    if (ev.status === 'bitti' && !results) return { status: 403, error: 'Bu etkinlik sona erdi.' };
    if (ev.status !== 'acik' && ev.status !== 'bitti') return { status: 403, error: 'Etkinlik şu an açık değil.' };
  }
  return { ev };
}

// Girdiyi temizler: { title, body, kind, quiz } -> { data } ya da { error }.
function input(raw) {
  const title = clean(raw?.title, 60);
  if (!title) return { error: 'Başlık gerekli.' };
  const kind = KINDS.includes(raw?.kind) ? raw.kind : 'diger';
  // Toplu oyun türlerinde soru tutulmaz.
  const sq = MASS_KINDS.includes(kind) ? { quiz: [] } : sanitizeQuiz(raw?.quiz);
  if (sq.error) return { error: sq.error };
  if (kind === 'sinav' && !sq.quiz.length) return { error: `Sınav türü için en az ${QUIZ_MIN} soru ekleyin.` };
  const cfg = JSON.stringify({ game: kind === 'skor' ? clean(raw?.cfg?.game, 40) || 'Masa turnuvası' : '' });
  return { data: { title, body: clean(raw?.body, 200), kind, quiz: JSON.stringify(sq.quiz), cfg } };
}

export async function createEvent(bizId, raw) {
  const r = input(raw);
  if (r.error) return r;
  const n = Number((await get('SELECT count(*)::int AS n FROM events WHERE biz_id = ?', bizId))?.n) || 0;
  if (n >= MAX_EVENTS) return { error: `En çok ${MAX_EVENTS} etkinlik oluşturabilirsiniz; eskilerini silin.` };
  const now = Date.now();
  const row = await get(
    `INSERT INTO events (biz_id, title, body, kind, status, quiz, cfg, created_at, updated_at) VALUES (?, ?, ?, ?, 'kapali', ?, ?, ?, ?) RETURNING ${COLS}`,
    bizId, r.data.title, r.data.body, r.data.kind, r.data.quiz, r.data.cfg, now, now,
  );
  return { event: shape(row, true) };
}

// Yalnızca kapalı etkinlik düzenlenir (açıkken sorular değişmesin). Her sorgu biz_id ile sınırlıdır.
export async function updateEvent(bizId, id, raw) {
  const cur = await getEvent(id);
  if (!cur || cur.bizId !== bizId) return { error: 'Etkinlik bulunamadı.', status: 404 };
  if (cur.status !== 'kapali') return { error: 'Önce etkinliği kapatın; açık ya da biten etkinlik düzenlenemez.', status: 409 };
  const r = input(raw);
  if (r.error) return r;
  const row = await get(
    `UPDATE events SET title = ?, body = ?, kind = ?, quiz = ?, cfg = ?, updated_at = ? WHERE id = ? AND biz_id = ? RETURNING ${COLS}`,
    r.data.title, r.data.body, r.data.kind, r.data.quiz, r.data.cfg, Date.now(), id, bizId,
  );
  return { event: shape(row, true) };
}

const NEXT = { acik: ['kapali', 'bitti'], kapali: ['acik', 'bitti'] };
const KEY = (id) => `bil@${id}`; // rooms.js roomKey ile aynı

// Aç / Kapat / Bitir. Bitmiş etkinlik yeniden açılmaz. Açarken eski sınav odaları silinir (temiz başlangıç).
export async function setStatus(bizId, id, status) {
  if (!STATUSES.includes(status)) return { error: 'Geçersiz durum.', status: 400 };
  const cur = await getEvent(id);
  if (!cur || cur.bizId !== bizId) return { error: 'Etkinlik bulunamadı.', status: 404 };
  if (cur.status === status) return { event: cur };
  if (!(NEXT[cur.status] || []).includes(status)) return { error: 'Bu durum değişikliği yapılamaz.', status: 409 };
  if (status === 'acik' && cur.kind === 'sinav' && !cur.questions) return { error: 'Soru yok; açılamaz.', status: 409 };
  // Toplu oyunun durumu (çekilen sayılar, puanlar) kapat/aç ile silinmez; sıfırlama panelden ayrıca yapılır.
  if (status === 'acik' && !MASS_KINDS.includes(cur.kind)) await run('DELETE FROM game_rooms WHERE biz_id = ? AND game = ?', bizId, KEY(id));
  await run('UPDATE events SET status = ?, updated_at = ? WHERE id = ? AND biz_id = ?', status, Date.now(), id, bizId);
  return { event: await getEvent(id, true) };
}

export async function deleteEvent(bizId, id) {
  const cur = await getEvent(id);
  if (!cur || cur.bizId !== bizId) return { error: 'Etkinlik bulunamadı.', status: 404 };
  if (cur.status === 'acik') return { error: 'Açık etkinlik silinemez; önce kapatın ya da bitirin.', status: 409 };
  await run('DELETE FROM game_rooms WHERE biz_id = ? AND game = ?', bizId, KEY(id));
  await run('DELETE FROM game_rooms WHERE biz_id = ? AND tbl = ? AND game = ?', bizId, 'etkinlik', `ev@${id}`);
  await run('DELETE FROM events WHERE id = ? AND biz_id = ?', id, bizId);
  return { ok: true };
}
