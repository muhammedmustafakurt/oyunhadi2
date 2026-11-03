import { PRICE } from './site';

// Yasal metinler. TASLAKTIR; yayın öncesi hukuk danışmanı onayından geçmelidir.
// ŞİRKET BİLGİLERİ: Aşağıdaki alanlar NEXT_PUBLIC_COMPANY_* ortam değişkenlerinden okunur. Değişken yoksa köşeli
// parantezli yer tutucu görünür; yayından önce ortam değişkenleri doldurulmalıdır (ünvan, vergi no, MERSİS, adres, telefon).
// Not: Next, NEXT_PUBLIC_ değişkenlerini yalnızca bu biçimde (doğrudan process.env.ADI) satır içine alır.
export const COMPANY = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || '[Şirket ünvanı]',
  taxOffice: process.env.NEXT_PUBLIC_COMPANY_TAX_OFFICE || '[Vergi dairesi]',
  taxNo: process.env.NEXT_PUBLIC_COMPANY_TAX_NO || '[Vergi no]',
  mersis: process.env.NEXT_PUBLIC_COMPANY_MERSIS || '[MERSİS no]',
  address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || '[Adres]',
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '[Telefon]',
  email: 'merhaba@oyunhadi.com',
};

export const LEGAL_UPDATED = '2 Kasım 2026';
export const LEGAL_DISCLAIMER = 'Bu metin bilgilendirme amaçlı taslaktır; yayın öncesi hukuk danışmanı onayından geçmelidir.';

export type Block = string | { list: string[]; ordered?: boolean };
export type Section = { id: string; title: string; body: Block[] };
export type LegalDoc = { slug: string; title: string; short: string; intro: string; sections: Section[] };

const C = COMPANY;
const companyLine = `${C.name}, vergi dairesi/no: ${C.taxOffice} / ${C.taxNo}, MERSİS: ${C.mersis}, adres: ${C.address}, telefon: ${C.phone}, e-posta: ${C.email}`;
const SURE = '[süre]';

