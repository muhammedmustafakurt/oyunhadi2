// Bil Bakalım: herkes aynı soruyu kendi telefonundan, aynı anda cevaplar. Doğru cevap yalnızca süre dolunca ya da
// herkes cevaplayınca açılır. Doğru: 500 puan + kalan süreye göre en çok 500 + üst üste doğru için seri bonusu.
export const ASK_MS = 15 * 1000;
export const REVEAL_MS = 5500;
export const ROUNDS = 10;
const STREAK_BONUS = 100; // her önceki doğru için, en çok 3 kat
export const BASE = 500;

// Her soruda ilk seçenek doğru cevaptır; oyun sırasında karıştırılır.
export const BANK = [
  { c: 'Coğrafya', q: 'Türkiye\'nin başkenti neresidir?', a: ['Ankara', 'İstanbul', 'İzmir', 'Bursa'] },
  { c: 'Coğrafya', q: 'Türkiye\'nin en yüksek dağı hangisidir?', a: ['Ağrı Dağı', 'Erciyes', 'Uludağ', 'Kaçkar Dağı'] },
  { c: 'Coğrafya', q: 'Hangi şehrimiz iki kıtada yer alır?', a: ['İstanbul', 'Ankara', 'Trabzon', 'Edirne'] },
  { c: 'Coğrafya', q: 'Dünyanın en büyük okyanusu hangisidir?', a: ['Pasifik', 'Atlas', 'Hint', 'Arktik'] },
  { c: 'Coğrafya', q: 'Nil Nehri hangi kıtadadır?', a: ['Afrika', 'Asya', 'Avrupa', 'Güney Amerika'] },
  { c: 'Coğrafya', q: 'Japonya\'nın başkenti neresidir?', a: ['Tokyo', 'Kyoto', 'Osaka', 'Seul'] },
  { c: 'Coğrafya', q: 'Türkiye\'nin en büyük gölü hangisidir?', a: ['Van Gölü', 'Tuz Gölü', 'Beyşehir Gölü', 'Eğirdir Gölü'] },
  { c: 'Coğrafya', q: 'Eyfel Kulesi hangi şehirdedir?', a: ['Paris', 'Roma', 'Londra', 'Madrid'] },
  { c: 'Coğrafya', q: 'Avustralya\'nın başkenti neresidir?', a: ['Canberra', 'Sidney', 'Melbourne', 'Perth'] },
  { c: 'Coğrafya', q: 'Peri bacalarıyla ünlü Kapadokya hangi ilimizdedir?', a: ['Nevşehir', 'Konya', 'Sivas', 'Kayseri'] },
  { c: 'Coğrafya', q: 'Pamukkale travertenleri hangi ilimizdedir?', a: ['Denizli', 'Aydın', 'Muğla', 'Antalya'] },
  { c: 'Coğrafya', q: 'İstanbul Boğazı hangi iki denizi birbirine bağlar?', a: ['Karadeniz ve Marmara', 'Marmara ve Ege', 'Akdeniz ve Ege', 'Karadeniz ve Hazar'] },
  { c: 'Coğrafya', q: 'Büyük Giza piramitleri hangi şehrin yakınındadır?', a: ['Kahire', 'Luksor', 'İskenderiye', 'Asvan'] },
  { c: 'Coğrafya', q: 'Brezilya\'da resmî dil hangisidir?', a: ['Portekizce', 'İspanyolca', 'İngilizce', 'Fransızca'] },
  { c: 'Coğrafya', q: 'Dünyanın en yüksek dağı hangisidir?', a: ['Everest', 'K2', 'Kilimanjaro', 'Mont Blanc'] },
  { c: 'Coğrafya', q: 'Yüzölçümüne göre dünyanın en büyük ülkesi hangisidir?', a: ['Rusya', 'Çin', 'ABD', 'Kanada'] },
  { c: 'Coğrafya', q: 'Türkiye\'de kaç il vardır?', a: ['81', '78', '82', '80'] },
  { c: 'Coğrafya', q: 'Ankara\'nın plaka kodu kaçtır?', a: ['06', '34', '35', '16'] },
  { c: 'Tarih', q: 'Türkiye Cumhuriyeti hangi yıl kuruldu?', a: ['1923', '1919', '1938', '1920'] },
  { c: 'Tarih', q: 'İstanbul\'u fetheden Osmanlı padişahı kimdir?', a: ['Fatih Sultan Mehmet', 'Yavuz Sultan Selim', 'Kanuni Sultan Süleyman', 'I. Murad'] },
  { c: 'Tarih', q: 'İstanbul hangi yıl fethedildi?', a: ['1453', '1071', '1299', '1517'] },
  { c: 'Tarih', q: 'Çanakkale Savaşları hangi yıl yaşandı?', a: ['1915', '1912', '1923', '1919'] },
  { c: 'Tarih', q: 'Osmanlı Devleti\'nin kurucusu kimdir?', a: ['Osman Bey', 'Orhan Bey', 'Ertuğrul Gazi', 'I. Murad'] },
  { c: 'Tarih', q: 'Mimar Sinan\'ın Edirne\'deki ustalık eseri hangisidir?', a: ['Selimiye Camii', 'Süleymaniye Camii', 'Sultanahmet Camii', 'Yeni Cami'] },
  { c: 'Tarih', q: 'İnsan Ay\'a ilk kez hangi yıl ayak bastı?', a: ['1969', '1959', '1975', '1981'] },
  { c: 'Tarih', q: 'Fransız Devrimi hangi yıl başladı?', a: ['1789', '1815', '1848', '1700'] },
  { c: 'Tarih', q: 'İkinci Dünya Savaşı hangi yıl sona erdi?', a: ['1945', '1939', '1918', '1950'] },
  { c: 'Tarih', q: 'Titanik gemisi hangi yıl battı?', a: ['1912', '1905', '1920', '1898'] },
  { c: 'Tarih', q: 'Türkiye Cumhuriyeti\'nin ilk cumhurbaşkanı kimdir?', a: ['Mustafa Kemal Atatürk', 'İsmet İnönü', 'Celal Bayar', 'Cemal Gürsel'] },
  { c: 'Tarih', q: 'İstiklal Marşı\'nın şairi kimdir?', a: ['Mehmet Akif Ersoy', 'Nazım Hikmet', 'Ziya Gökalp', 'Yahya Kemal'] },
  { c: 'Bilim', q: 'Suyun kimyasal formülü nedir?', a: ['H2O', 'CO2', 'O2', 'NaCl'] },
  { c: 'Bilim', q: 'Güneş Sistemi\'ndeki en büyük gezegen hangisidir?', a: ['Jüpiter', 'Satürn', 'Neptün', 'Dünya'] },
  { c: 'Bilim', q: '"Kızıl Gezegen" olarak bilinen gezegen hangisidir?', a: ['Mars', 'Venüs', 'Merkür', 'Jüpiter'] },
  { c: 'Bilim', q: 'Yetişkin bir insanın vücudunda kaç kemik vardır?', a: ['206', '150', '312', '180'] },
  { c: 'Bilim', q: 'Dünya, Güneş\'in etrafında yaklaşık kaç günde döner?', a: ['365', '30', '180', '400'] },
  { c: 'Bilim', q: 'Bitkiler fotosentez için hangi gazı alır?', a: ['Karbondioksit', 'Oksijen', 'Azot', 'Hidrojen'] },
  { c: 'Bilim', q: 'Altının element sembolü nedir?', a: ['Au', 'Ag', 'Fe', 'Al'] },
  { c: 'Bilim', q: 'İnsan kalbi kaç odacıktan oluşur?', a: ['4', '2', '3', '6'] },
  { c: 'Bilim', q: 'Doğada bulunan en sert madde hangisidir?', a: ['Elmas', 'Altın', 'Demir', 'Kuvars'] },
  { c: 'Bilim', q: 'Gökkuşağında geleneksel olarak kaç renk sayılır?', a: ['7', '5', '6', '9'] },
  { c: 'Bilim', q: 'Aşağıdakilerden hangisi bir memelidir?', a: ['Yunus', 'Köpekbalığı', 'Ahtapot', 'Kaplumbağa'] },
  { c: 'Bilim', q: 'Dünya\'nın doğal uydusu hangisidir?', a: ['Ay', 'Mars', 'Titan', 'Venüs'] },
  { c: 'Bilim', q: 'Telefonun mucidi olarak bilinen kişi kimdir?', a: ['Alexander Graham Bell', 'Thomas Edison', 'Nikola Tesla', 'Guglielmo Marconi'] },
  { c: 'Bilim', q: 'Görelilik kuramını ortaya atan bilim insanı kimdir?', a: ['Albert Einstein', 'Isaac Newton', 'Galileo Galilei', 'Stephen Hawking'] },
  { c: 'Bilim', q: 'Yer çekimi yasasıyla anılan bilim insanı kimdir?', a: ['Isaac Newton', 'Albert Einstein', 'Galileo Galilei', 'Nikola Tesla'] },
  { c: 'Bilim', q: 'Aziz Sancar hangi alanda Nobel Ödülü aldı?', a: ['Kimya', 'Fizik', 'Edebiyat', 'Barış'] },
  { c: 'Spor', q: 'Futbolda bir takım sahaya kaç oyuncuyla çıkar?', a: ['11', '9', '10', '12'] },
  { c: 'Spor', q: 'Yaz Olimpiyat Oyunları kaç yılda bir yapılır?', a: ['4', '2', '3', '5'] },
  { c: 'Spor', q: '2022 Dünya Kupası\'nı hangi takım kazandı?', a: ['Arjantin', 'Fransa', 'Brezilya', 'Hırvatistan'] },
  { c: 'Spor', q: 'Türkiye 2002 Dünya Kupası\'nı kaçıncı bitirdi?', a: ['Üçüncü', 'İkinci', 'Dördüncü', 'Birinci'] },
  { c: 'Spor', q: 'Wimbledon turnuvası hangi zeminde oynanır?', a: ['Çim', 'Kil', 'Sert zemin', 'Halı'] },
  { c: 'Spor', q: 'Maraton koşusu yaklaşık kaç kilometredir?', a: ['42', '21', '10', '100'] },
  { c: 'Spor', q: 'Satrançta yakalandığında oyunun bittiği taş hangisidir?', a: ['Şah', 'Vezir', 'Kale', 'At'] },
  { c: 'Spor', q: 'Beşiktaş\'ın renkleri hangileridir?', a: ['Siyah-beyaz', 'Sarı-lacivert', 'Sarı-kırmızı', 'Bordo-mavi'] },
  { c: 'Spor', q: 'Muhammed Ali hangi spor dalıyla ünlenmiştir?', a: ['Boks', 'Güreş', 'Karate', 'Tenis'] },
  { c: 'Spor', q: 'Cep Herkülü Naim Süleymanoğlu hangi spor dalındadır?', a: ['Halter', 'Güreş', 'Boks', 'Yüzme'] },
  { c: 'Kültür ve sanat', q: "Guernica tablosunu hangi ressam yapmıştır?", a: ["Pablo Picasso", "Salvador Dalí", "Joan Miró", "Henri Matisse"] },
  { c: 'Kültür ve sanat', q: '"Çığlık" adlı ünlü tablonun ressamı kimdir?', a: ["Edvard Munch", "Gustav Klimt", "Egon Schiele", "Francisco Goya"] },
  { c: 'Kültür ve sanat', q: "Düşünen Adam heykelinin sanatçısı kimdir?", a: ["Auguste Rodin", "Michelangelo", "Donatello", "Bernini"] },
  { c: 'Kültür ve sanat', q: "Barselona'daki Sagrada Familia kilisesinin mimarı kimdir?", a: ["Antoni Gaudí", "Le Corbusier", "Frank Lloyd Wright", "Oscar Niemeyer"] },
  { c: 'Kültür ve sanat', q: 'Mona Lisa tablosunu kim yapmıştır?', a: ['Leonardo da Vinci', 'Michelangelo', 'Vincent van Gogh', 'Pablo Picasso'] },
  { c: 'Kültür ve sanat', q: '"Yıldızlı Gece" tablosu hangi ressama aittir?', a: ['Vincent van Gogh', 'Claude Monet', 'Salvador Dalí', 'Pablo Picasso'] },
  { c: 'Kültür ve sanat', q: 'Standart bir piyanoda kaç tuş vardır?', a: ['88', '76', '66', '100'] },
  { c: 'Kültür ve sanat', q: 'Harry Potter kitaplarının yazarı kimdir?', a: ['J. K. Rowling', 'J. R. R. Tolkien', 'Dan Brown', 'Roald Dahl'] },
  { c: 'Kültür ve sanat', q: 'Yüzüklerin Efendisi\'nin yazarı kimdir?', a: ['J. R. R. Tolkien', 'J. K. Rowling', 'C. S. Lewis', 'George R. R. Martin'] },
  { c: 'Kültür ve sanat', q: 'Aslan Kral filminin ana karakteri hangisidir?', a: ['Simba', 'Mufasa', 'Scar', 'Timon'] },
  { c: 'Kültür ve sanat', q: 'Sünger Bob\'un en yakın arkadaşı kimdir?', a: ['Patrick', 'Squidward', 'Mr. Krabs', 'Plankton'] },
  { c: 'Kültür ve sanat', q: 'Karagöz\'ün gölge oyunundaki arkadaşı kimdir?', a: ['Hacivat', 'Keloğlan', 'Nasreddin Hoca', 'Bekri Mustafa'] },
  { c: 'Kültür ve sanat', q: 'Orhan Pamuk hangi alanda Nobel Ödülü aldı?', a: ['Edebiyat', 'Barış', 'Kimya', 'Tıp'] },
  { c: 'Kültür ve sanat', q: 'Mevlana\'nın türbesi hangi ilimizdedir?', a: ['Konya', 'Kayseri', 'Bursa', 'Sivas'] },
  { c: 'Yemek', q: 'Baklavasıyla meşhur şehrimiz hangisidir?', a: ['Gaziantep', 'Trabzon', 'Rize', 'Edirne'] },
  { c: 'Yemek', q: 'Türkiye\'de çay en çok hangi ilde yetiştirilir?', a: ['Rize', 'Sinop', 'Mersin', 'Muğla'] },
  { c: 'Yemek', q: 'Pizza hangi ülkenin mutfağından gelir?', a: ['İtalya', 'Fransa', 'İspanya', 'Yunanistan'] },
  { c: 'Yemek', q: 'Suşi hangi ülkenin mutfağına aittir?', a: ['Japonya', 'Çin', 'Kore', 'Tayland'] },
  { c: 'Yemek', q: 'Menemen hangi malzemelerle yapılır?', a: ['Yumurta, domates, biber', 'Patates, soğan', 'Nohut, pirinç', 'Süt, un'] },
  { c: 'Yemek', q: 'İskender kebap hangi ilimizle anılır?', a: ['Bursa', 'Adana', 'Şanlıurfa', 'Kars'] },
  { c: 'Genel kültür', q: 'Türkçe alfabede kaç harf vardır?', a: ['29', '28', '26', '31'] },
  { c: 'Genel kültür', q: 'Bir düzine kaç adettir?', a: ['12', '10', '20', '24'] },
  { c: 'Genel kültür', q: 'Kırmızı ile sarı karıştırılınca hangi renk elde edilir?', a: ['Turuncu', 'Yeşil', 'Mor', 'Kahverengi'] },
  { c: 'Genel kültür', q: 'Karada en hızlı koşan hayvan hangisidir?', a: ['Çita', 'Aslan', 'At', 'Tilki'] },
  { c: 'Genel kültür', q: 'Karada yaşayan en büyük hayvan hangisidir?', a: ['Fil', 'Zürafa', 'Gergedan', 'Su aygırı'] },
  { c: 'Genel kültür', q: 'Türk bayrağında hangi semboller yer alır?', a: ['Ay ve yıldız', 'Güneş', 'Kılıç', 'Kartal'] },
  { c: 'Genel kültür', q: 'Nasreddin Hoca\'nın türbesi hangi ilçemizdedir?', a: ['Akşehir', 'Sivrihisar', 'Beypazarı', 'Bolu'] },
  // --- Coğrafya (devam) ---
  { c: 'Coğrafya', q: "Amazon Nehri hangi kıtadadır?", a: ["Güney Amerika", "Afrika", "Asya", "Avrupa"] },
  { c: 'Coğrafya', q: "Mısır'ın başkenti neresidir?", a: ["Kahire", "İskenderiye", "Cidde", "Amman"] },
  { c: 'Coğrafya', q: "İtalya'nın başkenti neresidir?", a: ["Roma", "Milano", "Venedik", "Napoli"] },
  { c: 'Coğrafya', q: "Almanya'nın başkenti neresidir?", a: ["Berlin", "Münih", "Hamburg", "Frankfurt"] },
  { c: 'Coğrafya', q: "İspanya'nın başkenti neresidir?", a: ["Madrid", "Barselona", "Valensiya", "Sevilla"] },
  { c: 'Coğrafya', q: "Kanada'nın başkenti neresidir?", a: ["Ottawa", "Toronto", "Vancouver", "Montreal"] },
  { c: 'Coğrafya', q: "Rusya'nın başkenti neresidir?", a: ["Moskova", "St. Petersburg", "Kiev", "Minsk"] },
  { c: 'Coğrafya', q: "Yunanistan'ın başkenti neresidir?", a: ["Atina", "Selanik", "Girit", "Patras"] },
  { c: 'Coğrafya', q: "Çin'in başkenti neresidir?", a: ["Pekin", "Şanghay", "Hong Kong", "Guangzhou"] },
  { c: 'Coğrafya', q: "Brezilya'nın başkenti neresidir?", a: ["Brasilia", "Rio de Janeiro", "Sao Paulo", "Salvador"] },
  { c: 'Coğrafya', q: "Türkiye'nin en kalabalık şehri hangisidir?", a: ["İstanbul", "Ankara", "İzmir", "Bursa"] },
  { c: 'Coğrafya', q: "Aşağıdakilerden hangisi Türkiye'nin komşusu değildir?", a: ["Mısır", "Gürcistan", "İran", "Bulgaristan"] },
  { c: 'Coğrafya', q: "Kızılırmak hangi denize dökülür?", a: ["Karadeniz", "Akdeniz", "Ege Denizi", "Marmara Denizi"] },
  { c: 'Coğrafya', q: "Aşağıdaki illerden hangisi Ege Denizi kıyısındadır?", a: ["İzmir", "Sinop", "Hatay", "Kars"] },
  { c: 'Coğrafya', q: "Dünyanın en büyük sıcak çölü hangisidir?", a: ["Sahra", "Gobi", "Kalahari", "Atacama"] },
  { c: 'Coğrafya', q: "Dünyanın en derin gölü hangisidir?", a: ["Baykal", "Van Gölü", "Victoria", "Titicaca"] },
  { c: 'Coğrafya', q: "Dünyanın yüzölçümü en küçük ülkesi hangisidir?", a: ["Vatikan", "Monako", "San Marino", "Lihtenştayn"] },
  { c: 'Coğrafya', q: "Venedik hangi ülkededir?", a: ["İtalya", "Fransa", "Yunanistan", "Hırvatistan"] },
  { c: 'Coğrafya', q: "Kolezyum hangi şehirdedir?", a: ["Roma", "Atina", "Paris", "Viyana"] },
  { c: 'Coğrafya', q: "Taj Mahal hangi ülkededir?", a: ["Hindistan", "Pakistan", "Bangladeş", "Nepal"] },
  { c: 'Coğrafya', q: "Özgürlük Heykeli hangi şehirdedir?", a: ["New York", "Washington", "Los Angeles", "Chicago"] },
  { c: 'Coğrafya', q: "Big Ben hangi şehirdedir?", a: ["Londra", "Dublin", "Edinburgh", "Manchester"] },
  { c: 'Coğrafya', q: "Sibirya hangi ülkenin topraklarındadır?", a: ["Rusya", "Kanada", "Kazakistan", "Moğolistan"] },
  { c: 'Coğrafya', q: "Aşağıdaki illerden hangisi Karadeniz kıyısındadır?", a: ["Samsun", "Mersin", "İzmir", "Muğla"] },
  { c: 'Coğrafya', q: "Efes Antik Kenti hangi ilimizdedir?", a: ["İzmir", "Aydın", "Muğla", "Manisa"] },
  { c: 'Coğrafya', q: "Göbeklitepe hangi ilimizdedir?", a: ["Şanlıurfa", "Mardin", "Diyarbakır", "Gaziantep"] },
  { c: 'Coğrafya', q: "Sümela Manastırı hangi ilimizdedir?", a: ["Trabzon", "Rize", "Giresun", "Ordu"] },
  { c: 'Coğrafya', q: "Ani Harabeleri hangi ilimizdedir?", a: ["Kars", "Erzurum", "Ağrı", "Van"] },
  { c: 'Coğrafya', q: "Nemrut Dağı'ndaki dev heykeller hangi ilimizdedir?", a: ["Adıyaman", "Malatya", "Elazığ", "Batman"] },
  { c: 'Coğrafya', q: "Anıtkabir hangi şehirdedir?", a: ["Ankara", "İstanbul", "Samsun", "Sivas"] },
  { c: 'Coğrafya', q: "Osmanlı evleriyle ünlü Safranbolu hangi ilimizdedir?", a: ["Karabük", "Bartın", "Zonguldak", "Bolu"] },
  { c: 'Coğrafya', q: "Truva (Troya) Antik Kenti hangi ilimizdedir?", a: ["Çanakkale", "Balıkesir", "Edirne", "Tekirdağ"] },
  { c: 'Coğrafya', q: "Japonya\'nın bayrağında hangi şekil vardır?", a: ["Kırmızı daire", "Beyaz yıldız", "Mavi çizgi", "Yeşil üçgen"] },
  // --- Tarih (devam) ---
  { c: 'Tarih', q: "Malazgirt Savaşı hangi yıl yapıldı?", a: ["1071", "1176", "1243", "1402"] },
  { c: 'Tarih', q: "Birinci Dünya Savaşı hangi yıl başladı?", a: ["1914", "1918", "1905", "1920"] },
  { c: 'Tarih', q: "Cumhuriyet Bayramı hangi tarihte kutlanır?", a: ["29 Ekim", "23 Nisan", "30 Ağustos", "19 Mayıs"] },
  { c: 'Tarih', q: "Türkiye Büyük Millet Meclisi hangi yıl açıldı?", a: ["1920", "1923", "1919", "1921"] },
  { c: 'Tarih', q: "Zafer Bayramı hangi tarihte kutlanır?", a: ["30 Ağustos", "19 Mayıs", "9 Eylül", "10 Kasım"] },
  { c: 'Tarih', q: "Atatürk hangi yıl vefat etti?", a: ["1938", "1930", "1945", "1923"] },
  { c: 'Tarih', q: "Atatürk hangi şehirde doğdu?", a: ["Selanik", "İstanbul", "Manastır", "Üsküp"] },
  { c: 'Tarih', q: "Harf Devrimi (Latin harflerinin kabulü) hangi yıl yapıldı?", a: ["1928", "1923", "1934", "1925"] },
  { c: 'Tarih', q: "Türk kadınına milletvekili seçme ve seçilme hakkı hangi yıl verildi?", a: ["1934", "1923", "1928", "1945"] },
  { c: 'Tarih', q: "Piramitleri hangi uygarlık yapmıştır?", a: ["Mısırlılar", "Romalılar", "Yunanlılar", "Persler"] },
  { c: 'Tarih', q: "Antik Olimpiyat Oyunları hangi ülkede başladı?", a: ["Yunanistan", "İtalya", "Mısır", "Türkiye"] },
  { c: 'Tarih', q: "1492'de Amerika'ya ulaşan denizci kimdir?", a: ["Kristof Kolomb", "Vasco da Gama", "Macellan", "Marco Polo"] },
  { c: 'Tarih', q: "Napolyon hangi adada hayatını kaybetmiştir?", a: ["Saint Helena", "Elba", "Korsika", "Malta"] },
  { c: 'Tarih', q: "Berlin Duvarı hangi yıl yıkıldı?", a: ["1989", "1961", "1975", "1991"] },
  { c: 'Tarih', q: "Sovyetler Birliği hangi yıl dağıldı?", a: ["1991", "1989", "1985", "2000"] },
  { c: 'Tarih', q: "Kanuni Sultan Süleyman'ın eşi kimdir?", a: ["Hürrem Sultan", "Nurbanu Sultan", "Kösem Sultan", "Mihrimah Sultan"] },
  { c: 'Tarih', q: "Topkapı Sarayı'nı kim yaptırmıştır?", a: ["Fatih Sultan Mehmet", "Kanuni Sultan Süleyman", "II. Abdülhamid", "Abdülmecid"] },
  { c: 'Tarih', q: "Sultanahmet Camii'nin halk arasındaki adı nedir?", a: ["Mavi Cami", "Yeşil Cami", "Kırmızı Cami", "Beyaz Cami"] },
  { c: 'Tarih', q: "Atatürk hangi sarayda hayatını kaybetmiştir?", a: ["Dolmabahçe Sarayı", "Topkapı Sarayı", "Yıldız Sarayı", "Beylerbeyi Sarayı"] },
  { c: 'Tarih', q: "Wright kardeşler ilk motorlu uçuşu hangi yıl yaptı?", a: ["1903", "1890", "1920", "1914"] },
  { c: 'Tarih', q: "Osmanlı'da ilk matbaayı kuran kişi kimdir?", a: ["İbrahim Müteferrika", "Piri Reis", "Evliya Çelebi", "Katip Çelebi"] },
  { c: 'Tarih', q: "Ünlü dünya haritasını çizen Osmanlı denizcisi kimdir?", a: ["Piri Reis", "Barbaros Hayreddin", "Turgut Reis", "Kemal Reis"] },
  { c: 'Tarih', q: "Barbaros Hayreddin Paşa hangi deniz savaşı ile anılır?", a: ["Preveze", "Lepanto", "Navarin", "Sinop"] },
  // --- Bilim (devam) ---
  { c: 'Bilim', q: "Işık yılı neyin ölçü birimidir?", a: ["Uzaklık", "Zaman", "Hız", "Kütle"] },
  { c: 'Bilim', q: "Su deniz seviyesinde kaç derecede kaynar?", a: ["100 °C", "90 °C", "80 °C", "120 °C"] },
  { c: 'Bilim', q: "Dünya'ya en yakın yıldız hangisidir?", a: ["Güneş", "Sirius", "Kutup Yıldızı", "Vega"] },
  { c: 'Bilim', q: "Güneş'e en yakın gezegen hangisidir?", a: ["Merkür", "Venüs", "Mars", "Dünya"] },
  { c: 'Bilim', q: "Halkalarıyla ünlü gezegen hangisidir?", a: ["Satürn", "Mars", "Venüs", "Merkür"] },
  { c: 'Bilim', q: "Güneş Sistemi'nde kaç gezegen vardır?", a: ["8", "9", "7", "10"] },
  { c: 'Bilim', q: "İnsan vücudunun en büyük organı hangisidir?", a: ["Deri", "Karaciğer", "Akciğer", "Kalp"] },
  { c: 'Bilim', q: "Oksijeni kana geçiren organımız hangisidir?", a: ["Akciğer", "Böbrek", "Mide", "Karaciğer"] },
  { c: 'Bilim', q: "Yetişkin bir insanın kaç dişi vardır?", a: ["32", "28", "30", "36"] },
  { c: 'Bilim', q: "Hangi vitamin güneş ışığıyla vücutta üretilir?", a: ["D vitamini", "C vitamini", "A vitamini", "B12 vitamini"] },
  { c: 'Bilim', q: "Atmosferde en çok bulunan gaz hangisidir?", a: ["Azot", "Oksijen", "Karbondioksit", "Argon"] },
  { c: 'Bilim', q: "Elektrik akımının birimi nedir?", a: ["Amper", "Volt", "Watt", "Ohm"] },
  { c: 'Bilim', q: "Demirin element sembolü nedir?", a: ["Fe", "Dm", "De", "Ir"] },
  { c: 'Bilim', q: "Sofra tuzunun kimyasal formülü nedir?", a: ["NaCl", "KCl", "CaCO3", "Na2CO3"] },
  { c: 'Bilim', q: "En hafif element hangisidir?", a: ["Hidrojen", "Helyum", "Lityum", "Oksijen"] },
  { c: 'Bilim', q: "Bitkilerin yeşil rengini veren madde nedir?", a: ["Klorofil", "Karoten", "Melanin", "Hemoglobin"] },
  { c: 'Bilim', q: "Kanın kırmızı rengini veren madde nedir?", a: ["Hemoglobin", "Klorofil", "Melanin", "İnsülin"] },
  { c: 'Bilim', q: "Penisilini bulan bilim insanı kimdir?", a: ["Alexander Fleming", "Louis Pasteur", "Marie Curie", "Edward Jenner"] },
  { c: 'Bilim', q: "Radyoaktivite çalışmalarıyla iki Nobel kazanan bilim insanı kimdir?", a: ["Marie Curie", "Rosalind Franklin", "Florence Nightingale", "Ada Lovelace"] },
  { c: 'Bilim', q: "Evrim kuramıyla anılan bilim insanı kimdir?", a: ["Charles Darwin", "Gregor Mendel", "Louis Pasteur", "Carl Linnaeus"] },
  { c: 'Bilim', q: "Şimşeği gök gürültüsünden önce görmemizin nedeni nedir?", a: ["Işık sesten hızlıdır", "Ses ışıktan hızlıdır", "Bulutlar yavaştır", "Rüzgâr sesi geciktirir"] },
  { c: 'Bilim', q: "Mevsimlerin oluşmasının asıl nedeni nedir?", a: ["Dünya'nın eksen eğikliği", "Ay'ın çekimi", "Güneş'in büyümesi", "Rüzgârlar"] },
  { c: 'Bilim', q: "Uzaya çıkan ilk insan kimdir?", a: ["Yuri Gagarin", "Neil Armstrong", "Buzz Aldrin", "John Glenn"] },
  { c: 'Bilim', q: "Ay'a ilk ayak basan insan kimdir?", a: ["Neil Armstrong", "Buzz Aldrin", "Yuri Gagarin", "Michael Collins"] },
  { c: 'Bilim', q: "Bir üçgenin iç açıları toplamı kaç derecedir?", a: ["180", "90", "360", "270"] },
  { c: 'Bilim', q: "Pi sayısı yaklaşık kaçtır?", a: ["3,14", "2,71", "1,61", "4,13"] },
  { c: 'Bilim', q: "Bir saat kaç saniyedir?", a: ["3600", "360", "6000", "1200"] },
  { c: 'Bilim', q: "Ağaçların yaşı gövdesindeki nelerin sayısıyla anlaşılır?", a: ["Halka sayısı", "Yaprak sayısı", "Dal sayısı", "Kök sayısı"] },
  { c: 'Bilim', q: "Kutup Yıldızı hangi yönü gösterir?", a: ["Kuzey", "Güney", "Doğu", "Batı"] },
  { c: 'Bilim', q: "Romen rakamıyla X kaçtır?", a: ["10", "5", "50", "100"] },
  { c: 'Bilim', q: "Bir asır kaç yıldır?", a: ["100", "10", "50", "1000"] },
  { c: 'Bilim', q: "Şubat ayı artık yılda kaç gün çeker?", a: ["29", "28", "30", "31"] },
  // --- Hayvanlar ---
  { c: 'Hayvanlar', q: "Dünyanın en büyük hayvanı hangisidir?", a: ["Mavi balina", "Fil", "Köpekbalığı", "Zürafa"] },
  { c: 'Hayvanlar', q: "Hangi hayvan en uzun boyludur?", a: ["Zürafa", "Fil", "Deve", "Devekuşu"] },
  { c: 'Hayvanlar', q: "Aşağıdaki kuşlardan hangisi uçamaz?", a: ["Penguen", "Kartal", "Leylek", "Serçe"] },
  { c: 'Hayvanlar', q: "Örümceğin kaç bacağı vardır?", a: ["8", "6", "10", "4"] },
  { c: 'Hayvanlar', q: "Böceklerin kaç bacağı vardır?", a: ["6", "8", "4", "10"] },
  { c: 'Hayvanlar', q: "Develer hörgüçlerinde ne depolar?", a: ["Yağ", "Su", "Hava", "Kemik"] },
  { c: 'Hayvanlar', q: "Hangisi yumurtlayan bir memelidir?", a: ["Ornitorenk", "Kanguru", "Yarasa", "Yunus"] },
  { c: 'Hayvanlar', q: "Rengini değiştirmesiyle ünlü sürüngen hangisidir?", a: ["Bukalemun", "Yılan", "Kaplumbağa", "Timsah"] },
  { c: 'Hayvanlar', q: "Koala hangi ülkede yaşar?", a: ["Avustralya", "Yeni Zelanda", "Güney Afrika", "Brezilya"] },
  { c: 'Hayvanlar', q: "Panda hangi ülkeyle özdeşleşmiştir?", a: ["Çin", "Japonya", "Hindistan", "Tayland"] },
  { c: 'Hayvanlar', q: "Kutup ayısı hangi bölgede yaşar?", a: ["Kuzey Kutbu", "Güney Kutbu", "Sahra", "Amazon"] },
  { c: 'Hayvanlar', q: "Kelebeğin yumurtadan çıkan ilk evresine ne denir?", a: ["Tırtıl", "Solucan", "Karınca", "Kurtçuk"] },
  { c: 'Hayvanlar', q: "Dalış sırasında en hızlı hareket eden kuş hangisidir?", a: ["Şahin", "Baykuş", "Leylek", "Güvercin"] },
  // --- Spor (devam) ---
  { c: 'Spor', q: "Basketbolda bir takım sahada kaç oyuncuyla oynar?", a: ["5", "6", "7", "4"] },
  { c: 'Spor', q: "Voleybolda bir takım sahada kaç oyuncuyla oynar?", a: ["6", "5", "7", "8"] },
  { c: 'Spor', q: "2014 Dünya Kupası'nı hangi ülke kazandı?", a: ["Almanya", "Brezilya", "Arjantin", "Hollanda"] },
  { c: 'Spor', q: "2018 Dünya Kupası'nı hangi ülke kazandı?", a: ["Fransa", "Hırvatistan", "Belçika", "İngiltere"] },
  { c: 'Spor', q: "EURO 2020 turnuvasını (2021'de oynandı) hangi ülke kazandı?", a: ["İtalya", "İngiltere", "İspanya", "Fransa"] },
  { c: 'Spor', q: "Türkiye EURO 2008'de hangi turda elendi?", a: ["Yarı final", "Çeyrek final", "Final", "Grup aşaması"] },
  { c: 'Spor', q: "Hakan Şükür 2002'de en hızlı golünü hangi takıma attı?", a: ["Güney Kore", "Brezilya", "Japonya", "Kosta Rika"] },
  { c: 'Spor', q: "Dünya Kupası'nı en çok kazanan ülke hangisidir?", a: ["Brezilya", "Almanya", "İtalya", "Arjantin"] },
  { c: 'Spor', q: "Olimpiyat bayrağında kaç halka vardır?", a: ["5", "4", "6", "7"] },
  { c: 'Spor', q: "Roland Garros tenis turnuvası hangi şehirde oynanır?", a: ["Paris", "Londra", "Melbourne", "New York"] },
  { c: 'Spor', q: "Galatasaray'ın renkleri hangileridir?", a: ["Sarı-kırmızı", "Sarı-lacivert", "Siyah-beyaz", "Bordo-mavi"] },
  { c: 'Spor', q: "Fenerbahçe'nin renkleri hangileridir?", a: ["Sarı-lacivert", "Sarı-kırmızı", "Siyah-beyaz", "Bordo-mavi"] },
  { c: 'Spor', q: "Trabzonspor'un renkleri hangileridir?", a: ["Bordo-mavi", "Sarı-lacivert", "Sarı-kırmızı", "Yeşil-beyaz"] },
  { c: 'Spor', q: "Satranç tahtasında kaç kare vardır?", a: ["64", "36", "49", "81"] },
  { c: 'Spor', q: "Bowlingte kaç lobut devrilmeye çalışılır?", a: ["10", "8", "12", "9"] },
  { c: 'Spor', q: "Chicago Bulls ile efsaneleşen basketbolcu kimdir?", a: ["Michael Jordan", "LeBron James", "Kobe Bryant", "Shaquille O'Neal"] },
  { c: 'Spor', q: "Usain Bolt hangi ülkenin atletidir?", a: ["Jamaika", "ABD", "Nijerya", "Kenya"] },
  { c: 'Spor', q: "Futbolda penaltı noktası kaleye kaç metre uzaktadır?", a: ["11", "9", "7", "16"] },
  { c: 'Spor', q: "Normal bir futbol maçı kaç dakika sürer?", a: ["90", "60", "80", "100"] },
  { c: 'Spor', q: "Futbolda kırmızı kart ne anlama gelir?", a: ["Oyundan atılma", "Uyarı", "Penaltı", "Faul"] },
  // --- Edebiyat ---
  { c: 'Edebiyat', q: "Çalıkuşu romanının yazarı kimdir?", a: ["Reşat Nuri Güntekin", "Halide Edib Adıvar", "Yakup Kadri Karaosmanoğlu", "Ömer Seyfettin"] },
  { c: 'Edebiyat', q: "İnce Memed romanının yazarı kimdir?", a: ["Yaşar Kemal", "Orhan Kemal", "Kemal Tahir", "Sait Faik"] },
  { c: 'Edebiyat', q: "Kürk Mantolu Madonna romanının yazarı kimdir?", a: ["Sabahattin Ali", "Orhan Kemal", "Peyami Safa", "Refik Halit Karay"] },
  { c: 'Edebiyat', q: "Tutunamayanlar romanının yazarı kimdir?", a: ["Oğuz Atay", "Yusuf Atılgan", "Adalet Ağaoğlu", "Ahmet Hamdi Tanpınar"] },
  { c: 'Edebiyat', q: "Beyaz Diş romanının yazarı kimdir?", a: ["Jack London", "Mark Twain", "Ernest Hemingway", "Charles Dickens"] },
  { c: 'Edebiyat', q: "Suç ve Ceza romanının yazarı kimdir?", a: ["Dostoyevski", "Tolstoy", "Gogol", "Çehov"] },
  { c: 'Edebiyat', q: "Savaş ve Barış romanının yazarı kimdir?", a: ["Tolstoy", "Dostoyevski", "Puşkin", "Gorki"] },
  { c: 'Edebiyat', q: "Küçük Prens kitabının yazarı kimdir?", a: ["Antoine de Saint-Exupéry", "Victor Hugo", "Jules Verne", "Alexandre Dumas"] },
  { c: 'Edebiyat', q: "Sefiller romanının yazarı kimdir?", a: ["Victor Hugo", "Balzac", "Flaubert", "Stendhal"] },
  { c: 'Edebiyat', q: "Romeo ve Juliet oyununun yazarı kimdir?", a: ["William Shakespeare", "Charles Dickens", "Oscar Wilde", "Jane Austen"] },
  { c: 'Edebiyat', q: "Don Kişot romanının yazarı kimdir?", a: ["Cervantes", "Lorca", "Borges", "García Márquez"] },
  { c: 'Edebiyat', q: "Simyacı kitabının yazarı kimdir?", a: ["Paulo Coelho", "Gabriel García Márquez", "Umberto Eco", "Haruki Murakami"] },
  { c: 'Edebiyat', q: "Yüz Yıllık Yalnızlık romanının yazarı kimdir?", a: ["Gabriel García Márquez", "Paulo Coelho", "Mario Vargas Llosa", "Isabel Allende"] },
  { c: 'Edebiyat', q: "80 Günde Devri Âlem kitabının yazarı kimdir?", a: ["Jules Verne", "H. G. Wells", "Mark Twain", "Daniel Defoe"] },
  // --- Müzik ---
  { c: 'Müzik', q: "Mozart hangi ülkede doğmuştur?", a: ["Avusturya", "Almanya", "İtalya", "Fransa"] },
  { c: 'Müzik', q: "Dört Mevsim adlı eserin bestecisi kimdir?", a: ["Vivaldi", "Bach", "Mozart", "Chopin"] },
  { c: 'Müzik', q: "The Beatles hangi ülkenin müzik grubudur?", a: ["İngiltere", "ABD", "İrlanda", "Avustralya"] },
  { c: 'Müzik', q: "Bohemian Rhapsody şarkısı hangi gruba aittir?", a: ["Queen", "The Beatles", "Led Zeppelin", "Pink Floyd"] },
  { c: 'Müzik', q: "Standart bir gitarda kaç tel vardır?", a: ["6", "4", "5", "8"] },
  { c: 'Müzik', q: "Kemanda kaç tel vardır?", a: ["4", "3", "5", "6"] },
  { c: 'Müzik', q: "Do, re, mi ile başlayan müzik notaları kaç tanedir?", a: ["7", "5", "8", "12"] },
  { c: 'Müzik', q: "Barış Manço'nun sunduğu ünlü çocuk programının adı nedir?", a: ["7'den 77'ye", "Gül Pembe", "Dönence", "Mega"] },
  { c: 'Müzik', q: "Bağlama hangi tür çalgıdır?", a: ["Telli", "Nefesli", "Vurmalı", "Tuşlu"] },
  { c: 'Müzik', q: "Ney hangi tür çalgıdır?", a: ["Nefesli", "Telli", "Vurmalı", "Tuşlu"] },
  // --- Film ve dizi ---
  { c: 'Film ve dizi', q: "Titanik filminde Rose'u hangi oyuncu canlandırır?", a: ["Kate Winslet", "Cate Blanchett", "Nicole Kidman", "Emma Watson"] },
  { c: 'Film ve dizi', q: "Avatar filminin yönetmeni kimdir?", a: ["James Cameron", "Steven Spielberg", "Christopher Nolan", "Peter Jackson"] },
  { c: 'Film ve dizi', q: "Başlangıç (Inception) filminin yönetmeni kimdir?", a: ["Christopher Nolan", "Martin Scorsese", "Quentin Tarantino", "Ridley Scott"] },
  { c: 'Film ve dizi', q: "Shrek hangi renktir?", a: ["Yeşil", "Mavi", "Kırmızı", "Sarı"] },
  { c: 'Film ve dizi', q: "Kayıp Balık Nemo'da Nemo hangi balıktır?", a: ["Palyaço balığı", "Köpekbalığı", "Vatoz", "Kılıç balığı"] },
  { c: 'Film ve dizi', q: "Karlar Ülkesi'ndeki kardan adamın adı nedir?", a: ["Olaf", "Kristoff", "Sven", "Hans"] },
  { c: 'Film ve dizi', q: "Toy Story'deki uzay polisi oyuncak kimdir?", a: ["Buzz Lightyear", "Woody", "Rex", "Slinky"] },
  { c: 'Film ve dizi', q: "Harry Potter'ın okuduğu büyücülük okulunun adı nedir?", a: ["Hogwarts", "Durmstrang", "Beauxbatons", "Ilvermorny"] },
  { c: 'Film ve dizi', q: "Luke Skywalker'ın babası kimdir?", a: ["Darth Vader", "Yoda", "Obi-Wan Kenobi", "Han Solo"] },
  { c: 'Film ve dizi', q: "G.O.R.A. filminde başrolü kim oynar?", a: ["Cem Yılmaz", "Şahan Gökbakar", "Ata Demirer", "Yılmaz Erdoğan"] },
  { c: 'Film ve dizi', q: "Recep İvedik karakterini kim canlandırır?", a: ["Şahan Gökbakar", "Cem Yılmaz", "Ata Demirer", "Yılmaz Erdoğan"] },
  { c: 'Film ve dizi', q: "Tom ve Jerry'de Tom hangi hayvandır?", a: ["Kedi", "Köpek", "Fare", "Kuş"] },
  { c: 'Film ve dizi', q: "Süper Mario'nun mesleği nedir?", a: ["Tesisatçı", "Aşçı", "Doktor", "Pilot"] },
  { c: 'Film ve dizi', q: "Minecraft'ta patlayan yeşil yaratığın adı nedir?", a: ["Creeper", "Zombie", "Skeleton", "Enderman"] },
  // --- Teknoloji ---
  { c: 'Teknoloji', q: "iPhone telefonlarını hangi şirket üretir?", a: ["Apple", "Samsung", "Nokia", "Huawei"] },
  { c: 'Teknoloji', q: "Windows işletim sistemi hangi şirkete aittir?", a: ["Microsoft", "Apple", "Google", "IBM"] },
  { c: 'Teknoloji', q: "WWW kısaltması neyin açılımıdır?", a: ["World Wide Web", "Wide World Web", "World Web Wide", "Web World Wide"] },
  { c: 'Teknoloji', q: "Wi-Fi ne işe yarar?", a: ["Kablosuz internet bağlantısı", "Telefonu şarj etmek", "Ses kaydetmek", "Belge yazdırmak"] },
  { c: 'Teknoloji', q: "Bilgisayarda Ctrl + C kısayolu ne yapar?", a: ["Kopyalar", "Yapıştırır", "Keser", "Siler"] },
  { c: 'Teknoloji', q: "Bir bayt kaç bitten oluşur?", a: ["8", "4", "16", "10"] },
  { c: 'Teknoloji', q: "Instagram hangi şirkete aittir?", a: ["Meta", "Google", "Microsoft", "Apple"] },
  { c: 'Teknoloji', q: "TOGG hangi alanda üretim yapar?", a: ["Elektrikli otomobil", "Uçak", "Cep telefonu", "Gemi"] },
  // --- Yemek (devam) ---
  { c: 'Yemek', q: "Mantısıyla ünlü ilimiz hangisidir?", a: ["Kayseri", "Konya", "Sivas", "Yozgat"] },
  { c: 'Yemek', q: "Dondurmasıyla ünlü ilimiz hangisidir?", a: ["Kahramanmaraş", "Gaziantep", "Adana", "Malatya"] },
  { c: 'Yemek', q: "Taco hangi ülke mutfağına aittir?", a: ["Meksika", "İspanya", "Arjantin", "Peru"] },
  { c: 'Yemek', q: "Paella hangi ülke mutfağına aittir?", a: ["İspanya", "İtalya", "Portekiz", "Yunanistan"] },
  { c: 'Yemek', q: "Çikolatanın ana maddesi nedir?", a: ["Kakao", "Fındık", "Şeker", "Süt"] },
  { c: 'Yemek', q: "Ayran hangi sütlü üründen yapılır?", a: ["Yoğurt", "Peynir", "Tereyağı", "Kaymak"] },
  // --- Genel kültür (devam) ---
  { c: 'Genel kültür', q: "Bir yıl yaklaşık kaç haftadır?", a: ["52", "48", "50", "60"] },
  { c: 'Genel kültür', q: "Japonya'nın para birimi nedir?", a: ["Yen", "Won", "Yuan", "Ringgit"] },
  { c: 'Genel kültür', q: "Avrupa Birliği ülkelerinin ortak para birimi nedir?", a: ["Euro", "Dolar", "Sterlin", "Frank"] },
  { c: 'Genel kültür', q: "İngiltere'nin para birimi nedir?", a: ["Sterlin", "Euro", "Dolar", "Frank"] },
  { c: 'Genel kültür', q: "Dünyada ana dil olarak en çok konuşulan dil hangisidir?", a: ["Mandarin Çincesi", "İngilizce", "İspanyolca", "Hintçe"] },
  { c: 'Genel kültür', q: "Türkiye'nin uluslararası telefon kodu nedir?", a: ["+90", "+1", "+44", "+49"] },
  { c: 'Genel kültür', q: "Hangi organımız hem kalbi hem akciğerleri korur?", a: ["Kaburga kemikleri", "Kafatası", "Omurga", "Leğen kemiği"] },
  { c: 'Genel kültür', q: "Boks ringi hangi şekildedir?", a: ["Kare", "Yuvarlak", "Üçgen", "Altıgen"] },
  { c: 'Coğrafya', q: "Kuzey Kutbu'nu çevreleyen okyanus hangisidir?", a: ["Arktik Okyanusu", "Atlas Okyanusu", "Hint Okyanusu", "Pasifik Okyanusu"] },
  { c: 'Coğrafya', q: "Türkiye'nin en uzun nehri hangisidir?", a: ["Kızılırmak", "Fırat", "Dicle", "Sakarya"] },
  { c: 'Coğrafya', q: "Türkiye'nin yüzölçümü en büyük ili hangisidir?", a: ["Konya", "Ankara", "Sivas", "Erzurum"] },
  { c: 'Coğrafya', q: "Portekiz'in başkenti neresidir?", a: ["Lizbon", "Porto", "Madrid", "Sevilla"] },
  { c: 'Coğrafya', q: "Dünyanın en büyük adası hangisidir?", a: ["Grönland", "Madagaskar", "Borneo", "Yeni Gine"] },
  { c: 'Coğrafya', q: "Fransa'nın başkenti neresidir?", a: ["Paris", "Lyon", "Marsilya", "Nice"] },
  { c: 'Tarih', q: "Kurtuluş Savaşı hangi yıl başladı?", a: ["1919", "1914", "1923", "1922"] },
  { c: 'Tarih', q: "Amerika Birleşik Devletleri bağımsızlığını hangi yıl ilan etti?", a: ["1776", "1789", "1812", "1865"] },
  { c: 'Tarih', q: "Sakarya Meydan Muharebesi hangi yıl yapıldı?", a: ["1921", "1919", "1922", "1920"] },
  { c: 'Tarih', q: "Lozan Antlaşması hangi yıl imzalandı?", a: ["1923", "1920", "1919", "1921"] },
  { c: 'Tarih', q: "Hitit Devleti'nin başkenti neresidir?", a: ["Hattuşa", "Gordion", "Troya", "Efes"] },
  { c: 'Tarih', q: "Süleymaniye Camii'ni yaptıran padişah kimdir?", a: ["Kanuni Sultan Süleyman", "Fatih Sultan Mehmet", "Yavuz Sultan Selim", "II. Bayezid"] },
  { c: 'Tarih', q: "Osmanlı Devleti'nin ilk başkenti neresidir?", a: ["Bursa", "Edirne", "İznik", "Söğüt"] },
  { c: 'Bilim', q: "Suyun donma noktası kaç derecedir?", a: ["0 °C", "10 °C", "-10 °C", "5 °C"] },
  { c: 'Bilim', q: "Dünya kendi ekseni etrafında bir tam dönüşünü kaç saatte tamamlar?", a: ["24", "12", "48", "36"] },
  { c: 'Bilim', q: "Güneş'ten en uzak gezegen hangisidir?", a: ["Neptün", "Uranüs", "Satürn", "Jüpiter"] },
  { c: 'Bilim', q: "İnsülin hormonunu üreten organ hangisidir?", a: ["Pankreas", "Mide", "Tiroid", "Dalak"] },
  { c: 'Bilim', q: "Vücudumuzdaki en küçük kemik hangisidir?", a: ["Üzengi kemiği", "Çekiç kemiği", "Örs kemiği", "Kaburga kemiği"] },
  { c: 'Spor', q: "2010 Dünya Kupası'nı hangi ülke kazandı?", a: ["İspanya", "Hollanda", "Almanya", "Brezilya"] },
  { c: 'Spor', q: "Golf sahasında standart bir tur kaç delikten oluşur?", a: ["18", "9", "12", "24"] },
  { c: 'Spor', q: "Yüzmede kaç temel yüzme stili vardır?", a: ["4", "3", "5", "6"] },
  { c: 'Edebiyat', q: "Hamlet oyununun yazarı kimdir?", a: ["William Shakespeare", "Molière", "Goethe", "Ibsen"] },
  { c: 'Edebiyat', q: "Leyla ile Mecnun mesnevisinin yazarı kimdir?", a: ["Fuzuli", "Nedim", "Baki", "Şeyh Galip"] },
  { c: 'Edebiyat', q: "Mesnevi adlı eserin yazarı kimdir?", a: ["Mevlânâ Celâleddin-i Rûmî", "Yunus Emre", "Fuzuli", "Nesimi"] },
  { c: 'Edebiyat', q: "Kuyucaklı Yusuf romanının yazarı kimdir?", a: ["Sabahattin Ali", "Yaşar Kemal", "Halide Edib Adıvar", "Reşat Nuri Güntekin"] },
  { c: 'Edebiyat', q: "Aşk-ı Memnu romanının yazarı kimdir?", a: ["Halit Ziya Uşaklıgil", "Ahmet Mithat Efendi", "Recaizade Mahmut Ekrem", "Namık Kemal"] },
  { c: 'Edebiyat', q: "Madame Bovary romanının yazarı kimdir?", a: ["Gustave Flaubert", "Émile Zola", "Honoré de Balzac", "Victor Hugo"] },
  { c: 'Edebiyat', q: "Sherlock Holmes serisinin yazarı kimdir?", a: ["Arthur Conan Doyle", "Agatha Christie", "Edgar Allan Poe", "Bram Stoker"] },
  { c: 'Edebiyat', q: "Dracula romanının yazarı kimdir?", a: ["Bram Stoker", "Mary Shelley", "Edgar Allan Poe", "H. P. Lovecraft"] },
  { c: 'Müzik', q: "Ud hangi tür çalgıdır?", a: ["Telli", "Nefesli", "Vurmalı", "Tuşlu"] },
  { c: 'Müzik', q: "Davul hangi tür çalgıdır?", a: ["Vurmalı", "Telli", "Nefesli", "Tuşlu"] },
  { c: 'Müzik', q: "Bir oktavda kaç nota (yarım ses dahil) bulunur?", a: ["12", "7", "8", "10"] },
  { c: 'Film ve dizi', q: "Matrix filminde Neo'yu hangi oyuncu canlandırır?", a: ["Keanu Reeves", "Brad Pitt", "Tom Cruise", "Will Smith"] },
  { c: 'Film ve dizi', q: "Forrest Gump filminin başrolünü kim oynar?", a: ["Tom Hanks", "Brad Pitt", "Leonardo DiCaprio", "Johnny Depp"] },
  { c: 'Film ve dizi', q: "Breaking Bad dizisinde Walter White'ın mesleği nedir?", a: ["Kimya öğretmeni", "Doktor", "Avukat", "Polis"] },
  { c: 'Film ve dizi', q: "Kung Fu Panda'nın başkahramanı kimdir?", a: ["Po", "Shifu", "Tigress", "Oogway"] },
  { c: 'Teknoloji', q: "Android işletim sistemi hangi şirkete aittir?", a: ["Google", "Apple", "Microsoft", "Samsung"] },
  { c: 'Teknoloji', q: "Linux çekirdeğinin yaratıcısı kimdir?", a: ["Linus Torvalds", "Bill Gates", "Steve Jobs", "Richard Stallman"] },
  { c: 'Teknoloji', q: "Bir bilgisayarın işlem yapan ana birimi nedir?", a: ["İşlemci (CPU)", "Ekran kartı", "Sabit disk", "Klavye"] },
  { c: 'Yemek', q: "Kahvenin anavatanı olarak kabul edilen ülke hangisidir?", a: ["Etiyopya", "Brezilya", "Kolombiya", "Vietnam"] },
  { c: 'Yemek', q: "Beyaz peynirle ünlü Yunan peyniri hangisidir?", a: ["Feta", "Mozzarella", "Parmesan", "Gouda"] },
  { c: 'Yemek', q: "Zerdeçalın rengi nedir?", a: ["Sarı", "Kırmızı", "Yeşil", "Mor"] },
  { c: 'Hayvanlar', q: "Balinalar hangi hayvan sınıfına girer?", a: ["Memeli", "Balık", "Sürüngen", "Amfibi"] },
  { c: 'Hayvanlar', q: "Bal, hangi böcek tarafından üretilir?", a: ["Arı", "Karınca", "Sinek", "Termit"] },
  { c: 'Genel kültür', q: "Dünyanın en kalabalık ülkesi hangisidir?", a: ["Hindistan", "Çin", "ABD", "Endonezya"] },
  { c: 'Genel kültür', q: "Türkiye'deki en büyük tuzlu göl hangisidir?", a: ["Tuz Gölü", "Van Gölü", "Beyşehir Gölü", "Eğirdir Gölü"] },
  { c: 'Genel kültür', q: "Bir kilogram kaç gramdır?", a: ["1000", "100", "10000", "500"] },
  { c: 'Genel kültür', q: "Bir dakika kaç saniyedir?", a: ["60", "100", "30", "120"] },
  { c: 'Genel kültür', q: "Pinokyo'nun burnu ne zaman uzar?", a: ["Yalan söylediğinde", "Üzüldüğünde", "Uyuduğunda", "Yemek yediğinde"] },
];

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Sorular kategoriler arasında dönerek seçilir; bir kategori (ör. Coğrafya) oyunu doldurmasın.
function pickDeck() {
  const groups = {};
  BANK.forEach((q, i) => (groups[q.c] ??= []).push(i));
  const lists = shuffle(Object.values(groups).map(shuffle));
  const deck = [];
  for (let k = 0; deck.length < Math.min(ROUNDS, BANK.length); k++) {
    const l = lists[k % lists.length];
    if (l.length) deck.push(l.pop());
  }
  return deck;
}

