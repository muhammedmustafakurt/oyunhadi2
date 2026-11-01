import Link from 'next/link';
import GameCover from '@/components/oyun/GameCover';
import { SPINE } from '@/lib/spines';
import { GAMES } from '@/lib/games';

type G = (typeof GAMES)[number];

// Oyun kartı: üstte oyunun renginde karakter, altta beyaz bilgi alanı.
export function GameCard({ g, className = '' }: { g: G; className?: string }) {
  const [bg, fg] = SPINE[g.id];
  return (
    <Link href={`/oyunlar/${g.id}`} className={`card card-hover group block overflow-hidden ${className}`}>
      <div className="relative grid h-44 place-items-center overflow-hidden" style={{ background: bg, color: fg }}>
        <GameCover id={g.id} title={false} className="absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="p-5">
        <p className="font-display text-xl font-extrabold">{g.name}</p>
        <p className="mt-1 text-sm text-muted">{g.note} · {g.players.replace('-', '–')} kişi · {g.minutes.replace('-', '–')} dk</p>
      </div>
    </Link>
  );
}

// Izgara düzeni (Oyunlar sayfası)
export default function GameShelf({ limit }: { limit?: number }) {
  const games = GAMES.filter((g) => g.play).slice(0, limit);
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((g, i) => (
        <li key={g.id} data-aos="zoom-y-out" data-aos-delay={(i % 3) * 100}><GameCard g={g} /></li>
      ))}
    </ul>
  );
}
