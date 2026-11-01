import Link from 'next/link';
import { notFound } from 'next/navigation';
import MonopolyOnline from '@/components/games/MonopolyOnline';
import ChessOnline from '@/components/games/ChessOnline';
import SpyfallOnline from '@/components/games/SpyfallOnline';
import AjanlarOnline from '@/components/games/AjanlarOnline';
import VampirOnline from '@/components/games/VampirOnline';
import TabuOnline from '@/components/games/TabuOnline';
import KimimOnline from '@/components/games/KimimOnline';
import CizimOnline from '@/components/games/CizimOnline';
import BilOnline from '@/components/games/BilOnline';
import RiskOnline from '@/components/games/RiskOnline';
import AzulOnline from '@/components/games/AzulOnline';
import CluedoOnline from '@/components/games/CluedoOnline';
import ScrabbleOnline from '@/components/games/ScrabbleOnline';
import CarcassonneOnline from '@/components/games/CarcassonneOnline';
import CatanOnline from '@/components/games/CatanOnline';
import TicketOnline from '@/components/games/TicketOnline';
import ResetTable from '@/components/oyun/ResetTable';
import Presence from '@/components/oyun/Presence';
import GameBand from '@/components/oyun/GameBand';
import VenueBadge from '@/components/oyun/VenueBadge';
import ChatWidget from '@/components/sohbet/ChatWidget';
import { findCafe, hasTable } from '@/lib/rooms';
import { GAMES } from '@/lib/games';

export const dynamic = 'force-dynamic';

const VIEWS: Record<string, React.ComponentType<{ cafe: string; masa: string }>> = {
  monopoly: MonopolyOnline, satranc: ChessOnline, spyfall: SpyfallOnline, ajanlar: AjanlarOnline, vampir: VampirOnline,
  tabu: TabuOnline, kimim: KimimOnline, cizim: CizimOnline, bil: BilOnline, azul: AzulOnline, risk: RiskOnline,
  cluedo: CluedoOnline, scrabble: ScrabbleOnline, carcassonne: CarcassonneOnline, catan: CatanOnline, ticket: TicketOnline,
};

export async function generateMetadata({ params }: PageProps<'/[mekan]/[masa]/oyunlar/[game]'>) {
  const { game } = await params;
  const g = GAMES.find((x) => x.id === game);
  return { title: g ? g.name : 'Oyun' };
}

export default async function TablePlay({ params }: PageProps<'/[mekan]/[masa]/oyunlar/[game]'>) {
  const { mekan, masa, game } = await params;
  const g = GAMES.find((x) => x.id === game && x.play);
  const v = await findCafe(mekan);
  if (!g || !v || !hasTable(v, masa) || !v.games.includes(g.id)) notFound();
  const View = VIEWS[g.id];
  const back = `/${mekan}/${masa}/oyunlar`;

  return (
    <main className="oh-play">
      <header className="oh-play-top">
        <Link href={back} className="oh-back" aria-label="Tüm oyunlar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </Link>
        <VenueBadge venue={v} />
        <span className="oh-play-where">{v.name}<small>Masa {masa.replace('masa-', '')}</small></span>
      </header>
      <GameBand game={g} />
      <div className={`shell oh-play-body${g.id === 'monopoly' ? ' game-board' : ''}`}>
        <View cafe={mekan} masa={masa} />
        <Presence cafe={mekan} masa={masa} game={g.id} />
        <ResetTable cafe={mekan} masa={masa} game={g.id} />
        <p className="oh-play-back"><Link href={back}>← Tüm oyunlar</Link></p>
      </div>

      <ChatWidget cafe={mekan} masa={masa} no={masa.replace('masa-', '')} />
    </main>
  );
}
