// Tabu: iki takım sırayla oynar. Sırası gelen takımdan bir oyuncu (anlatıcı) kartı görür ve ekrandaki kelimeyi
// yasaklı kelimeleri söylemeden anlatır; takım arkadaşları tahmin eder. Rakip takım kartı izler ve yasaklı
// kelime söylendiğinde "TABU" diyerek hakemlik yapar.
//
// Puanlama: doğru tahmin anlatıcının takımına +1; tabu (yasaklı kelime söylendi) anlatıcının takımına −1;
// pas puan değiştirmez ama tur başına sınırlı pas hakkı vardır. Oyun, her oyuncu belirli sayıda anlatana kadar sürer.
export const TEAM = { r: 'Kırmızı', b: 'Mavi' };
export const TURN_MS = 60 * 1000;
export const TURN_OPTIONS = [30, 45, 60, 90, 120]; // saniye; lobide seçilir
export const PASSES = 3;
export const ROUNDS = 2; // her oyuncu en az bu kadar kez anlatır
export const RULES = [
  'İki takım sırayla oynar; her tur bir oyuncu anlatır, takım arkadaşları tahmin eder.',
  'Doğru tahmin: anlatıcının takımına +1 puan. Kart otomatik olarak değişir.',
  'Yasaklı (tabu) kelimeden birini söylemek: anlatıcının takımına −1 puan. Rakip takım TABU’ya basar.',
  'Pas: puan değişmez, ama tur başına en fazla 3 pas hakkın var.',
  'Beraberlikte her takıma bir uzatma eli verilir.',
];