const kvkk: LegalDoc = {
  slug: 'kvkk',
  title: 'KVKK Aydınlatma Metni',
  short: 'Kişisel verilerin nasıl işlendiği (6698 sayılı Kanun)',
  intro: '6698 sayılı Kişisel Verilerin Korunması Kanunu’nun 10. maddesi uyarınca, kişisel verilerinizin hangi amaçlarla ve nasıl işlendiğini anlatır.',
  sections: [
    { id: 'veri-sorumlusu', title: 'Veri sorumlusu', body: [`Veri sorumlusu: ${companyLine}.`, 'Bu metinde “oyunhadi” veya “biz” olarak anılır.'] },
    {
      id: 'islenen-veriler', title: 'İşlenen kişisel veriler',
      body: [
        'Hizmeti kullanma biçiminize göre aşağıdaki veriler işlenebilir:',
        { list: [
          'Oyuncular (masadaki misafirler): cihazınızda rastgele üretilen anonim bir oyuncu kimliği ve girdiğiniz takma ad; oyun içinde yaptığınız hamleler ve masa durumu; masaya girerken konum kilidi açıksa tarayıcınızın verdiği konum bilgisi (yalnızca anlık mesafe denetimi için, aşağıya bakın).',
          'Masalar arası sohbeti kullananlar: takma ad, isteğe bağlı kısa tanıtım yazısı, masa bilgisi ve gönderdiğiniz mesajlar.',
          'Mekân panelini kullananlar (mekân yetkilileri): e-posta adresi, şifre (yalnızca tek yönlü şifrelenmiş karma olarak), mekân adı, şehir, logo, renkler ve mekânın konum bilgisi.',
          'Teknik veriler: istekleri sınırlamak ve kötüye kullanımı önlemek amacıyla IP adresi.',
          'İletişim: bize WhatsApp ya da e-postayla yazarsanız ilettiğiniz ad, telefon/e-posta ve mesaj içeriği.',
        ] },
        'Oyuncular için ad, soyad, e-posta, telefon ya da hesap oluşturma istenmez.',
      ],
    },
    {
      id: 'amaclar', title: 'İşleme amaçları ve hukuki sebepler',
      body: [{ list: [
        'Oyunları çalıştırmak, masa ve oyun durumunu yönetmek, sohbet özelliğini sunmak (KVKK m.5/2-c: sözleşmenin ifası ve m.5/2-f: meşru menfaat).',
        'Konum kilidi açık mekânlarda yalnızca mekânda bulunan cihazların masaya katılmasını sağlamak (açık rıza: tarayıcının konum iznini siz verirsiniz).',
        'Mekân panelinde oturum açmak, istatistikleri göstermek ve aboneliği yürütmek (sözleşmenin ifası).',
        'Hizmetin güvenliğini sağlamak, kaba kuvvet ve kötüye kullanım denemelerini sınırlamak (meşru menfaat).',
        'Taleplerinize yanıt vermek (sözleşme öncesi görüşme, meşru menfaat).',
        'Hukuki yükümlülüklerin yerine getirilmesi (m.5/2-ç), örneğin fatura ve muhasebe kayıtları.',
      ] }],
    },
    {
      id: 'konum', title: 'Konum bilgisi',
      body: [
        'Mekân konum kilidini açtıysa tarayıcınız konum izni ister. İzin verirseniz konumunuz, mekâna olan mesafeyi hesaplamak için sunucumuza gönderilir. Konumunuz bu denetimin ardından veritabanına kaydedilmez; yalnızca “mekâna yakın / değil” sonucu oyun akışında kullanılır.',
        'İzni vermek zorunda değilsiniz; ancak konum kilidi açık mekânlarda izin vermezseniz masaya katılamazsınız. İzni tarayıcı ayarlarından dilediğiniz zaman geri alabilirsiniz.',
      ],
    },
    {
      id: 'saklama', title: 'Saklama süreleri',
      body: [{ list: [
        'Oyun odası durumu: masada 6 saat boyunca hiçbir işlem olmazsa oda bir sonraki erişimde sıfırlanır.',
        'Masalar arası sohbet: kapatılan sohbet odalarındaki mesajlar, mekânın belirlediği saklama süresi sonunda silinir (varsayılan 24 saat, mekân 1-168 saat arasında ayarlayabilir).',
        'Hız sınırı sayaçları ve panel giriş denemeleri (IP adresi içerebilir): en fazla 24 saatlik kayıtlar tutulur, eskiler düzenli olarak temizlenir.',
        'Panel oturumu: oturum çerezi 30 gün geçerlidir.',
        `Oyun kayıtları (mekân, masa, oyun, oyuncu sayısı ve zaman; kişi kimliği içermez) ve mekân hesabı bilgileri: ${SURE}.`,
        `İletişim yazışmaları ve fatura/muhasebe kayıtları: ${SURE} (yasal saklama yükümlülükleri saklıdır).`,
      ] }],
    },
    {
      id: 'aktarim', title: 'Verilerin aktarıldığı taraflar',
      body: [
        'Verileriniz satılmaz. Hizmetin sunulması için aşağıdaki hizmet sağlayıcılarla paylaşılabilir; bu sağlayıcılar yurt dışında bulunabilir:',
        { list: [
          'Veritabanı ve barındırma altyapısı sağlayıcıları (veriler bu altyapıda saklanır).',
          'WhatsApp (Meta): site üzerindeki WhatsApp bağlantısına tıklayıp bize yazarsanız mesajlaşma WhatsApp’ın kendi koşullarına tabidir.',
          'Ödeme altyapısı sağlayıcısı: mekân abonelik ödemelerinde kart bilgileri ödeme kuruluşuna iletilir; oyunhadi kart numarasını görmez ve saklamaz.',
          'Yasal zorunluluk halinde yetkili kamu kurum ve kuruluşları.',
        ] },
        'Yurt dışına aktarım, KVKK m.9 hükümlerine uygun şekilde yapılır.',
      ],
    },
    {
      id: 'yontem', title: 'Toplama yöntemi',
      body: ['Verileriniz, siteyi ve oyunları kullanırken tarayıcınız üzerinden otomatik olarak ya da bizimle iletişime geçerken sizin ilettiğiniz bilgiler yoluyla toplanır. Sitedeki teklif formu şu an herhangi bir yere veri göndermez; iletişim için WhatsApp veya e-posta kullanılır.'],
    },
    {
      id: 'haklariniz', title: 'Haklarınız (KVKK m.11)',
      body: [
        'Veri sorumlusuna başvurarak şu haklarınızı kullanabilirsiniz:',
        { list: [
          'Kişisel verilerinizin işlenip işlenmediğini öğrenme ve bilgi talep etme,',
          'İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,',
          'Yurt içinde veya yurt dışında aktarıldığı kişileri bilme,',
          'Eksik veya yanlış işlenmişse düzeltilmesini isteme,',
          'Kanun’da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme ve bunun aktarılan üçüncü kişilere bildirilmesini isteme,',
          'İşlenen verilerin otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç çıkmasına itiraz etme,',
          'Kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme.',
        ], ordered: true },
        `Başvurularınızı ${C.email} adresine ya da yukarıdaki adrese yazılı olarak iletebilirsiniz. Başvuruyu niteliğine göre en geç otuz gün içinde yanıtlarız. Cihazınızdaki anonim oyuncu kimliği sunucumuzda sizinle bir kişi olarak eşleştirilmediğinden, kimliğin doğrulanabilmesi için ek bilgi isteyebiliriz.`,
      ],
    },
  ],
};

