import Link from 'next/link';
import Accordion from '@/components/site/accordion';
import { IconBox } from '@/components/site/icon';
import { GAMES } from '@/lib/games';

const TONES = ['coral', 'grape', 'sky', 'leaf', 'rose', 'sun'] as const;
const ICONS = ['group', 'gift', 'chart', 'megaphone', 'pin', 'toggle'];
const NUM = ['text-coral-deep', 'text-grape', 'text-sky'];

// Bölüm başlığı: ortalı H2 ve isteğe bağlı kısa açıklama.
export function SectionHead({ title, lead, align = 'center' }: { title: React.ReactNode; lead?: React.ReactNode; align?: 'center' | 'left' }) {
  return (
    <div className={`mb-10 max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
      <h2 className="text-3xl leading-[1.08] font-black text-balance md:text-4xl">{title}</h2>
      {lead && <p className="mt-4 text-lg text-muted">{lead}</p>}
    </div>
  );
}

// Oyun kartı: ad, kişi sayısı, süre ve neden bu ortama uygun olduğu; oyun sayfasına bağlanır.
export function GameLink({ id, why }: { id: string; why?: string }) {
  const g = GAMES.find((x) => x.id === id);
  if (!g) return null;
  return (
    <Link href={`/oyunlar/${g.id}`} className="card card-hover flex min-h-11 flex-col p-6">
      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-xl font-extrabold">{g.name}</span>
        <span className="text-sm font-semibold text-muted">{g.players} kişi · {g.minutes} dk</span>
      </span>
      <span className="mt-2 text-[15px] leading-relaxed text-muted">{why ?? g.note}</span>
      <span className="mt-4 text-sm font-bold text-grape">Oyunu incele →</span>
    </Link>
  );
}

// İkon kutulu fayda kartları.
export function BenefitGrid({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {items.map((b, i) => (
        <article key={b.title} className="card p-7">
          <IconBox name={ICONS[i % ICONS.length]} tone={TONES[i % TONES.length]} />
          <h3 className="mt-5 text-xl font-extrabold">{b.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{b.body}</p>
        </article>
      ))}
    </div>
  );
}

// Üç (ya da daha fazla) adımlı akış.
export function StepCards({ items }: { items: [string, string][] }) {
  return (
    <ol className={`grid gap-5 ${items.length === 3 ? 'md:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {items.map(([h, p], i) => (
        <li key={h} className="card relative overflow-hidden p-7">
          <span className={`font-display text-sm font-black ${NUM[i % NUM.length]}`}>ADIM {String(i + 1).padStart(2, '0')}</span>
          <h3 className="mt-3 text-xl font-extrabold">{h}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{p}</p>
        </li>
      ))}
    </ol>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((f) => <Accordion key={f.q} title={f.q}>{f.a}</Accordion>)}
    </div>
  );
}

// Sayfa gövdesi sarmalayıcısı.
export function Wrap({ children, className = 'py-16 md:py-20', max = 'max-w-6xl' }: { children: React.ReactNode; className?: string; max?: string }) {
  return (
    <section className={className}>
      <div className={`mx-auto ${max} px-4 sm:px-6`}>{children}</div>
    </section>
  );
}
