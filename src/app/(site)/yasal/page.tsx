import Link from 'next/link';
import { LEGAL_DOCS, LEGAL_UPDATED } from '@/lib/legal';

export const metadata = {
  title: 'Yasal Metinler',
  description: 'KVKK aydınlatma metni, gizlilik ve çerez politikası, kullanım şartları, mesafeli satış, abonelik sözleşmesi ve iade koşulları.',
  alternates: { canonical: '/yasal' },
};

export default function LegalIndex() {
  return (
    <section className="mx-auto max-w-4xl px-4 pt-32 pb-20 sm:px-6 md:pt-40">
      <h1 className="text-4xl font-black text-balance md:text-5xl">Yasal metinler</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">Verilerinizin nasıl işlendiği, hizmetin koşulları ve satış sözleşmeleri. Son güncelleme: {LEGAL_UPDATED}.</p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {LEGAL_DOCS.map((d) => (
          <li key={d.slug}>
            <Link href={`/yasal/${d.slug}`} className="card card-hover block h-full p-6 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-grape">
              <h2 className="text-xl font-black">{d.title}</h2>
              <p className="mt-2 text-muted">{d.short}</p>
              <span className="mt-4 inline-block font-bold text-grape-deep">Oku →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