// Kart: anlattırılacak kelime (w) ve yasaklı kelimeler (t). Yasaklı kelimeler kartın kelimesini veya
// onun içinde geçen bir kelimeyi içermez; her kartta 5 yasaklı kelime vardır.
export const CARDS = [
  // Yiyecek ve içecek
  { w: 'Çay', t: ['demlik', 'bardak', 'Rize', 'şeker', 'sıcak'] },
  { w: 'Kahve', t: ['fincan', 'telve', 'sütlü', 'kafein', 'Türk'] },
  { w: 'Simit', t: ['susam', 'fırın', 'halka', 'kahvaltı', 'sokak satıcısı'] },
  { w: 'Pasta', t: ['krema', 'dilim', 'tatlı', 'kek', 'kat'] },
  { w: 'Dondurma', t: ['soğuk', 'külah', 'yaz', 'vanilya', 'erimek'] },
  { w: 'Pizza', t: ['İtalyan', 'peynir', 'mozzarella', 'fırın', 'hamur'] },
  { w: 'Hamburger', t: ['ekmek', 'köfte', 'patates', 'turşu', 'fast food'] },
  { w: 'Çorba', t: ['kaşık', 'sıcak', 'mercimek', 'tuz', 'kış'] },
  { w: 'Balık', t: ['deniz', 'olta', 'yüzgeç', 'ızgara', 'kılçık'] },
  { w: 'Çikolata', t: ['kakao', 'bar', 'sütlü', 'kahverengi', 'tatlı'] },
  { w: 'Börek', t: ['yufka', 'peynirli', 'ıspanak', 'tepsi', 'kıymalı'] },
  { w: 'Pilav', t: ['pirinç', 'tencere', 'tereyağı', 'sofra', 'buharda'] },
  { w: 'Ayran', t: ['yoğurt', 'köpük', 'tuz', 'kebap', 'bardak'] },
  { w: 'Lokum', t: ['şeker', 'nişasta', 'gül', 'kutu', 'Hacı Bekir'] },
  { w: 'Patates', t: ['toprak', 'kızartma', 'püre', 'kök', 'yumru'] },
  { w: 'Elma', t: ['meyve', 'ağaç', 'yeşil', 'kırmızı', 'Newton'] },
  { w: 'Karpuz', t: ['yaz', 'kırmızı', 'çekirdek', 'yeşil', 'kavun'] },
  { w: 'Yumurta', t: ['tavuk', 'kırmak', 'sarı', 'beyaz', 'kabuk'] },
  { w: 'Ekmek', t: ['fırın', 'somun', 'buğday', 'un', 'bayat'] },
  { w: 'Bal', t: ['arı', 'petek', 'kovan', 'süzme', 'yapışkan'] },
  { w: 'Turşu', t: ['salatalık', 'tuzlu', 'kavanoz', 'sirke', 'kış'] },
  { w: 'Sucuk', t: ['kırmızı', 'et', 'Kayseri', 'kahvaltı', 'baharat'] },
  { w: 'Çikolatalı pasta', t: ['krema', 'kakao', 'doğum günü', 'kek', 'bar'] },
  // Hayvanlar
  { w: 'Kedi', t: ['miyav', 'evcil', 'tüy', 'köpek', 'fare'] },
  { w: 'Köpek', t: ['havlamak', 'evcil', 'kemik', 'kedi', 'sadık'] },
  { w: 'Aslan', t: ['yele', 'kral', 'savan', 'pençe', 'kükremek'] },
  { w: 'Kaplan', t: ['çizgili', 'turuncu', 'hayvanat bahçesi', 'Asya', 'yırtıcı'] },
  { w: 'Fil', t: ['hortum', 'sirk', 'Afrika', 'dev', 'kulak'] },
  { w: 'Zürafa', t: ['boyun', 'benek', 'Afrika', 'uzun', 'yaprak'] },
  { w: 'Tavşan', t: ['havuç', 'kulak', 'kuyruk', 'kır', 'zıplamak'] },
  { w: 'Kuş', t: ['uçmak', 'kanat', 'gaga', 'yuva', 'tüy'] },
  { w: 'Balina', t: ['okyanus', 'su püskürtmek', 'memeli', 'dev', 'mavi'] },
  { w: 'Yılan', t: ['sürünmek', 'zehir', 'sepetçi', 'kuyruk', 'pul'] },
  { w: 'Kurbağa', t: ['bataklık', 'zıplamak', 'yeşil', 'su', 'göl'] },
  { w: 'Kelebek', t: ['kanat', 'renkli', 'tırtıl', 'pul', 'uçmak'] },
  { w: 'Kaplumbağa', t: ['yavaş', 'kabuk', 'uzun ömür', 'sürünmek', 'deniz'] },
  { w: 'Ayı', t: ['kış uykusu', 'kahverengi', 'kutup', 'pençe', 'şişman'] },
  { w: 'Papağan', t: ['konuşmak', 'tüy', 'renkli', 'tekrarlamak', 'gaga'] },
  { w: 'At', t: ['binmek', 'yele', 'nal', 'ahır', 'koşmak'] },
  { w: 'İnek', t: ['süt', 'boynuz', 'otlamak', 'çiftlik', 'dana'] },
  { w: 'Koyun', t: ['yün', 'kuzu', 'sürü', 'çoban', 'meleme'] },
  { w: 'Maymun', t: ['muz', 'ağaç', 'şempanze', 'kuyruk', 'taklit'] },
  { w: 'Penguen', t: ['buz', 'kutup', 'uçamamak', 'siyah beyaz', 'güney'] },
  { w: 'Yunus', t: ['deniz', 'zeki', 'atlamak', 'okyanus', 'şişe'] },
  { w: 'Timsah', t: ['nehir', 'dişli', 'sürüngen', 'ağız', 'Nil'] },
  { w: 'Karınca', t: ['küçük', 'yuva', 'koloni', 'çalışkan', 'yiyecek'] },
  // Meslekler ve roller
  { w: 'Doktor', t: ['hasta', 'hastane', 'ilaç', 'muayene', 'beyaz önlük'] },
  { w: 'Hemşire', t: ['serum', 'enjeksiyon', 'bakım', 'nöbet', 'şırınga'] },
  { w: 'Polis', t: ['suç', 'hırsız', 'karakol', 'tutuklamak', 'üniforma'] },
  { w: 'İtfaiyeci', t: ['yangın', 'su', 'hortum', 'kırmızı', 'söndürmek'] },
  { w: 'Aşçı', t: ['mutfak', 'yemek', 'şef', 'pişirmek', 'tencere'] },
  { w: 'Öğretmen', t: ['tahta', 'ders', 'sınıf', 'karne', 'tebeşir'] },
  { w: 'Pilot', t: ['uçak', 'kokpit', 'gökyüzü', 'yolcu', 'kaptan'] },
  { w: 'Garson', t: ['restoran', 'sipariş', 'menü', 'tepsi', 'bahşiş'] },
  { w: 'Berber', t: ['saç', 'tıraş', 'makas', 'sakal', 'dükkân'] },
  { w: 'Çiftçi', t: ['tarla', 'traktör', 'hasat', 'köy', 'ekin'] },
  { w: 'Asker', t: ['silah', 'üniforma', 'komutan', 'savaş', 'nöbet'] },
  { w: 'Ressam', t: ['tablo', 'fırça', 'boya', 'tuval', 'sanat'] },
  { w: 'Şarkıcı', t: ['ses', 'mikrofon', 'konser', 'albüm', 'sahne'] },
  { w: 'Hakem', t: ['düdük', 'saha', 'kırmızı kart', 'maç', 'karar'] },
  { w: 'Hastane', t: ['doktor', 'ameliyat', 'acil servis', 'ambulans', 'serum'] },
  { w: 'Okul', t: ['öğrenci', 'öğretmen', 'ders', 'zil', 'sınıf'] },
  // Yerler
  { w: 'Kütüphane', t: ['kitap', 'sessizlik', 'ödünç', 'raf', 'okur'] },
  { w: 'Plaj', t: ['kum', 'deniz', 'şemsiye', 'güneşlenmek', 'mayo'] },
  { w: 'Müze', t: ['sergi', 'eser', 'tarih', 'rehber', 'koleksiyon'] },
  { w: 'Pazar', t: ['tezgâh', 'indirim', 'meyve', 'sebze', 'cuma'] },
  { w: 'Park', t: ['çimen', 'salıncak', 'bank', 'oyun alanı', 'piknik'] },
  { w: 'Havaalanı', t: ['pist', 'terminal', 'bagaj', 'kontrol', 'uçuş'] },
  { w: 'Otel', t: ['oda', 'resepsiyon', 'konaklamak', 'yıldız', 'lobi'] },
  { w: 'Cami', t: ['minare', 'namaz', 'kubbe', 'mihrap', 'ezan'] },
  { w: 'Mutfak', t: ['ocak', 'tencere', 'lavabo', 'yemek', 'tabak'] },
  { w: 'Banyo', t: ['duş', 'küvet', 'lavabo', 'havlu', 'sabun'] },
  { w: 'Bahçe', t: ['çim', 'toprak', 'sulamak', 'sebze', 'çit'] },
  { w: 'Köprü', t: ['nehir', 'geçmek', 'kemer', 'boğaz', 'asma'] },
  { w: 'Kafe', t: ['kahve', 'masa', 'sohbet', 'pasta', 'menü'] },
  { w: 'Sahil', t: ['deniz', 'kum', 'dalga', 'kıyı', 'yürüyüş'] },
  { w: 'Çöl', t: ['kum', 'deve', 'kaktüs', 'Sahra', 'vaha'] },
  { w: 'Ev', t: ['oda', 'kapı', 'mutfak', 'aile', 'çatı'] },
  // Ev eşyaları ve günlük nesneler
  { w: 'Telefon', t: ['aramak', 'ekran', 'numara', 'cep', 'mesaj'] },
  { w: 'Bilgisayar', t: ['klavye', 'fare', 'ekran', 'internet', 'program'] },
  { w: 'Televizyon', t: ['kanal', 'kumanda', 'dizi', 'ekran', 'izlemek'] },
  { w: 'Saat', t: ['kol', 'akrep', 'yelkovan', 'zaman', 'çalmak'] },
  { w: 'Gözlük', t: ['cam', 'burun', 'miyop', 'takmak', 'çerçeve'] },
  { w: 'Şemsiye', t: ['yağmur', 'açmak', 'ıslak', 'sap', 'korumak'] },
  { w: 'Ayna', t: ['yansıma', 'bakmak', 'cam', 'yüz', 'kırılmak'] },
  { w: 'Anahtar', t: ['kapı', 'kilit', 'açmak', 'çilingir', 'deste'] },
  { w: 'Kitap', t: ['okumak', 'sayfa', 'yazar', 'kütüphane', 'roman'] },
  { w: 'Kalem', t: ['yazmak', 'kâğıt', 'kurşun', 'silgi', 'tükenmez'] },
  { w: 'Valiz', t: ['tatil', 'seyahat', 'bagaj', 'çanta', 'tekerlek'] },
  { w: 'Pasaport', t: ['yurtdışı', 'vize', 'kimlik', 'havaalanı', 'fotoğraf'] },
  { w: 'Para', t: ['cüzdan', 'banka', 'lira', 'harcamak', 'kâğıt'] },
  { w: 'Banka', t: ['para', 'kredi', 'ATM', 'hesap', 'şube'] },
  { w: 'Yatak', t: ['uyumak', 'yastık', 'gece', 'battaniye', 'rahat'] },
  { w: 'Buzdolabı', t: ['soğuk', 'yiyecek', 'mutfak', 'dondurucu', 'kapak'] },
  { w: 'Çamaşır makinesi', t: ['yıkamak', 'kirli', 'deterjan', 'kıyafet', 'sıkma'] },
  { w: 'Süpürge', t: ['temizlik', 'toz', 'elektrik', 'halı', 'yer'] },
  { w: 'Diş fırçası', t: ['macun', 'sabah', 'ağız', 'temizlemek', 'gargara'] },
  { w: 'Sabun', t: ['yıkamak', 'köpük', 'el', 'banyo', 'koku'] },
  { w: 'Şampuan', t: ['saç', 'banyo', 'köpük', 'yıkamak', 'bakım'] },
  { w: 'Bardak', t: ['su', 'içmek', 'cam', 'plastik', 'kulp'] },
  { w: 'Tencere', t: ['pişirmek', 'kapak', 'ocak', 'kaynamak', 'tava'] },
  { w: 'Kaşık', t: ['çorba', 'çatal', 'bıçak', 'yemek', 'metal'] },
  { w: 'Masa', t: ['sandalye', 'tabak', 'ahşap', 'ayak', 'örtü'] },
  { w: 'Koltuk', t: ['oturmak', 'kanepe', 'minder', 'salon', 'rahat'] },
  { w: 'Kapı', t: ['menteşe', 'kilit', 'giriş', 'tokmak', 'zil'] },
  { w: 'Pencere', t: ['cam', 'perde', 'manzara', 'duvar', 'çerçeve'] },
  { w: 'Merdiven', t: ['basamak', 'kat', 'çıkmak', 'korkuluk', 'asansör'] },
  { w: 'Asansör', t: ['kat', 'kabin', 'düğme', 'merdiven', 'bina'] },
  { w: 'Şapka', t: ['baş', 'güneş', 'kep', 'kafa', 'bere'] },
  { w: 'Ayakkabı', t: ['taban', 'bağcık', 'topuk', 'spor', 'numara'] },
  { w: 'Çanta', t: ['omuz', 'taşımak', 'fermuar', 'el', 'deri'] },
  { w: 'Tarak', t: ['saç', 'dişli', 'dağınık', 'düzeltmek', 'berber'] },
  { w: 'Oyuncak', t: ['çocuk', 'bebek', 'peluş', 'eğlence', 'yumuşak'] },
  { w: 'Lego', t: ['yapı taşı', 'blok', 'inşa', 'çocuk', 'Danimarka'] },
  { w: 'Balon', t: ['hava', 'şişirmek', 'patlamak', 'renkli', 'ip'] },
  { w: 'Mum', t: ['yanmak', 'ateş', 'fitil', 'pasta', 'ışık'] },
  { w: 'Kibrit', t: ['ateş', 'çakmak', 'çöp', 'yakmak', 'kutu'] },
  { w: 'Kum saati', t: ['huni', 'cam', 'ölçmek', 'dakika', 'bekleme'] },
  { w: 'Kamera', t: ['fotoğraf', 'lens', 'flaş', 'çekmek', 'video'] },
  { w: 'Radyo', t: ['frekans', 'anten', 'müzik', 'dinlemek', 'kanal'] },
  { w: 'Pil', t: ['şarj', 'enerji', 'kutup', 'elektrik', 'AA'] },
  { w: 'İnternet', t: ['tarayıcı', 'wifi', 'ağ', 'sörf', 'bağlantı'] },
  // Ulaşım
  { w: 'Araba', t: ['tekerlek', 'direksiyon', 'motor', 'benzin', 'yol'] },
  { w: 'Bisiklet', t: ['pedal', 'tekerlek', 'sürmek', 'zincir', 'gidon'] },
  { w: 'Otobüs', t: ['durak', 'şoför', 'yolcu', 'biniş', 'bilet'] },
  { w: 'Metro', t: ['tünel', 'yeraltı', 'raylı', 'vagon', 'turnike'] },
  { w: 'Tren', t: ['ray', 'istasyon', 'vagon', 'lokomotif', 'bilet'] },
  { w: 'Gemi', t: ['deniz', 'kaptan', 'liman', 'yelken', 'güverte'] },
  { w: 'Uçak', t: ['havaalanı', 'pilot', 'kanat', 'bilet', 'uçmak'] },
  { w: 'Helikopter', t: ['pervane', 'rotor', 'kurtarma', 'uçmak', 'iniş'] },
  // Spor ve oyun
  { w: 'Futbol', t: ['top', 'kale', 'gol', 'hakem', 'maç'] },
  { w: 'Basketbol', t: ['pota', 'top', 'sayı', 'smaç', 'NBA'] },
  { w: 'Voleybol', t: ['file', 'servis', 'ağ', 'pas', 'sahası'] },
  { w: 'Tenis', t: ['raket', 'kort', 'Wimbledon', 'top', 'set'] },
  { w: 'Yüzmek', t: ['havuz', 'deniz', 'mayo', 'su', 'kulaç'] },
  { w: 'Kayak', t: ['kar', 'pist', 'sopa', 'dağ', 'botlar'] },
  { w: 'Satranç', t: ['taş', 'şah', 'vezir', 'tahta', 'hamle'] },
  { w: 'Kart oyunu', t: ['papaz', 'as', 'deste', 'kupa', 'dağıtmak'] },
  { w: 'Zar', t: ['küp', 'nokta', 'altı yüzlü', 'atmak', 'kumar'] },
  { w: 'Dans', t: ['müzik', 'ritim', 'oynamak', 'adım', 'halay'] },
  { w: 'Gitar', t: ['tel', 'çalmak', 'müzik', 'akort', 'akustik'] },
  { w: 'Piyano', t: ['tuş', 'siyah', 'beyaz', 'çalmak', 'kuyruklu'] },
  { w: 'Keman', t: ['yay', 'orkestra', 'tel', 'çalmak', 'şef'] },
  { w: 'Davul', t: ['tokmak', 'deri', 'ritim', 'marş', 'vurmak'] },
  { w: 'Sinema', t: ['film', 'bilet', 'perde', 'patlamış mısır', 'salon'] },
  { w: 'Tiyatro', t: ['sahne', 'oyuncu', 'perde', 'seyirci', 'oyun'] },
  // Etkinlikler ve kutlamalar
  { w: 'Düğün', t: ['gelin', 'damat', 'davul', 'nikâh', 'davetli'] },
  { w: 'Doğum günü', t: ['pasta', 'mum', 'hediye', 'kutlamak', 'yaş'] },
  { w: 'Bayram', t: ['şeker', 'harçlık', 'kurban', 'tatil', 'ziyaret'] },
  { w: 'Yılbaşı', t: ['gece', 'kutlamak', 'hindi', 'çam', 'hediye'] },
  { w: 'Tatil', t: ['otel', 'deniz', 'dinlenmek', 'izin', 'valiz'] },
  { w: 'Mezuniyet', t: ['diploma', 'cüppe', 'tören', 'kep', 'okul'] },
  { w: 'Ramazan', t: ['oruç', 'iftar', 'sahur', 'teravih', 'fanus'] },
  { w: 'Karne', t: ['not', 'veli', 'tatil', 'sonuç', 'okul'] },
  { w: 'Piknik', t: ['sepet', 'battaniye', 'çimen', 'sandviç', 'mangal'] },
  { w: 'Sınav', t: ['soru', 'cevap', 'not', 'kalem', 'zaman'] },
  // Doğa ve gök cisimleri
  { w: 'Güneş', t: ['sıcak', 'gökyüzü', 'gündüz', 'ışık', 'yaz'] },
  { w: 'Ay', t: ['gece', 'gökyüzü', 'hilal', 'uydu', 'yıldız'] },
  { w: 'Kar', t: ['kış', 'beyaz', 'soğuk', 'tipi', 'kayak'] },
  { w: 'Yağmur', t: ['ıslak', 'bulut', 'şemsiye', 'damla', 'yağmak'] },
  { w: 'Deniz', t: ['mavi', 'dalga', 'tuzlu', 'plaj', 'yüzmek'] },
  { w: 'Dağ', t: ['tırmanmak', 'zirve', 'yüksek', 'kar', 'yamaç'] },
  { w: 'Orman', t: ['ağaç', 'yeşil', 'hayvan', 'kamp', 'yaprak'] },
  { w: 'Ağaç', t: ['yaprak', 'dal', 'orman', 'kök', 'meyve'] },
  { w: 'Çiçek', t: ['koku', 'bahçe', 'gül', 'renkli', 'bitki'] },
  { w: 'Gökkuşağı', t: ['renk', 'yağmur', 'güneş', 'yay', 'yedi renk'] },
  { w: 'Şimşek', t: ['gök gürültüsü', 'fırtına', 'parlamak', 'elektrik', 'bulut'] },
  { w: 'Hava durumu', t: ['derece', 'meteoroloji', 'bulut', 'güneş', 'yağmur'] },
  { w: 'Ateş', t: ['yanmak', 'kıvılcım', 'sıcak', 'alev', 'kibrit'] },
  // Kavramlar
  { w: 'Aşk', t: ['kalp', 'romantik', 'sevgili', 'öpücük', 'mektup'] },
  { w: 'Rüya', t: ['uyku', 'yatak', 'gece', 'hayal', 'kabus'] },
  // Masal ve karakterler
  { w: 'Hırsız', t: ['çalmak', 'polis', 'kapı', 'gece', 'hapis'] },
  { w: 'Korsan', t: ['gemi', 'deniz', 'hazine', 'kılıç', 'papağan'] },
  { w: 'Sihirbaz', t: ['hüner', 'şapka', 'tavşan', 'değnek', 'numara'] },
  { w: 'Robot', t: ['makine', 'metal', 'insan', 'yapay', 'kumanda'] },
  { w: 'Astronot', t: ['uzay', 'roket', 'ay', 'kask', 'NASA'] },
  { w: 'Dedektif', t: ['ipucu', 'suç', 'bulmak', 'Sherlock', 'büyüteç'] },
  { w: 'Prenses', t: ['kral', 'taç', 'masal', 'kale', 'saray'] },
  { w: 'Ejderha', t: ['ateş', 'masal', 'kanat', 'mağara', 'pul'] },
];

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Her kart indeksi desteye bir kez girer; deste bitmeden aynı kart tekrar çıkmaz.
const deckFrom = (n) => shuffle([...Array(n).keys()]);