const gizlilik: LegalDoc = {
  slug: 'gizlilik',
  title: 'Gizlilik Politikası',
  short: 'Hangi veriyi neden topladığımız ve nasıl koruduğumuz',
  intro: 'oyunhadi’yi kullanırken hangi bilgilerin işlendiğini ve bu bilgileri nasıl koruduğumuzu sade bir dille anlatır. Ayrıntılı hukuki bilgilendirme için KVKK Aydınlatma Metni’ne bakın.',
  sections: [
    {
      id: 'ozet', title: 'Kısaca',
      body: [{ list: [
        'Oyuncular üye olmaz; ad, e-posta ya da telefon vermez.',
        'Sitede reklam, analitik ya da izleme betiği kullanmıyoruz.',
        'Konumunuz yalnızca mekânda olup olmadığınızı denetlemek için kullanılır ve kaydedilmez.',
        'Verilerinizi satmayız.',
      ] }],
    },
    {
      id: 'oyuncular', title: 'Oyuncular için',
      body: [
        'Masadaki karekodu okuttuğunuzda tarayıcınız bir oyuncu kimliği (rastgele bir kod) üretir ve cihazınızın yerel depolamasında saklar; ayrıca girdiğiniz takma adı hatırlar. Bunlar sizi tanımaya yarayan bir hesap değildir; aynı cihazla masaya geri dönebilmeniz içindir. Tarayıcı verilerini temizlerek bunları silebilirsiniz.',
        'Oyun sırasında takma adınız, hamleleriniz ve masa durumu sunucuda tutulur ve masadaki diğer oyuncularla paylaşılır. Başkalarının oyuncu kimlikleri size gönderilmez.',
        'Sohbet özelliğini kullanırsanız takma adınız, isteğe bağlı tanıtım yazınız ve mesajlarınız yalnızca sohbet ettiğiniz kişiyle paylaşılır. Mekân sohbeti kapatabilir; kapanan sohbetlerin mesajları mekânın belirlediği süre sonunda silinir. Kötüye kullanımı engellemek için kişileri engelleyebilir ve şikâyet edebilirsiniz.',
        'Mekân konum kilidini açtıysa tarayıcınız konum izni ister. Konumunuz yalnızca mekâna yakın olup olmadığınızı denetlemek için kullanılır, kaydedilmez. İzni dilediğiniz zaman tarayıcı ayarlarından kapatabilirsiniz.',
      ],
    },
    {
      id: 'mekanlar', title: 'Mekân yetkilileri için',
      body: [
        'Mekân paneli için e-posta adresinizi ve şifrenizi işleriz; şifre tek yönlü karma olarak saklanır, düz metin olarak tutulmaz. Panelde oyun sayısı, saatlik yoğunluk gibi toplu istatistikler görünür; bunlar kişi bazında bilgi içermez.',
        'Mekân hesabı bilgileriniz, aboneliğiniz sürdüğü sürece saklanır.',
      ],
    },
    {
      id: 'ip', title: 'IP adresi ve güvenlik',
      body: ['Kötüye kullanımı ve kaba kuvvet denemelerini sınırlamak için istek sayıları IP adresi bazında sayılır. Bu sayaçlar yaklaşık 24 saatten eski olmayacak şekilde tutulur ve düzenli temizlenir.'],
    },
    {
      id: 'ucuncu', title: 'Üçüncü taraflar',
      body: [
        { list: [
          'Veritabanı ve barındırma sağlayıcıları: verilerin saklandığı altyapı.',
          'WhatsApp (Meta): sitedeki WhatsApp düğmesine tıklarsanız sohbet WhatsApp’ta açılır ve WhatsApp’ın gizlilik koşulları geçerli olur.',
          'Ödeme altyapısı sağlayıcısı: mekân abonelik ödemelerinde.',
          'Yazı tipleri sitemizle birlikte kendi sunucularımızdan sunulur; yazı tipi için sayfa açılırken üçüncü bir sunucuya bağlanılmaz.',
        ] },
      ],
    },
    {
      id: 'form', title: 'İletişim ve teklif formu',
      body: ['Sitedeki teklif formu şu an girdiğiniz bilgileri bir sunucuya göndermez. Bize ulaşmak için WhatsApp veya e-posta kullanın; ilettiğiniz bilgiler yalnızca talebinize yanıt vermek için kullanılır.'],
    },
    { id: 'haklar', title: 'Haklarınız ve iletişim', body: [`Verilerinize ilişkin sorularınız ve KVKK kapsamındaki talepleriniz için ${C.email} adresine yazabilirsiniz. Ayrıntılar için KVKK Aydınlatma Metni’ne bakın.`] },
    { id: 'degisiklik', title: 'Değişiklikler', body: ['Bu politikayı güncelleyebiliriz. Güncel sürüm her zaman bu sayfadadır; üstteki “Son güncelleme” tarihine bakabilirsiniz.'] },
  ],
};

