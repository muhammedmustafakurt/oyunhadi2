import Link from 'next/link';
import PageHero from '@/components/site/page-hero';
import Cta from '@/components/site/cta';
import { Wrap } from '@/components/site/solution-parts';
import DailyQuiz from './gunluk-test-client';

export const metadata = {
  title: 'Bugün hangi masa oyunusun?',
  description: 'Altı soruluk eğlenceli test: bugün hangi masa oyunusun? Sonucunu arkadaşlarınla paylaş, çıkan oyunu telefonunda dene.',
  alternates: { canonical: '/gunluk-test' },
  openGraph: { title: 'Bugün hangi masa oyunusun? · oyunhadi', description: 'Altı soru, bir oyun karakteri. Günlük test.', url: '/gunluk-test' },
};

export default function DailyTestPage() {
  return (
    <>
      <PageHero eyebrow="Günlük test" title={<>Bugün hangi <span className="hl-coral">masa oyunusun?</span></>} lead="Altı soru, bir oyun karakteri. Her gün sorular biraz değişir; sonucunu arkadaşlarına gönder." />
      <Wrap className="pb-20 md:pb-28" max="max-w-3xl">
        <DailyQuiz />
        <p className="mt-8 text-center text-muted">Bu test eğlence içindir. Tüm oyunları <Link className="font-bold text-grape underline underline-offset-4" href="/oyunlar">Oyunlar sayfasında</Link> görebilirsin.</p>
      </Wrap>
      <Cta />
    </>
  );
}
