import PageContainer from '@/components/panel/page-container';
import GamesToggle from '@/components/panel/games-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GAMES } from '@/lib/games';
import { SPINE } from '@/lib/spines';
import { gameDocs } from '@/lib/stats';
import { requireVenue } from '@/lib/venues';

export const metadata = { title: 'Oyunlar' };

export default async function GamesPage() {
  const v = await requireVenue();
  const spine = SPINE as Record<string, [string, string]>;
  const plays = new Map((await gameDocs(v.id, 7)).map((g) => [g.game, g.oyun]));
  const games = GAMES.filter((g) => g.play).map((g) => ({
    id: g.id, name: g.name, note: g.note, players: g.players, minutes: g.minutes,
    color: spine[g.id][0], fg: spine[g.id][1], plays: plays.get(g.id) ?? 0,
  }));
  const soon = GAMES.filter((g) => !g.play);
  return (
    <PageContainer title="Oyunlar" description="Mekânınıza uymayan oyunları kapatın; masalardaki liste anında güncellenir.">
      <GamesToggle games={games} initial={v.games} />
      {soon.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Yakında eklenecekler</CardTitle>
            <CardDescription>Yeni oyunlar aboneliğinize ek ücret olmadan eklenir.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {soon.map((g) => <li key={g.id} className="text-muted-foreground rounded-md border-2 border-dashed px-3 py-1 text-sm">{g.name}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
