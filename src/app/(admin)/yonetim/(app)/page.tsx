import PageContainer from '@/components/panel/page-container';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { overview, requireAdminPage } from '@/lib/admin';
import { GAMES } from '@/lib/games';

export const metadata = { title: 'Özet' };
export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  await requireAdminPage();
  const o = await overview();
  const name = (id: string) => GAMES.find((g) => g.id === id)?.name ?? id;
  const stats: [string, number][] = [['Mekân', o.venues], ['Toplam masa', o.tables], ['Oyun, son 7 gün', o.plays7], ['Oyun, son 30 gün', o.plays30]];
  return (
    <PageContainer title="Özet" description="Platformun genel durumu.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, n]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">{n.toLocaleString('tr-TR')}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>En çok oynananlar</CardTitle>
          <CardDescription>Son 30 gün, tüm mekânlar.</CardDescription>
        </CardHeader>
        <CardContent>
          {o.top.length === 0 ? (
            <p className="text-muted-foreground text-sm">Henüz oyun kaydı yok.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Oyun</TableHead><TableHead className="text-right">Oyun sayısı</TableHead></TableRow></TableHeader>
              <TableBody>
                {o.top.map((t: { game: string; n: number }) => (
                  <TableRow key={t.game}><TableCell>{name(t.game)}</TableCell><TableCell className="text-right tabular-nums">{t.n.toLocaleString('tr-TR')}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