const other = (t) => (t === 'r' ? 'b' : 'r');
const activeIn = (g, seats, team) => g.order[team].filter((i) => !seats[i].left);

// Sıradaki anlatıcıyı seçer: takım sırayla döner, ayrılanlar atlanır.
function nextTurn(g, seats) {
  const team = g.turnNo % 2 === 0 ? 'r' : 'b';
  const members = activeIn(g, seats, team);
  return { team, describer: members[Math.floor(g.turnNo / 2) % members.length], phase: 'ready', endsAt: 0, card: null, passes: PASSES, log: [] };
}

export function newGame(n, seats, ms) {
  const turnMs = TURN_OPTIONS.includes(Math.round(Number(ms) / 1000)) ? Math.round(Number(ms) / 1000) * 1000 : TURN_MS;
  const order = shuffle([...Array(n).keys()]);
  const teams = Array(n);
  order.forEach((seat, k) => { teams[seat] = k % 2 === 0 ? 'r' : 'b'; });
  const lists = { r: order.filter((s) => teams[s] === 'r'), b: order.filter((s) => teams[s] === 'b') };
  const g = {
    turnMs,
    teams,
    order: lists,
    total: Math.max(lists.r.length, lists.b.length) * ROUNDS * 2,
    turnNo: 0,
    deck: deckFrom(CARDS.length),
    deckPos: 0,
    score: { r: 0, b: 0 },
    turn: null,
    history: [],
    note: '',
    over: null,
  };
  g.turn = nextTurn(g, seats);
  g.note = `${TEAM.r} takım başlıyor. Anlatıcı hazır olunca "Başla" der.`;
  return g;
}