const cerezler: LegalDoc = {
  slug: 'cerezler',
  title: 'Çerez Politikası',
  short: 'Çerezler ve cihazda saklanan veriler',
  intro: 'Sitede hangi çerezlerin ve benzeri cihaz depolamalarının kullanıldığını anlatır.',
  sections: [
    {
      id: 'ozet', title: 'Kısaca',
      body: ['oyunhadi reklam, izleme ya da analitik çerezi kullanmaz. Yalnızca hizmetin çalışması için gerekli çerezler ve tarayıcı depolaması kullanılır. Bu nedenle bir çerez onay bandı göstermiyoruz. İleride izleme ya da analitik aracı eklersek bu politikayı günceller ve gerekli onayı alırız.'],
    },
    {
      id: 'kullanilanlar', title: 'Kullanılanlar',
      body: [
        { list: [
          'Panel oturum çerezi (oh-panel): mekân yetkilisi panele giriş yaptığında oluşur. Yalnızca giriş yapmış mekân yetkilileri içindir; imzalıdır, tarayıcı betikleri tarafından okunamaz (HttpOnly) ve 30 gün geçerlidir. Zorunludur.',
          'Oyuncu kimliği (oh-pid, yerel depolama): masadaki oyuncuyu aynı cihazda tanıyan rastgele bir koddur. Zorunludur; tarayıcı verilerini silerek kaldırabilirsiniz.',
          'Takma ad (oh-name, yerel depolama): son girdiğiniz takma adı hatırlar. İşlevseldir; silerek kaldırabilirsiniz.',
          'Oturum depolaması (sessionStorage): oyun tanıtım ekranının aynı oturumda tekrar gösterilmemesi gibi arayüz tercihleri için kullanılır; sekmeyi kapatınca silinir.',
        ] },
      ],
    },
    {
      id: 'ucuncu-taraf', title: 'Üçüncü taraf çerezleri',
      body: ['Sitemiz üçüncü taraf reklam ya da analitik çerezi yerleştirmez. Sitedeki WhatsApp bağlantısına tıklarsanız WhatsApp’ın kendi sitesine geçersiniz; orada WhatsApp’ın çerez ve gizlilik koşulları geçerlidir.'],
    },
    {
      id: 'yonetim', title: 'Çerezleri nasıl yönetirsiniz?',
      body: ['Tarayıcı ayarlarınızdan çerezleri ve site verilerini silebilir ya da engelleyebilirsiniz. Zorunlu çerezleri engellerseniz panele giriş yapamayabilir ya da masadaki oyuncu kimliğiniz her ziyarette yenilenebilir.'],
    },
  ],
};