const activeSeats = (seats) => seats.map((_, i) => i).filter((i) => !seats[i].left);

// Yeni soruyu açar: seçenekler karıştırılır, doğru cevabın yeri sunucuda kalır.
function ask(g, now) {
  const b = BANK[g.deck[g.turnNo]];
  const opts = shuffle(b.a.map((t, i) => ({ t, right: i === 0 })));
  return {
    ...g,
    phase: 'ask',
    cur: { cat: b.c, q: b.q, opts: opts.map((o) => o.t), ans: opts.findIndex((o) => o.right) },
    picks: g.picks.map(() => null),
    at: g.at.map(() => 0),
    endsAt: now + ASK_MS,
    last: null,
  };
}

export function newGame(n, now = Date.now()) {
  return ask({
    deck: pickDeck(),
    turnNo: 0,
    total: ROUNDS,
    extra: 0,
    scores: Array(n).fill(0),
    streak: Array(n).fill(0),
    picks: Array(n).fill(null),
    at: Array(n).fill(0),
    cur: null,
    phase: 'ask',
    endsAt: 0,
    last: null,
    note: '',
    over: null,
  }, now);
}

// Birinci sırada birden fazla kişi kaldıysa onların koltukları (masada olanlar arasından).
const leaders = (g, seats) => {
  const act = seats.map((_, i) => i).filter((i) => !seats[i].left);
  const best = Math.max(...act.map((i) => g.scores[i]));
  return act.filter((i) => g.scores[i] === best);
};
const MAX_EXTRA = 5;

