import Link from 'next/link';
import PageHero from '@/components/site/page-hero';
import Cta from '@/components/site/cta';
import { FaqList, SectionHead, Wrap } from '@/components/site/solution-parts';

export const metadata = {
  title: 'Güven ve veri',
  description: 'oyunhadi hangi verileri tutar? Takma ad, rastgele tarayıcı kimliği, oda durumu, masa sohbeti ve oyun kayıtları; konum kilidi nasıl çalışır, hesap ve şifre neden yok.',
  alternates: { canonical: '/guven' },
  openGraph: { title: 'Güven ve veri · oyunhadi', description: 'Hangi veri tutulur, hangisi tutulmaz? Açık açık anlatıyoruz.', url: '/guven' },
};

const DATA: [string, string, string][] = [
  ['Takma ad', 'Oyunda ve masa sohbetinde sizi diğer oyunculara göstermek için.', 'Oyuncunun kendi yazdığı ad. Telefonun tarayıcısında hatırlanır (oh-name); oyun odasında oyun boyunca durur. Gerçek ad istenmez.'],
  ['Rastgele tarayıcı kimliği', 'Aynı telefonun masadaki yerini tanımak için.', 'Telefonun tarayıcısında rastgele üretilen bir kod (oh-pid). Ad, telefon numarası ya da e-postayla ilişkilendirilmez. Başka oyunculara gönderilmez.'],
  ['Oda durumu', 'Oyunun herkesin ekranında aynı görünmesi için.', 'Mekân, masa ve oyun başına bir satır: koltuklar, hamleler, puanlar. Altı saat işlem görmeyen oda sıfırlanır.'],
  ['Masa sohbeti', 'Masalar arasında, iki tarafın da kabul ettiği özel yazışma için.', 'Takma ad, kısa tanıtım yazısı ve mesajlar. Mekân sohbeti kapatabilir; mesajlar, oda kapandıktan sonra mekânın belirlediği saklama süresi (varsayılan 24 saat, en çok 168 saat) dolunca silinir.'],
  ['Oyun kayıtları', 'Mekân panelindeki istatistikler için.', 'Başlayan her oyun için mekân, masa, oyun, oyuncu sayısı ve zaman. İçinde isim ya da kimlik yoktur.'],
  ['Hız sınırı sayaçları', 'Kötüye kullanımı ve aşırı isteği engellemek için.', 'İstek sayısı IP adresi ve masa bazında sayılır. 24 saatten eski sayaçlar düzenli olarak temizlenir.'],
];

const FAQ = [
  { q: 'Konumum saklanıyor mu?', a: 'Kodumuzda konum yalnızca mesafe kontrolü için kullanılıyor: telefonunuzun konumu sunucuya gönderilir, mekâna olan uzaklığı hesaplanır ve "yakında mı, değil mi" sonucu kullanılır. Koordinatlar oyun odasına, oyun kaydına ya da sohbet kaydına yazılmaz. Yalnızca mekânın kendi koordinatı mekân kaydında durur.' },
  { q: 'Konum izni vermezsem ne olur?', a: 'Mekân konum kilidini açmışsa masaya katılmak için konum izni gerekir. Kilit kapalıysa konum hiç istenmez.' },
  { q: 'Hesap ya da şifre oluşturmam gerekir mi?', a: 'Hayır. Oyuncular için üyelik, e-posta ya da şifre yoktur. Hesap ve şifre yalnızca mekân sahiplerinin paneli içindir; şifre düz yazı olarak değil, tek yönlü bir karma (scrypt) olarak saklanır.' },
  { q: 'Ödeme bilgilerimi siz mi tutuyorsunuz?', a: 'Oyuncular hiçbir ödeme yapmaz; oyun odaları, sohbet ve kayıtlar kart bilgisi içermez. Mekân aboneliğinin kart ödemesi iyzico güvencesiyle alınacak şekilde hazırlanıyor; ödeme ayrıntılarını Fiyat sayfasında bulabilirsiniz.' },
  { q: 'Sohbette biri beni rahatsız ederse?', a: 'Sohbet isteği iki taraf da kabul edince açılır. Kullanıcıyı engelleyebilir ya da şikâyet edebilirsiniz; şikâyet mekân sahibinin panelinde görünür. Mekân sohbeti tamamen kapatabilir.' },
  { q: 'Verilerimin silinmesini nasıl isterim?', a: 'Oyun ve sohbet verisi kimliğinizle ilişkilendirilmediği için bireysel talep sürecini Yasal Metinler sayfasındaki iletişim bilgisiyle yürütebilirsiniz. Bu sayfa hukuki bir metin değildir; bağlayıcı koşullar için Yasal Metinler\'e bakın.' },
];

export default function TrustPage() {
  return (
    <>
      <PageHero eyebrow="Güven" title={<>Ne tutuyoruz,<br /><span className="hl-coral">ne tutmuyoruz?</span></>} lead="Bu sayfa, oyunhadi'nin kodunda gerçekten ne olduğunu anlatır. Doğrulayamadığımız hiçbir şeyi yazmadık." />

      <Wrap max="max-w-5xl">
        <SectionHead title="Hangi veriler tutuluyor?" />
        <div className="grid gap-4">
          {DATA.map(([k, why, how]) => (
            <article key={k} className="card grid gap-3 p-6 md:grid-cols-[14rem_1fr] md:gap-6">
              <h3 className="text-lg font-extrabold">{k}</h3>
              <div>
                <p className="text-[15px] font-semibold">{why}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-muted">{how}</p>
              </div>
            </article>
          ))}
        </div>
      </Wrap>

      <Wrap className="band-grape py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl leading-[1.08] font-black md:text-4xl">Konum kilidi nasıl çalışır?</h2>
          <ol className="mt-6 space-y-4 text-lg text-white/90">
            <li className="flex gap-3"><span className="font-display font-black text-sun">1.</span><span>Mekân sahibi panelde mekânının konumunu girerse kilit açılır; girmezse konum hiç sorulmaz.</span></li>
            <li className="flex gap-3"><span className="font-display font-black text-sun">2.</span><span>Kilit açıkken telefonun tarayıcısı konum izni ister. İzin verilirse konum, masaya katılırken ve oyun sırasında düzenli olarak sunucuya iletilir.</span></li>
            <li className="flex gap-3"><span className="font-display font-black text-sun">3.</span><span>Sunucu, telefon ile mekân arasındaki mesafeyi hesaplar (250 metre ve GPS sapması payı). Yakındaysa oyun devam eder; değilse masaya katılınamaz.</span></li>
            <li className="flex gap-3"><span className="font-display font-black text-sun">4.</span><span>Koordinatlar yalnızca bu karşılaştırmada kullanılır; veritabanındaki oda, sohbet ve oyun kayıtlarına yazılmaz.</span></li>
          </ol>
        </div>
      </Wrap>

      <Wrap max="max-w-3xl">
        <SectionHead title="Sık sorulan güven soruları" />
        <FaqList items={FAQ} />
        <p className="mt-8 text-center text-muted">Bağlayıcı metinler için <Link className="font-bold text-grape underline underline-offset-4" href="/yasal">Yasal Metinler</Link> sayfasına bakın. Oyuncular için kısa özet: <Link className="font-bold text-grape underline underline-offset-4" href="/oyuncular-icin">Oyuncular için</Link>.</p>
      </Wrap>

      <Cta title="Sorunuz mu var?" lead="Veri akışıyla ilgili merak ettiğiniz bir şey varsa WhatsApp'tan yazın, bilmiyorsak bilmediğimizi söyleriz." />
    </>
  );
}
