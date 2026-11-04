import Link from 'next/link';
import PageHero from '@/components/site/page-hero';
import Cta from '@/components/site/cta';
import { FaqList, GameLink, SectionHead, Wrap } from '@/components/site/solution-parts';
import { GAMES } from '@/lib/games';

export const metadata = {
  title: 'Kafe oyunları rehberi: hangi oyun hangi saatte?',
  description: 'Kafe ve restoran sahipleri için rehber: tüm masa oyunlarının kişi sayısı, süresi, uygun olduğu saat ve kitle. Sakin öğleden sonra mı, kalabalık akşam mı?',
  alternates: { canonical: '/kafe-oyunlari-rehberi' },
  openGraph: { title: 'Kafe oyunları rehberi · oyunhadi', description: 'Hangi oyun hangi saatte, hangi kitleye uygun?', url: '/kafe-oyunlari-rehberi' },
};

// Oyun başına "ne zaman, kime" önerisi; kişi sayısı ve süre games.js'ten gelir.
const GUIDE: Record<string, { when: string; who: string; noise: 'sakin' | 'orta' | 'canlı' }> = {
  bil: { when: 'Öğleden sonra, akşam, her saat', who: 'Tek başına gelen çiftler, iş arkadaşları, öğrenciler', noise: 'orta' },
  kadro: { when: 'Maç günleri, akşam', who: 'Futbol seven arkadaş grupları', noise: 'orta' },
  futbolcu: { when: 'Maç öncesi ve sonrası', who: 'Futbol sohbeti eden masalar', noise: 'canlı' },
  spyfall: { when: 'Akşam', who: '4-8 kişilik arkadaş grupları', noise: 'canlı' },
  ajanlar: { when: 'Akşam, hafta sonu', who: 'İki takıma bölünebilen kalabalık masalar', noise: 'orta' },
  vampir: { when: 'Akşam, gece', who: '6-10 kişilik büyük gruplar, doğum günleri', noise: 'canlı' },
  tabu: { when: 'Akşam, hafta sonu', who: 'Takım olmayı seven, gürültüden çekinmeyen gruplar', noise: 'canlı' },
  kimim: { when: 'Her saat, özellikle aile saatleri', who: 'Karma yaş grupları, aileler', noise: 'orta' },
  cizim: { when: 'Öğleden sonra, hafta sonu', who: 'Çocuklu aileler, yaratıcı arkadaşlar', noise: 'orta' },
  satranc: { when: 'Sabah, öğleden sonra', who: 'İki kişilik sakin masalar', noise: 'sakin' },
  azul: { when: 'Öğleden sonra', who: '2-4 kişilik sakin masalar', noise: 'sakin' },
  carcassonne: { when: 'Öğleden sonra, akşam', who: 'Çiftler, aile masaları', noise: 'sakin' },
  scrabble: { when: 'Öğleden sonra, hafta içi akşam', who: 'Kelime sevenler, 2-4 kişilik masalar', noise: 'sakin' },
  cluedo: { when: 'Akşam', who: 'Mantık ve gizem sevenler', noise: 'orta' },
  ticket: { when: 'Hafta sonu öğleden sonra, akşam', who: 'Strateji sevenler, aile', noise: 'sakin' },
  monopoly: { when: 'Hafta sonu akşamı', who: 'Uzun oturan arkadaş grupları', noise: 'orta' },
  catan: { when: 'Hafta sonu akşamı', who: '3-4 kişilik oyun meraklıları', noise: 'orta' },
  pisti: { when: 'Her saat, öğleden sonra', who: 'Kahve içen ikili ve dörtlü masalar, her yaştan oyuncu', noise: 'sakin' },
  okey: { when: 'Akşam, hafta sonu', who: 'Okey geleneği olan arkadaş grupları, 2-4 kişi', noise: 'orta' },
  g2048: { when: 'Her saat', who: 'Sipariş beklerken kısa rekabet isteyen masalar', noise: 'sakin' },
  adam: { when: 'Öğleden sonra, aile saatleri', who: 'Çocuklu aileler, kelime seven gruplar', noise: 'orta' },
  risk: { when: 'Hafta sonu akşamı, gece', who: 'Saatlerce oturmayı göze alan gruplar', noise: 'orta' },
};