const kullanim: LegalDoc = {
  slug: 'kullanim-sartlari',
  title: 'Kullanım Şartları',
  short: 'Web sitesi ve oyunların kullanım koşulları',
  intro: 'oyunhadi web sitesini ve karekodla açılan masa oyunlarını kullanırken geçerli kuralları içerir.',
  sections: [
    { id: 'kabul', title: 'Kabul', body: ['Siteyi veya oyunları kullanarak bu şartları kabul etmiş olursunuz. Kabul etmiyorsanız lütfen kullanmayın.'] },
    { id: 'hizmet', title: 'Hizmetin tanımı', body: ['oyunhadi, mekânların masalarına yerleştirilen karekodlar aracılığıyla tarayıcıda oynanan çok oyunculu masa oyunları ve mekânlar için bir yönetim paneli sunar. Hizmet olduğu gibi sunulur; kesintisiz ya da hatasız olacağı garanti edilmez.'] },
    {
      id: 'oyuncu-kurallari', title: 'Oyuncu kuralları',
      body: [{ list: [
        'Takma adınız ve sohbet mesajlarınız hukuka, genel ahlaka ve diğer kişilerin haklarına aykırı olmamalıdır; hakaret, taciz, nefret söylemi ve spam yasaktır.',
        'Başkasının kimliğine bürünmeyin; hizmeti engelleyecek, aşırı yükleyecek ya da güvenliğini aşmaya çalışacak işlemler yapmayın.',
        'Konum kilidini aşmaya çalışmayın; konum bilgisini taklit etmeyin.',
        'Mekân ya da sistem, kurallara aykırı davranan oyuncuyu masadan veya sohbetten çıkarabilir.',
      ], ordered: true }],
    },
    { id: 'sohbet', title: 'Sohbet', body: ['Masalar arası sohbet isteğe bağlıdır ve mekân tarafından kapatılabilir. Sohbet içeriklerinden ilgili kullanıcı sorumludur. Karşı tarafı engelleyebilir ve şikâyet edebilirsiniz; şikâyetler mekân yetkilisine iletilir.'] },
    { id: 'fikri', title: 'Fikri mülkiyet', body: ['Site, oyunlar, tasarımlar, markalar ve yazılım üzerindeki haklar oyunhadi’ye veya lisans verenlerine aittir. Yazılı izin olmadan kopyalanamaz, çoğaltılamaz, tersine mühendislik yapılamaz.', 'Bazı oyun ve karakter adları ilgili hak sahiplerinin markası olabilir; oyunhadi bunlarla bir ortaklık iddia etmez.'] },
    { id: 'sorumluluk', title: 'Sorumluluk sınırı', body: ['Hizmet “olduğu gibi” sunulur. Yürürlükteki mevzuatın izin verdiği ölçüde, hizmetin kullanımından veya kullanılamamasından doğan dolaylı zararlardan sorumlu değiliz. Mekânlarda sunulan ikram ve ödüllerden ilgili mekân sorumludur.'] },
    { id: 'degisiklik', title: 'Değişiklik ve yürürlük', body: ['Bu şartları ve hizmeti güncelleyebiliriz; güncel sürüm bu sayfada yayımlanır.', 'Bu şartlara Türk hukuku uygulanır. Uyuşmazlıklarda, tüketici mevzuatından doğan haklarınız saklı kalmak üzere, mevzuatın yetkili kıldığı mahkemeler ve icra daireleri yetkilidir.'] },
    { id: 'iletisim', title: 'İletişim', body: [`Sorularınız için ${C.email} adresine yazabilirsiniz.`] },
  ],
};

