import PageHero from '@/components/site/page-hero';
import Accordion from '@/components/site/accordion';
import Cta from '@/components/site/cta';
import { FAQ } from '@/lib/site';
import { jsonLdString } from '@/lib/utils';

export const metadata = {
  title: 'Sıkça Sorulan Sorular',
  description: 'oyunhadi nasıl çalışır, misafir uygulama indirir mi, ödül kodları, karekod teslimi, fiyat ve ödeme hakkında sık sorulan sorular.',
  alternates: { canonical: '/sss' },
};

const DOT = ['bg-coral', 'bg-grape', 'bg-sky', 'bg-leaf', 'bg-rose', 'bg-sun'];

export default function FaqPage() {
  const cats = [...new Set(FAQ.map((f) => f.cat))];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <PageHero eyebrow="SSS" title={<>Sıkça sorulan <span className="hl-coral">sorular</span></>} lead="Aradığınızı bulamazsanız WhatsApp'tan yazın, hemen yanıtlayalım." />
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-3xl space-y-12 px-4 sm:px-6">
          {cats.map((c, i) => (
            <div key={c}>
              <h2 className="mb-5 flex items-center gap-3 text-2xl font-black"><span className={`h-3 w-3 rounded-full ${DOT[i % DOT.length]}`} />{c}</h2>
              <div className="space-y-3">
                {FAQ.filter((f) => f.cat === c).map((f) => <Accordion key={f.q} title={f.q}>{f.a}</Accordion>)}
              </div>
            </div>
          ))}
        </div>
      </section>
      <Cta />
    </>
  );
}