const NOISE_TONE = { sakin: 'bg-leaf/15 text-leaf', orta: 'bg-sun/40 text-ink', canlı: 'bg-coral/15 text-coral-deep' } as const;

const SLOTS = [
  { title: 'Sabah ve öğle', body: 'Laptopla çalışanlar ve yalnız içenler çoğunlukta. Gürültülü oyunları kapalı tutun; Satranç ve Bil Bakalım sakin masalar için yeterli.', ids: ['satranc', 'bil'] },
  { title: 'Öğleden sonra', body: 'İki üç kişilik sohbet masaları ve ders sonrası öğrenciler. Sakin strateji ve kelime oyunları burada parlar.', ids: ['azul', 'scrabble', 'carcassonne'] },
  { title: 'Akşam', body: 'Masalar büyür, ses yükselir. Blöf ve takım oyunlarının zamanı; duyuru panosundan akşama özel bir mesaj koymak için de iyi saat.', ids: ['tabu', 'spyfall', 'ajanlar'] },
  { title: 'Gece ve hafta sonu', body: 'Uzun oturan büyük gruplar için süresi uzun oyunlar: bir akşam boyunca devam eden masa, mekânda geçen süreyi uzatır.', ids: ['vampir', 'catan', 'risk'] },
];

const KITLE = [
  ['Çiftler', 'Satranç, Azul, Carcassonne, Bil Bakalım'],
  ['4-6 kişilik arkadaş masası', 'Tabu, Casus, Gizli Ajanlar, Kadro, Futbolcuyu Bul'],
  ['Büyük gruplar (7-10 kişi)', 'Vampir Köylü, Tabu, Ben Kimim?, Çiz Bakalım'],
  ['Çocuklu aileler', 'Çiz Bakalım, Ben Kimim?, Bil Bakalım, Adam Asmaca'],
  ['Okey ve Pişti sevenler', 'Okey 101, Pişti'],
  ['Strateji sevenler', 'Catan, Risk, Ticket to Ride, Emlak Krallığı'],
  ['Futbol sohbeti edenler', 'Kadro, Futbolcuyu Bul'],
];

const FAQ = [
  { q: 'Bütün oyunları açık bırakmalı mıyım?', a: 'Başlangıçta evet; panelden hangi oyunun ne kadar oynandığını göreceksiniz. Sonra ortamınıza uymayan oyunları tek dokunuşla kapatabilirsiniz.' },
  { q: 'Hangi oyunla başlamalıyım?', a: 'Bil Bakalım, Tabu ve Casus ilk günden anlaşılır, kısa oyunlardır. Uzun strateji oyunları tutunca zaten kendini gösterir.' },
  { q: 'Saate göre oyun listesini otomatik değiştirebilir miyim?', a: 'Hayır. Oyunları panelden elle açıp kapatırsınız; saate göre otomatik değişim şu an yok.' },
];