const mesafeli: LegalDoc = {
  slug: 'mesafeli-satis',
  title: 'Mesafeli Satış Sözleşmesi',
  short: 'İşletmelere yönelik abonelik satışı',
  intro: 'Bu sözleşme, oyunhadi abonelik hizmetinin internet üzerinden işletmelere satışına ilişkindir.',
  sections: [
    {
      id: 'taraflar', title: 'Taraflar',
      body: [
        `SATICI: ${companyLine}.`,
        'ALICI: Sipariş veya başvuru sırasında bilgilerini ileten ticari işletme (mekân). Alıcı bilgileri (ünvan, vergi no, adres, yetkili) sipariş/başvuru kaydındadır.',
      ],
    },
    { id: 'konu', title: 'Sözleşmenin konusu', body: ['Konu; alıcının seçtiği oyunhadi yıllık abonelik hizmetinin, karekodlu pleksi/baskı ürünlerinin ve ilgili hizmetlerin mesafeli olarak satışı ve teslimidir. Hizmetin kapsamı, süresi ve koşulları Abonelik Sözleşmesi’nde düzenlenir.'] },
    {
      id: 'b2b', title: 'Tüketici hükümlerinin uygulanması',
      body: ['Hizmet, ticari faaliyet kapsamındaki işletmelere sunulur. Alıcı, hizmeti ticari amaçla satın aldığından, 6502 sayılı Tüketicinin Korunması Hakkında Kanun’daki ve Mesafeli Sözleşmeler Yönetmeliği’ndeki tüketiciye özgü haklar (örneğin 14 günlük cayma hakkı) bu sözleşmeye uygulanmaz. İade ve iptal koşulları Teslimat ve İade Koşulları ile Abonelik Sözleşmesi’nde belirtilmiştir. Alıcı tüketici sıfatında ise bu madde uygulanmaz, mevzuatın tanıdığı haklar saklıdır.'],
    },
    { id: 'bedel', title: 'Bedel ve ödeme', body: [`Güncel yıllık abonelik bedeli ${PRICE.yearly} ${PRICE.note}’dır (fiyat sayfasındaki güncel tutar esastır). Ödeme kredi kartı (ödeme altyapısı sağlayıcısı aracılığıyla) veya havale/EFT ile yapılır. Fatura e-posta ile gönderilir. Kampanya, taksit ve hediye süre koşulları sipariş anında alıcıya bildirilir.`] },
    { id: 'teslim', title: 'Teslimat', body: ['Karekodlu pleksi ve baskı ürünleri, sipariş onayından sonra alıcının bildirdiği adrese kargoyla gönderilir. Dijital hizmet (panel ve oyunlar) ödemenin ardından açılır. Ayrıntılar Teslimat ve İade Koşulları’ndadır.'] },
    { id: 'iptal', title: 'İptal, iade ve fesih', body: ['İptal, iade ve fesih koşulları Teslimat ve İade Koşulları ile Abonelik Sözleşmesi’nde düzenlenmiştir.'] },
    { id: 'uyusmazlik', title: 'Uyuşmazlık ve yürürlük', body: ['Bu sözleşmeye Türk hukuku uygulanır. Uyuşmazlıklarda satıcının bulunduğu yerdeki mahkemeler ve icra daireleri yetkilidir. Alıcı, sipariş sırasında bu sözleşmeyi okuyup kabul ettiğini beyan eder.'] },
  ],
};

