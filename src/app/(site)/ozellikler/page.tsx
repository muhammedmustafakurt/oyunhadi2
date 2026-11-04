import PageHero from '@/components/site/page-hero';
import { IconBox } from '@/components/site/icon';
import Cta from '@/components/site/cta';
import PhoneMock from '@/components/site/phone-mock';
import { Card, Pawn } from '@/components/site/props';
import { FEATURES } from '@/lib/site';

export const metadata = {
  title: 'Özellikler',
  description: 'Grup oyunları, mekâna özel renk ve logo, ödül kodları, duyuru panosu, konum kilidi ve kullanım istatistikleri: oyunhadi\'nin bütün özellikleri.',
  alternates: { canonical: '/ozellikler' },
};

const TONES = ['coral', 'grape', 'sky', 'leaf', 'rose', 'sun'] as const;

export default function FeaturesPage() {
  return (
    <>
      <PageHero eyebrow="Özellikler" title={<>Masaya bir karekod,<br /><span className="hl-coral">mekâna bir sürü yenilik</span></>} lead="Misafir için eğlenceli, sizin için ölçülebilir. Misafir ekranında ve mekân panelinde neler var?" />

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <article key={f.title} className="card card-hover p-7" data-aos="zoom-y-out" data-aos-delay={(i % 3) * 100}>
                <IconBox name={f.icon} tone={TONES[i % TONES.length]} />
                <h2 className="mt-5 flex items-center gap-2 text-xl font-extrabold">
                  {f.title}
                  {f.tag && <span className="rounded-md border-2 border-ink bg-sun px-2 py-0.5 font-sans text-xs font-bold tracking-normal">{f.tag}</span>}
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band-sun relative overflow-hidden py-24 md:py-28">
        <Pawn className="top-10 left-[3%] hidden w-20 md:block" />
        <Card className="right-[3%] bottom-10 hidden w-24 md:block" delay="-3s" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-4xl leading-[1.05] font-black md:text-5xl">Sizin renginiz,<br /><span className="hl">sizin logonuz</span></h2>
            <p className="mt-5 text-lg text-ink/75">Panelden logonuzu yükleyin, ana ve ikinci renginizi seçin; masadaki ekranlar anında güncellenir. Aynı ekran, iki farklı mekânda:</p>
          </div>
          <div className="flex justify-center gap-6">
            <div className="-rotate-3 scale-90"><PhoneMock /></div>
            <div className="mt-12 hidden rotate-3 scale-90 sm:block"><PhoneMock color="#7c3aed" accent="#22d3ee" name="Lavanta Bistro" initials="LB" /></div>
          </div>
        </div>
      </section>

      <Cta title="Özellikleri canlı görelim mi?" />
    </>
  );
}