export default function GuidePage() {
  const rows = GAMES.filter((g) => g.play);
  return (
    <>
      <PageHero eyebrow="Rehber" title={<>Hangi oyun,<br /><span className="hl-coral">hangi saatte, kime?</span></>} lead="Mekân sahibi için pratik rehber: oyunların kişi sayısı, süresi ve en iyi çalıştığı ortam. Tabloyu bir kez gözden geçirin, panelden oyun listenizi buna göre ayarlayın." />

      <Wrap>
        <SectionHead title="Gün içinde oyun akışı" lead="Aynı mekânın sabah ve gece kitlesi farklıdır. Oyun listesini buna göre düşünün." />
        <div className="grid gap-5 sm:grid-cols-2">
          {SLOTS.map((s) => (
            <article key={s.title} className="card p-7">
              <h3 className="text-xl font-extrabold">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
              <p className="mt-4 flex flex-wrap gap-2">
                {s.ids.map((id) => (
                  <Link key={id} href={`/oyunlar/${id}`} className="inline-flex min-h-11 items-center chip px-4 text-sm">{GAMES.find((g) => g.id === id)?.name}</Link>
                ))}
              </p>
            </article>
          ))}
        </div>
      </Wrap>

      <Wrap className="band-sun py-16 md:py-20">
        <SectionHead title="Kitleye göre öneri" />
        <ul className="grid gap-4 sm:grid-cols-2">
          {KITLE.map(([k, v]) => (
            <li key={k} className="card p-5">
              <p className="font-extrabold">{k}</p>
              <p className="mt-1 text-[15px] text-muted">{v}</p>
            </li>
          ))}
        </ul>
      </Wrap>

      <Wrap max="max-w-7xl">
        <SectionHead title={`${rows.length} oyunun tamamı`} lead="Kişi sayısı ve süreler oyun listesinde yazan değerlerdir. Gürültü sütunu masada çıkan sesi gösterir: sakin, orta, canlı." />
        <div className="overflow-x-auto rounded-xl border-[2.5px] border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)]" tabIndex={0} role="region" aria-label="Oyun karşılaştırma tablosu">
          <table className="w-full min-w-[720px] text-left text-[15px]">
            <caption className="sr-only">Oyunlara göre kişi sayısı, süre, uygun saat ve kitle</caption>
            <thead>
              <tr className="border-b-[2.5px] border-ink bg-sun text-sm">
                <th scope="col" className="px-4 py-3 font-extrabold">Oyun</th>
                <th scope="col" className="px-4 py-3 font-extrabold">Kişi</th>
                <th scope="col" className="px-4 py-3 font-extrabold">Süre</th>
                <th scope="col" className="px-4 py-3 font-extrabold">En iyi saat</th>
                <th scope="col" className="px-4 py-3 font-extrabold">Kitle</th>
                <th scope="col" className="px-4 py-3 font-extrabold">Gürültü</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => {
                const x = GUIDE[g.id];
                return (
                  <tr key={g.id} className="border-b border-line last:border-0">
                    <th scope="row" className="px-4 py-3 font-bold"><Link className="underline-offset-4 hover:underline" href={`/oyunlar/${g.id}`}>{g.name}</Link></th>
                    <td className="px-4 py-3 whitespace-nowrap">{g.players}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{g.minutes} dk</td>
                    <td className="px-4 py-3 text-muted">{x?.when}</td>
                    <td className="px-4 py-3 text-muted">{x?.who}</td>
                    <td className="px-4 py-3">{x && <span className={`rounded-md border-2 border-ink px-2.5 py-0.5 text-xs font-extrabold ${NOISE_TONE[x.noise]}`}>{x.noise}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-sm text-muted sm:hidden">Tabloyu yana kaydırarak okuyabilirsiniz.</p>
      </Wrap>

      <Wrap className="pt-0 pb-16 md:pb-20">
        <SectionHead title="Kısa akşam için üç öneri" lead="Sipariş bekleme süresine sığan, ilk günden anlaşılan oyunlar." />
        <div className="grid gap-5 md:grid-cols-3">
          <GameLink id="bil" />
          <GameLink id="kadro" />
          <GameLink id="spyfall" />
        </div>
      </Wrap>

      <Wrap max="max-w-3xl" className="pb-16 md:pb-20">
        <SectionHead title="Sık sorulanlar" />
        <FaqList items={FAQ} />
        <p className="mt-8 text-center text-muted">Mekân türünüze özel öneriler için <Link className="font-bold text-grape underline underline-offset-4" href="/cozumler">çözümler sayfasına</Link> bakın.</p>
      </Wrap>

      <Cta title="Oyun listenizi birlikte kuralım" lead="Mekânınızı ve kitlenizi anlatın, hangi oyunların işinize yarayacağını birlikte konuşalım." />
    </>
  );
}