function finish(g, seats) {
  const ranking = seats.map((_, i) => i).sort((a, b) => (Number(seats[a].left) - Number(seats[b].left)) || (g.scores[b] - g.scores[a]));
  const best = g.scores[ranking[0]];
  const tops = ranking.filter((i) => g.scores[i] === best && !seats[i].left);
  const text = tops.length === 0 ? 'Oyuncular masadan ayrıldığı için oyun bitti.' : tops.length > 1 ? `Berabere! ${tops.map((i) => seats[i].name).join(' ve ')} ${best} puanla birinci.` : `${seats[ranking[0]].name} kazandı! (${best} puan)`;
  return { ...g, phase: 'over', endsAt: 0, over: { ranking, text }, note: text };
}

// Cevapları puanlar ve doğru cevabı herkese açar.
function reveal(g, now) {
  const scores = [...g.scores];
  const streak = [...g.streak];
  const gains = g.picks.map((p, i) => {
    if (p !== g.cur.ans) { streak[i] = 0; return 0; }
    const pts = BASE + Math.round(500 * g.at[i] / ASK_MS) + Math.min(3, streak[i]) * STREAK_BONUS;
    streak[i] += 1;
    scores[i] += pts;
    return pts;
  });
  return { ...g, phase: 'reveal', endsAt: now + REVEAL_MS, scores, streak, last: { ans: g.cur.ans, picks: [...g.picks], gains } };
}

