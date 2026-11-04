import Link from 'next/link';
import PageHero from '@/components/site/page-hero';
import Cta from '@/components/site/cta';
import { STEPS } from '@/lib/site';

export const metadata = {
  title: 'Nasıl Çalışır?',
  description: 'Karekodlar masanıza gelir, misafir okutur, aynı masadaki arkadaşları kendi telefonlarından katılır. oyunhadi\'nin mekân ve misafir için adım adım işleyişi.',
  alternates: { canonical: '/nasil-calisir' },
};

const GUEST = [
  ['Karekodu okutur', 'Telefon kamerasını masadaki pleksiye tutar. Sayfa mekânın renginde açılır.'],
  ['Oyunu seçer', '"Kaç kişisiniz?" sorusuna göre uygun oyunlar öne çıkar.'],
  ['Arkadaşları katılır', 'Masadakiler aynı karekodu okutup adlarını yazar; oyun herkesin ekranında aynı anda ilerler.'],
  ['Ödülünü alır', 'Hedefi tutturan masaya tek kullanımlık kod çıkar; garsona gösterilir.'],
];

const VENUE = [
  ['Kayıt ve teklif', 'Formu doldurursunuz, masa sayınızı ve mekân türünüzü konuşuruz.'],
  ['Pleksiler kargoda', 'Masa sayınız kadar karekodlu pleksi hazırlanıp gönderilir. Abonelik ilk okutmada başlar.'],
  ['Panel hazır', 'Logonuzu, renklerinizi, açık oyunları ve ödülleri panelden ayarlarsınız.'],
  ['İzleyin, geliştirin', 'Haftalık raporlarla hangi oyunların ve saatlerin öne çıktığını görürsünüz.'],
];

const C = ['text-coral', 'text-grape', 'text-sky'];

export default function HowPage() {
  return (
    <>
      <PageHero eyebrow="Nasıl çalışır?" title={<>Okut, katıl, <span className="squiggle">oyna</span></>} lead="Ne mekânın ne de misafirin bir şey kurması gerekir. Karekod masaya, oyun telefona." />

      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.no} className="card relative overflow-hidden p-7" data-aos="zoom-y-out" data-aos-delay={i * 120}>
                <span className={`font-display absolute -top-6 -right-2 text-[7rem] leading-none font-black opacity-15 ${C[i]}`} aria-hidden="true">{s.no}</span>
                <span className={`font-display text-sm font-black ${C[i]}`}>ADIM {s.no}</span>
                <h2 className="mt-3 text-2xl font-extrabold">{s.title}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pb-20 md:pb-24">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-2">
          {([['Misafir için', GUEST, 'band-coral'], ['Mekân için', VENUE, 'band-grape']] as const).map(([title, items, band]) => (
            <div key={title} className={`${band} relative overflow-hidden rounded-[14px] border-[3px] border-ink shadow-[6px_6px_0_var(--color-ink)] p-8 md:p-10`}>
              <div className="confetti pointer-events-none absolute inset-0" aria-hidden="true" />
              <h2 className="relative mb-8 text-3xl font-black">{title}</h2>
              <ol className="relative space-y-6">
                {items.map(([h, p], i) => (
                  <li key={h} className="flex gap-4">
                    <span className="font-display grid h-9 w-9 shrink-0 place-items-center rounded-lg border-2 border-ink bg-white text-sm font-black text-ink">{i + 1}</span>
                    <div><p className="font-bold">{h}</p><p className="mt-1 text-[15px] text-white/85">{p}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-4xl font-black">Kendiniz deneyin</h2>
          <p className="mt-4 text-lg text-muted">Demo masayı iki telefonda açın; birinden oyunu başlatın, diğerinden katılın.</p>
          <Link href="/demo/masa-1/oyunlar" className="btn btn-primary mt-8">Demo masayı aç</Link>
        </div>
      </section>

      <Cta />
    </>
  );
}
