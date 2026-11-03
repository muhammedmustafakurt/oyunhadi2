import { notFound } from 'next/navigation';
import Link from 'next/link';
import '@/styles/pages-legal.css';
import { LEGAL_DOCS, LEGAL_DISCLAIMER, LEGAL_UPDATED, legalBySlug, type Block } from '@/lib/legal';

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ sayfa: d.slug }));
}

export async function generateMetadata({ params }: PageProps<'/yasal/[sayfa]'>) {
  const { sayfa } = await params;
  const doc = legalBySlug(sayfa);
  if (!doc) return { title: 'Yasal' };
  return { title: doc.title, description: doc.intro, alternates: { canonical: `/yasal/${doc.slug}` } };
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (typeof b === 'string') return <p key={i}>{b}</p>;
        const Tag = b.ordered ? 'ol' : 'ul';
        return <Tag key={i}>{b.list.map((li, j) => <li key={j}>{li}</li>)}</Tag>;
      })}
    </>
  );
}

export default async function LegalPage({ params }: PageProps<'/yasal/[sayfa]'>) {
  const { sayfa } = await params;
  const doc = legalBySlug(sayfa);
  if (!doc) notFound();
  return (
    <article className="legal-wrap mx-auto max-w-3xl px-4 pt-32 pb-20 sm:px-6 md:pt-40">
      <p className="no-print text-sm font-bold"><Link href="/yasal" className="text-grape-deep hover:underline">← Yasal metinler</Link></p>
      <h1 className="mt-3 text-4xl font-black text-balance md:text-5xl">{doc.title}</h1>
      <p className="mt-3 text-sm font-semibold text-muted">Son güncelleme: {LEGAL_UPDATED}</p>
      <p className="legal-notice mt-5" role="note">{LEGAL_DISCLAIMER}</p>

      <nav className="legal-toc card mt-8 p-5" aria-labelledby="icindekiler">
        <h2 id="icindekiler" className="text-base font-black">İçindekiler</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px]">
          {doc.sections.map((s) => <li key={s.id}><a className="font-semibold text-grape-deep" href={`#${s.id}`}>{s.title}</a></li>)}
        </ol>
      </nav>

      <div className="legal">
        <p>{doc.intro}</p>
        {doc.sections.map((s, i) => (
          <section key={s.id} aria-labelledby={s.id}>
            <h2 id={s.id}>{i + 1}. {s.title}</h2>
            <Blocks blocks={s.body} />
          </section>
        ))}
      </div>
    </article>
  );
}
