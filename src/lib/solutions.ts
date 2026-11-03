// Mekân türüne özel çözüm sayfalarının içeriği. Oyun kimlikleri src/lib/games.js ile aynıdır.

export type SolutionGame = { id: string; why: string };
export type SolutionQA = { q: string; a: string };

export type Solution = {
  slug: string;
  name: string;
  /** Başlıkta kullanılan kısa mekân adı (ör. "kafenizde") */
  title: string;
  hl: string;
  lead: string;
  /** İndeks kartındaki tek cümle */
  card: string;
  games: SolutionGame[];
  benefits: { title: string; body: string }[];
  steps: [string, string][];
  faq: SolutionQA[];
};

export const SOLUTIONS: Solution[] = [
  {
    slug: 'kafe',
    name: 'Kafe',
    title: 'Kahve sipariş edildi,',
    hl: 'oyun masada başladı',
    lead: 'Kahvenin gelmesini beklemek, masada oturma süresini uzatmanın en doğal yoludur. Karekodu okutan masa dakikalar içinde oyuna girer; siz kasada ve barda işinize bakarsınız.',
    card: 'Uzun oturan masalar, öğleden sonra kalabalığı ve laptop yoğun saatler için.',
    games: [
      { id: 'bil', why: 'Sipariş gelene kadar 5-8 dakikada biter; tek kişi bile "bir tur daha" der.' },
      { id: 'tabu', why: 'Dört beş kişilik arkadaş masaları için; gürültüsü kafenin canlılığına yakışır.' },
      { id: 'azul', why: 'Sessiz, sakin ve görsel; öğleden sonra kahve eşliğinde iki üç kişilik masalara uyar.' },
      { id: 'satranc', why: 'İki kişi, bir filtre kahve, bir saat. Rövanş tek dokunuşla.' },
    ],
    benefits: [
      { title: 'Masa daha uzun dolar', body: 'Oyun başlayan masa ikinci tur ister; ikinci tur çoğu zaman ikinci sipariş getirebilir. Etkisini görmek için panelde hangi masanın hangi oyunu oynadığını görürsünüz.' },
      { title: 'Öğleden sonra sakinliğini doldurur', body: 'Kahvaltı ve öğle yoğunluğu sonrası boş kalan saatlere duyuru panosundan "15.00-17.00 oyun molası" gibi bir duyuru koyabilirsiniz.' },
      { title: 'Kendi markanızla görünür', body: 'Karekodu okutan misafir sizin logonuz ve renklerinizle açılan bir ekran görür; oyun sizin kafenizin parçası gibi durur.' },
      { title: 'Personel yükü yok', body: 'Oyunu garson kurmaz, anlatmaz. Masa kendi telefonlarından başlatır.' },
    ],
    steps: [
      ['Karekod masada durur', 'Pleksi şeker kutusunun ya da menünün yanında durur, misafir oturunca görür.'],
      ['Misafir oyunu seçer', 'Kaç kişi olduklarına göre oyun listesi çıkar; arkadaşları aynı karekodu okutup katılır.'],
      ['Siz günü izlersiniz', 'Akşam panelden en çok oynanan oyunu ve yoğun saatleri görür, gerekirse oyun listesini değiştirirsiniz.'],
    ],
    faq: [
      { q: 'Laptopla çalışan misafirleri rahatsız eder mi?', a: 'Hayır. Oyun yalnızca karekodu okutan masada başlar. Sessiz isteyen masa karekodu hiç okutmaz; kafenin geri kalanı etkilenmez.' },
      { q: 'Hangi oyunları kapatmalıyım?', a: 'Gürültülü oyunları (Tabu, Çiz Bakalım) sakin saatlerde sevmiyorsanız panelden tek dokunuşla kapatıp akşam açabilirsiniz.' },
      { q: 'Tek kişilik masa için bir şey var mı?', a: 'Oyunların çoğu birden fazla oyuncu ister. Bil Bakalım ve Satranç 2 kişiyle başlar; tek başına gelen misafir için bu bir arkadaşını davet etmek anlamına gelir.' },
    ],
  },
  {
    slug: 'bar-pub',
    name: 'Bar & pub',
    title: 'Akşam kalabalığı,',
    hl: 'masada kendi eğlencesini bulur',
    lead: 'Bar ve pub masaları sohbetle dolar, sohbet oyunla uzar. Rol ve blöf oyunları tam bu ortam için: kalabalık, gürültülü ve herkesin kendi telefonu elinde.',
    card: 'Kalabalık arkadaş grupları, blöf ve rol oyunları, happy hour akşamları.',
    games: [
      { id: 'vampir', why: '5-10 kişilik masa için gizli rollü oyun; tartışma uzadıkça içecek siparişi de gelir.' },
      { id: 'spyfall', why: 'Casus kim? 8-10 dakikalık turlar, masa her turda yeniden şüphelenir.' },
      { id: 'ajanlar', why: 'İki takım, bir tahta; takımlar arası kıran kırana rekabet.' },
      { id: 'tabu', why: 'Takım halinde bağırarak oynanır, bar ortamında hiç yadırganmaz.' },
    ],
    benefits: [
      { title: 'Kalabalık masayı aynı oyunda toplar', body: 'Vampir Köylü 10 kişiye kadar oynanır. Büyük arkadaş grubu tek oyunda buluşur, kimse telefonla tek başına kalmaz.' },
      { title: 'Happy hour ve etkinlik duyurusu', body: 'Duyuru panosu oyun listesinin en üstünde görünür: "21.00 sonrası bira 2 al 1 öde" gibi bir mesajı masaların hepsine ulaştırırsınız.' },
      { title: 'Ödül koduyla masa teşviki', body: 'Hedefi tutturan masaya tek kullanımlık ödül kodu çıkar. İkramın ne olacağına ve maliyetine siz karar verirsiniz; garson kodu panelden doğrular.' },
      { title: 'Evden oynanamaz', body: 'Konum kilidi açıksa masaya yalnızca mekândaki telefonlar katılır; karekodun fotoğrafı işe yaramaz.' },
    ],
    steps: [
      ['Karekod masa numarasıyla gelir', 'Her masanın kendi karekodu olur; hangi masanın hangi oyunu oynadığı panelde net görünür.'],
      ['Grup rolünü seçer', 'Herkes telefonundan katılır, roller gizlice dağıtılır; ekranı kimse görmeden oynanır.'],
      ['Akşam sonu rapor', 'Kaç masa kaç kişiyle hangi saatte oynadı, panelde saat saat bakarsınız.'],
    ],
    faq: [
      { q: 'Müzik yüksekken oyun oynanır mı?', a: 'Ekran tabanlı oyunlar (Bil Bakalım, Çiz Bakalım, Gizli Ajanlar) gürültüden etkilenmez. Sesli anlatım isteyen Tabu\'da masa kendi aralarında konuşur.' },
      { q: 'Alkollü ortamda ödül kodu riskli mi?', a: 'Ödülü siz belirlersiniz; içecek yerine tatlı, atıştırmalık ya da bir sonraki ziyarette indirim gibi bir ikram da tanımlayabilirsiniz.' },
      { q: 'Misafirler birbirinin oyununu bozabilir mi?', a: 'Her masa kendi odasında oynar. Her masanın karekodu kendi odasına açılır; konum kilidi açıksa mekânın dışındaki telefonlar hiçbir masaya katılamaz.' },
    ],
  },
  {
    slug: 'restoran',
    name: 'Restoran',
    title: 'Yemek beklerken,',
    hl: 'masa birlikte oynar',
    lead: 'Siparişle yemek arasındaki bekleme restoranların en sıkıcı kısmıdır. Karekod, bu süreyi çocuklu aileler ve arkadaş grupları için hafif bir oyuna çevirir.',
    card: 'Sipariş sonrası bekleme, aile masaları ve uzun akşam yemekleri.',
    games: [
      { id: 'bil', why: 'Yemek gelene kadar 5-8 dakikalık hızlı yarış; masa içinde sohbeti açar.' },
      { id: 'kimim', why: 'Her yaştan kalabalık masalara uyar; aile yemeklerinde çocuklar da oynar.' },
      { id: 'cizim', why: 'Telefonla çizim, çocuklu masalarda kahkaha garantisi.' },
      { id: 'monopoly', why: 'Yemek sonrası uzayan akşamlar için uzun soluklu bir oyun.' },
    ],
    benefits: [
      { title: 'Bekleme algısını yumuşatır', body: 'Sipariş sonrası beklemenin sıkıcı hissi, masa oyundayken kısalmış gibi gelir.' },
      { title: 'Aileler için rahat masa', body: 'Çocukla gelen aile, çocuğun tableti ya da telefonuyla tek başına uğraşması yerine bir oyunu hep birlikte oynar.' },
      { title: 'Günün menüsünü duyurun', body: 'Duyuru panosuna günün çorbası ya da şefin önerisini yazın; oyun listesine bakan her misafir görür.' },
      { title: 'Masa bazlı görünürlük', body: 'Panelde hangi masaların oyun açtığını görürsünüz; servis ritmini buna göre ayarlayabilirsiniz.' },
    ],
    steps: [
      ['Karekod menünün yanında', 'Menüyle birlikte masaya konan pleksi, sipariş verildikten sonra devreye girer.'],
      ['Aile ya da arkadaş grubu katılır', 'Herkes kendi telefonundan katılır; en fazla katılımcı 2 ile 10 arasında oyuna göre değişir.'],
      ['Yemek gelince duraklatın', 'Oyunun durumu sunucuda tutulur; masada yemek servisi yapılırken oyun açık kalabilir.'],
    ],
    faq: [
      { q: 'Yemek gelince oyun kesilir mi?', a: 'Oyun, yemeği kesmeden telefonlarda açık kalabilir. Oyunun durumu sunucuda tutulur ve altı saat işlem görmeyen oda sıfırlanır.' },
      { q: 'Çocuklar için uygun oyun var mı?', a: 'Çiz Bakalım, Ben Kimim? ve Bil Bakalım çocukla birlikte oynanabilir. İçerik denetimi sizdedir: uygun olmadığını düşündüğünüz oyunu panelden kapatabilirsiniz.' },
      { q: 'Servisi yavaşlatır mı?', a: 'Oyun garson çağırmaz, sipariş akışına karışmaz. Masalar kendi telefonlarından oynar.' },
    ],
  },
  {
    slug: 'otel-lobisi',
    name: 'Otel lobisi',
    title: 'Lobide beklemek,',
    hl: 'konukların hoşuna gider',
    lead: 'Check-in, transfer ya da toplantı arası lobide oturan konuk için telefonu açıp kendi dilinde bir oyun bulmak küçük ama akılda kalan bir ayrıntıdır.',
    card: 'Lobi, bar ve teras masaları; uzun bekleyen ve gruplar halinde gelen konuklar.',
    games: [
      { id: 'satranc', why: 'İki konuk ya da iki arkadaş, sessiz ve zarif bir oyun; lobi atmosferine yakışır.' },
      { id: 'scrabble', why: 'Kelime oyunları sakin lobilerde uzun uzun oynanır.' },
      { id: 'ticket', why: 'Tren hatlarını planlayan sakin bir strateji; Türkiye haritası yerli konuk için ayrı bir tat.' },
      { id: 'carcassonne', why: 'Birlikte harita kurmak, aile ve çift konuklar için nazik bir ortak oyun.' },
    ],
    benefits: [
      { title: 'Lobiyi yaşayan bir alana çevirir', body: 'Konuk telefonunu eline almadan önce masadaki pleksiyi görür; "bir şey var burada" hissi verir.' },
      { title: 'Otelin kimliğiyle', body: 'Logonuz ve markanızın renkleri oyun ekranında; konuk oyunun otelin bir hizmeti olduğunu anlar.' },
      { title: 'Duyuruları doğru yere koyar', body: 'Akşam konseri, havuz saati ya da kahvaltı saati duyurusu oyun listesinin üstünde görünür.' },
      { title: 'Sessiz oyunlar seçilebilir', body: 'Lobi için sadece sakin oyunları açık bırakıp gürültülü olanları panelden kapatırsınız.' },
    ],
    steps: [
      ['Lobi masalarına pleksi', 'Bar, lobi ve teras masalarına karekodlar yerleşir; her masa ayrı numaralanır.'],
      ['Konuk okutur, oyunu seçer', 'Uygulama indirmek ya da otel Wi-Fi\'ına üye olmak gerekmez; mobil veriyle de çalışır.'],
      ['Siz oyun listesini düzenlersiniz', 'Sezona ve konuk profiline göre oyunları açıp kapatırsınız.'],
    ],
    faq: [
      { q: 'Yabancı konuklar için dil seçeneği var mı?', a: 'Şu an oyunlar Türkçe hazırlanmıştır. Yurtdışından konuk ağırlıyorsanız bu bilgiyi göz önünde bulundurun; çoğu satranç ve strateji oyunu dilden bağımsız oynanabilir.' },
      { q: 'Konuk odasından oynanabilir mi?', a: 'Konum kilidi lobi koordinatına göre çalışır. Mekânınızın dışında kalan telefonlar masaya katılamaz.' },
      { q: 'Birden fazla lobi alanı için tek kayıt yeter mi?', a: 'Masa sayısı toplam masa üzerinden tanımlanır. Ayrı bir bar ya da restoranınız varsa onu ayrı mekân olarak kurmak daha düzenlidir.' },
    ],
  },
  {
    slug: 'nargile-salonu',
    name: 'Nargile salonu',
    title: 'Uzun oturumlar,',
    hl: 'uzun oyunlara yakışır',
    lead: 'Nargile salonunda masa saatlerce dolu kalır. Bu, 60-120 dakikalık büyük oyunlar için ideal bir ortam: kimse acele etmez, oyun sohbetin içinde akar.',
    card: 'Saatlerce oturulan masalar, strateji ve kalabalık grup oyunları.',
    games: [
      { id: 'catan', why: 'Ticaret ve pazarlık oyunu; üç dört kişilik masa uzun uzun konuşur.' },
      { id: 'risk', why: '90-120 dakikalık fetih savaşları, nargile dumanı kadar uzayan bir rekabet.' },
      { id: 'cluedo', why: 'Not tutan, tartışan, birbirini suçlayan masalar için mantık oyunu.' },
      { id: 'monopoly', why: 'Klasik emlak oyunu; arkadaş grupları için bitmeyen bir rövanş sebebi.' },
    ],
    benefits: [
      { title: 'Zamanı oyunla doldurur', body: 'Uzun oturumlarda en sık görülen şey telefonda gezmektir. Büyük oyun masayı birbirine bakar hale getirir.' },
      { title: 'Herkesin ekranı aynı', body: 'Oyun durumu telefonlarda değil sunucuda tutulur; masadaki herkes aynı tahtayı aynı anda görür.' },
      { title: 'Kalabalık masa için çözüm', body: 'Vampir Köylü ve Tabu gibi kalabalık oyunlar sekiz on kişilik masaları da kapsar.' },
      { title: 'Duyuru panosu', body: 'Yeni aroma, paket kampanyası ya da etkinlik akşamını oyun listesinin üstüne yazabilirsiniz.' },
    ],
    steps: [
      ['Her sofa grubuna karekod', 'Masa ya da sofa grubu başına bir karekod; hangi grubun ne oynadığı panelde ayrı görünür.'],
      ['Grup uzun bir oyun seçer', 'Süresi açıkça yazan oyun listesi, grubun akşamına uygun oyunu seçmesini kolaylaştırır.'],
      ['Ödül hedefi koyun', 'Belirli bir oyunda hedefi tutturan gruba ikram çıkarabilirsiniz.'],
    ],
    faq: [
      { q: 'Uzun oyunlar ne kadar sürer?', a: 'Emlak Krallığı 60-120, Risk 90-120, Catan 60-90, Cluedo yaklaşık 45 dakika sürer. Süreler oyun listesinde yazar; grup akşamına uygun olanı seçer.' },
      { q: 'Aynı masada iki farklı oyun aynı anda açılabilir mi?', a: 'Evet. Her masa için oyun başına ayrı bir oda tutulur; grup isterse oyun değiştirebilir.' },
      { q: 'Yaş sınırı konusunda ne yapmalıyım?', a: 'Mekânınızın yaş politikası ve yasal yükümlülükleri sizin sorumluluğunuzdadır. oyunhadi masadaki oyunları sağlar; kimlik kontrolü yapmaz.' },
    ],
  },
  {
    slug: 'kampus-kafesi',
    name: 'Kampüs kafesi',
    title: 'Ders arası kalabalığı,',
    hl: 'masada yarışmaya dönüşür',
    lead: 'Öğrenci kafesinde masalar hızlı dolar, hızlı boşalır; ama final haftası ya da kulüp akşamı bir masa saatlerce kalır. Her ikisine de uyan hızlı oyunlar var.',
    card: 'Ders arası, final haftası, kulüp buluşmaları ve öğrenci turnuvaları.',
    games: [
      { id: 'bil', why: '15 dakikalık ders arasına sığar; her turda aynı anda cevaplanan hızlı bir bilgi yarışı.' },
      { id: 'kadro', why: 'Futbol sohbeti hiç eksik olmaz; 5-8 dakikada biten kadro kurma yarışı.' },
      { id: 'futbolcu', why: 'Evet-hayır sorularıyla futbolcu bulmaca; yatay sohbet için ideal.' },
      { id: 'ajanlar', why: 'Kulüp ve sınıf grupları için iki takımlı kelime yarışı.' },
    ],
    benefits: [
      { title: 'Üyelik ve kayıt yok', body: 'Öğrenci uygulama indirmek istemez. Karekodu okutur, takma ad yazar, oynar.' },
      { title: 'Turnuva akşamı kurulur', body: 'Kulüplerle ortak yarışma akşamı yapıp ödül kodunu kampüs kafesi ikramına bağlayabilirsiniz. Ayrıntı için kampüs sayfasına bakın.' },
      { title: 'Ders saatine göre oyun listesi', body: 'Gündüz kısa oyunları, akşam uzun oyunları öne çıkarmak için oyunları açıp kapatırsınız.' },
      { title: 'Paylaşılabilir bir an', body: 'Kazanılan kod, masada konuşulan bir ödül haline gelir.' },
    ],
    steps: [
      ['Karekodlar masalara', 'Kampüs kafenizin masaları numaralanır, her masaya kendi karekodu gelir.'],
      ['Öğrenciler kendiliğinden katılır', 'Kimlik ya da ders bilgisi gerekmez; takma adlarla oynanır.'],
      ['Haftalık etkinlik koyun', 'Duyuru panosuyla "Perşembe 18.00 Bil Bakalım turnuvası" gibi bir duyuru yayınlayın.'],
    ],
    faq: [
      { q: 'Öğrenci kimliği doğruluyor mu?', a: 'Hayır. oyunhadi hesap, e-posta ya da kimlik istemez. Oyuncu yalnızca bir takma ad yazar.' },
      { q: 'Wi-Fi yoksa çalışır mı?', a: 'Oyunlar internet bağlantısı ister; kampüs Wi-Fi\'ı ya da mobil veri yeterlidir.' },
      { q: 'Kulüpler kendi sorusunu ekleyebilir mi?', a: 'Şu an kulüplerin ya da mekânın kendi sorusunu eklemesi mümkün değil; sorular oyunun içinde hazır gelir.' },
    ],
  },
  {
    slug: 'tatlici',
    name: 'Tatlıcı',
    title: 'Tatlı, çay ve',
    hl: 'bir tur daha',
    lead: 'Tatlıcıda oturma süresi kısa, tekrar gelme isteği güçlüdür. Hızlı oyunlar masayı birbirine yaklaştırır, ödül kodu ise ikinci ziyaretin sebebi olabilir.',
    card: 'Kısa süreli oturumlar, çay saati ve aile ziyaretleri.',
    games: [
      { id: 'bil', why: 'Tatlı gelene kadar bir tur; masa kısa ve eğlenceli bir yarışla ısınır.' },
      { id: 'kimim', why: 'Aile masalarında herkesin anladığı basit kurallı bir oyun.' },
      { id: 'cizim', why: 'Çocuklu masalar için çizim, tatlı beklerken sakin bir eğlence.' },
      { id: 'azul', why: 'Renkli fayanslar; tatlı vitrinine benzeyen sakin bir görsel.' },
    ],
    benefits: [
      { title: 'İkinci ziyaretin sebebi', body: 'Ödül kodu kısa süreli geçerli olduğu için kazanan masa tatlı ya da çay ikramını o ziyarette kullanır; ikramı siz belirlersiniz.' },
      { title: 'Küçük mekâna uygun', body: 'Birkaç masalı mekânlar için de çalışır, ek donanım gerekmez.' },
      { title: 'Yeni ürün duyurusu', body: 'Mevsimin tatlısını duyuru panosuna yazın; oyun listesini açan her masa görür.' },
      { title: 'Çocuklar meşgul olur', body: 'Aile masasında çocuğun oyunu ebeveynle birlikte oynaması, tatlıyı sakince yemeyi kolaylaştırır.' },
    ],
    steps: [
      ['Vitrin yanına karekod', 'Pleksi masada, vitrin yanında bir duyuru olarak durur.'],
      ['Masa bir tur oynar', 'Kısa oyunlar tatlı gelene kadar tamamlanır.'],
      ['Kazanan kodu garsona gösterir', 'Garson kodu panelden doğrular; kod ikinci kez kullanılamaz.'],
    ],
    faq: [
      { q: 'Ödül kodu ne kadar geçerli?', a: 'Kod birkaç saat geçerlidir ve bir kez kullanılabilir. Ödülün ne olacağını siz belirlersiniz.' },
      { q: 'Dışarı satış ağırlıklı bir tatlıcıda işe yarar mı?', a: 'Hayır. oyunhadi masada oturan misafir içindir; paket servis ağırlıklı mekânlara uygun değildir.' },
      { q: 'Şubemiz bir AVM içinde, konum kilidi çalışır mı?', a: 'Konum kilidi mekân koordinatının çevresinde kontrol yapar; AVM içinde GPS sapabileceği için ilk kurulumda test etmeniz önerilir.' },
    ],
  },
  {
    slug: 'bowling-eglence',
    name: 'Bowling & eğlence',
    title: 'Sıra beklerken,',
    hl: 'masa oyuna dönsün',
    lead: 'Bowling pistinde sıra beklemek, atış arasında oyun oynamak için zaten bir fırsattır. Eğlence merkezlerinde grup büyüktür, enerji yüksektir, oyunlar hızlı olmalıdır.',
    card: 'Pist başı ve lounge masaları, doğum günü grupları, takım etkinlikleri.',
    games: [
      { id: 'tabu', why: 'Pist başı takım oyununa dönüşür; atışlar arasında anlatıcı değişir.' },
      { id: 'bil', why: 'Atış arası 5-8 dakikaya sığan hızlı yarış.' },
      { id: 'ajanlar', why: 'Doğum günü ve takım etkinliği gruplarına iki takımlı oyun.' },
      { id: 'vampir', why: 'Kalabalık gruplar için gizli rol, tartışma ve kahkaha.' },
    ],
    benefits: [
      { title: 'Atışlar arası boşluğu doldurur', body: 'Sıra beklemek bazen telefona bakmak demektir. Oyun, grup içi etkileşimi canlı tutar.' },
      { title: 'Doğum günü ve grup rezervasyonları', body: 'Büyük grupların hepsi kendi telefonundan katılır; kimse oyun dışında kalmaz.' },
      { title: 'Ödül kodu ve ikram', body: 'Oyun turnuvasını kazanan takıma ikram ya da indirim kodu tanımlayabilirsiniz.' },
      { title: 'Etkinlik duyurusu', body: 'Hafta sonu kampanyası, turnuva saati ve kampanya paketlerini duyuru panosuna ekleyin.' },
    ],
    steps: [
      ['Pist ve lounge masalarına karekod', 'Her pist ve lounge masası numaralı bir karekod alır.'],
      ['Grup oyunu seçer', 'Süresi kısa olanlar atış aralarına, uzun olanlar lounge oturumlarına uygundur.'],
      ['Etkinlik akşamı kurun', 'Doğum günü paketlerine oyun turnuvası eklemek için panelden ödül tanımlayın.'],
    ],
    faq: [
      { q: 'Gürültülü ortamda oyunlar duyulur mu?', a: 'Ekran tabanlı oyunlar (Bil Bakalım, Gizli Ajanlar, Çiz Bakalım) gürültüden etkilenmez.' },
      { q: 'Çok büyük grupta herkes katılabilir mi?', a: 'Oyunlar en fazla 10 kişiye kadar destekliyor (örneğin Vampir Köylü ve Tabu). Daha büyük gruplar birden fazla masa kullanabilir.' },
      { q: 'Pist başına ayrı karekod mu gerekir?', a: 'Karekodlar masa numarasıyla hazırlanır ve teklif masa sayısına göre yapılır. Pist başı alanlarınızın kaç masa sayılacağını görüşmede birlikte netleştiririz.' },
    ],
  },
];

export const findSolution = (slug: string) => SOLUTIONS.find((s) => s.slug === slug);
