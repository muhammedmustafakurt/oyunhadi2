import Link from 'next/link';
import PageHero from '@/components/site/page-hero';
import { POSTS, fmtDate } from '@/lib/blog';

export const metadata = {
  title: 'Blog',
  description: 'Kafe ve restoran işletmecileri için misafir deneyimi, etkinlik fikirleri ve masa oyunları üzerine yazılar.',
  alternates: { canonical: '/blog' },
};

const TAG = ['bg-coral', 'bg-sky', 'bg-leaf', 'bg-grape'];

export default function BlogPage() {
  const [first, ...rest] = POSTS;
  return (
    <>
      <PageHero eyebrow="Blog" title={<>Masadan <span className="squiggle">notlar</span></>} lead="Mekânınızı daha eğlenceli, daha dolu ve daha akılda kalıcı yapmak için fikirler." />
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Link href={`/blog/${first.slug}`} className="band-grape group relative mb-6 grid gap-6 overflow-hidden rounded-[14px] border-[3px] border-ink shadow-[6px_6px_0_var(--color-ink)] p-8 md:grid-cols-[1fr_auto] md:p-12">
            <div className="confetti pointer-events-none absolute inset-0" aria-hidden="true" />
            <div className="relative">
              <p className="mb-3 text-sm font-semibold text-sun">{first.tag} · {fmtDate(first.date)}</p>
              <h2 className="text-3xl font-black group-hover:underline md:text-4xl">{first.title}</h2>
              <p className="mt-3 max-w-2xl text-white/85">{first.description}</p>
            </div>
            <span className="btn btn-white relative self-end">{first.readMin} dk okuma →</span>
          </Link>
          <div className="grid gap-6 md:grid-cols-2">
            {rest.map((p, i) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="card card-hover group p-7">
                <span className={`inline-block rounded-md border-2 border-ink px-3 py-1 text-xs font-extrabold text-white ${TAG[(i + 1) % TAG.length]}`}>{p.tag}</span>
                <h2 className="mt-4 text-2xl font-black group-hover:underline">{p.title}</h2>
                <p className="mt-2 text-muted">{p.description}</p>
                <p className="mt-5 text-sm text-muted">{fmtDate(p.date)} · {p.readMin} dk okuma</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
