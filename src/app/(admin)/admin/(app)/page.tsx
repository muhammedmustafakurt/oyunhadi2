import Link from 'next/link';
import PageContainer from '@/components/panel/page-container';
import StatCard from '@/components/panel/stat-card';
import { WeekChart, GameBarChart } from '@/components/panel/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { dailyPlays, overview, requireAdminPage } from '@/lib/admin';
import { gameColor, gameName } from '@/lib/game-meta';

export const metadata = { title: 'Özet' };
export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  await requireAdminPage();
  const [o, days] = await Promise.all([overview(), dailyPlays(14)]);
  return (
    <PageContainer
      title="Özet"
      description="Platformun genel durumu."
      action={<Link href="/admin/mekanlar/yeni" className={buttonVariants({ variant: 'outline' })}>Yeni mekân</Link>}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mekân" value={o.venues.toLocaleString('tr-TR')} note="Kayıtlı mekân sayısı" />
        <StatCard label="Toplam masa" value={o.tables.toLocaleString('tr-TR')} note="Tüm mekânların masa toplamı" />
        <StatCard label="Oyun, son 7 gün" value={o.plays7.toLocaleString('tr-TR')} note="Başlanan oyun sayısı" />
        <StatCard label="Oyun, son 30 gün" value={o.plays30.toLocaleString('tr-TR')} note="Başlanan oyun sayısı" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Günlük kullanım</CardTitle>
            <CardDescription>Son 14 gün, tüm mekânlarda başlayan oyun ve oyuncu sayısı</CardDescription>
          </CardHeader>
          <CardContent><WeekChart data={days} /></CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>En çok oynanan oyunlar</CardTitle>
            <CardDescription>Son 30 gün, tüm mekânlar</CardDescription>
          </CardHeader>
          <CardContent>
            {o.top.length ? (
              <GameBarChart data={o.top.slice(0, 6).map((t: { game: string; n: number }) => ({ name: gameName(t.game), oyun: t.n, color: gameColor(t.game) }))} />
            ) : (
              <p className="text-muted-foreground text-sm">Henüz oyun kaydı yok.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
