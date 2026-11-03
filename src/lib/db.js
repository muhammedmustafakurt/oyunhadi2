import { neon } from '@neondatabase/serverless';
import { randomBytes, scryptSync } from 'node:crypto';

// Neon (sunucusuz Postgres). Bağlantı adresi DATABASE_URL ortam değişkeninden gelir.
// DATABASE_URL yoksa (yerel tasarım/deneme aşaması) aynı SQL bellekteki PGlite'ta çalışır; sunucu kapanınca silinir.
// Çağrı yerleri `?` yer tutucusuyla yazılır; burada Postgres'in $1, $2 biçimine çevrilir.

const g = globalThis;

async function client() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const sql = (g.__neonSql ??= neon(url));
    return (text, params) => sql.query(text, params);
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL ayarlanmamış. Neon bağlantı adresini ortam değişkenlerine ekleyin.');
  }
  g.__pglite ??= import('@electric-sql/pglite').then(({ PGlite }) => new PGlite());
  const db = await g.__pglite;
  return async (text, params) => (await db.query(text, params)).rows;
}

const toPg = (text) => {
  let i = 0;
  return text.replace(/\?/g, () => `$${++i}`);
};

// Şimdilik oyun odaları, mekânlar ve oyun kayıtları veritabanında.
const SCHEMA = [
  // Mekân masalarındaki çok oyunculu oyun odaları: her (mekân, masa, oyun) için bir satır, durum JSON olarak tutulur.
  `CREATE TABLE IF NOT EXISTS game_rooms (
    id SERIAL PRIMARY KEY,
    biz_id INTEGER NOT NULL, -- mekân numarası
    tbl TEXT NOT NULL,
    game TEXT NOT NULL,
    state TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    updated_at BIGINT NOT NULL,
    UNIQUE (biz_id, tbl, game)
  )`,
  // Mekân kayıtları: panelin yönettiği ve oyuncu ekranının okuduğu mekân bilgisi. Sütunlar src/lib/venue-types.ts'teki
  // Venue tipiyle birebir; games virgülle ayrılmış liste, announcement ve reward (varsa) kendi sütunlarında.
  `CREATE TABLE IF NOT EXISTS venues (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT '',
    initials TEXT NOT NULL DEFAULT '',
    logo_url TEXT,
    color TEXT NOT NULL DEFAULT '#ff4f2e',
    accent TEXT NOT NULL DEFAULT '#ffc83d',
    ntables INTEGER NOT NULL DEFAULT 1,
    lat BIGINT, lng BIGINT, -- null: konum kilidi kapalı; derece × 1e6 tam sayı olarak tutulur (NUMERIC yerine basitlik)
    games TEXT NOT NULL DEFAULT '',
    welcome TEXT NOT NULL DEFAULT '',
    ann_title TEXT, ann_body TEXT,
    reward_game TEXT, reward_goal TEXT, reward_prize TEXT,
    email TEXT NOT NULL DEFAULT '',
    password TEXT NOT NULL DEFAULT '', -- scrypt karması: salt:hash
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  )`,
  // Başlanan her oyun bir kayıt: panelin istatistikleri (haftalık, saat, oyun bazlı) buradan hesaplanır.
  `CREATE TABLE IF NOT EXISTS play_logs (
    id SERIAL PRIMARY KEY,
    biz_id INTEGER NOT NULL,
    masa TEXT NOT NULL,
    game TEXT NOT NULL,
    players INTEGER NOT NULL DEFAULT 0,
    at BIGINT NOT NULL
  )`,

  // Başarısız panel giriş denemeleri (e-posta ve IP başına hız sınırı için).
  `CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL,
    at BIGINT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS login_attempts_key ON login_attempts (key, at)`,
  // Genel hız sınırı sayaçları (src/lib/ratelimit.js).
  `CREATE TABLE IF NOT EXISTS rate_hits (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL,
    at BIGINT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS rate_hits_key ON rate_hits (key, at)`,

  // ---- Masalar arası sohbet (chat) ----

  // İşletme sohbet ayarları: satır yoksa varsayılanlar (açık, açık mod kapalı, 24 saat saklama) geçerlidir.
  `CREATE TABLE IF NOT EXISTS chat_settings (
    biz_id INTEGER PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT true,
    open_mode BOOLEAN NOT NULL DEFAULT false,
    retention_hours INTEGER NOT NULL DEFAULT 24,
    updated_at BIGINT NOT NULL
  )`,
  // Ziyaretçi oturumu: cihaz (pid) + masa başına tek satır. token sunucuda üretilir, istemciye bir kez verilir.
  `CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    biz_id INTEGER NOT NULL,
    tbl TEXT NOT NULL,
    pid TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    nick TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active', -- active | paused | left | kicked
    seen_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS chat_sessions_pid ON chat_sessions (biz_id, tbl, pid)`,
  `CREATE INDEX IF NOT EXISTS chat_sessions_live ON chat_sessions (biz_id, status, seen_at)`,
  // Sohbet isteği: bir oturumdan diğerine. Aynı çift arasında tek bekleyen istek olabilir.
  `CREATE TABLE IF NOT EXISTS chat_requests (
    id SERIAL PRIMARY KEY,
    biz_id INTEGER NOT NULL,
    from_id INTEGER NOT NULL,
    to_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | rejected | cancelled
    created_at BIGINT NOT NULL,
    decided_at BIGINT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS chat_requests_pending ON chat_requests (from_id, to_id) WHERE status = 'pending'`,
  `CREATE INDEX IF NOT EXISTS chat_requests_to ON chat_requests (to_id, status)`,
  `CREATE INDEX IF NOT EXISTS chat_requests_from ON chat_requests (from_id, status, created_at)`,
  // İki oturum arasındaki özel oda. a_id < b_id yazılır; aynı çift için tek aktif oda.
  `CREATE TABLE IF NOT EXISTS chat_rooms (
    id SERIAL PRIMARY KEY,
    biz_id INTEGER NOT NULL,
    a_id INTEGER NOT NULL,
    b_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active | closed
    created_at BIGINT NOT NULL,
    closed_at BIGINT,
    last_at BIGINT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS chat_rooms_pair ON chat_rooms (a_id, b_id) WHERE status = 'active'`,
  `CREATE INDEX IF NOT EXISTS chat_rooms_biz ON chat_rooms (biz_id, status)`,
  // Mesajlar: yalnızca odanın iki katılımcısı görebilir (yetki API katmanında doğrulanır).
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL,
    from_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    at BIGINT NOT NULL,
    seen_at BIGINT
  )`,
  `CREATE INDEX IF NOT EXISTS chat_messages_room ON chat_messages (room_id, id)`,
  `CREATE INDEX IF NOT EXISTS chat_messages_from ON chat_messages (from_id, at)`,
  // Engelleme: engelleyen, engelleneni listesinde görmez; istek ve mesaj sunucuda reddedilir.
  `CREATE TABLE IF NOT EXISTS chat_blocks (
    id SERIAL PRIMARY KEY,
    biz_id INTEGER NOT NULL,
    by_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    created_at BIGINT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS chat_blocks_uniq ON chat_blocks (by_id, target_id)`,
  // Şikâyet: panelde işletme sahibi görür; mesaj içeriği kopyalanmaz, yalnızca oda referansı tutulur.
  `CREATE TABLE IF NOT EXISTS chat_reports (
    id SERIAL PRIMARY KEY,
    biz_id INTEGER NOT NULL,
    by_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    room_id INTEGER,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- open | dismissed
    created_at BIGINT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS chat_reports_biz ON chat_reports (biz_id, status, created_at)`,
  // Mekâna özel etkinlikler (src/lib/events.js). status: kapali | acik | bitti; yalnızca 'acik' olan oyunculara görünür.
  // quiz: Mekân Sınavı soruları (JSON metni: [{ q, a: [doğru, yanlış, yanlış, yanlış] }]); sınavsız etkinlikte boş.
  `CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    biz_id INTEGER NOT NULL, -- venues.id
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL DEFAULT 'diger', -- sinav | turnuva | diger
    status TEXT NOT NULL DEFAULT 'kapali', -- kapali | acik | bitti
    quiz TEXT NOT NULL DEFAULT '',
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS events_biz ON events (biz_id, status)`,
  // Süper-admin (platform yöneticisi) hesapları; mekân hesaplarından ayrıdır. password: scrypt karması salt:hash.
  `CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    last_login_at BIGINT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS admins_email ON admins (lower(email))`,
  // Bir kereliğe mahsus veri düzeltmelerinin kaydı (aynı düzeltme ikinci kez çalışmaz).
  `CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY, at BIGINT NOT NULL)`,
];

// Tohum yalnızca boş veritabanında çalışır; sonradan eklenen oyunlar mevcut mekânların listesine girmez.
// Bu düzeltme, 5 yeni masa oyununu mevcut mekânlara bir kez ekler (sonra paneldeki seçim geçerlidir).
const GAME_MIGRATIONS = [
  { name: 'add-games-2026-11', ids: ['pisti', 'okey', 'tavla', 'g2048', 'adam'] },
  { name: 'add-games-2026-11b', ids: ['kadro', 'futbolcu'] },
];

// Veritabanı boş açılırsa ilk mekânlar örnek verilerle eklenir. Panel girişi test hesabıyla yapılır
// (elif@hadikafe.com / demo1234); şifre alanında scrypt karması saklanır.
const SCRYPT = { N: 16384, r: 8, p: 1 };
export function hashPassword(plain, salt) {
  const s = salt ?? randomBytes(16).toString('hex');
  const h = scryptSync(plain, s, 32, SCRYPT).toString('hex');
  return `${s}:${h}`;
}

const SEED_VENUES = () => {
  const now = Date.now();
  return [
    {
      slug: 'demo', name: 'Hadi Kafe', city: 'Kadıköy, İstanbul', initials: 'HK', logo_url: null,
      color: '#ff4f2e', accent: '#ffc83d', ntables: 12, lat: null, lng: null,
      games: 'monopoly,satranc,spyfall,ajanlar,vampir,tabu,kimim,cizim,bil,azul,catan,risk,cluedo,scrabble,ticket,carcassonne,kadro,futbolcu,pisti,okey,tavla,g2048,adam',
      welcome: 'Çaylar bizden değil ama oyunlar bizden!',
      ann_title: 'Cuma akşamı Tabu turnuvası', ann_body: "Saat 20:00'de. Kazanan masaya büyük boy pizza ikramımız.",
      reward_game: 'bil', reward_goal: "Bil Bakalım'da 6.000 puanı geç", reward_prize: '1 tatlı ikram',
      // Üretimde bilinen şifreli demo hesap oluşturulmaz (şifre boş = girişe kapalı).
      email: 'elif@hadikafe.com', password: process.env.NODE_ENV === 'production' ? '' : hashPassword('demo1234'),
    },
    {
      slug: 'lavanta-bistro', name: 'Lavanta Bistro', city: 'Alsancak, İzmir', initials: 'LB', logo_url: null,
      color: '#7c3aed', accent: '#22d3ee', ntables: 8, lat: null, lng: null,
      games: 'spyfall,tabu,kimim,cizim,bil,satranc',
      welcome: 'Siparişiniz gelene kadar bir el oynayın.',
      ann_title: null, ann_body: null,
      reward_game: null, reward_goal: null, reward_prize: null,
      email: '', password: '',
    },
  ].map((v) => ({ ...v, created_at: now, updated_at: now }));
};

function ensure() {
  const sig = SCHEMA.join(';');
  if (g.__dbSig !== sig) { g.__dbSig = sig; g.__dbReady = null; }
  g.__dbReady ??= (async () => {
    const q = await client();
    for (const stmt of SCHEMA) await q(stmt, []);
    const rows = await q('SELECT count(*)::int AS n FROM venues', []);
    if (rows[0]?.n === 0) {
      for (const v of SEED_VENUES()) {
        await q(
          'INSERT INTO venues (slug, name, city, initials, logo_url, color, accent, ntables, lat, lng, games, welcome, ann_title, ann_body, reward_game, reward_goal, reward_prize, email, password, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) ON CONFLICT (slug) DO NOTHING',
          [v.slug, v.name, v.city, v.initials, v.logo_url, v.color, v.accent, v.ntables, v.lat, v.lng, v.games, v.welcome, v.ann_title, v.ann_body, v.reward_game, v.reward_goal, v.reward_prize, v.email, v.password, v.created_at, v.updated_at],
        );
      }
    }
    for (const m of GAME_MIGRATIONS) {
      const done = await q('SELECT name FROM migrations WHERE name = $1', [m.name]);
      if (done.length) continue;
      const venues = await q('SELECT slug, games FROM venues', []);
      for (const v of venues) {
        const have = String(v.games || '').split(',').filter(Boolean);
        const next = [...have, ...m.ids.filter((id) => !have.includes(id))];
        if (next.length !== have.length) await q('UPDATE venues SET games = $1, updated_at = $2 WHERE slug = $3', [next.join(','), Date.now(), v.slug]);
      }
      await q('INSERT INTO migrations (name, at) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING', [m.name, Date.now()]);
    }
  })().catch((err) => {
    g.__dbReady = null; // sonraki istekte yeniden dene
    throw err;
  });
  return g.__dbReady;
}

async function exec(text, params) {
  await ensure();
  const q = await client();
  return q(toPg(text), params);
}

export const get = async (text, ...params) => (await exec(text, params))[0];
export const all = (text, ...params) => exec(text, params);
export const run = async (text, ...params) => { await exec(text, params); };
