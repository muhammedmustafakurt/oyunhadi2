import Link from 'next/link';
import PageHero from '@/components/site/page-hero';
import Cta from '@/components/site/cta';
import { BenefitGrid, FaqList, GameLink, SectionHead, StepCards, Wrap } from '@/components/site/solution-parts';

export const metadata = {
  title: 'Kampüs kafeleri ve öğrenci toplulukları',
  description: 'Kampüs kafesinde turnuva ve yarışma akşamı kurun: Bil Bakalım, Kadro ve Gizli Ajanlar ile masalar yarışsın, kazanan masa ikramını alsın.',
  alternates: { canonical: '/kampus' },
  openGraph: { title: 'Kampüs kafeleri ve öğrenci toplulukları · oyunhadi', description: 'Üyeliksiz, uygulamasız; karekodu okutan öğrenci oynar.', url: '/kampus' },
};

const BENEFITS = [
  { title: 'Üyelik, uygulama, hesap yok', body: 'Öğrenci karekodu okutur, bir takma ad yazar ve oynar. E-posta, öğrenci numarası ya da şifre istenmez.' },
  { title: 'Ders arasına sığar', body: 'Bil Bakalım ve Kadro 5-8 dakikada biter; kısa bir ara bile bir tura yeter.' },
  { title: 'Kulüp akşamları için', body: 'Bir kulüp ya da toplulukla ortak akşam kurup duyuru panosundan tarihi ve saati ilan edebilirsiniz.' },
  { title: 'Ödül sizin kontrolünüzde', body: 'Kazanan masaya tek kullanımlık ödül kodu çıkar. İkram bir çay, tatlı ya da kafede geçerli bir indirim olabilir; kararı siz verirsiniz.' },
];

const STEPS: [string, string][] = [
  ['Akşamı duyurun', 'Duyuru panosuna "Perşembe 18.00 Bil Bakalım turnuvası" yazın; oyun listesini açan her masa görür.'],
  ['Masalar kendi telefonundan oynar', 'Her masa kendi karekodunu okutur. Kulüp ya da kafe çalışanı başlangıç saatini duyurur, masalar aynı anda başlar.'],
  ['Kazanan kodunu gösterir', 'Hedefi tutturan masaya çıkan kodu garson panelden doğrular, ikram verilir.'],
];

const FAQ = [
  { q: 'Öğrenci kulüpleri nasıl yararlanır?', a: 'Kulüp, kafe sahibiyle bir akşam belirler; kafe duyuruyu panoya koyar, masalar oyunu oynar. Kulübe özel bir ekran ya da hesap yoktur.' },
  { q: 'Büyük bir turnuva için tek ekranda sıralama var mı?', a: 'Hayır. Her masa kendi oyununu oynar; masalar arası ortak bir sıralama tablosu şu an yok. Kazananı masalar kendi içinde belirler, kafe de ödül kodlarını masa bazında verir.' },
  { q: 'Fiyat kampüs kafeleri için farklı mı?', a: 'Tek paket var; güncel fiyat Fiyat sayfasında. Özel bir koşul gerekiyorsa teklif formunda belirtin.' },
];

export default function CampusPage() {
  return (
    <>
      <PageHero eyebrow="Kampüs" title={<>Final haftası değil,<br /><span className="hl-coral">turnuva haftası</span></>} lead="Kampüs kafeleri ve öğrenci toplulukları için: üyeliksiz, uygulamasız, masa masa yarışılan oyun akşamları." />

      <Wrap>
        <SectionHead title="Neden kampüste işe yarar?" />
        <BenefitGrid items={BENEFITS} />
      </Wrap>

      <Wrap className="band-sun py-16 md:py-20">
        <SectionHead title="Turnuva ve yarışma akşamı fikri" lead="Kafe ve topluluk birlikte bir akşam seçer, oyun hazır gelir." />
        <StepCards items={STEPS} />
        <p className="mt-8 text-center">Adım adım kurulum için <Link className="font-bold underline underline-offset-4" href="/yarisma-gecesi">yarışma gecesi rehberine</Link> bakın.</p>
      </Wrap>

      <Wrap>
        <SectionHead title="Kampüste en iyi giden oyunlar" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <GameLink id="bil" why="Herkes aynı soruyu aynı anda cevaplar. Hız ve seri bonusuyla puan toplanır." />
          <GameLink id="kadro" why="Futbolu seven öğrenci masası için 5-8 dakikalık kadro kurma yarışı." />
          <GameLink id="ajanlar" why="İki takımlı kelime oyunu; kulüp ve sınıf grupları için." />
        </div>
      </Wrap>

      <Wrap max="max-w-3xl" className="pb-16 md:pb-20">
        <SectionHead title="Sık sorulanlar" />
        <FaqList items={FAQ} />
        <p className="mt-8 text-center text-muted">Daha fazla ayrıntı için <Link className="font-bold text-grape underline underline-offset-4" href="/cozumler/kampus-kafesi">kampüs kafesi çözüm sayfasına</Link> bakın.</p>
      </Wrap>

      <Cta title="Kampüs kafeniz için teklif alın" />
    </>
  );
}
