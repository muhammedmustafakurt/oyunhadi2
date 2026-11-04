import { Dice, Star } from './props';

// İç sayfaların başlığı: krem alan, ince ızgara, ortalı kalın başlık, uçuşan iki süs.
export default function PageHero({ eyebrow, title, lead, children }: { eyebrow?: string; title: React.ReactNode; lead?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="hero-light relative overflow-hidden">
      <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden="true" />
      <Dice className="top-28 left-[4%] hidden w-20 lg:block" />
      <Star className="right-[6%] bottom-10 hidden w-16 lg:block" delay="-2s" />
      <div className="relative mx-auto max-w-5xl px-4 pt-32 pb-16 text-center sm:px-6 md:pt-40 md:pb-24">
        {eyebrow && (
          <p className="mb-5 inline-flex rounded-lg border-2 border-ink bg-ink px-3.5 py-1 text-sm font-extrabold text-sun shadow-[3px_3px_0_var(--color-coral)]">{eyebrow}</p>
        )}
        <h1 className="text-4xl leading-[1.02] font-black text-balance md:text-6xl">{title}</h1>
        {lead && <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