const abonelik: LegalDoc = {
  slug: 'abonelik-sozlesmesi',
  title: 'Abonelik Sözleşmesi',
  short: 'Yıllık abonelik hizmetinin kapsamı ve koşulları',
  intro: 'oyunhadi yıllık abonelik hizmetinin kapsamını, süresini, ücretini ve tarafların yükümlülüklerini düzenler.',
  sections: [
    { id: 'taraflar', title: 'Taraflar', body: [`Hizmet sağlayıcı: ${companyLine}. Abone: hizmete başvuran işletme (mekân).`] },
    {
      id: 'kapsam', title: 'Hizmetin kapsamı',
      body: [{ list: [
        'Karekodla açılan masa oyunlarına erişim; oyun listesi zamanla genişleyebilir veya değişebilir.',
        'Mekân paneli: logo ve renkler, oyun seçimi, duyuru, ödül kodları, konum kilidi, sohbet ayarları ve kullanım istatistikleri.',
        'Masa sayısına göre hazırlanan karekodlu pleksi/baskı ürünleri.',
        'Kurulum ücreti alınmaz.',
      ] }],
    },
    { id: 'sure', title: 'Süre ve yenileme', body: ['Abonelik, ödemenin alındığı tarihte başlar ve bir yıl sürer. Abonelik kendiliğinden yenilenmez; süre sonunda devam etmek için aboneden onay ve ödeme alınır.'] },
    { id: 'ucret', title: 'Ücret', body: [`Yıllık abonelik ücreti ${PRICE.yearly} ${PRICE.note}’dır. Güncel ücret fiyat sayfasında yayımlanır; yürürlükteki abonelik dönemi için ödenen ücret dönem boyunca değişmez. Ödeme kredi kartı ya da havale/EFT ile yapılır; ödeme işlemleri ödeme altyapısı sağlayıcısı aracılığıyla gerçekleşir.`] },
    { id: 'sla', title: 'Hizmet seviyesi', body: ['Hizmeti kesintisiz ve hatasız sunmak için makul çabayı gösteririz; ancak belirli bir erişilebilirlik oranı (SLA) veya kesintisizlik taahhüdü verilmez. Bakım, güncelleme, altyapı sağlayıcı sorunları ve kullanıcının internet bağlantısı nedeniyle kesintiler olabilir.'] },
    {
      id: 'abone-yukumlulukleri', title: 'Abonenin yükümlülükleri',
      body: [{ list: [
        'Panel erişim bilgilerini gizli tutmak; hesapla yapılan işlemlerden sorumlu olmak.',
        'Hizmeti hukuka ve Kullanım Şartları’na uygun kullanmak.',
        'Ödül ve ikramların sunulmasından ve maliyetinden kendisi sorumludur.',
        'Mekân misafirlerinin kişisel verileri bakımından yürürlükteki mevzuata uymak.',
      ], ordered: true }],
    },
    { id: 'fikri', title: 'Fikri mülkiyet', body: ['Yazılım, oyunlar ve tasarımlar üzerindeki tüm haklar hizmet sağlayıcıya veya lisans verenlerine aittir; abone abonelik süresince devredilemez, münhasır olmayan bir kullanım hakkı kazanır. Abonenin yüklediği logo ve içeriklerin hakları abonede kalır; abone, bunların hizmette gösterilmesi için gerekli kullanım izni verir ve haklarına sahip olduğunu beyan eder.'] },
    { id: 'veri', title: 'Kişisel veriler', body: ['Kişisel veriler Gizlilik Politikası ve KVKK Aydınlatma Metni’ne uygun işlenir.'] },
    { id: 'fesih', title: 'Fesih ve iade', body: ['Taraflardan biri sözleşmenin esaslı ihlali halinde, yazılı bildirimle sözleşmeyi feshedebilir. Mekânın kapanması ya da hizmetin hizmet sağlayıcıdan kaynaklı olarak kesilmesi halinde kalan abonelik süresinin ücreti iade edilir. Abonenin dilediği zaman iptali halinde ücret iadesi Teslimat ve İade Koşulları’na göre değerlendirilir. Aboneliğin sona ermesiyle panel erişimi kapanır.'] },
    { id: 'sorumluluk', title: 'Sorumluluk sınırı', body: ['Yürürlükteki mevzuatın izin verdiği ölçüde, hizmet sağlayıcının toplam sorumluluğu, olayın gerçekleştiği abonelik dönemi için abonenin ödediği ücretle sınırlıdır. Kâr kaybı, ticari itibar kaybı ve dolaylı zararlardan sorumluluk kabul edilmez. Kast ve ağır kusur halleri saklıdır.'] },
    { id: 'degisiklik', title: 'Değişiklik ve uyuşmazlık', body: ['Sözleşmede yapılacak değişiklikler yazılı olarak ve tarafların onayıyla geçerlidir. Sözleşmeye Türk hukuku uygulanır; uyuşmazlıklarda hizmet sağlayıcının bulunduğu yerdeki mahkemeler ve icra daireleri yetkilidir.'] },
  ],
};