// Kart destesi bitince yeniden karılır; yeni desteye son kart hemen tekrar gelmez.
function drawCard(g) {
  let deck = g.deck;
  let pos = g.deckPos;
  if (pos >= deck.length) {
    const last = deck[deck.length - 1];
    deck = deckFrom(CARDS.length);
    if (deck.length > 1 && deck[0] === last) [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]];
    pos = 0;
  }
  return { card: deck[pos], deck, deckPos: pos + 1 };
}

function endTurn(g, seats) {
  const t = g.turn;
  const correct = t.log.filter((x) => x.r === 'ok').length;
  const tabu = t.log.filter((x) => x.r === 'tabu').length;
  const entry = { team: t.team, describer: t.describer, log: t.log, delta: correct - tabu };
  const n = { ...g, history: [...g.history, entry], turnNo: g.turnNo + 1 };
  if (n.turnNo >= n.total) {
    const d = n.score.r - n.score.b;
    if (d === 0 && (n.overtime || 0) < 3) {
      // Beraberlik: her takıma bir el daha verilir (uzatma eli), fark çıkana kadar sürer.
      const turn = nextTurn({ ...n, total: n.total + 2 }, seats);
      return { ...n, total: n.total + 2, overtime: (n.overtime || 0) + 1, turn, note: `Berabere! İki takım da ${n.score.r} puan. Uzatma eli: ${TEAM.r} takım başlıyor.` };
    }
    const text = d === 0 ? `Berabere! İki takım da ${n.score.r} puan.` : `${TEAM[d > 0 ? 'r' : 'b']} takım kazandı! (${n.score.r} - ${n.score.b})`;
    return { ...n, turn: { ...t, phase: 'over', card: null, endsAt: 0 }, over: { winner: d === 0 ? 'none' : d > 0 ? 'r' : 'b', text }, note: text };
  }
  const turn = nextTurn(n, seats);
  return { ...n, turn, note: `Tur bitti: ${correct} doğru, ${tabu} tabu (${correct - tabu >= 0 ? '+' : ''}${correct - tabu}). Sıra ${TEAM[turn.team]} takımda.` };
}

