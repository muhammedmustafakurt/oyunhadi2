// Mekân kaydının ortak tipi. Alanlar venues tablosunun sütunlarıyla birebir (veritabanına geçiş sonrası
// demodan bağımsız); okuma src/lib/venues.js'ten gelir.
export type Venue = {
  id: number;
  slug: string;
  name: string;
  city: string;
  /** Logo yüklenmediyse gösterilen kısaltma */
  initials: string;
  logoUrl: string | null;
  /** Ana renk: butonlar, başlık bandı. Oyunlarda --blue değişkeninin yerini alır. */
  color: string;
  /** İkinci renk: süslemeler, rozetler */
  accent: string;
  tables: number;
  /** Konum kontrolü: doluysa masaya yalnızca mekândaki telefonlar katılabilir */
  lat: number | null;
  lng: number | null;
  games: string[];
  welcome: string;
  /** Panel girişi için kayıtlı e-posta */
  email: string;
  announcement: { title: string; body: string } | null;
};
