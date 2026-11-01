import GameCover, { CoverDefs } from './GameCover';
import { SPINE } from '@/lib/spines';

type Game = { id: string; name: string; note: string; players: string; minutes: string };

// Oyun sayfasının başlık bandı: oyun listesindeki kutu sırtı rengiyle aynı.
export default function GameBand({ game }: { game: Game }) {
  const [bg, fg] = (SPINE as Record<string, [string, string]>)[game.id] ?? ['var(--blue)', '#fff'];
  const [a, b = a] = game.players.split('-');
  return (
    <section className="oh-band" style={{ '--bg': bg, '--fg': fg } as React.CSSProperties}>
      <div>
        <h1>{game.name}</h1>
        <p>{game.note}</p>
        <ul>
          <li>{a === b ? a : `${a}–${b}`} kişi</li>
          <li>{game.minutes} dk</li>
        </ul>
      </div>
      <span className="oh-band-art oh-band-cover"><CoverDefs /><GameCover id={game.id} title={false} /></span>
    </section>
  );
}
