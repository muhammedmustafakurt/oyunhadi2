# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Read `AGENTS.md` first: this is a non-standard Next.js (16.x, React 19, Tailwind 4). Check `node_modules/next/dist/docs/` before using Next APIs. Code comments and UI copy are in Turkish.

## Commands

- `npm run dev` / `npm run build` / `npm start`
- `npm run typecheck` (`tsc --noEmit`); there is no linter and no unit-test runner.
- `npm run test:session`: saf modül testi (oturum belirteci, IP seçimi; sunucu gerekmez). `npm run test:security`: yerel dev sunucuya karşı API güvenlik testi (yalnız fetch, DB'ye doğrudan erişmez; `BASE_URL`, varsayılan `http://localhost:3002`). Dev sunucu `DATABASE_URL`'siz (bellek içi PGlite) çalışmalı.
- `npm run test:chat`: end-to-end chat security/flow test against a running server (`BASE_URL`, default `http://localhost:3002`) and the real DB from `.env`; it needs `DATABASE_URL` and cleans up after itself.
- Env vars (`.env.example`): `DATABASE_URL` (Neon), `SESSION_SECRET` (≥32 chars, required in production), `SITE_URL`, `NEXT_PUBLIC_WHATSAPP`. Without `DATABASE_URL`, dev runs on in-memory PGlite (data is lost on restart; demo venue `demo` and panel login `elif@hadikafe.com` / `demo1234` are seeded). Production without `DATABASE_URL` throws.

## Architecture

Platform for cafés ("mekân"): guests scan a QR code at a table and play multiplayer table games on their phones; venue owners manage everything in a panel. Route groups in `src/app`, each with its own root layout/styles:

- `(site)`: marketing site and blog.
- `(oyun)`: player screens at `/[mekan]/[masa]/...` (`masa` is `masa-N`). The venue layout injects `--brand`/`--accent` CSS vars from the venue record.
- `(panel)`: venue-owner dashboard (cookie session `oh-panel`, HMAC-signed, see `lib/venues.js`).
- `(admin)`: super-admin (platform operator), separate accounts in the `admins` table.
- `api/*`: `room` (game rooms), `room/reward`, `chat`, `event`, `panel/*`, `admin/*`.

### Database (`src/lib/db.js`)
Single Neon Postgres via `@neondatabase/serverless`. Call sites use `?` placeholders (converted to `$n`); helpers are `get`/`all`/`run`. The whole schema is `CREATE TABLE IF NOT EXISTS` statements in the `SCHEMA` array, executed lazily on first query per process (`ensure()`), and one-off data fixes live in `GAME_MIGRATIONS` / the `migrations` table. Add schema changes there (`ALTER ... IF NOT EXISTS`). Rate limiting (`lib/ratelimit.js`) is two-tier: in-memory `floodOk` per instance and DB-backed `hit`.

### Game rooms (the core)
One row in `game_rooms` per (venue, table, game); the full state is a JSON string. The server is authoritative, and clients never compute rules or dice.
- `lib/rooms.js`: `readRoom`, `mutate` (read, `apply`, then `UPDATE ... WHERE version = ?`; optimistic concurrency, retried up to 4 times), `view` (per-player projection that strips other players' secrets/pids), seat/idle/geofence logic, `findCafe` (5 s in-memory venue cache; cleared by `updateVenue`).
- `api/room/route.js`: single GET/POST endpoint. GET is a version-poll (`roomUnchanged` returns `{unchanged}` cheaply). POST validates the action name against the `ACTIONS` allowlist or a plugin prefix. Rooms idle for 6 h reset.
- Client: `components/games/useRoom.js` polls every 1.5 s plus a 20 s `ping`; `components/oyun/Presence.js` and `RewardNotice.js` poll separately. Each game has a `<Name>Online.js` client component registered in `VIEWS` in `(oyun)/[mekan]/[masa]/oyunlar/[game]/page.tsx`.
- Two ways to add a game's engine. Older games (monopoly=`emlak`, chess, spyfall, …) are hard-wired into `rooms.js` (`CONFIG`, `apply`, `view`) and `api/room/route.js` `ACTIONS`. **Newer games use the plugin registry `lib/plugins.js`** (pisti, okey, g2048, adam): the module exports `CONFIG, PREFIX, newGame, act, onLeave, viewFor` and no `rooms.js` changes are needed. A new game id must also be added to `VENUE_GAMES` (`lib/venues.js`), the `GAMES` list (`lib/games.js`), and, for existing venues, to `GAME_MIGRATIONS` in `db.js`.
- Event rooms ("Mekân Sınavı") reuse the `bil` engine under room key `bil@<eventId>`, gated by `lib/events.js` `gateEvent`.
- Rewards: for games in `lib/reward-games.js`, `settleRoom` (`lib/rewards.js`) issues codes server-side from the final score when a game ends.

### Other subsystems
- Cross-table chat: `lib/chat.js`, `api/chat`, `components/sohbet`, spec in `docs/sohbet.md`.
- Venues, subscriptions, events, reward rules each have their own `lib/*.js` module and panel page.

## Security notes
- Durum değiştiren panel/admin API uçları (POST/PUT/DELETE) `lib/guard.js` `originOk(req)` ile CSRF denetimi yapar: `Origin` başlığı varsa `Host` ile aynı olmalı, yoksa `Sec-Fetch-Site: same-origin` gerekir (süper-admin `guardApi` aynı yardımcıyı kullanır). Yeni panel/admin ucu eklerken bunu çağırın. Oyuncu uçları (room/chat/event) bilerek Origin'e bağlı değildir.
- JSON gövdeler `lib/guard.js` `readBody(req, maxBytes)` ile okunur (Content-Length + gerçek okuma, aşımda 413): room 256 KB (çizim parçaları ~92 KB), panel/admin 32-64 KB, chat/event 32 KB. `req.json()` doğrudan kullanmayın.
- Girdi alanları `typeof === 'string'` ile denetlenir; `String(x)` dizi/nesneyi geçerli gösterebilir.
- Panel/süper-admin oturum çerezi `<id>.<bitiş>.<parolaSürümü>.<HMAC>` (`lib/session-token.js`, saf modül; `node scripts/session-token-test.mjs`). Sürüm parola karmasından türer: şifre değişince/sıfırlanınca eski çerezler düşer, şema değişmez. Eski 3 parçalı biçim reddedilir (yeniden giriş).
- Giriş kilidi `lib/ratelimit.js` `loginGate`: (hesap+IP) ve IP sayaçları, artan gecikme (üst sınır 15 dk), sayma+ekleme tek SQL; global/hesap-toplam sayaç YOK. Başarıda çift sayacı silinir. Panel girişi ve admin girişi/şifre değiştirme bunu kullanır.
- İstemci IP'si yalnız `ratelimit.clientIp` (`lib/client-ip.js`): Vercel'de x-real-ip, Vercel dışı üretimde XFF'nin SON girdisi, geliştirmede ilk girdi. Yeni uçta `x-forwarded-for`'u elle okumayın.
- Ödül kodu günlük üst sınırı: kuralda `daily_limit` boşsa mekân başına günde `DEFAULT_DAILY_CODE_LIMIT` (200, `lib/reward-games.js`). 2048 hamleleri arası `MIN_MOVE_GAP_MS` (120 ms). Etkinlik kontenjanı masa başına `MAX_CARDS_PER_MASA`/`MAX_ENTRIES_PER_MASA` (25, `lib/eventgames.js`). Bunlar sahte pid'i engellemez, yalnızca maliyeti sınırlar.
- Masa `join` hız sayacı yalnızca başarılı joinde artar (`hitUnder` + `hitRecord`).
- JSON-LD çıktısı `jsonLdString` (`lib/utils.ts`) ile yazılır (`<` kaçırılır). Üretimde `SITE_URL` ve `SESSION_SECRET` zorunlu.

## Gotchas
- `tsc` does not catch missing imports in the `.js` game modules; do a `next build` to verify them.

## Project quality rules

- Treat visual design and clean, maintainable code as equally important.
- Study existing patterns before introducing new ones. Reuse existing components and design tokens (venue `--brand`/`--accent` vars, existing stylesheets in `src/styles`, `components/ui`) where appropriate.
- Never redesign a page without understanding its purpose and user journey (the QR scan, table and game flow for players; the panel for venue owners).
- Avoid generic AI-generated UI patterns. Make deliberate design decisions based on the product's identity.
- Do not add dependencies without a clear benefit.
- Never remove working functionality to simplify a redesign.
- For significant changes, plan first and implement in small, reviewable stages.
- After implementing, run the relevant checks: `npm run typecheck` and `npm run build` (there is no lint script or unit-test runner; `npm run test:chat` covers chat only). Inspect the real browser output when browser tooling is available.
- Report verification honestly, including failures and untested areas.
- Do not mark a task complete while known critical regressions remain.
