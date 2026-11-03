import Link from 'next/link';
import PageHero from '@/components/site/page-hero';
import Cta from '@/components/site/cta';
import { Wrap } from '@/components/site/solution-parts';
import { SOLUTIONS } from '@/lib/solutions';

export const metadata = {
  title: 'Mekâna özel çözümler',
  description: 'Kafe, bar, restoran, otel lobisi, nargile salonu, kampüs kafesi, tatlıcı ve eğlence merkezleri için karekodlu masa oyunu çözümleri.',
  alternates: { canonical: '/cozumler' },
  openGraph: { title: 'Mekâna özel çözümler · oyunhadi', description: 'Hangi mekânda hangi oyun işe yarar? Sekiz mekân türü için somut öneriler.', url: '/cozumler' },
};

const BAR = ['bg-coral', 'bg-grape', 'bg-sky', 'bg-leaf', 'bg-rose', 'bg-sun'];

export default function SolutionsIndex() {
  return (
    <>
      <PageHero eyebrow="Çözümler" title={<>Her mekânın masası <span className="hl-coral">başka türlü dolar</span></>} lead="Kafede ders arası, barda gece yarısı, otel lobisinde bekleme... Mekânınıza göre hangi oyunun ne zaman işe yaradığını görün." />
      <Wrap className="py-16 md:py-24" max="max-w-7xl">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SOLUTIONS.map((s, i) => (
            <Link key={s.slug} href={`/cozumler/${s.slug}`} className="card card-hover relative flex min-h-44 flex-col overflow-hidden p-6">
              <span className={`absolute inset-x-0 top-0 h-1.5 ${BAR[i % BAR.length]}`} aria-hidden="true" />
              <h2 className="mt-2 text-2xl font-black">{s.name}</h2>
              <p className="mt-2 grow text-[15px] leading-relaxed text-muted">{s.card}</p>
              <span className="mt-4 text-sm font-bold text-grape">İncele →</span>
            </Link>
          ))}
        </div>
        <p className="mt-10 text-center text-muted">
          Birden fazla şubeniz mi var? <Link className="font-bold text-grape underline underline-offset-4" href="/kurumsal">Kurumsal sayfasına</Link> bakın. Kampüs kafesi ya da öğrenci topluluğuysanız <Link className="font-bold text-grape underline underline-offset-4" href="/kampus">kampüs sayfası</Link> sizin için.
        </p>
      </Wrap>
      <Cta title="Mekânınız listede yok mu?" lead="Başka bir mekân türüyle çalışıyorsanız yine de yazın; masada oturan misafiriniz varsa konuşabiliriz." />
    </>
  );
}
