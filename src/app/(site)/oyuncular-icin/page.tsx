import Link from 'next/link';
import PageHero from '@/components/site/page-hero';
import Cta from '@/components/site/cta';
import { BenefitGrid, FaqList, SectionHead, StepCards, Wrap } from '@/components/site/solution-parts';

export const metadata = {
  title: 'Oyuncular için: karekodu okut, oyna',
  description: 'Masadaki karekodu okut, uygulama indirmeden arkadaşlarınla oyna. Takma ad yaz, katıl; konum izni neden isteniyor, masa sohbeti nasıl çalışıyor?',
  alternates: { canonical: '/oyuncular-icin' },
  openGraph: { title: 'Oyuncular için · oyunhadi', description: 'Karekodu okut, takma adını yaz, oyna. Uygulama ve üyelik yok.', url: '/oyuncular-icin' },
};

const BENEFITS = [
  { title: 'Uygulama yok', body: 'Oyun telefonunun tarayıcısında açılır. Hiçbir şey indirmezsin, yer kaplamaz.' },
  { title: 'Üyelik ve şifre yok', body: 'E-posta, telefon numarası ya da şifre istenmez. Yalnızca bir takma ad yazarsın.' },
  { title: 'Masa sohbeti', body: 'Mekân açtıysa başka masadaki biriyle sohbet isteği gönderebilirsin. İki taraf da kabul ederse yazışma açılır; istediğinde engelleyebilir ya da şikâyet edebilirsin.' },
  { title: 'Konum izni neden isteniyor?', body: 'Bazı mekânlar yalnızca mekânda olanların katılmasını ister. Bu durumda telefonunun konumu, mekâna yakın olup olmadığını kontrol etmek için kullanılır. Ayrıntılar Güven sayfasında.' },
];

const STEPS: [string, string][] = [
  ['Karekodu okut', 'Telefon kamerasını masadaki pleksiye tut. Açılan bağlantıya dokun.'],
  ['Oyunu seç, adını yaz', 'Kaç kişi olduğunuza uygun oyunu seç ve bir takma ad yaz. Gerçek adın gerekmez.'],
  ['Arkadaşlarını katıl', 'Masadakiler aynı karekodu okutup katılır. Yeterli kişi olunca biri oyunu başlatır.'],
];

const FAQ = [
  { q: 'Oynamak için internet gerekir mi?', a: 'Evet, oyun telefonların birbirine bağlanması için internet ister. Mekânın Wi-Fi\'ı ya da mobil veri yeterlidir.' },
  { q: 'Hangi telefonlarda çalışır?', a: 'Güncel tarayıcısı olan akıllı telefonların çoğunda çalışır. Çok eski tarayıcılarda bazı özellikler eksik olabilir.' },
  { q: 'Konum iznini vermek zorunda mıyım?', a: 'Yalnızca mekân konum kilidini açmışsa. Kilit kapalıysa konum hiç istenmez. İzin vermezsen kilitli bir masaya katılamazsın.' },
  { q: 'Oyundan çıkarsam ne olur?', a: 'Uzun süre yoklamayan oyuncu masadan çıkarılabilir. Oyuna aynı karekodla tekrar katılabilirsin; ancak oyunun türüne göre yer dolmuş olabilir.' },
  { q: 'Sohbette kimse beni rahatsız edemez mi?', a: 'Sohbet isteği iki taraf kabul edince açılır. İstemediğin kişiyi engelleyebilir, şikâyet edebilirsin. Şikâyet mekân yöneticisinin panelinde görünür.' },
  { q: 'Kazandığım ödül nerede?', a: 'Mekân bir ödül tanımladıysa ve hedefi tutturursan ekranda tek kullanımlık bir kod çıkar. Kodu garsona göster. Kod birkaç saat geçerlidir ve bir kez kullanılır.' },
];

export default function PlayersPage() {
  return (
    <>
      <PageHero eyebrow="Oyuncular için" title={<>Okut, takma adını yaz,<br /><span className="hl-coral">oyna</span></>} lead="İndirme yok, üyelik yok. Masadaki karekod ve arkadaşların yeterli." />

      <Wrap>
        <SectionHead title="Nasıl katılırım?" />
        <StepCards items={STEPS} />
      </Wrap>

      <Wrap className="band-sun py-16 md:py-20">
        <SectionHead title="Bilmen gerekenler" />
        <BenefitGrid items={BENEFITS} />
        <p className="mt-8 text-center">Hangi verinin tutulduğunu merak ediyorsan <Link className="font-bold underline underline-offset-4" href="/guven">Güven sayfasını</Link> oku.</p>
      </Wrap>

      <Wrap max="max-w-3xl" className="pb-16 md:pb-20">
        <SectionHead title="Sık sorulanlar" />
        <FaqList items={FAQ} />
        <p className="mt-8 text-center text-muted">Oyunlara göz atmak için <Link className="font-bold text-grape underline underline-offset-4" href="/oyunlar">Oyunlar sayfasına</Link> git ya da <Link className="font-bold text-grape underline underline-offset-4" href="/gunluk-test">günlük testi</Link> çöz.</p>
      </Wrap>

      <Cta title="Sevdiğin mekânda yok mu?" />
    </>
  );
}