// Süresi dolmuş turu kapatır.
function settle(g, seats, now) {
  return g.turn.phase === 'run' && now >= g.turn.endsAt ? endTurn(g, seats) : g;
}

export function begin(g0, seats, idx, now = Date.now()) {
  const g = settle(g0, seats, now);
  if (g.over) return { error: 'Oyun bitti.' };
  if (g.turn.phase !== 'ready') return { error: 'Tur zaten başladı.' };
  if (g.turn.describer !== idx) return { error: 'Turu yalnızca anlatıcı başlatabilir.' };
  const { card, deck, deckPos } = drawCard(g);
  return { ...g, deck, deckPos, turn: { ...g.turn, phase: 'run', endsAt: now + (g.turnMs || TURN_MS), card }, note: `${seats[idx].name} anlatıyor!` };
}

function advance(g, res, delta) {
  const { card, deck, deckPos } = drawCard(g);
  const t = g.turn;
  return {
    ...g,
    deck,
    deckPos,
    score: { ...g.score, [t.team]: g.score[t.team] + delta },
    turn: { ...t, card, passes: res === 'pas' ? t.passes - 1 : t.passes, log: [...t.log, { w: CARDS[t.card].w, r: res }] },
  };
}

export function act(g0, seats, idx, type, now = Date.now()) {
  const g = settle(g0, seats, now);
  if (g.over) return { error: 'Oyun bitti.' };
  const t = g.turn;
  if (t.phase !== 'run') return { error: 'Tur şu an çalışmıyor.' };
  if (type === 'right' || type === 'pass') {
    if (t.describer !== idx) return { error: 'Bu işlemi yalnızca anlatıcı yapabilir.' };
    if (type === 'pass' && t.passes <= 0) return { error: 'Pas hakkın kalmadı.' };
    return advance(g, type === 'right' ? 'ok' : 'pas', type === 'right' ? 1 : 0);
  }
  if (type === 'taboo') {
    const team = idx >= 0 ? g.teams[idx] : undefined;
    if (!team) return { error: 'Yalnızca masadaki oyuncular tabu diyebilir.' };
    if (team === t.team) return { error: 'Tabu demek rakip takımın görevi.' };
    return advance(g, 'tabu', -1);
  }
  return { error: 'Bilinmeyen işlem.' };
}

