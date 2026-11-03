import Link from 'next/link';
import { GameSeal } from '@/components/oyun/GameCover';
import { accentOf } from '@/components/oyun/emblems';
import { GAMES } from '@/lib/games';

type G = (typeof GAMES)[number];

// Oyun kartı (premium kutu oyunu dili): takım renginde çerçeve, krem iç yüz, solda mühür simge, sağda italik logo ve bilgiler.
export function GameCard({ g, no, total, className = '' }: { g: G; no?: number; total?: number; className?: string }) {
  return (
    <Link
      href={`/oyunlar/${g.id}`}
      className={`group block h-full rounded-[20px] border-[2.5px] border-ink p-2 shadow-[0_6px_0_var(--color-ink)] transition hover:-translate-y-1 hover:shadow-[0_10px_0_var(--color-ink)] ${className}`}
      style={{ background: accentOf(g.id) }}
    >
      <span className="relative flex h-full items-center gap-4 rounded-[13px] border-2 border-ink bg-[#fff7ee] px-4 py-5 sm:gap-5 sm:px-5">
        <span aria-hidden="true" className="pointer-events-none absolute inset-[5px] rounded-[8px] border border-ink/50" />
        <GameSeal id={g.id} className="relative h-[104px] w-[104px] shrink-0 transition-transform duration-300 group-hover:-rotate-6 sm:h-[116px] sm:w-[116px]" />
        <span className="relative min-w-0">
          {no != null && total != null && (
            <span className="block text-[10px] font-extrabold tracking-[.22em] text-ink uppercase">Oyunhadi · {String(no).padStart(2, '0')}/{String(total).padStart(2, '0')}</span>
          )}
          <span className="mt-1 block text-[1.7rem] leading-[1] font-extrabold italic" style={{ fontFamily: 'var(--font-logo), Georgia, serif' }}>{g.name}</span>
          <span className="mt-2 block text-sm leading-snug text-muted">{g.note}</span>
          <span className="mt-2.5 block text-[11px] font-extrabold tracking-[.1em] text-ink uppercase">{g.players.replace('-', '–')} oyuncu · {g.minutes.replace('-', '–')} dk</span>
        </span>
      </span>
    </Link>
  );
}

// Izgara düzeni (Oyunlar sayfası)
export default function GameShelf({ limit }: { limit?: number }) {
  const all = GAMES.filter((g) => g.play);
  const games = all.slice(0, limit);
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((g, i) => (
        <li key={g.id} data-aos="zoom-y-out" data-aos-delay={(i % 3) * 100}><GameCard g={g} no={i + 1} total={all.length} /></li>
      ))}
    </ul>
  );
}
