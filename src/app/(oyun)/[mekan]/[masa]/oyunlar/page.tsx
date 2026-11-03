import { notFound } from 'next/navigation';
import GameDeck, { type DeckGame } from '@/components/oyun/GameDeck';
import VenueBadge from '@/components/oyun/VenueBadge';
import ChatWidget from '@/components/sohbet/ChatWidget';
import Link from 'next/link';
import { findCafe, hasTable } from '@/lib/rooms';
import { activeRuleMap } from '@/lib/rewards';
import { listOpenEvents } from '@/lib/events';
import { KIND_INFO, MASS } from '@/lib/event-kinds';
import { GAMES } from '@/lib/games';
import { SPINE } from '@/lib/spines';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/[mekan]/[masa]/oyunlar'>) {
  const { mekan } = await params;
  const v = await findCafe(mekan);
  return { title: `${v ? v.name : 'Oyunlar'} · Masa oyunları` };
}

// Masanın ana sayfası (karekod okutulunca açılır): yeşil çuha üstünde oyun destesi.
export default async function TableGames({ params }: PageProps<'/[mekan]/[masa]/oyunlar'>) {
  const { mekan, masa } = await params;
  const v = await findCafe(mekan);
  if (!v || !hasTable(v, masa)) notFound();
  const no = masa.replace('masa-', '');
  // Yalnızca durumu 'acik' olan etkinlikler; yoksa hiçbir şey gösterilmez. Hata sayfayı düşürmesin.
  const open: { id: number; title: string; body: string; kind: string; questions: number }[] = await listOpenEvents(v.id).catch(() => []);
  const rules = await activeRuleMap(v.id).catch(() => ({} as Record<string, { target: number; prize: string }>));
  const base = `/${mekan}/${masa}/oyunlar`;

  const games: DeckGame[] = GAMES.filter((g) => g.play && v.games.includes(g.id)).map((g) => ({
    id: g.id, name: g.name, note: g.note, players: g.players, minutes: g.minutes,
    bg: SPINE[g.id][0], fg: SPINE[g.id][1], href: `${base}/${g.id}`,
    reward: rules[g.id] ? `${rules[g.id].target.toLocaleString('tr-TR')} puan ve üstü: ${rules[g.id].prize}` : undefined,
  }));
  // Ödüllü oyun destenin en üstünde
  games.sort((a, b) => Number(!!b.reward) - Number(!!a.reward));
  const soon = GAMES.filter((g) => !g.play).map((g) => g.name);

  return (
    <main className="oh-felt">
      <header className="felt-top">
        <VenueBadge venue={v} />
        <span className="felt-name">{v.name}<small>{v.city}</small></span>
        <span className="felt-seat">Masa {no}</span>
      </header>

      <div className="felt-intro">
        <h1>Hadi, bir oyun seçin!</h1>
        <p>{v.welcome}</p>
      </div>

      {v.announcement && (
        <p className="felt-news"><b>Duyuru</b> {v.announcement.title}. {v.announcement.body}</p>
      )}

      {open.map((e) => (
        <Link key={e.id} href={`/${mekan}/${masa}/etkinlik/${e.id}`} className="felt-live">
          <b>{KIND_INFO[e.kind]?.icon} Şimdi açık · {KIND_INFO[e.kind]?.name ?? 'Etkinlik'}</b>
          <span className="t">{e.title}</span>
          {e.body && <span className="d">{e.body}</span>}
          <span className="go">{(e.questions > 0 || MASS.includes(e.kind) ? KIND_INFO[e.kind]?.go : null) ?? 'Ayrıntılar'} →</span>
        </Link>
      ))}

      <GameDeck games={games} soon={soon} introKey={`${mekan}-${masa}`} table={no} />

      <ChatWidget cafe={mekan} masa={masa} no={no} />

      <footer className="oh-foot felt-foot"><a href="/">oyunhadi</a> ile oynanıyor</footer>
    </main>
  );
}