export function timeout(g, seats, now = Date.now()) {
  if (g.over) return g;
  if (g.turn.phase !== 'run' || now < g.turn.endsAt) return { error: 'Süre henüz dolmadı.' };
  return endTurn(g, seats);
}

// Oyuncu masadan ayrıldı (seats'te left işaretlendikten sonra çağrılır).
export function onLeave(g, seats, idx) {
  if (g.over) return g;
  for (const team of ['r', 'b']) {
    if (activeIn(g, seats, team).length === 0) {
      const text = `${TEAM[team]} takımda oyuncu kalmadı, oyun iptal edildi.`;
      return { ...g, over: { winner: 'none', text }, turn: { ...g.turn, phase: 'over', card: null }, note: text };
    }
  }
  if (g.turn.describer === idx) return endTurn(g, seats); // anlatıcı ayrıldı: tur atlanır
  return g;
}

// Bir oyuncuya giden görünüm: kart yalnızca anlatıcıya ve rakip takıma açıktır.
export function viewFor(g, idx, now = Date.now()) {
  if (!g) return null;
  const t = g.turn;
  const team = idx < 0 ? null : g.teams[idx];
  const sees = !g.over && t.phase === 'run' && t.card !== null && team !== null && (t.describer === idx || team !== t.team);
  return {
    teams: g.teams,
    order: g.order,
    score: g.score,
    turnNo: g.turnNo,
    total: g.total,
    turnMs: g.turnMs || TURN_MS,
    overtime: g.overtime || 0,
    turn: {
      team: t.team,
      describer: t.describer,
      phase: t.phase,
      passes: t.passes,
      leftMs: t.phase === 'run' ? Math.max(0, t.endsAt - now) : 0,
      ok: t.log.filter((x) => x.r === 'ok').length,
      tabu: t.log.filter((x) => x.r === 'tabu').length,
      card: sees ? { w: CARDS[t.card].w, t: CARDS[t.card].t } : null,
    },
    history: g.history.slice(-6),
    note: g.note,
    over: g.over,
    me: team ? { team, describer: t.describer === idx, judge: team !== t.team } : null,
  };
}
