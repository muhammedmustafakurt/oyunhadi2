import PageContainer from '@/components/panel/page-container';
import AnnouncementForm from '@/components/panel/announcement-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { requireVenue } from '@/lib/venues';

export const metadata = { title: 'Duyurular' };

// Yayındaki duyuru venues tablosundan gelir; geçmiş duyurular kaydedilmediği için listelenmez.

export default async function AnnouncementsPage() {
  const v = await requireVenue();
  const a = v.announcement;
  return (
    <PageContainer title="Duyurular" description="Duyurunuz masalardaki oyun listesinin en üstünde görünür.">
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {a && (
            <Card>
              <CardHeader>
                <CardTitle>{a.title}</CardTitle>
                <CardDescription>{a.body}</CardDescription>
                <CardAction><Badge className="bg-chart-5 text-primary-foreground">Yayında</Badge></CardAction>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">Yayınlandığı andan kaldırana kadar {v.tables} masada gösterilir</CardContent>
            </Card>
          )}
          {!a && (
            <Card>
              <CardHeader>
                <CardTitle>Yayında duyuru yok</CardTitle>
                <CardDescription>Yandaki formla yazdığınız duyuru masalardaki oyun listesinin en üstünde görünür.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
        <Card className="h-fit">
          <CardHeader><CardTitle>{a ? 'Duyuruyu düzenle' : 'Yeni duyuru'}</CardTitle></CardHeader>
          <CardContent><AnnouncementForm initial={a} /></CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
