// Oyun kartlarının sağ alt köşesindeki çizimler: tek renk (kartın yazı rengi), farklı saydamlıkta katmanlar.
const A = {
  monopoly: (
    <>
      <rect x="24" y="62" width="72" height="42" opacity=".28" />
      <polygon points="12,64 60,20 108,64" opacity=".45" />
      <rect x="52" y="78" width="16" height="26" opacity=".55" />
      <circle cx="98" cy="30" r="17" opacity=".4" />
      <circle cx="98" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="3" opacity=".7" />
    </>
  ),
  satranc: (
    <>
      <circle cx="60" cy="32" r="17" opacity=".45" />
      <rect x="48" y="48" width="24" height="9" rx="2" opacity=".55" />
      <path d="M43 100 Q45 70 52 57 H68 Q75 70 77 100Z" opacity=".3" />
      <rect x="32" y="98" width="56" height="12" rx="6" opacity=".5" />
    </>
  ),
  spyfall: (
    <>
      <path d="M24 46 Q26 18 48 18 Q70 18 72 46Z" opacity=".3" />
      <rect x="25" y="36" width="46" height="7" opacity=".55" />
      <ellipse cx="48" cy="48" rx="42" ry="9" opacity=".45" />
      <circle cx="82" cy="80" r="20" fill="none" stroke="currentColor" strokeWidth="8" opacity=".55" />
      <line x1="97" y1="95" x2="112" y2="111" stroke="currentColor" strokeWidth="9" strokeLinecap="round" opacity=".55" />
    </>
  ),
  ajanlar: (
    <path fillRule="evenodd" opacity=".42" d="M34 36a24 24 0 1 0 .01 0ZM34 52a8 8 0 1 1-.01 0ZM54 55h58v11h-9v13h-10V66h-8v10H75V66H54Z" />
  ),
  vampir: (
    <>
      <path d="M72 10 A48 48 0 1 0 110 78 A38 38 0 1 1 72 10Z" opacity=".35" />
      <path d="M16 96 Q30 72 46 86 Q60 66 74 86 Q90 72 104 96 Q88 92 74 104 Q60 92 46 104 Q32 92 16 96Z" opacity=".5" />
    </>
  ),
  tabu: (
    <>
      <circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" strokeWidth="11" opacity=".45" />
      <line x1="32" y1="88" x2="88" y2="32" stroke="currentColor" strokeWidth="11" strokeLinecap="round" opacity=".45" />
    </>
  ),
  kimim: (
    <>
      <path d="M22 114 Q22 86 60 86 Q98 86 98 114Z" opacity=".3" />
      <circle cx="60" cy="66" r="17" opacity=".42" />
      <rect x="36" y="20" width="48" height="30" rx="5" opacity=".5" />
      <text x="60" y="44" textAnchor="middle" fontSize="26" fontWeight="800" fill="currentColor" opacity=".85">?</text>
    </>
  ),
  cizim: (
    <>
      <g transform="rotate(38 62 56)">
        <rect x="50" y="6" width="24" height="68" opacity=".4" />
        <rect x="50" y="6" width="24" height="12" opacity=".6" />
        <polygon points="50,74 74,74 62,100" opacity=".3" />
      </g>
      <path d="M6 108 q14 -18 28 0 t28 0 t28 0 t28 0" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity=".5" />
    </>
  ),
  cluedo: (
    <>
      <rect x="12" y="12" width="44" height="34" opacity=".4" />
      <rect x="64" y="12" width="44" height="34" opacity=".25" />
      <rect x="12" y="54" width="44" height="34" opacity=".25" />
      <circle cx="74" cy="74" r="20" fill="none" stroke="currentColor" strokeWidth="8" opacity=".55" />
      <line x1="88" y1="88" x2="108" y2="110" stroke="currentColor" strokeWidth="8" strokeLinecap="round" opacity=".6" />
    </>
  ),
  azul: (
    <>
      <rect x="12" y="12" width="40" height="40" rx="7" opacity=".4" />
      <rect x="58" y="12" width="40" height="40" rx="7" opacity=".25" />
      <rect x="12" y="58" width="40" height="40" rx="7" opacity=".25" />
      <rect x="58" y="58" width="40" height="40" rx="7" opacity=".5" />
    </>
  ),
  catan: (
    <>
      <polygon points="60,8 104,33 104,87 60,112 16,87 16,33" opacity=".4" />
      <polygon points="60,30 84,44 84,72 60,86 36,72 36,44" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" opacity=".6" />
    </>
  ),
  risk: (
    <>
      <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" strokeWidth="8" opacity=".55" />
      <ellipse cx="60" cy="60" rx="20" ry="46" fill="none" stroke="currentColor" strokeWidth="4" opacity=".35" />
      <path d="M26 46q16-18 34-2q8 14-6 26q-18 4-28-24Z" opacity=".4" />
      <path d="M70 70q18-6 26 12q-4 18-22 16q-14-8-4-28Z" opacity=".4" />
    </>
  ),
  scrabble: (
    <>
      <rect x="10" y="10" width="56" height="56" rx="9" opacity=".25" />
      <rect x="54" y="54" width="56" height="56" rx="9" opacity=".45" />
      <text x="82" y="98" textAnchor="middle" fontSize="44" fontWeight="800" fill="currentColor">S</text>
    </>
  ),
  ticket: (
    <>
      <rect x="18" y="40" width="84" height="44" rx="8" opacity=".45" />
      <rect x="70" y="22" width="32" height="22" rx="4" opacity=".6" />
      <rect x="28" y="26" width="10" height="16" opacity=".5" />
      <circle cx="36" cy="98" r="9" opacity=".75" />
      <circle cx="84" cy="98" r="9" opacity=".75" />
      <path d="M4 112h112" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity=".5" />
    </>
  ),
  carcassonne: (
    <>
      <rect x="34" y="40" width="52" height="70" opacity=".4" />
      <rect x="30" y="26" width="14" height="16" opacity=".6" />
      <rect x="53" y="26" width="14" height="16" opacity=".6" />
      <rect x="76" y="26" width="14" height="16" opacity=".6" />
      <path d="M52 110V96a8 8 0 0 1 16 0v14Z" opacity=".9" />
      <path d="M22 110h76" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity=".45" />
    </>
  ),
  kadro: (
    <>
      <rect x="10" y="20" width="100" height="84" rx="6" fill="none" stroke="currentColor" strokeWidth="5" opacity=".5" />
      <path d="M10 62h100" stroke="currentColor" strokeWidth="4" opacity=".5" />
      <circle cx="60" cy="62" r="14" fill="none" stroke="currentColor" strokeWidth="4" opacity=".5" />
      <circle cx="36" cy="40" r="6" opacity=".6" /><circle cx="84" cy="40" r="6" opacity=".6" />
      <circle cx="60" cy="34" r="6" opacity=".6" /><circle cx="36" cy="86" r="6" opacity=".6" />
      <circle cx="84" cy="86" r="6" opacity=".6" /><circle cx="60" cy="90" r="6" opacity=".6" />
    </>
  ),
  futbolcu: (
    <>
      <circle cx="44" cy="62" r="34" opacity=".3" />
      <polygon points="44,44 58,54 53,70 35,70 30,54" opacity=".6" />
      <text x="90" y="58" textAnchor="middle" fontSize="56" fontWeight="800" fill="currentColor" opacity=".55">?</text>
      <path d="M12 104h96" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity=".45" />
    </>
  ),
  bil: (
    <>
      <circle cx="58" cy="62" r="44" opacity=".26" />
      <text x="58" y="86" textAnchor="middle" fontSize="70" fontWeight="800" fill="currentColor" opacity=".6">?</text>
      <path d="M106 8v18M97 17h18" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity=".6" />
      <path d="M14 20v10M9 25h10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity=".5" />
    </>
  ),
};

export default function GameArt({ id }) {
  if (!A[id]) return null;
  return (
    <svg className="menu-art" viewBox="0 0 120 120" fill="currentColor" aria-hidden="true" focusable="false">{A[id]}</svg>
  );
}
