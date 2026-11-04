import { headers } from 'next/headers';
import QRCode from 'qrcode';
import PageContainer from '@/components/panel/page-container';
import PrintButton from '@/components/panel/print-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { requireVenue } from '@/lib/venues';
import { onColor } from '@/components/oyun/on-color';


export const metadata = { title: 'Karekod yazdır' };
export const dynamic = 'force-dynamic';

// Masa karekodları (nfc'deki admin/qr sayfasından uyarlandı): her kod /<mekân>/masa-N/oyunlar adresine açılır.
export default async function PrintPage({ searchParams }: PageProps<'/panel/masalar/yazdir'>) {
  const v = await requireVenue();
  const sp = await searchParams;
  const n = Math.min(Math.max(parseInt(String(sp.n ?? ''), 10) || v.tables, 1), 60);

  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || (host?.startsWith('localhost') ? 'http' : 'https');
  const base = (process.env.SITE_URL || `${proto}://${host}`).replace(/\/+$/, '');

  const codes = await Promise.all(Array.from({ length: n }, async (_, i) => {
    const url = `${base}/${v.slug}/masa-${i + 1}/oyunlar`;
    return { no: i + 1, url, svg: await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1c1233', light: '#ffffff' } }) };
  }));

  return (
    <PageContainer title="Karekod yazdır" description="A4 kâğıda 6'şar kart sığar. Pleksi siparişiniz gecikirse masalarınıza bunları koyabilirsiniz." action={<PrintButton />}>
      <form method="get" className="no-print flex flex-wrap items-end gap-3">
        <div className="grid gap-2">
          <Label htmlFor="n">Masa sayısı</Label>
          <Input id="n" name="n" type="number" min={1} max={60} defaultValue={n} className="w-28" />
        </div>
        <Button type="submit" variant="outline">Güncelle</Button>
        <p className="text-muted-foreground text-xs">Karekodlar <code className="font-mono">{base}</code> adresine yönlenir. Adres yanlışsa yazdırmadan önce bize bildirin.</p>
      </form>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3 print:gap-3">
        {codes.map((c) => (
          <figure key={c.no} className="relative flex break-inside-avoid flex-col items-center overflow-hidden rounded-3xl border-[3px] border-[#1c1233] bg-white p-4 text-[#1c1233]" style={{ boxShadow: `0 5px 0 #1c1233` }}>
            <div className="absolute inset-x-0 top-0 h-16" style={{ background: v.color }} aria-hidden="true" />
            <div className="absolute top-3 right-3 h-8 w-8 rotate-12 rounded-lg" style={{ background: v.accent }} aria-hidden="true" />
            <figcaption className="relative z-10 mb-3 flex w-full items-center gap-2" style={{ color: onColor(v.color) }}>
              <span className="grid size-8 place-items-center rounded-lg border-2 border-[#1c1233] bg-white text-[11px] font-extrabold" style={{ color: `color-mix(in srgb, ${v.color} 42%, #000)` }}>{v.initials}</span>
              <span className="text-sm leading-tight font-bold">{v.name}</span>
            </figcaption>
            <span className="relative z-10 mb-2 -rotate-2 rounded-full border-2 border-[#1c1233] px-3 py-0.5 text-base font-extrabold" style={{ background: v.accent, color: onColor(v.accent) }}>Masa {c.no}</span>
            <div className="w-full max-w-[170px] [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: c.svg }} />
            <p className="mt-2 text-center text-sm font-extrabold">Okut, oyna!</p>
            <p className="text-center text-[10px] opacity-70">Uygulama gerekmez · oyunhadi</p>
          </figure>
        ))}
      </div>
    </PageContainer>
  );
}
