// Ortaklık programları. Komisyon, gelir payı, fiyat ya da garanti burada VERİLMEZ; şartlar başvuru sonrası görüşmede netleşir.

export type Partner = {
  slug: string;
  title: string;
  tag: string;
  forWho: string;
  does: string[];
  how: string;
};

export const PARTNER_GIVES = [
  'Canlı demo ve ürün tanıtımı',
  'Tanıtım materyali (görseller, kısa anlatım metinleri)',
  'Öncelikli destek',
];

export const PARTNERS: Partner[] = [
  {
    slug: 'influencer',
    title: 'Influencer ortağı',
    tag: 'İçerik üreticileri',
    forWho: 'Kafe, mekân, oyun ya da yaşam tarzı içerikleri üreten ve takipçisine yeni bir deneyim tanıtmak isteyen içerik üreticileri.',
    does: ['oyunhadi’yi kendi dilinizle ve kendi kanalınızda tanıtırsınız.', 'İlgilenen mekân sahiplerini bizimle tanıştırırsınız.'],
    how: 'Kanal bağlantınızı ve kısa bir tanıtım notunu WhatsApp ya da e-posta ile iletin.',
  },
  {
    slug: 'menu',
    title: 'Menü ortağı',
    tag: 'Menü ve QR menü firmaları',
    forWho: 'Kafe ve restoranlara menü, QR menü ya da dijital sipariş çözümü sunan firmalar.',
    does: ['Mevcut müşterilerinize oyunhadi’yi tamamlayıcı bir hizmet olarak önerirsiniz.', 'Karekod ve masa kurulumunda bizimle birlikte çalışırsınız.'],
    how: 'Firma adınızı, çalıştığınız mekân sayısını ve şehrinizi iletin.',
  },
  {
    slug: 'sadakat',
    title: 'Sadakat ortağı',
    tag: 'Sadakat ve kampanya platformları',
    forWho: 'Mekânlara sadakat, puan ya da kampanya çözümü sunan platformlar.',
    does: ['Platformunuzun mekânlarıyla oyunhadi’yi birlikte sunmanın yollarını bizimle tasarlarsınız.', 'Ödül ve ikram kurgusunu mekânlarınıza göre birlikte şekillendiririz.'],
    how: 'Platformunuzu ve düşündüğünüz iş birliği biçimini kısaca anlatın.',
  },
  {
    slug: 'kurumsal',
    title: 'Kurumsal ortak',
    tag: 'Zincirler, oteller, işletme grupları',
    forWho: 'Birden çok şubesi olan zincirler, otel ve eğlence grupları ya da mekân yönetim şirketleri.',
    does: ['Şubelerinizde oyunhadi’nin tek elden planlanmasına yardımcı olursunuz.', 'Şube bazlı ihtiyaçları bizimle paylaşırsınız.'],
    how: 'Şube sayınızı ve ilgilendiğiniz şehirleri iletin.',
  },
  {
    slug: 'kampus',
    title: 'Kampüs temsilcisi',
    tag: 'Öğrenciler ve topluluklar',
    forWho: 'Üniversite çevresindeki kafeleri tanıyan öğrenciler ve öğrenci toplulukları.',
    does: ['Kampüs çevresindeki mekânlara oyunhadi’yi tanıtırsınız.', 'Mekânlarla görüşme ayarlamamıza yardımcı olursunuz.'],
    how: 'Okulunuzu, bölümünüzü ve çevrenizdeki mekânlardan kısaca bahsedin.',
  },
];

export const PARTNER_FAQ = [
  { q: 'Komisyon ya da gelir payı ne kadar?', a: 'Şartlar program ve iş birliği biçimine göre değişir. Herhangi bir oran ya da garanti vaat etmiyoruz; şartlar başvuru sonrası görüşmede netleşir.' },
  { q: 'Başvurmak bir şey taahhüt ettirir mi?', a: 'Hayır. Başvuru yalnızca ilk tanışma görüşmesi içindir; şartlar netleşmeden bir yükümlülük doğmaz.' },
  { q: 'Başvurudan sonra ne olur?', a: 'Mesajınızı inceleyip sizinle iletişime geçeriz, ihtiyacınıza uygun programı birlikte belirleriz. Dönüş süresi için söz veremiyoruz ama mesajınıza yanıt veririz.' },
  { q: 'Birden fazla programa başvurabilir miyim?', a: 'Evet. Mesajınızda ilgilendiğiniz programları yazmanız yeterli.' },
];

export const PARTNER_EMAIL = 'merhaba@oyunhadi.com';
export const partnerMessage = (p: string) => `Merhaba, oyunhadi "${p}" programına başvurmak istiyorum. Adım/firmam: `;
export const partnerMailto = (p: string) =>
  `mailto:${PARTNER_EMAIL}?subject=${encodeURIComponent(`Ortaklık başvurusu: ${p}`)}&body=${encodeURIComponent(partnerMessage(p))}`;