const allIn = (g, seats) => activeSeats(seats).every((i) => g.picks[i] !== null);

export function pick(g, seats, idx, choice, now = Date.now()) {
  if (g.over || g.phase !== 'ask') return { error: 'Şu an cevap verilemez.' };
  if (now >= g.endsAt) return { error: 'Süre doldu.' };
  if (!Number.isInteger(choice) || choice < 0 || choice >= g.cur.opts.length) return { error: 'Geçersiz seçenek.' };
  if (g.picks[idx] !== null) return { error: 'Bu soruyu zaten cevapladın.' };
  const n = { ...g, picks: g.picks.map((p, i) => (i === idx ? choice : p)), at: g.at.map((t, i) => (i === idx ? g.endsAt - now : t)) };
  return allIn(n, seats) ? reveal(n, now) : n;
}

// Süre dolduysa soruyu kapatır ya da sonraki soruya geçer; dolmadıysa durum değişmez.
export function timeout(g, seats, now = Date.now()) {
  if (g.over || now < g.endsAt) return g;
  if (g.phase === 'ask') return reveal(g, now);
  const n = { ...g, turnNo: g.turnNo + 1 };
  const total = n.total ?? ROUNDS;
  if (n.turnNo < total) return ask(n, now);
  // Beraberlik: fark çıkana kadar (en fazla 5) ek soru sorulur.
  if (activeSeats(seats).length > 1 && leaders(n, seats).length > 1 && (n.extra || 0) < MAX_EXTRA) {
    const unused = BANK.map((_, i) => i).filter((i) => !n.deck.includes(i));
    const q = unused[Math.floor(Math.random() * unused.length)];
    return ask({ ...n, total: total + 1, extra: (n.extra || 0) + 1, deck: [...n.deck, q] }, now);
  }
  return finish(n, seats);
}

