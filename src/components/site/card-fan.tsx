import QRCode from 'qrcode';
import GameCover from '@/components/oyun/GameCover';
import { SPINE } from '@/lib/spines';
import { GAMES } from '@/lib/games';
import { SITE_URL } from '@/lib/site';

const FAN = ['bil', 'monopoly', 'satranc', 'ajanlar', 'vampir', 'kimim'];
const MID = 2; // "Bu oyunu aç" düğmeli, en önde duran kart
const INK = '#1c1233';

// Gerçek, okutulabilir karekod (demo masaya gider). Yüksek hata düzeltmesiyle üretilir ki ortasına logo sığsın.
const qr = QRCode.create(`${SITE_URL}/demo/masa-5/oyunlar`, { errorCorrectionLevel: 'H' });
const N = qr.modules.size;
const at = (x: number, y: number) => qr.modules.get(y, x) === 1;
const inFinder = (x: number, y: number) => (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
const LOGO = Math.round(N * 0.22) | 1; // ortadaki logo alanı (tek sayı)
const L0 = (N - LOGO) / 2;
const inLogo = (x: number, y: number) => x >= L0 - 0.5 && x < L0 + LOGO + 0.5 && y >= L0 - 0.5 && y < L0 + LOGO + 0.5;
const DOTS: [number, number][] = [];
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (at(x, y) && !inFinder(x, y) && !inLogo(x, y)) DOTS.push([x, y]);

function Finder({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x + 0.5} y={y + 0.5} width="6" height="6" rx="1.7" fill="none" stroke={INK} strokeWidth="1" />
      <rect x={x + 2} y={y + 2} width="3" height="3" rx="0.9" fill={INK} />
    </g>
  );
}

function Qr({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={`-1 -1 ${N + 2} ${N + 2}`} aria-hidden="true">
      <rect x="-1" y="-1" width={N + 2} height={N + 2} rx="2" fill="#fff" />
      {DOTS.map(([x, y]) => <rect key={`${x}-${y}`} x={x + 0.08} y={y + 0.08} width="0.84" height="0.84" rx="0.3" fill={INK} />)}
      <Finder x={0} y={0} />
      <Finder x={N - 7} y={0} />
      <Finder x={0} y={N - 7} />
      {/* Ortada oyunhadi zarı */}
      <g transform={`translate(${L0} ${L0})`}>
        <rect width={LOGO} height={LOGO} rx={LOGO * 0.28} fill="#ff4f2e" transform={`rotate(-8 ${LOGO / 2} ${LOGO / 2})`} />
        <circle cx={LOGO * 0.33} cy={LOGO * 0.33} r={LOGO * 0.11} fill="#fff" />
        <circle cx={LOGO * 0.67} cy={LOGO * 0.67} r={LOGO * 0.11} fill="#fff" />
      </g>
    </svg>
  );
}

// Ana sayfa başlığındaki sahne: telefon masadaki karekodu okutur, kartlar telefondan çıkıp yelpaze gibi açılır.
// CSS ile döngü halinde oynar (bkz. site-utility.css "Karekod sahnesi").
export default function CardFan() {
  return (
    <div className="scan-scene relative mx-auto h-[400px] w-full max-w-[520px] sm:h-[460px]" aria-hidden="true">
      {/* Masadaki karekodlu pleksi */}
      <div className="scan-stand absolute bottom-0 left-1/2 w-[132px]">
        <div className="rounded-t-[14px] border-[3px] border-ink bg-white px-3 pt-2.5 pb-2 text-center text-ink shadow-[0_6px_0_rgba(0,0,0,.25)]">
          <p className="text-[11px] leading-none font-extrabold">Masa 5</p>
          <Qr className="mx-auto my-1.5 h-[76px] w-[76px]" />
          <p className="text-[10px] leading-none font-bold">Okut, oyna!</p>
        </div>
        <div className="h-3 rounded-b-md border-[3px] border-t-0 border-ink bg-sun" />
      </div>

      {/* Telefon */}
      <div className="scan-phone absolute bottom-[96px] left-1/2 z-20 w-[112px]">
        <div className="rounded-[22px] border-[3px] border-ink bg-ink p-1.5 shadow-[0_10px_0_rgba(0,0,0,.25)]">
          <div className="relative h-[196px] overflow-hidden rounded-[16px] bg-[#2a2440]">
            <span className="absolute top-1.5 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-black/50" />
            {/* Vizör: köşeler ve karekod */}
            <div className="absolute inset-x-4 top-12 bottom-12">
              <span className="absolute top-0 left-0 h-4 w-4 rounded-tl-md border-t-[3px] border-l-[3px] border-sun" />
              <span className="absolute top-0 right-0 h-4 w-4 rounded-tr-md border-t-[3px] border-r-[3px] border-sun" />
              <span className="absolute bottom-0 left-0 h-4 w-4 rounded-bl-md border-b-[3px] border-l-[3px] border-sun" />
              <span className="absolute right-0 bottom-0 h-4 w-4 rounded-br-md border-r-[3px] border-b-[3px] border-sun" />
              <div className="absolute inset-2 grid place-items-center rounded bg-white/90"><Qr className="h-full w-full p-1" /></div>
              <span className="scan-line absolute inset-x-1 h-[3px] rounded-full bg-mint shadow-[0_0_8px_#5ef2b5]" />
            </div>
            {/* Okundu */}
            <div className="scan-ok absolute inset-0 grid place-items-center bg-coral text-center text-white">
              <div>
                <svg className="mx-auto h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                <p className="mt-1 text-[13px] leading-tight font-extrabold">Masa 5<br />açıldı</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Masa etiketi */}
      <span className="scan-seat absolute top-0 right-2 z-30 rotate-6 rounded-full border-[2.5px] border-ink bg-sun px-4 py-1.5 font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)] sm:right-8">Masa 5</span>

      {/* Telefondan çıkıp açılan kartlar */}
      {FAN.map((id, i) => {
        const g = GAMES.find((x) => x.id === id)!;
        const [bg] = SPINE[id];
        const mid = i === MID;
        return (
          <div
            key={id}
            className="fan-card absolute top-8 left-1/2 w-[160px] overflow-hidden rounded-[18px] border-[3px] border-ink bg-[#fffdf8] text-ink shadow-[0_10px_0_rgba(0,0,0,.25)] sm:w-[190px]"
            style={{ '--i': i - (FAN.length - 1) / 2, '--d': `${Math.abs(i - MID) * 60}ms`, zIndex: mid ? 15 : 13 - Math.abs(i - MID) } as React.CSSProperties}
          >
            <div className="relative h-[118px] overflow-hidden border-b-[3px] border-ink sm:h-[140px]" style={{ background: bg }}>
              <GameCover id={id} title={false} className="absolute inset-0 h-full w-full" />
            </div>
            <div className="px-3.5 pt-3 pb-14">
              <p className="font-display text-xl leading-none font-extrabold sm:text-2xl">{g.name}</p>
              <p className="mt-1 text-[13px] text-muted">{g.players.replace('-', '–')} kişi</p>
            </div>
            {mid && <span className="absolute right-3 bottom-3 left-3 rounded-xl border-2 border-ink bg-coral py-2 text-center text-sm font-extrabold text-white">Bu oyunu aç</span>}
          </div>
        );
      })}
    </div>
  );
}
