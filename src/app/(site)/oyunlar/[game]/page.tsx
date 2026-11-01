import Link from 'next/link';
import { notFound } from 'next/navigation';
import GameCover from '@/components/oyun/GameCover';
import { GameCard } from '@/components/site/game-shelf';
import Cta from '@/components/site/cta';
import { SPINE } from '@/lib/spines';
import { GAMES } from '@/lib/games';
import { GAME_INFO } from '@/lib/site';

const playable = () => GAMES.filter((g) => g.play);

export function generateStaticParams() {
  return playable().map((g) => ({ game: g.id }));
}

export async function generateMetadata({ params }: PageProps<'/oyunlar/[game]'>) {
  const { game } = await params;
  const g = playable().find((x) => x.id === game);
  if (!g) return {};
  return {
    title: `${g.name}: telefonda masa oyunu`,
    description: `${GAME_INFO[g.id]?.intro.slice(0, 150) ?? g.note}`,
    alternates: { canonical: `/oyunlar/${g.id}` },
  };
}

export default async function GamePage({ params }: PageProps<'/oyunlar/[game]'>) {
  const { game } = await params;
  const g = playable().find((x) => x.id === game);
  if (!g) notFound();
  const info = GAME_INFO[g.id];
  const [bg, fg] = SPINE[g.id];
  const others = playable().filter((x) => x.id !== g.id).slice(0, 3);

  return (
    <>
      {/* Oyunun renginde başlık */}
      <section className="relative overflow-hidden pt-16" style={{ background: bg, color: fg }}>
        <div className="grid-lines-light pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 md:grid-cols-[1fr_auto] md:py-24">
          <div>
            <nav className="mb-6 text-sm font-semibold opacity-80" aria-label="Konum">
              <Link href="/oyunlar" className="hover:underline">Oyunlar</Link> <span aria-hidden="true">/</span> {g.name}
            </nav>
            <h1 className="text-5xl leading-[0.95] font-black uppercase md:text-7xl">{g.name}</h1>
            <p className="mt-4 text-xl opacity-90">{g.note}</p>
            <ul className="mt-6 flex flex-wrap gap-2 text-sm font-bold">
              <li className="rounded-full bg-black/15 px-3.5 py-1.5">{g.players.replace('-', '–')} kişi</li>
              <li className="rounded-full bg-black/15 px-3.5 py-1.5">{g.minutes.replace('-', '–')} dakika</li>
              {info && <li className="rounded-full bg-black/15 px-3.5 py-1.5">{info.good}</li>}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={`/demo/masa-1/oyunlar/${g.id}`} className="btn btn-white">Demo masada oyna</Link>
              {!g.tableOnly && <Link href={`/oyna/${g.id}`} className="btn" style={{ boxShadow: `inset 0 0 0 2px ${fg}` }}>Tek telefonda dene</Link>}
            </div>
          </div>
          <div className="mx-auto h-56 w-56 animate-float md:h-80 md:w-80" aria-hidden="true"><GameCover id={g.id} className="h-full w-full overflow-hidden rounded-[28px] border-[3px] border-ink shadow-[0_8px_0_rgba(0,0,0,.2)]" /></div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="text-3xl font-black md:text-4xl">Oyun hakkında</h2>
            {info && <p className="mt-5 text-lg leading-relaxed text-muted">{info.intro}</p>}
          </div>
          <div>
            <h2 className="text-3xl font-black md:text-4xl">Nasıl oynanır?</h2>
            <ol className="mt-5 space-y-3">
              {info?.how.map((h, i) => (
                <li key={h} className="card flex gap-4 p-4">
                  <span className="font-display grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black" style={{ background: bg, color: fg }}>{i + 1}</span>
                  <span className="text-[15px]">{h}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-8 text-3xl font-black">Diğer oyunlar</h2>
          <ul className="grid gap-5 sm:grid-cols-3">
            {others.map((o) => <li key={o.id}><GameCard g={o} /></li>)}
          </ul>
        </div>
      </section>

      <Cta />
    </>
  );
}