// Oyuncu masadan ayrıldı (seats'te left işaretlendikten sonra çağrılır).
export function onLeave(g, seats, idx, now = Date.now()) {
  if (g.over) return g;
  if (activeSeats(seats).length === 0) return finish(g, seats);
  return g.phase === 'ask' && allIn(g, seats) ? reveal(g, now) : g;
}

// Bir oyuncuya giden görünüm: doğru cevap ve başkalarının seçimi yalnızca soru kapanınca açılır.
export function viewFor(g, idx, now = Date.now()) {
  if (!g) return null;
  const open = g.phase === 'reveal';
  return {
    phase: g.phase,
    turnNo: g.turnNo,
    total: g.total ?? ROUNDS,
    extra: g.extra || 0,
    scores: g.scores,
    streak: g.streak,
    leftMs: g.phase === 'over' ? 0 : Math.max(0, g.endsAt - now),
    cat: g.phase === 'over' ? null : g.cur.cat,
    q: g.phase === 'over' ? null : g.cur.q,
    opts: g.phase === 'over' ? [] : g.cur.opts,
    mine: idx >= 0 ? g.picks[idx] : null,
    answered: g.picks.map((p) => p !== null),
    ans: open ? g.last.ans : null,
    picks: open ? g.last.picks : null,
    gains: open ? g.last.gains : null,
    note: g.note,
    over: g.over,
  };
}
