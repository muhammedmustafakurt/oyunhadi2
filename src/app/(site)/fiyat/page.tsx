import Link from 'next/link';
import PageHero from '@/components/site/page-hero';
import Accordion from '@/components/site/accordion';
import Icon from '@/components/site/icon';
import Cta from '@/components/site/cta';
import { FAQ, PRICE, whatsappLink } from '@/lib/site';

export const metadata = {
  title: 'Fiyat',
  description: 'Tek paket, tüm oyunlar ve özellikler dahil. Yıllık abonelik, peşin ödemede 2 ay hediye, peşin fiyatına 3 taksit, kurulum ücreti yok.',
  alternates: { canonical: '/fiyat' },
};

const INCLUDED = [
  'Tüm oyunlar ve yıl içinde eklenecek yeni oyunlar',
  'Masa sayınız kadar karekodlu pleksi (kargo dahil)',
  'Mekân paneli: istatistik, masalar, duyurular',
  'Ödül ve ikram kodları',
  'Logonuz ve renklerinizle oyun ekranı',
  'Konum kilidi',
  'WhatsApp ve e-posta desteği',
  'Kurulum ve bakım',
];

export default function PricePage() {
  const faq = FAQ.filter((f) => f.cat === 'Ödeme');
  return (
    <>
      <PageHero eyebrow="Fiyat" title={<>Tek paket, <span className="squiggle">her şey dahil</span></>} lead="Masa sayınız ne olursa olsun aynı paket. Gizli ücret, kurulum bedeli, oyun başı ücret yok." />

      <section className="pb-20 md:pb-24">
        <div className="mx-auto grid max-w-5xl gap-5 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="band-grape relative overflow-hidden rounded-[14px] border-[3px] border-ink shadow-[6px_6px_0_var(--color-ink)] p-8 md:p-10">
            <div className="confetti pointer-events-none absolute inset-0" aria-hidden="true" />
            <div className="relative">
              <span className="rounded-md border-2 border-ink bg-sun px-3 py-1 text-xs font-black text-ink">YILLIK ABONELİK</span>
              <h2 className="mt-6 font-sans text-lg font-bold tracking-normal text-white/85">oyunhadi Mekân</h2>
              <p className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="font-display text-6xl font-black">{PRICE.yearly}</span>
                <span className="text-white/80">{PRICE.note}</span>
              </p>
              <p className="mt-1 text-sm text-white/75">{PRICE.monthly}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {PRICE.perks.map((p) => <li key={p} className="rounded-lg border-2 border-white bg-white/15 px-3.5 py-1.5 text-sm font-bold">{p}</li>)}
              </ul>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link href="/teklif" className="btn btn-white">Teklif al</Link>
                <a href={whatsappLink('Merhaba, oyunhadi aboneliği hakkında bilgi almak istiyorum.')} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">WhatsApp</a>
              </div>
              <p className="mt-6 text-xs text-white/70">Kredi kartı (iyzico güvencesiyle) ya da havale/EFT ile ödeme. Fatura e-posta ile gönderilir.</p>
            </div>
          </div>
          <div className="card p-8 md:p-10">
            <h2 className="text-2xl font-black">Pakete dahil</h2>
            <ul className="mt-6 space-y-3.5">
              {INCLUDED.map((t) => (
                <li key={t} className="flex gap-3"><span className="mt-1"><Icon name="check" className="fill-leaf" /></span>{t}</li>
              ))}
            </ul>
            <p className="mt-8 rounded-xl border-[2.5px] border-ink bg-sun p-4 shadow-[3px_3px_0_var(--color-ink)] text-sm font-medium">Birden fazla şubeniz mi var? Şube sayınıza göre ayrı teklif hazırlıyoruz.</p>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-8 text-3xl font-black">Ödeme ile ilgili sorular</h2>
          <div className="space-y-3">{faq.map((f) => <Accordion key={f.q} title={f.q}>{f.a}</Accordion>)}</div>
        </div>
      </section>

      <Cta />
    </>
  );
}
