import { IconCheck, IconDownload } from '@tabler/icons-react';
import PageContainer from '@/components/panel/page-container';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { requireVenue } from '@/lib/venues';
import { getSubscription, listPayments } from '@/lib/subscriptions';
import { whatsappLink } from '@/lib/site';

export const metadata = { title: 'Abonelik' };
export const dynamic = 'force-dynamic';

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });
const money = (n: number) => `₺${n.toLocaleString('tr-TR')}`;
const STATUS = {
  aktif: { label: 'Aktif', cls: 'bg-chart-5 text-primary-foreground' },
  deneme: { label: 'Deneme', cls: 'bg-chart-4 text-primary-foreground' },
  bitti: { label: 'Bitti', cls: 'bg-secondary text-primary-foreground' },
  iptal: { label: 'İptal', cls: 'bg-destructive text-destructive-foreground' },
} as const;
const PAY = { odendi: 'Ödendi', bekliyor: 'Bekliyor', iade: 'İade' } as const;

// Abonelik durumu ve ödemeler: subscriptions / payments tablolarından okunur (kayıtları süper-admin girer).
export default async function BillingPage() {
  const v = await requireVenue();
  const [s, pays] = await Promise.all([getSubscription(v.id), listPayments(v.id)]);
  const write = whatsappLink(`Merhaba, ${v.name} (${v.slug}) aboneliği hakkında yazıyorum.`);

  if (!s) {
    return (
      <PageContainer title="Abonelik" description="Paketiniz, kalan süreniz ve ödemeleriniz.">
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="font-medium">Henüz bir aboneliğiniz görünmüyor.</p>
            <p className="text-muted-foreground text-sm">Destek ile iletişime geçin, kaydınız oluşturulunca burada görünür.</p>
            <a href={write} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>Bize yazın</a>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const st = STATUS[s.status as keyof typeof STATUS] ?? STATUS.aktif;
  return (
    <PageContainer title="Abonelik" description="Paketiniz, kalan süreniz ve ödemeleriniz.">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{s.plan}</CardTitle>
            <CardDescription>{fmtDate(s.startedAt)} – {fmtDate(s.endsAt)}</CardDescription>
            <CardAction><Badge className={st.cls}>{st.label}</Badge></CardAction>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">{s.daysLeft > 0 ? `${s.daysLeft} gün kaldı` : 'Süre doldu'}</span>
                <span className="text-muted-foreground">%{s.usedPct} kullanıldı</span>
              </div>
              <div className="bg-muted h-4 overflow-hidden rounded-md border-2 border-foreground"><div className="bg-primary h-full" style={{ width: `${s.usedPct}%` }} /></div>
            </div>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div><dt className="text-muted-foreground text-sm">Tutar</dt><dd className="font-semibold">{s.totalTry == null ? '—' : `${money(s.totalTry)}${s.vatNote ? ` ${s.vatNote}` : ''}`}</dd></div>
              <div><dt className="text-muted-foreground text-sm">Ödeme</dt><dd className="font-semibold">{s.method || '—'}</dd></div>
              <div><dt className="text-muted-foreground text-sm">Yenileme</dt><dd className="font-semibold">{s.renewal === 'otomatik' ? 'Otomatik' : 'Elle (otomatik değil)'}</dd></div>
            </dl>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <a href={write} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>Yenileme için bize yazın</a>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pakete dahil</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {['Tüm oyunlar ve yeni eklenenler', `${v.tables} masa karekodu`, 'Panel, istatistik ve duyurular', 'Ödül kodları', 'Logo ve renkler', 'Konum kilidi', 'WhatsApp desteği'].map((t) => (
                <li key={t} className="flex items-center gap-2"><IconCheck className="size-4 text-chart-5" /> {t}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Ödemeler</CardTitle></CardHeader>
        <CardContent className="px-0 sm:px-6">
          {pays.length === 0 ? (
            <p className="text-muted-foreground px-6 text-sm sm:px-0">Henüz ödeme kaydı yok.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Açıklama</TableHead><TableHead>Tutar</TableHead><TableHead>Durum</TableHead><TableHead className="text-right">Fatura</TableHead></TableRow></TableHeader>
              <TableBody>
                {pays.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{fmtDate(p.paidAt)}</TableCell>
                    <TableCell>{p.description || '—'}</TableCell>
                    <TableCell className="tabular-nums">{money(p.amountTry)}</TableCell>
                    <TableCell><Badge variant="secondary">{PAY[p.status as keyof typeof PAY] ?? p.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {p.invoiceUrl && (
                        <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })} aria-label="Faturayı indir"><IconDownload /></a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
