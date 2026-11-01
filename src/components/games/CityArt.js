// Emlak Krallığı şehirleri için çizilmiş simge yapılar (64x48). Ana renk --c (mülkün renk grubu), çizgi/gölge rengi currentColor.
const SEA = '#4fb3e8';
const Waves = ({ y = 44 }) => <path d={`M2 ${y}q5-4 10 0t10 0 10 0 10 0 10 0 10 0`} fill="none" stroke={SEA} strokeWidth="2.2" strokeLinecap="round" />;

const ART = {
  // Adana: Taş Köprü
  adana: (
    <>
      <path fillRule="evenodd" fill="var(--c)" d="M4 20h56v6H4z M8 26h48v16H8z M12 42v-5a5 5 0 0 1 10 0v5z M27 42v-5a5 5 0 0 1 10 0v5z M42 42v-5a5 5 0 0 1 10 0v5z" />
      <Waves y={46} />
    </>
  ),
  // Mersin: Kızkalesi
  mersin: (
    <>
      <path fill="var(--c)" d="M12 38V24h4v-3h4v3h4v-3h4v3h4v-3h4v3h4v-3h4v3h4v14z" />
      <path fill="var(--c)" d="M28 24V12h4V9h4v3h4v12z" />
      <path fill="#fff" d="M30 28h4v6h-4z" opacity=".85" />
      <path d="M32 9V3" stroke="currentColor" strokeWidth="1.6" /><path d="M32 3l7 2.5-7 2.5z" fill="#d64545" />
      <Waves y={42} /><Waves y={47} />
    </>
  ),
  // Konya: Mevlana Türbesi
  konya: (
    <>
      <path fill="var(--c)" d="M16 34a14 15 0 0 1 28 0z" />
      <path d="M22 34l2-13M28 34l1-15M34 34l-1-15M40 34l-2-13" stroke="#fff" strokeWidth="1.3" opacity=".6" />
      <path d="M30 20V10" stroke="currentColor" strokeWidth="1.6" /><circle cx="30" cy="9" r="2" fill="#e8c230" />
      <path fill="currentColor" opacity=".75" d="M14 34h32v9H14z" />
      <path fill="var(--c)" d="M50 43V15h4v28z" /><path fill="currentColor" d="M49 15l3-9 3 9z" />
    </>
  ),
  // Gaziantep: baklava
  antep: (
    <>
      <path fill="#e8b04a" d="M32 6l26 18-26 18L6 24z" />
      <path d="M32 6l26 18-26 18L6 24z" fill="none" stroke="#b97d1c" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 24h36M32 11v26M20 17l24 14M44 17L20 31" stroke="#b97d1c" strokeWidth="1.2" opacity=".55" />
      <circle cx="32" cy="24" r="5" fill="#7bbf4a" /><circle cx="32" cy="24" r="2" fill="#4c8a2a" />
      <ellipse cx="32" cy="45" rx="20" ry="2" fill="currentColor" opacity=".12" />
    </>
  ),
  // Bursa: Uludağ ve Ulu Cami kubbeleri
  bursa: (
    <>
      <path fill="var(--c)" d="M2 42L22 10l10 14 8-10 22 28z" />
      <path fill="#fff" d="M22 10l-6.5 10 4-2 3 4 3-4 3 3z" />
      <path fill="currentColor" opacity=".8" d="M10 42a7 7 0 0 1 14 0zM26 42a9 9 0 0 1 18 0zM46 42a6 6 0 0 1 12 0z" />
    </>
  ),
  // Antalya: Yivli Minare
  antalya: (
    <>
      <circle cx="12" cy="12" r="6" fill="#ffd25a" />
      <path fill="var(--c)" d="M27 38V12h10v26z" />
      <path d="M30 14v24M34 14v24" stroke="#fff" strokeWidth="1.2" opacity=".55" />
      <path fill="currentColor" d="M26 12l6-10 6 10z" />
      <path fill="currentColor" d="M24 21h16v3H24zM22 38h20v5H22z" />
      <path fill="#4c9a4a" d="M50 43c0-8 2-12 4-16-1 5 0 10 0 16zM48 28c3-2 6-1 8 1-3 0-6 1-8-1z" />
    </>
  ),
  // İzmir: Saat Kulesi
  izmir: (
    <>
      <path fill="var(--c)" d="M23 43V28h18v15z" />
      <path fill="var(--c)" d="M26 28V14h12v14z" />
      <path fill="currentColor" d="M24 14a8 8 0 0 1 16 0z" />
      <path d="M32 6V2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="32" cy="21" r="4.4" fill="#fff" /><path d="M32 18.5V21l2 1.4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M27 36h3v7h-3zM34 36h3v7h-3z" fill="#fff" opacity=".8" />
      <path fill="currentColor" opacity=".7" d="M20 43h24v3H20z" />
    </>
  ),
  // Eskişehir: Odunpazarı evi
  eskisehir: (
    <>
      <path fill="currentColor" opacity=".8" d="M10 20L32 6l22 14z" />
      <path fill="var(--c)" d="M8 20h48v10H8z" />
      <path fill="#fff" d="M14 23h6v5h-6zM29 23h6v5h-6zM44 23h6v5h-6z" opacity=".85" />
      <path fill="var(--c)" opacity=".8" d="M14 30h36v13H14z" />
      <path fill="#fff" d="M20 33h6v6h-6zM38 33h6v6h-6z" opacity=".7" /><path fill="currentColor" opacity=".7" d="M29 34h6v9h-6z" />
    </>
  ),
  // Trabzon: Sümela Manastırı
  trabzon: (
    <>
      <path fill="currentColor" opacity=".55" d="M22 48V16l10-10h32v42z" />
      <path fill="var(--c)" d="M30 40V24h22v16z" />
      <path fill="#fff" d="M34 28h4v8h-4zM42 28h4v8h-4z" opacity=".8" /><path fill="currentColor" opacity=".8" d="M28 24l13-8 13 8z" />
      <path fill="#2f8a4a" d="M4 46l6-18 6 18zM12 46l5-14 5 14z" />
    </>
  ),
  // Samsun: Bandırma Vapuru
  samsun: (
    <>
      <path fill="var(--c)" d="M8 33h48l-6 10H14z" />
      <path fill="#fff" d="M20 24h24v9H20z" /><path fill="currentColor" opacity=".5" d="M24 27h4v4h-4zM31 27h4v4h-4zM38 27h4v4h-4z" />
      <path fill="currentColor" d="M29 12h7v12h-7z" /><path fill="#d64545" d="M29 12h7v3h-7z" />
      <path d="M38 10q4-3 2-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".4" />
      <Waves y={46} />
    </>
  ),
  // Ankara: Anıtkabir
  ankara: (
    <>
      <path fill="currentColor" opacity=".8" d="M8 18L32 7l24 11z" />
      <path fill="var(--c)" d="M8 18h48v4H8z" />
      <path fill="var(--c)" d="M11 22h5v16h-5zM21 22h5v16h-5zM30 22h4v16h-4zM38 22h5v16h-5zM48 22h5v16h-5z" />
      <path fill="currentColor" opacity=".7" d="M5 38h54v3H5zM2 41h60v4H2z" />
    </>
  ),
  // Bodrum: St. Peter Kalesi
  bodrum: (
    <>
      <path fill="var(--c)" d="M12 40V20h11v20zM41 40V14h11v26zM23 40V28h18v12z" />
      <path fill="currentColor" d="M10 20l7.5-10 7.5 10zM39 14l7.5-11L54 14z" />
      <path d="M46 3V0" stroke="currentColor" strokeWidth="1.4" />
      <path fill="#fff" d="M16 26h3v6h-3zM45 22h3v6h-3zM29 32h6v8h-6z" opacity=".8" />
      <Waves y={44} />
    </>
  ),
  // Boğaz Köprüsü
  bogaz: (
    <>
      <path fill="var(--c)" d="M18 6h4v36h-4zM42 6h4v36h-4z" />
      <path d="M2 30h60" stroke="currentColor" strokeWidth="3" />
      <path d="M20 8L4 30M20 8l-8 22M20 8l8 22M20 8l14 22M44 8L30 30M44 8l8 22M44 8l-8 22M44 8l16 22" stroke="var(--c)" strokeWidth="1.2" opacity=".75" />
      <Waves y={42} /><Waves y={47} />
    </>
  ),
  // Kapadokya: balon ve peri bacaları
  kapadokya: (
    <>
      <path fill="#c9a27a" d="M4 46l7-26 7 26zM18 46l6-17 6 17zM38 46l5-22 6 22zM50 46l4-13 5 13z" />
      <path fill="currentColor" opacity=".25" d="M11 20l-3 9h6z" />
      <ellipse cx="40" cy="14" rx="11" ry="12" fill="var(--c)" />
      <path d="M40 2v24M32 6q-3 8 2 18M48 6q3 8-2 18" stroke="#fff" strokeWidth="1.4" fill="none" opacity=".65" />
      <path d="M36 29l-1 5h10l-1-5" fill="none" stroke="currentColor" strokeWidth="1.2" /><path fill="currentColor" d="M35 34h10v4H35z" />
    </>
  ),
  // Nişantaşı: alışveriş
  nisantasi: (
    <>
      <path fill="var(--c)" d="M16 18h32l2 25H14z" />
      <path d="M24 18v-3a8 8 0 0 1 16 0v3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path fill="#fff" d="M32 26l2.2 4.8 5.2.6-3.9 3.5 1.1 5.1-4.6-2.7-4.6 2.7 1.1-5.1-3.9-3.5 5.2-.6z" opacity=".9" />
      <path fill="#ffd25a" d="M54 8l1.6 3.4L59 12l-3.4 1.6L54 17l-1.6-3.4L49 12l3.4-.6z" />
    </>
  ),
  // Kahramanmaraş: Ulu Cami minaresi ve kubbe
  kahramanmaras: (
    <>
      <path fill="var(--c)" d="M20 44V24a12 12 0 0 1 24 0v20z" />
      <path fill="currentColor" d="M44 44V12h4v32z" opacity=".8" />
      <path fill="currentColor" d="M43 12l2-7 2 7z" />
      <path fill="#fff" d="M28 30h4v6h-4zM36 30h4v6h-4z" opacity=".8" />
      <Waves y={46} />
    </>
  ),
  // Şanlıurfa: Balıklıgöl ve kutsal balıklar
  sanliurfa: (
    <>
      <path fill="var(--c)" d="M12 30a20 18 0 0 1 40 0z" />
      <path fill="currentColor" opacity=".6" d="M26 30V16h12v14z" />
      <ellipse cx="32" cy="38" rx="22" ry="6" fill="#4fb3e8" opacity=".75" />
      <path fill="#ffd25a" d="M26 37c2-2 5-2 7 0-2 2-5 2-7 0zM33 40c2-2 5-2 7 0-2 2-5 2-7 0z" />
    </>
  ),
  // Balıkesir: zeytin ağacı
  balikesir: (
    <>
      <path fill="currentColor" d="M30 46V28h4v18z" />
      <circle cx="32" cy="20" r="12" fill="var(--c)" />
      <circle cx="22" cy="27" r="6" fill="var(--c)" opacity=".8" />
      <circle cx="42" cy="27" r="6" fill="var(--c)" opacity=".8" />
      <Waves y={46} />
    </>
  ),
  // Kayseri: Erciyes Dağı
  kayseri: (
    <>
      <path fill="currentColor" opacity=".8" d="M2 42L22 12l10 14 8-8 22 24z" />
      <path fill="#fff" d="M22 12l-5 8 3-1 2 3 3-3 2 2z" />
      <path fill="var(--c)" d="M40 42V30h8v12z" />
    </>
  ),
  // Rize: çay tepeleri
  rize: (
    <>
      <path fill="#2f8a4a" d="M2 42q14-22 30-10t30 10z" />
      <path fill="var(--c)" d="M10 42q4-7 9-7t9 7zM32 42q4-7 9-7t9 7z" />
      <path fill="#7bbf4a" d="M20 34q3-4 6-4t6 4z" opacity=".8" />
      <Waves y={46} />
    </>
  ),
  // Fethiye: Ölüdeniz lagünü
  fethiye: (
    <>
      <path fill="var(--c)" d="M4 40l10-18 8 10 6-6 12 14z" />
      <path fill="#4fb3e8" d="M2 40h60v6H2z" opacity=".7" />
      <Waves y={44} />
    </>
  ),
  // Kaş: tekne ve koy
  kas: (
    <>
      <path fill="currentColor" d="M10 34h44l-6 8H16z" />
      <path fill="var(--c)" d="M30 34V10l16 24z" />
      <path d="M30 10v24" stroke="currentColor" strokeWidth="1.2" />
      <Waves y={46} />
    </>
  ),
  // Çeşme: Çeşme Kalesi
  cesme: (
    <>
      <path fill="var(--c)" d="M8 40V26h12v14zM44 40V26h12v14zM20 40V30h24v10z" />
      <path fill="currentColor" d="M8 26l6-8 6 8zM44 26l6-8 6 8z" />
      <Waves y={46} />
    </>
  ),
  // Alaçatı: yel değirmeni
  alacati: (
    <>
      <path fill="var(--c)" d="M26 44l-4-22h16l-4 22z" />
      <path fill="currentColor" d="M24 22l8-10 8 10z" />
      <path d="M32 12L18 4M32 12l14-8M32 12L18 22M32 12l14 10" stroke="currentColor" strokeWidth="2" />
      <Waves y={46} />
    </>
  ),
  // Belek: palmiye
  belek: (
    <>
      <path d="M32 44V20" stroke="currentColor" strokeWidth="2.2" />
      <path fill="#2f8a4a" d="M32 20q-14-6-22 4q10-2 22-4q-12 2-20-2zM32 20q14-6 22 4q-10-2-22-4q12 2 20-2zM32 20q-6-12-2-14q4 6 2 14z" />
      <Waves y={46} />
    </>
  ),
  // Göcek: yat
  goecek: (
    <>
      <path fill="var(--c)" d="M8 32h48l-8 10H16z" />
      <path fill="#fff" d="M28 32V12l14 20z" />
      <path fill="currentColor" d="M26 32V18l-10 14z" opacity=".6" />
      <Waves y={46} />
    </>
  ),
};

// Tapu adından şehir resmine (yalnızca resmi olan şehirler).
const CITY_BY_NAME = {
  'Kahramanmaraş': 'kahramanmaras', 'Şanlıurfa': 'sanliurfa', 'Mersin': 'mersin', 'Antalya': 'antalya',
  'Eskişehir': 'eskisehir', 'Bursa': 'bursa', 'Balıkesir': 'balikesir', 'İzmir': 'izmir', 'Ankara': 'ankara',
  'Konya': 'konya', 'Kayseri': 'kayseri', 'Samsun': 'samsun', 'Trabzon': 'trabzon', 'Rize': 'rize',
  'Bodrum': 'bodrum', 'Fethiye': 'fethiye', 'Kaş': 'kas', 'Alaçatı': 'alacati', 'Çeşme': 'cesme',
  'Belek': 'belek', 'Göcek': 'goecek', 'Nişantaşı': 'nisantasi',
};
export const cityOf = (name) => CITY_BY_NAME[name];

export default function CityArt({ id, color, className = 'city-art' }) {
  if (!ART[id]) return null;
  return (
    <svg className={className} viewBox="0 0 64 48" style={{ '--c': color }} aria-hidden="true" focusable="false">
      {ART[id]}
    </svg>
  );
}