const iade: LegalDoc = {
  slug: 'iade',
  title: 'Teslimat ve İade Koşulları',
  short: 'Pleksi teslimi, iade ve abonelik iptali',
  intro: 'Karekodlu pleksi/baskı ürünlerinin teslimi ile iade ve abonelik iptali koşullarını anlatır.',
  sections: [
    {
      id: 'teslimat', title: 'Teslimat',
      body: [
        'Ödeme onaylandıktan sonra masa sayınıza göre karekodlu pleksi/baskı ürünleri hazırlanır ve bildirdiğiniz adrese kargoyla gönderilir. Teslim süresi [süre] iş günüdür; kargo kaynaklı gecikmeler olabilir.',
        'Dijital hizmet (panel ve oyunlar) ödemenin ardından açılır. Karekodları panelden kendiniz de yazdırabilirsiniz.',
        'Teslimatta paketi kontrol edin; hasar varsa kargo görevlisine tutanak tutturun ve bize bildirin.',
      ],
    },
    {
      id: 'urun-iadesi', title: 'Ürün iadesi',
      body: [
        'Hasarlı, hatalı ya da siparişe uymayan ürünler için teslimattan itibaren [süre] gün içinde bize yazın; ürünü ücretsiz değiştirir ya da onarırız.',
        'Mekâna özel (logo, renk ya da masa numarası basılı) üretilen ürünlerde, hatalı olmadıkça iade kabul edilmeyebilir.',
      ],
    },
    {
      id: 'cayma', title: 'Cayma hakkı',
      body: ['Hizmet işletmelere sunulduğundan, tüketicilere tanınan 14 günlük cayma hakkı uygulanmaz (bkz. Mesafeli Satış Sözleşmesi). Yine de memnun kalmazsanız aşağıdaki iptal şartlarına göre bizimle görüşebilirsiniz.'],
    },
    {
      id: 'iptal', title: 'Abonelik iptali ve ücret iadesi',
      body: [
        { list: [
          'Abonelik kendiliğinden yenilenmez; dönem sonunda sona erer, iptal için bir işlem gerekmez.',
          'Mekânınız kapanırsa ya da hizmet bizden kaynaklı kesilirse kalan sürenin ücreti iade edilir.',
          'Dönem içinde isteğe bağlı iptallerde iade koşulları [süre ve koşullar] doğrultusunda değerlendirilir.',
          'İadeler, ödemenin yapıldığı yönteme göre kart ya da banka hesabına yapılır; bankanıza bağlı olarak yansıması zaman alabilir.',
        ] },
      ],
    },
    { id: 'basvuru', title: 'Başvuru', body: [`İade ve iptal talepleriniz için ${C.email} adresine yazın; sipariş bilgilerinizi ekleyin.`] },
  ],
};

export const LEGAL_DOCS: LegalDoc[] = [kvkk, gizlilik, cerezler, kullanim, mesafeli, abonelik, iade];
export const legalBySlug = (slug: string) => LEGAL_DOCS.find((d) => d.slug === slug);
