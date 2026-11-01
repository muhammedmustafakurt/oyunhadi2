// Oyun karakterleri: her oyunun bir yüzü var. Kalın koyu dış çizgi, düz renkler, renk geçişi yok.
// viewBox 0 0 120 120; kartın üst yarısında, oyunun kendi renginin üstünde durur.
const K = '#1c1233';
const s = { stroke: K, strokeWidth: 5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

const FACES: Record<string, React.ReactNode> = {
  // Emlak Krallığı: taç giymiş gülen ev
  monopoly: (
    <>
      <rect x="80" y="24" width="12" height="24" fill="#c9c2e0" {...s} />
      <rect x="26" y="56" width="68" height="52" fill="#fff4e0" {...s} />
      <polygon points="12,62 60,22 108,62" fill="#ff4f2e" {...s} />
      <path d="M44 22l4-14 12 9 12-9 4 14Z" fill="#ffc83d" {...s} />
      <circle cx="46" cy="76" r="5" fill={K} />
      <circle cx="74" cy="76" r="5" fill={K} />
      <path d="M48 90q12 10 24 0" fill="none" {...s} />
      <circle cx="38" cy="86" r="4" fill="#ff8fb1" />
      <circle cx="82" cy="86" r="4" fill="#ff8fb1" />
    </>
  ),
  // Satranç: gülümseyen şah
  satranc: (
    <>
      <path d="M60 4v16M52 12h16" fill="none" {...s} />
      <rect x="24" y="100" width="72" height="12" rx="4" fill="#c9c2e0" {...s} />
      <path d="M44 66Q40 92 32 100h56q-8-8-12-34Z" fill="#ece8f8" {...s} />
      <rect x="38" y="58" width="44" height="10" rx="3" fill="#c9c2e0" {...s} />
      <circle cx="60" cy="40" r="20" fill="#ece8f8" {...s} />
      <circle cx="53" cy="38" r="3.5" fill={K} />
      <circle cx="67" cy="38" r="3.5" fill={K} />
      <path d="M53 47q7 6 14 0" fill="none" {...s} strokeWidth={4} />
    </>
  ),
  // Casus: fötr şapka, güneş gözlüğü, bıyık
  spyfall: (
    <>
      <circle cx="60" cy="68" r="38" fill="#f4c7a1" {...s} />
      <path d="M22 46q4-34 38-34t38 34Z" fill="#5a361c" {...s} />
      <ellipse cx="60" cy="46" rx="50" ry="8" fill="#7a4b2a" {...s} />
      <rect x="32" y="60" width="22" height="14" rx="5" fill={K} />
      <rect x="66" y="60" width="22" height="14" rx="5" fill={K} />
      <path d="M54 66h12" stroke={K} strokeWidth="4" />
      <path d="M44 90q16 8 32 0" fill="none" {...s} />
      <path d="M40 84q20-8 40 0" fill="none" stroke="#5a361c" strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  // Gizli Ajanlar: göz bandı ve kulaklık
  ajanlar: (
    <>
      <circle cx="60" cy="64" r="40" fill="#f4c7a1" {...s} />
      <path d="M22 56q2-38 38-38t38 38q-14-14-38-14T22 56Z" fill={K} />
      <rect x="22" y="54" width="76" height="18" rx="9" fill={K} />
      <circle cx="44" cy="63" r="5" fill="#fff" />
      <circle cx="76" cy="63" r="5" fill="#fff" />
      <path d="M50 90h20" fill="none" {...s} />
      <path d="M101 66q9 12 0 26" fill="none" {...s} strokeWidth={4} />
      <circle cx="101" cy="64" r="5" fill={K} />
    </>
  ),
  // Vampir Köylü: pelerin yakalı, dişli vampir
  vampir: (
    <>
      <path d="M18 50q4-36 42-36t42 36l-20-8-22 16-22-16Z" fill={K} />
      <circle cx="60" cy="66" r="36" fill="#e9dcff" {...s} />
      <path d="M36 44l24 16 24-16" fill={K} />
      <path d="M40 62l10 4M80 62l-10 4" fill="none" {...s} strokeWidth={4} />
      <circle cx="46" cy="72" r="5" fill="#c0261e" />
      <circle cx="74" cy="72" r="5" fill="#c0261e" />
      <path d="M44 88q16 10 32 0" fill="#fff" {...s} strokeWidth={4} />
      <path d="M50 91l3 8 3-6M64 91l3 6 3-8" fill="#fff" {...s} strokeWidth={3} />
    </>
  ),
  // Tabu: ağzı bantlı yüz
  tabu: (
    <>
      <circle cx="60" cy="60" r="44" fill="#ffd6e4" {...s} />
      <circle cx="44" cy="50" r="6" fill={K} />
      <circle cx="76" cy="50" r="6" fill={K} />
      <path d="M36 38l14 5M84 38l-14 5" fill="none" {...s} strokeWidth={4} />
      <g transform="rotate(-10 60 76)">
        <rect x="32" y="68" width="56" height="17" rx="3" fill="#fff" {...s} strokeWidth={4} />
        <path d="M40 72l10 9M50 72l-10 9M70 72l10 9M80 72l-10 9" stroke="#e0457f" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    </>
  ),
  // Ben Kimim?: alnında soru kartı olan meraklı yüz
  kimim: (
    <>
      <circle cx="60" cy="72" r="38" fill="#ffe0b8" {...s} />
      <rect x="22" y="48" width="76" height="9" fill="#ff4f2e" {...s} strokeWidth={4} />
      <g transform="rotate(-6 60 34)">
        <rect x="40" y="10" width="40" height="46" rx="5" fill="#fff" {...s} strokeWidth={4} />
        <text x="60" y="44" textAnchor="middle" fontSize="30" fontWeight="800" fill={K} fontFamily="system-ui, sans-serif">?</text>
      </g>
      <circle cx="47" cy="76" r="7" fill="#fff" {...s} strokeWidth={3} />
      <circle cx="73" cy="76" r="7" fill="#fff" {...s} strokeWidth={3} />
      <circle cx="47" cy="72" r="3" fill={K} />
      <circle cx="73" cy="72" r="3" fill={K} />
      <ellipse cx="60" cy="96" rx="5" ry="6" fill={K} />
    </>
  ),
  // Çiz Bakalım: gülen kalem
  cizim: (
    <>
      <path d="M6 110q10-12 20 0t20 0" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <polygon points="38,88 82,88 60,116" fill="#f4c7a1" {...s} />
      <polygon points="53,106 67,106 60,116" fill={K} />
      <rect x="38" y="30" width="44" height="58" fill="#fff" {...s} />
      <rect x="38" y="22" width="44" height="10" fill="#b8b0c8" {...s} />
      <rect x="38" y="8" width="44" height="16" rx="5" fill="#ff8fb1" {...s} />
      <circle cx="51" cy="54" r="4.5" fill={K} />
      <circle cx="69" cy="54" r="4.5" fill={K} />
      <path d="M50 66q10 9 20 0" fill="none" {...s} strokeWidth={4} />
    </>
  ),
  // Cluedo: büyüteçli dedektif
  cluedo: (
    <>
      <rect x="22" y="66" width="72" height="42" rx="8" fill="#f5e6c8" {...s} />
      <line x1="76" y1="66" x2="102" y2="94" {...s} strokeWidth={10} />
      <circle cx="52" cy="40" r="26" fill="#cfe9ff" {...s} />
      <circle cx="44" cy="36" r="4" fill={K} />
      <circle cx="60" cy="36" r="4" fill={K} />
      <path d="M44 50q8 7 16 0" fill="none" {...s} />
    </>
  ),
  // Azul: gülen fayans
  azul: (
    <>
      <rect x="16" y="16" width="88" height="88" rx="18" fill="#2a6fb0" {...s} />
      <rect x="30" y="30" width="60" height="60" rx="10" fill="#f2c230" {...s} strokeWidth={4} />
      <circle cx="50" cy="56" r="5" fill={K} />
      <circle cx="70" cy="56" r="5" fill={K} />
      <path d="M48 70q12 10 24 0" fill="none" {...s} />
    </>
  ),
  // Futbolcuyu Bul: formalı, ter bantlı oyuncu ve soru işareti
  futbolcu: (
    <>
      <path d="M14 112q4-24 26-28h40q22 4 26 28Z" fill="#fff" {...s} />
      <path d="M46 84l14 14 14-14" fill="#1f9d3a" {...s} />
      <circle cx="60" cy="52" r="32" fill="#f4c7a1" {...s} />
      <path d="M28 46q2-30 32-30t32 30q-16-10-32-10T28 46Z" fill={K} />
      <rect x="28" y="40" width="64" height="9" rx="4" fill="#1f9d3a" {...s} strokeWidth={4} />
      <circle cx="49" cy="62" r="4.5" fill={K} />
      <circle cx="71" cy="62" r="4.5" fill={K} />
      <path d="M50 74q10 8 20 0" fill="none" {...s} strokeWidth={4} />
      <text x="104" y="30" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff" stroke={K} strokeWidth="2.5" paintOrder="stroke">?</text>
    </>
  ),
  // Kadro: gülen futbol topu
  kadro: (
    <>
      <circle cx="60" cy="60" r="44" fill="#fff" {...s} />
      <polygon points="60,26 78,38 71,58 49,58 42,38" fill={K} stroke={K} strokeWidth={3} strokeLinejoin="round" />
      <path d="M60 26V16M78 38l12-6M42 38L30 32M71 58l10 12M49 58L39 70" fill="none" {...s} strokeWidth={4} />
      <circle cx="51" cy="74" r="4.5" fill={K} />
      <circle cx="69" cy="74" r="4.5" fill={K} />
      <path d="M52 88q8 7 16 0" fill="none" {...s} strokeWidth={4} />
    </>
  ),
  // Bil Bakalım: gülen ampul
  bil: (
    <>
      <path d="M14 30l10 6M106 30l-10 6M60 0v6M8 60h10M112 60h-10" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M60 12a34 34 0 0 1 20 62v12H40V74a34 34 0 0 1 20-62Z" fill="#ffe08a" {...s} />
      <rect x="40" y="88" width="40" height="8" fill="#b8b0c8" {...s} strokeWidth={4} />
      <rect x="44" y="96" width="32" height="8" fill="#b8b0c8" {...s} strokeWidth={4} />
      <circle cx="50" cy="46" r="5" fill={K} />
      <circle cx="70" cy="46" r="5" fill={K} />
      <path d="M48 58q12 12 24 0" fill="none" {...s} />
    </>
  ),
  // Catan: gülen altıgen arazi karosu
  catan: (
    <>
      <polygon points="60,10 100,33 100,79 60,102 20,79 20,33" fill="#e8c76a" {...s} />
      <circle cx="48" cy="54" r="5" fill={K} />
      <circle cx="72" cy="54" r="5" fill={K} />
      <path d="M48 68q12 10 24 0" fill="none" {...s} />
    </>
  ),
  // Risk: gülen dünya küresi
  risk: (
    <>
      <circle cx="60" cy="60" r="44" fill="#9fd8f5" {...s} />
      <path d="M26 34q10-12 22-4q6 8-2 16q-10 4-18-2Z" fill="#8fc24a" {...s} strokeWidth={3} />
      <path d="M74 26q14-8 20 6q0 10-10 12q-10-2-10-18Z" fill="#8fc24a" {...s} strokeWidth={3} />
      <circle cx="48" cy="66" r="5" fill={K} />
      <circle cx="72" cy="66" r="5" fill={K} />
      <path d="M50 80q10 8 20 0" fill="none" {...s} />
    </>
  ),
  // Scrabble: gülen harf karosu
  scrabble: (
    <>
      <rect x="18" y="18" width="84" height="84" rx="16" fill="#fbe9c3" {...s} />
      <text x="84" y="46" textAnchor="middle" fontSize="24" fontWeight="800" fill={K} fontFamily="system-ui, sans-serif">Ş</text>
      <circle cx="46" cy="66" r="5" fill={K} />
      <circle cx="74" cy="66" r="5" fill={K} />
      <path d="M46 80q14 10 28 0" fill="none" {...s} />
    </>
  ),
  // Ticket to Ride: gülen lokomotif
  ticket: (
    <>
      <rect x="40" y="12" width="40" height="26" rx="4" fill="#c9c2e0" {...s} />
      <rect x="18" y="36" width="84" height="54" rx="12" fill="#e2483d" {...s} />
      <circle cx="46" cy="58" r="4" fill={K} />
      <circle cx="74" cy="58" r="4" fill={K} />
      <path d="M48 74q12 10 24 0" fill="none" {...s} />
      <circle cx="38" cy="98" r="9" fill={K} />
      <circle cx="82" cy="98" r="9" fill={K} />
    </>
  ),
  // Carcassonne: bayraklı kale kulesi
  carcassonne: (
    <>
      <rect x="36" y="36" width="48" height="74" fill="#e9e1cf" {...s} />
      <rect x="34" y="22" width="14" height="16" fill="#e9e1cf" {...s} strokeWidth={4} />
      <rect x="53" y="22" width="14" height="16" fill="#e9e1cf" {...s} strokeWidth={4} />
      <rect x="72" y="22" width="14" height="16" fill="#e9e1cf" {...s} strokeWidth={4} />
      <path d="M60 22V4" fill="none" {...s} strokeWidth={4} />
      <polygon points="60,4 80,10 60,16" fill="#ff4f2e" {...s} strokeWidth={3} />
      <circle cx="50" cy="58" r="5" fill={K} />
      <circle cx="70" cy="58" r="5" fill={K} />
      <path d="M50 72q10 8 20 0" fill="none" {...s} />
      <path d="M50 110V96a10 10 0 0 1 20 0v14Z" fill={K} />
    </>
  ),
};

export default function GameFace({ id, className }: { id: string; className?: string }) {
  const face = FACES[id];
  if (!face) return null;
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      {face}
    </svg>
  );
}
