import PageContainer from '@/components/panel/page-container';
import StatCard from '@/components/panel/stat-card';
import { GameBarChart, SimpleBarChart, WeekChart } from '@/components/panel/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { gameColor, gameName } from '@/lib/game-meta';
import { weekDocs, hoursDocs, gameDocs, monthDocs, tableRows } from '@/lib/stats';
import { requireVenue } from '@/lib/venues';
import { weekSummary, pct, hourRange, hourLabel } from '@/components/panel/week-summary';

export const metadata = { title: 'İstatistikler' };

export default async function StatsPage() {
  const v = await requireVenue();
  const [week14, hours, byGame, months, rows] = await Promise.all([
    weekDocs(v.id, 14),
    hoursDocs(v.id, 7),
    gameDocs(v.id, 7),
    monthDocs(v.id, 6),
    tableRows(v.id, v.tables),
  ]);
  const { week, games, prevGames, players, prevPlayers } = weekSummary(week14);
  const live = rows.filter((t) => t.status === 'oynaniyor').length;
  const top = [...rows].filter((t) => t.today > 0).sort((a, b) => b.today - a.today).slice(0, 5);
  const busyHour = hours.filter((h) => h.oyun > 0).sort((a, b) => b.oyun - a.oyun)[0];

  return (
    <PageContainer title="İstatistikler" description="Misafirleriniz ne zaman, hangi oyunu, kaç kişiyle oynuyor?">
      <Tabs defaultValue="hafta" className="gap-4">
        <TabsList>
          <TabsTrigger value="hafta">Bu hafta</TabsTrigger>
          <TabsTrigger value="ay">Son 6 ay</TabsTrigger>
        </TabsList>
        <TabsContent value="hafta" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Oynanan oyun" value={String(games)} change={pct(games, prevGames)} note="Geçen haftaya göre" />
            <StatCard label="Oyuncu" value={String(players)} change={pct(players, prevPlayers)} note="Başlanan oyunlardaki kişi sayısı toplamı" />
            <StatCard label="Şu an oynanan masa" value={`${live} / ${rows.length}`} note="Masadaki telefonlar yokluyor" />
            <StatCard label="En yoğun saat" value={busyHour ? hourLabel(busyHour.saat) : '—'} note="Bu haftaki en işli dilim" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Günlere göre</CardTitle><CardDescription>Oyun ve oyuncu sayısı</CardDescription></CardHeader>
              <CardContent><WeekChart data={week} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Saatlere göre</CardTitle><CardDescription>{busyHour ? `En yoğun dilim ${hourRange(busyHour.saat)}` : 'Bu hafta henüz oyun yok'}</CardDescription></CardHeader>
              <CardContent><SimpleBarChart data={hours} x="saat" y="oyun" label="Oyun" /></CardContent>
            </Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Oyun dağılımı</CardTitle></CardHeader>
              <CardContent>
                {byGame.length ? (
                  <GameBarChart data={byGame.map((g) => ({ name: gameName(g.game), oyun: g.oyun, color: gameColor(g.game) }))} />
                ) : (
                  <p className="text-muted-foreground text-sm">Bu hafta henüz oyun başlanmadı.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>En hareketli masalar</CardTitle><CardDescription>Bugün</CardDescription></CardHeader>
              <CardContent>
                {top.length ? (
                  <ol className="space-y-3">
                    {top.map((t, i) => (
                      <li key={t.no} className="flex items-center gap-3">
                        <span className="bg-secondary text-primary-foreground border-foreground grid size-7 place-items-center rounded-md border-2 text-xs font-extrabold">{i + 1}</span>
                        <span className="font-medium">{t.label}</span>
                        <div className="bg-card border-foreground mx-2 h-3 flex-1 overflow-hidden rounded-md border-2"><div className="bg-primary h-full" style={{ width: `${(t.today / top[0].today) * 100}%` }} /></div>
                        <span className="text-muted-foreground w-14 text-right text-sm tabular-nums">{t.today} oyun</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-muted-foreground text-sm">Bugün henüz oyun başlanmadı.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="ay">
          <Card>
            <CardHeader><CardTitle>Aylık oyun sayısı</CardTitle><CardDescription>Son 6 ay · oyun başlangıçlarına göre</CardDescription></CardHeader>
            <CardContent><SimpleBarChart data={months} x="ay" y="oyun" label="Oyun" /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
