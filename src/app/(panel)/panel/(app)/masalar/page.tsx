import Link from 'next/link';
import { IconPrinter, IconExternalLink } from '@tabler/icons-react';
import PageContainer from '@/components/panel/page-container';
import TableActions from '@/components/panel/table-actions';
import TableAdd from '@/components/panel/table-add';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { gameName } from '@/lib/game-meta';
import { tableRows } from '@/lib/stats';
import { requireVenue } from '@/lib/venues';

export const metadata = { title: 'Masalar ve karekodlar' };
export const dynamic = 'force-dynamic';

export default async function TablesPage() {
  const v = await requireVenue();
  const rows = await tableRows(v.id, v.tables);
  const playing = rows.filter((t) => t.status === 'oynaniyor').length;
  return (
    <PageContainer
      title="Masalar ve karekodlar"
      description={`${rows.length} masa kayıtlı${playing ? `, ${playing} masada oyun oynanıyor` : ''}. Her masanın kendi karekodu var; aynı karekod NFC etikete de yazılabilir.`}
      action={
        <>
          <Link href="/panel/masalar/yazdir" className={buttonVariants({ variant: 'outline' })}><IconPrinter /> Karekodları yazdır</Link>
          <TableAdd tables={v.tables} />
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Masalar</CardTitle>
          <CardDescription>Masa adını değiştirebilir, geçici olarak kapatabilir ya da karekodunu yenileyebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Masa</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="hidden md:table-cell">Şu an</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Bugün</TableHead>
                <TableHead className="hidden lg:table-cell">Adres</TableHead>
                <TableHead><span className="sr-only">İşlemler</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => {
                const url = `/${v.slug}/masa-${t.no}/oyunlar`;
                return (
                  <TableRow key={t.no}>
                    <TableCell className="font-medium">{t.label}<span className="text-muted-foreground block text-xs">masa-{t.no}</span></TableCell>
                    <TableCell>
                      {t.status === 'oynaniyor' ? <Badge className="bg-chart-5 text-primary-foreground">Oynanıyor</Badge> : <Badge variant="outline">Boş</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {t.status === 'oynaniyor' ? `${gameName(t.game)} · ${t.players} kişi` : '—'}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">{t.today} oyun</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono text-xs">
                        oyunhadi.com{url} <IconExternalLink className="size-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-right"><TableActions label={t.label} url={url} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
