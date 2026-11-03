import PageHero from '@/components/site/page-hero';
import Accordion from '@/components/site/accordion';
import Cta from '@/components/site/cta';
import Icon from '@/components/site/icon';
import { whatsappLink } from '@/lib/site';
import { PARTNERS, PARTNER_FAQ, PARTNER_GIVES, PARTNER_EMAIL, partnerMailto, partnerMessage } from '@/lib/partners';

export const metadata = {
  title: 'Ortaklık Programları',
  description: 'Influencer, menü, sadakat, kurumsal ortaklık ve kampüs temsilciliği. oyunhadi ile mekânlara masa oyunları getirin; şartlar başvuru sonrası görüşmede netleşir.',
  alternates: { canonical: '/ortaklik' },
};

export default function PartnersPage() {
  return (
    <>
      <PageHero
        eyebrow="Ortaklık"
        title={<>oyunhadi ile <span className="hl-coral">birlikte büyüyelim</span></>}
        lead="Mekânlara masa oyunları getiren ekibe katılın. Size uygun programı seçin, WhatsApp ya da e-postayla başvurun."
      />

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-2xl font-black md:text-3xl">Programlar</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {PARTNERS.map((p) => (
              <article key={p.slug} className="card flex flex-col p-6 md:p-7" aria-labelledby={`p-${p.slug}`}>
                <p className="text-sm font-bold text-grape-deep">{p.tag}</p>
                <h3 id={`p-${p.slug}`} className="mt-1 text-2xl font-black">{p.title}</h3>
                <dl className="mt-4 space-y-4 text-[15px] leading-relaxed">
                  <div><dt className="font-bold">Kimler için</dt><dd className="text-muted">{p.forWho}</dd></div>
                  <div>
                    <dt className="font-bold">Ne yaparsınız</dt>
                    <dd><ul className="mt-1 space-y-1 text-muted">{p.does.map((d) => <li key={d} className="flex gap-2"><span className="mt-1 shrink-0"><Icon name="check" className="fill-leaf" /></span>{d}</li>)}</ul></dd>
                  </div>
                  <div><dt className="font-bold">Nasıl başvurulur</dt><dd className="text-muted">{p.how}</dd></div>
                </dl>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-auto md:pt-2">
                  <a className="btn btn-dark" href={whatsappLink(partnerMessage(p.title))} target="_blank" rel="noopener noreferrer">WhatsApp ile başvur</a>
                  <a className="btn btn-outline" href={partnerMailto(p.title)}>E-posta ile başvur</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-black md:text-3xl">Tüm programlarda ne sağlıyoruz?</h2>
          <ul className="mt-6 space-y-3">
            {PARTNER_GIVES.map((g) => <li key={g} className="flex gap-3 font-semibold"><span className="mt-1"><Icon name="check" className="fill-leaf" /></span>{g}</li>)}
          </ul>
          <p className="mt-6 rounded-2xl border border-line bg-paper p-5 text-[15px] text-muted">
            Komisyon, gelir payı ya da fiyat konusunda bu sayfada bir vaadimiz yok. Şartlar başvuru sonrası görüşmede netleşir. Başvuru e-postası: <a className="font-semibold text-ink underline" href={`mailto:${PARTNER_EMAIL}`}>{PARTNER_EMAIL}</a>
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-6 text-2xl font-black md:text-3xl">Sık sorulanlar</h2>
          <div className="space-y-3">{PARTNER_FAQ.map((f) => <Accordion key={f.q} title={f.q}>{f.a}</Accordion>)}</div>
        </div>
      </section>

      <Cta title="Birlikte çalışalım" lead="Size uygun programı seçin, WhatsApp ya da e-postayla yazın; ilk tanışma görüşmesini ayarlayalım." />
    </>
  );
}
