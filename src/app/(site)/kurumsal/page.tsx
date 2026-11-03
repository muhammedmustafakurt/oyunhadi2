import Link from 'next/link';
import PageHero from '@/components/site/page-hero';
import Cta from '@/components/site/cta';
import { BenefitGrid, FaqList, SectionHead, StepCards, Wrap } from '@/components/site/solution-parts';
import { PRICE } from '@/lib/site';

export const metadata = {
  title: 'Zincir ve çok şubeli mekânlar',
  description: 'Birden fazla şubesi olan kafe, restoran ve eğlence mekânları için oyunhadi: her şube kendi kaydı, kendi logosu ve renkleriyle; teklif şube sayısına göre.',
  alternates: { canonical: '/kurumsal' },
  openGraph: { title: 'Zincir ve çok şubeli mekânlar · oyunhadi', description: 'Her şube ayrı mekân kaydı olarak kurulur, teklif şube sayısına göre hazırlanır.', url: '/kurumsal' },
};

const BENEFITS = [
  { title: 'Her şube kendi kaydı', body: 'Her şube ayrı bir mekân olarak kurulur: kendi masa sayısı, kendi karekodları, kendi açık oyun listesi, kendi duyurusu ve ödülü.' },
  { title: 'Şubeye göre oyun listesi', body: 'Üniversite yanındaki şubede hızlı oyunlar, merkezdeki şubede uzun strateji oyunları. Hangi şubede hangi oyun açık olsun, siz karar verirsiniz.' },
  { title: 'Aynı marka, aynı renkler', body: 'Aynı logo ve renkleri her şubeye girebilirsiniz; misafir hangi şubede olursa olsun tanıdık bir ekranla karşılaşır.' },
  { title: 'Konum kilidi şube şube', body: 'Konum kilidi her şubenin kendi koordinatına göre çalışır. Bir şubenin karekodu başka şubede ya da evde oyun açmaz.' },
];

const STEPS: [string, string][] = [
  ['Şube listesini paylaşın', 'Şube adları, şehirler ve masa sayılarını bize iletin.'],
  ['Her şube için teklif', 'Teklif şube sayısı ve toplam masa sayısına göre hazırlanır; kalemleri birlikte netleştiririz.'],
  ['Şube şube kurulum', 'Her şubeye masa sayısı kadar karekodlu pleksi gönderilir; her şube kendi panelinden yönetilir.'],
];

const FAQ = [
  { q: 'Tüm şubeleri tek panelde görebilir miyim?', a: 'Şu an hayır. Panelde şube hiyerarşisi ya da birleşik rapor yok: her şube ayrı bir mekân kaydıdır ve kendi panelinden yönetilir. Merkezi bakış istiyorsanız şube yöneticilerinizden aynı haftalık rakamları isteyebilirsiniz.' },
  { q: 'Fiyat nasıl hesaplanır?', a: `Tek paket var; güncel yıllık fiyat ${PRICE.yearly} ${PRICE.note}. Çok şubeli mekânlar için teklif şube sayısına göre hazırlanır; özel bir koşul olup olmadığını görüşmede birlikte konuşuruz.` },
  { q: 'Şubeler aynı logoyu kullanabilir mi?', a: 'Evet. Her şube kaydına aynı logoyu ve renkleri girebilirsiniz; isterseniz şubeye özel karşılama metni ya da duyuru da yazabilirsiniz.' },
  { q: 'Yeni şube açtığımızda ne yapacağız?', a: 'Yeni şube için yeni bir mekân kaydı ve o şubenin masa sayısı kadar karekod hazırlanır. Teklif bu eklemeye göre güncellenir.' },
];

export default function CorporatePage() {
  return (
    <>
      <PageHero eyebrow="Kurumsal" title={<>Birden fazla şube,<br /><span className="hl-coral">aynı oyun deneyimi</span></>} lead="Zincir kafe, restoran ve eğlence mekânları için: her şube kendi karekodları, kendi renkleri ve kendi paneliyle kurulur." />

      <Wrap>
        <SectionHead title="Nasıl çalışır?" lead="Şubeleriniz ayrı mekân kayıtları olarak kurulur. Bu, her şubenin kendi ritmine göre ayar yapabilmesi demektir." />
        <BenefitGrid items={BENEFITS} />
      </Wrap>

      <Wrap className="band-grape py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl leading-[1.08] font-black md:text-4xl">Dürüst bir not</h2>
          <p className="mt-5 text-lg text-white/90">Şu an panelde çok şubeli bir hiyerarşi ya da tek ekranda toplu rapor yok. Her şubenin kendi paneli var; teklif şube sayısına göre hazırlanır. Merkezi bakış sizin için önemliyse teklif formunda yazın, ihtiyacınızı not alalım.</p>
        </div>
      </Wrap>

      <Wrap>
        <SectionHead title="Kurulum nasıl ilerler?" />
        <StepCards items={STEPS} />
      </Wrap>

      <Wrap max="max-w-3xl" className="pb-16 md:pb-20">
        <SectionHead title="Sık sorulanlar" />
        <FaqList items={FAQ} />
        <p className="mt-8 text-center text-muted">Tek mekân mı? <Link className="font-bold text-grape underline underline-offset-4" href="/fiyat">Fiyat sayfasına</Link> bakın.</p>
      </Wrap>

      <Cta title="Şubeleriniz için teklif alın" lead="Şube sayınızı ve masa sayılarını yazın, size şube bazlı bir teklif hazırlayalım." />
    </>
  );
}
