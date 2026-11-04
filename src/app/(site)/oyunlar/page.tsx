import PageHero from '@/components/site/page-hero';
import GameShelf from '@/components/site/game-shelf';
import Cta from '@/components/site/cta';
import { GAMES } from '@/lib/games';

export const metadata = {
  title: 'Oyunlar',
  description: 'Emlak Krallığı, Satranç, Casus, Gizli Ajanlar, Vampir Köylü, Tabu, Ben Kimim?, Çiz Bakalım ve Bil Bakalım: masada telefonla oynanan grup oyunları.',
  alternates: { canonical: '/oyunlar' },
};

export default function GamesPage() {
  const soon = GAMES.filter((g) => !g.play);
  return (
    <>
      <PageHero eyebrow={`${GAMES.filter((g) => g.play).length} oyun`} title={<>Masada oynanan <span className="hl-coral">oyunlar</span></>} lead="Hepsi çok oyunculu: aynı masadaki arkadaşlar kendi telefonlarından birlikte ya da birbirine karşı oynar." />
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <GameShelf />
          <h2 className="mt-24 mb-8 text-3xl font-black">Rafta sıradakiler</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {soon.map((g) => (
              <li key={g.id} className="rounded-xl border-[2.5px] border-dashed border-ink bg-paper p-5">
                <p className="font-bold">{g.name}</p>
                <p className="mt-1 text-sm text-muted">{g.note} · {g.players.replace('-', '–')} kişi</p>
                <span className="mt-3 inline-block rounded-md border-2 border-ink bg-sun px-2.5 py-0.5 text-xs font-extrabold">Yakında</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Cta />
    </>
  );
}
