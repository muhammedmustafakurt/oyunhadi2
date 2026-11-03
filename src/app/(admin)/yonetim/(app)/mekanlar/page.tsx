import Link from 'next/link';
import PageContainer from '@/components/panel/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requireAdminPage, venueRows } from '@/lib/admin';

export const metadata = { title: 'Mekânlar' };
export const dynamic = 'force-dynamic';

const fmt = (t: number | null) => (t == null ? 'Hiç' : new Date(t).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Istanbul' }));

export default async function VenuesPage() {
  await requireAdminPage();
  const rows = await venueRows();
  return (
    <PageContainer title="Mekânlar" description={`${rows.length} mekân`} action={<Link href="/mekanlar/yeni" className={buttonVariants()}>Yeni mekân</Link>}>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead><TableHead>Şehir</TableHead><TableHead className="text-right">Masa</TableHead>
              <TableHead className="text-right">Açık oyun</TableHead><TableHead>Son oyun</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: { id: number; slug: string; name: string; city: string; tables: number; openGames: number; lastPlay: number | null }) => (
              <TableRow key={r.id}>
                <TableCell><Link href={`/mekanlar/${r.id}`} className="font-medium underline-offset-4 hover:underline">{r.name}</Link><span className="text-muted-foreground ml-2 text-xs">{r.slug}</span></TableCell>
                <TableCell>{r.city}</TableCell>
                <TableCell className="text-right tabular-nums">{r.tables}</TableCell>
                <TableCell className="text-right tabular-nums">{r.openGames}</TableCell>
                <TableCell>{fmt(r.lastPlay)}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-muted-foreground text-center">Mekân yok.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  );
}
