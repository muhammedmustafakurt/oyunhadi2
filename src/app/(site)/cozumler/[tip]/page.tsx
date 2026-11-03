import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHero from '@/components/site/page-hero';
import Cta from '@/components/site/cta';
import { BenefitGrid, FaqList, GameLink, SectionHead, StepCards, Wrap } from '@/components/site/solution-parts';
import { SOLUTIONS, findSolution } from '@/lib/solutions';

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ tip: s.slug }));
}

export async function generateMetadata({ params }: PageProps<'/cozumler/[tip]'>) {
  const { tip } = await params;
  const s = findSolution(tip);
  if (!s) return {};
  const title = `${s.name} için karekodlu masa oyunları`;
  return {
    title,
    description: s.lead.slice(0, 155),
    alternates: { canonical: `/cozumler/${s.slug}` },
    openGraph: { title, description: s.lead.slice(0, 155), url: `/cozumler/${s.slug}` },
  };
}

export default async function SolutionPage({ params }: PageProps<'/cozumler/[tip]'>) {
  const { tip } = await params;
  const s = findSolution(tip);
  if (!s) notFound();
  const others = SOLUTIONS.filter((x) => x.slug !== s.slug);
  return (
    <>
      <PageHero eyebrow={s.name} title={<>{s.title}<br /><span className="hl-coral">{s.hl}</span></>} lead={s.lead}>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link className="btn btn-primary" href="/teklif">Bana özel teklif al</Link>
          <Link className="btn btn-outline" href="/cozumler">Tüm çözümler</Link>
        </div>
      </PageHero>

      <Wrap>
        <SectionHead title={`${s.name} için işe yarayan oyunlar`} lead="Oyunların tamamı her mekânda açık gelir; aşağıdakiler bu ortamda en çok işe yarayacak olanlar." />
        <div className="grid gap-5 sm:grid-cols-2">
          {s.games.map((g) => <GameLink key={g.id} id={g.id} why={g.why} />)}
        </div>
      </Wrap>

      <Wrap className="band-sun py-16 md:py-20">
        <SectionHead title="Size ne kazandırır?" />
        <BenefitGrid items={s.benefits} />
      </Wrap>

      <Wrap>
        <SectionHead title="Nasıl kullanılır?" />
        <StepCards items={s.steps} />
      </Wrap>

      <Wrap max="max-w-3xl" className="pb-16 md:pb-20">
        <SectionHead title="Sık sorulanlar" />
        <FaqList items={s.faq} />
      </Wrap>

      <Wrap className="pb-16 md:pb-20">
        <SectionHead title="Diğer mekân türleri" />
        <ul className="flex flex-wrap justify-center gap-3">
          {others.map((o) => (
            <li key={o.slug}>
              <Link className="inline-flex min-h-11 items-center rounded-full border border-line bg-paper px-5 text-sm font-bold hover:border-ink" href={`/cozumler/${o.slug}`}>{o.name}</Link>
            </li>
          ))}
        </ul>
      </Wrap>

      <Cta title={`${s.name} için teklif alın`} />
    </>
  );
}
