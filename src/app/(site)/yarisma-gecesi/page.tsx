import Link from 'next/link';
import PageHero from '@/components/site/page-hero';
import Cta from '@/components/site/cta';
import { FaqList, GameLink, SectionHead, Wrap } from '@/components/site/solution-parts';

export const metadata = {
  title: 'Kafede yarışma gecesi nasıl kurulur?',
  description: 'Bil Bakalım ve ödül kodlarıyla kafenizde yarışma gecesi: duyuru, masa düzeni, ödül tanımı ve akşam akışı adım adım.',
  alternates: { canonical: '/yarisma-gecesi' },
  openGraph: { title: 'Kafede yarışma gecesi nasıl kurulur? · oyunhadi', description: 'Bil Bakalım ve ödül kodlarıyla adım adım yarışma akşamı.', url: '/yarisma-gecesi' },
};

const STEPS = [
  { h: 'Gün ve saati seçin', p: 'Hafta içi sakin bir akşam en uygun olanıdır: masalar yarı dolu, ses seviyesi düşüktür, yarışma da kalabalıkta kaybolmaz. Tarihi bir hafta önceden duyurun.' },
  { h: 'Duyuruyu panoya koyun', p: 'Panelde duyuru panosuna başlık ve kısa metin yazın: "Perşembe 20.00 Bil Bakalım gecesi, kazanan masaya ikram". Duyuru oyun listesinin en üstünde görünür. Masaya yazdığınız küçük bir kartla da destekleyin.' },
  { h: 'Ödülü tanımlayın', p: 'Panelde ödül bölümünde bir oyun, bir hedef ve bir ödül yazarsınız; örneğin oyun Bil Bakalım, hedef "6.000 puanı geç", ödül "1 tatlı ikram". Hedefi tutturan masaya tek kullanımlık kod çıkar. Ödülü ve maliyetini siz belirlersiniz; hedefi tutturmak zor olmasın ama kolay da olmasın.' },
  { h: 'Başlangıç saatinde herkes aynı anda başlasın', p: 'Her masa kendi karekodunu okutup Bil Bakalım\'ı açar. Bir çalışanınız "Başlıyoruz!" dediğinde masalar aynı anda başlar. Her masa 2-10 kişiyle 10 soru oynar, her soruda 15 saniye vardır.' },
  { h: 'Kodları doğrulayın', p: 'Hedefi tutturan masa kodu garsona gösterir. Garson kodu panelden doğrular; kod bir kez kullanılabilir ve birkaç saat sonra geçerliliğini yitirir.' },
  { h: 'Akşamı panelden değerlendirin', p: 'Ertesi gün panelden o akşam kaç masanın oynadığını ve hangi saatlerin yoğun olduğunu görün. Bir sonraki yarışmaya kadar neyi değiştireceğinize buradan karar verin.' },
];

const IDEAS = [
  ['Masa temalı yarış', 'Her masa bir takım adı seçer, tur boyunca aynı kalır. Kazanan masa tüm masalar arasında alkışlanır.'],
  ['Turlu akış', 'Akşamı üç tura bölün: ısınma (Bil Bakalım), ana tur (Kadro ya da Bil Bakalım), final (kazanan masalar tekrar).'],
  ['Ödül çeşitliği', 'Tek bir ödül tanımlanabildiği için ek ödüller (örneğin son sıraya teselli ikramı) mekânınızın kendi kararıdır, kodla değil sizin vereceğiniz ikramla yapılır.'],
];

const FAQ = [
  { q: 'Masalar arası ortak sıralama tablosu var mı?', a: 'Hayır. Her masa kendi oyununu oynar ve kendi sonucunu görür. Masalar arası sıralamayı duyuru ve çalışanınızın takibiyle sözlü yapabilirsiniz.' },
  { q: 'Birden fazla ödül tanımlayabilir miyim?', a: 'Panel şu an tek bir oyun, hedef ve ödül tanımını destekler. Etkinlikten sonra değiştirebilirsiniz.' },
  { q: 'Hile yapılabilir mi?', a: 'Konum kilidini açarsanız mekân dışından katılım engellenir. Oyun kuralları sunucuda işlenir; yine de ödülün ciddiyetine göre masaları garsonlarınızın yakından izlemesi iyi olur.' },
];

export default function ContestNightPage() {
  return (
    <>
      <PageHero eyebrow="Etkinlik" title={<>Kafenizde <span className="hl-coral">yarışma gecesi</span> kurun</>} lead="Bil Bakalım, duyuru panosu ve ödül kodlarıyla bir akşamlık turnuva: ekstra donanım yok, ekran kurulumu yok." />

      <Wrap max="max-w-4xl">
        <SectionHead title="Adım adım kurulum" lead="Aşağıdaki akış tek bir akşam içindir; her adım panelde zaten olan özelliklerle yapılır." />
        <ol className="space-y-4">
          {STEPS.map((s, i) => (
            <li key={s.h} className="card flex gap-4 p-6 sm:gap-5 sm:p-7">
              <span className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink text-sm font-black text-sun">{i + 1}</span>
              <div>
                <h3 className="text-xl font-extrabold">{s.h}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.p}</p>
              </div>
            </li>
          ))}
        </ol>
      </Wrap>

      <Wrap className="band-sun py-16 md:py-20">
        <SectionHead title="Akşamı renklendiren fikirler" />
        <div className="grid gap-5 md:grid-cols-3">
          {IDEAS.map(([h, p]) => (
            <article key={h} className="card p-6">
              <h3 className="text-lg font-extrabold">{h}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{p}</p>
            </article>
          ))}
        </div>
      </Wrap>

      <Wrap>
        <SectionHead title="Yarışma için uygun oyunlar" />
        <div className="grid gap-5 md:grid-cols-3">
          <GameLink id="bil" why="Herkes aynı soruyu aynı anda cevaplar; hız ve seri bonusu puanı belirler. Ödül hedefi buna bağlanabilir." />
          <GameLink id="kadro" why="Süper Lig kadronu kur, puan ortalaması en yüksek kazansın. Futbol akşamı için." />
          <GameLink id="futbolcu" why="Evet-hayır soruları, ortak sohbet; yarışma öncesi ısınma turu." />
        </div>
      </Wrap>

      <Wrap max="max-w-3xl" className="pb-16 md:pb-20">
        <SectionHead title="Sık sorulanlar" />
        <FaqList items={FAQ} />
        <p className="mt-8 text-center text-muted">Fiyat ve kapsam için <Link className="font-bold text-grape underline underline-offset-4" href="/fiyat">Fiyat sayfasına</Link> bakın.</p>
      </Wrap>

      <Cta title="İlk yarışma geceniz için hazırız" />
    </>
  );
}
