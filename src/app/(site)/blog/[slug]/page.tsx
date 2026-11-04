import Link from 'next/link';
import { jsonLdString } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Cta from '@/components/site/cta';
import { POSTS, findPost, fmtDate } from '@/lib/blog';
import { SITE_URL } from '@/lib/site';

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params;
  const p = findPost(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: 'article', title: p.title, description: p.description, publishedTime: p.date },
  };
}

export default async function PostPage({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params;
  const p = findPost(slug);
  if (!p) notFound();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.description,
    datePublished: p.date,
    url: `${SITE_URL}/blog/${p.slug}`,
    publisher: { '@type': 'Organization', name: 'oyunhadi' },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <article>
        <header className="hero-light relative overflow-hidden">
          <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-3xl px-4 pt-32 pb-14 sm:px-6 md:pt-40">
            <Link href="/blog" className="text-sm font-semibold text-muted hover:text-ink">← Blog</Link>
            <p className="mt-6 text-sm font-bold text-coral">{p.tag} · {fmtDate(p.date)} · {p.readMin} dk okuma</p>
            <h1 className="mt-3 text-4xl leading-[1.05] font-black md:text-6xl">{p.title}</h1>
            <p className="mt-6 text-xl text-muted">{p.description}</p>
          </div>
        </header>
        <div className="mx-auto max-w-3xl space-y-8 px-4 py-14 text-lg leading-relaxed sm:px-6 md:py-20">
          {p.body.map((b, i) => (
            <div key={i}>
              {b.h && <h2 className="mb-3 text-2xl font-black md:text-3xl">{b.h}</h2>}
              <p className="text-ink/80">{b.p}</p>
            </div>
          ))}
        </div>
      </article>
      <Cta />
    </>
  );
}
