import Link from 'next/link';
import PageContainer from '@/components/panel/page-container';
import StatCard from '@/components/panel/stat-card';
import { WeekChart, GameBarChart } from '@/components/panel/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { recentCodes, rewardStats } from '@/lib/rewards';
import { getSubscription } from '@/lib/subscriptions';
import { gameColor, gameName } from '@/lib/game-meta';
import { weekDocs, gameDocs, tableRows } from '@/lib/stats';
import { requireVenue } from '@/lib/venues';

export const metadata = { title: 'Genel bakış' };

const STATUS = { bekliyor: 'Bekliyor', kullanildi: 'Kullanıldı', 'suresi-doldu': 'Süresi doldu' } as const;
const pct = (a: number, b: number) => (b === 0 ? undefined : Math.round(((a - b) / b) * 100));

export default async function Overview() {
  const v = await requireVenue();
  const [week14, byGame, rows, codes, rst, sub] = await Promise.all([
    weekDocs(v.id, 14),
    gameDocs(v.id, 7),
    tableRows(v.id, v.tables),
    recentCodes(v.id, 4),
    rewardStats(v.id),
    getSubscription(v.id),
  ]);
  const week = week14.slice(7), prev = week14.slice(0, 7);
  const games = week.reduce((n, d) => n + d.oyun, 0);
  const prevGames = prev.reduce((n, d) => n + d.oyun, 0);
  const players = week.reduce((n, d) => n + d.oyuncu, 0);
  const prevPlayers = prev.reduce((n, d) => n + d.oyuncu, 0);
  const live = rows.filter((t) => t.status === 'oynaniyor');
  return (
    <PageContainer
      title={`Merhaba, ${v.name} 👋`}
      description="Bu haftanın özeti ve masalarınızın şu anki durumu."
      action={<Link href="/panel/masalar/yazdir" className={buttonVariants({ variant: 'outline' })}>Karekod yazdır</Link>}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bu hafta oynanan oyun" value={String(games)} change={pct(games, prevGames)} note="Geçen haftaya göre" />
        <StatCard label="Oyuncu" value={String(players)} change={pct(players, prevPlayers)} note="Başlanan oyunlardaki kişi sayısı toplamı" />
        <StatCard label="Şu an oynanan masa" value={`${live.length} / ${rows.length}`} note="Masadaki telefonlar yokluyor" />
        <StatCard label="Ödül kodu" value={String(rst.issued)} note={`Bu ay verilen · ${rst.used} kullanıldı`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Haftalık kullanım</CardTitle>
            <CardDescription>Günlere göre başlayan oyun ve oyuncu sayısı</CardDescription>
          </CardHeader>
          <CardContent><WeekChart data={week} /></CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>En çok oynanan oyunlar</CardTitle>
            <CardDescription>Bu hafta</CardDescription>
          </CardHeader>
          <CardContent>
            {byGame.length ? (
              <GameBarChart data={byGame.slice(0, 6).map((g) => ({ name: gameName(g.game), oyun: g.oyun, color: gameColor(g.game) }))} />
            ) : (
              <p className="text-muted-foreground text-sm">Bu hafta henüz oyun başlanmadı. Kartlar okutulup oyun başlayınca burada görünür.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Masalar şu an</CardTitle>
            <CardDescription>{live.length} masada oyun var</CardDescription>
            <CardAction><Link href="/panel/masalar" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Tümü</Link></CardAction>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {rows.map((t) => (
                <li key={t.no} className="flex items-center gap-3 rounded-lg border p-3">
                  <span className={`size-2.5 rounded-full ${t.status === 'oynaniyor' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <span className="font-medium">{t.label}</span>
                  <span className="text-muted-foreground ml-auto truncate text-sm">
                    {t.status === 'oynaniyor' ? `${gameName(t.game)} · ${t.players} kişi` : 'Boş'}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <div className="grid gap-4 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Son ödül kodları</CardTitle>
              <CardAction><Link href="/panel/oduller/dogrula" className={buttonVariants({ size: 'sm' })}>Kod doğrula</Link></CardAction>
            </CardHeader>
            <CardContent>
              {codes.length === 0 && <p className="text-muted-foreground text-sm">Henüz ödül kodu verilmedi.</p>}
              <ul className="space-y-3">
                {codes.map((r) => (
                  <li key={r.code} className="flex items-center gap-3 text-sm">
                    <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">{r.code}</code>
                    <span className="truncate">Masa {r.masa.replace('masa-', '')} · {gameName(r.game)}</span>
                    <Badge variant={r.status === 'bekliyor' ? 'default' : 'outline'} className="ml-auto">{STATUS[r.status]}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Abonelik</CardTitle>
              {sub ? <CardDescription>{sub.plan} · {new Date(sub.endsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' })} tarihine kadar</CardDescription> : <CardDescription>Henüz bir aboneliğiniz görünmüyor.</CardDescription>}
              {sub && <CardAction><Badge className={sub.status === 'aktif' ? 'bg-emerald-600 text-white' : sub.status === 'deneme' ? 'bg-sky-600 text-white' : sub.status === 'bitti' ? 'bg-amber-600 text-white' : 'bg-destructive text-white'}>{({ aktif: 'Aktif', deneme: 'Deneme', bitti: 'Bitti', iptal: 'İptal' } as Record<string, string>)[sub.status]}</Badge></CardAction>}
            </CardHeader>
            {sub && (
              <CardContent>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${sub.usedPct}%` }} />
                </div>
                <p className="text-muted-foreground mt-2 text-sm">{sub.daysLeft > 0 ? `${sub.daysLeft} gün kaldı` : 'Süre doldu'}</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
