import GameFace from './GameFace';
import { GAMES } from '@/lib/games';
import { INK, PAPER, SYMBOLS, accentOf, nameLines, sealSvg } from './emblems';

const nameOf = (id: string) => GAMES.find((g) => g.id === id)?.name ?? '';

// Mühür: sadece halka + simge (kartın ortasında kullanılır)
export function GameSeal({ id, className }: { id: string; className?: string }) {
  if (!SYMBOLS[id]) return <GameFace id={id} className={className} />;
  return (
    <svg className={className} viewBox="0 0 120 120" style={{ '--acc': accentOf(id) } as React.CSSProperties} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: sealSvg(id) }} />
  );
}

// Oyunun kapak sanatı (premium kutu oyunu dili). title=true ise krem kart üzerinde oyun logosuyla birlikte çizilir.
// Kapağı olmayan oyun için eski yüz çizimi gösterilir.
export default function GameCover({ id, title = true, className }: { id: string; title?: boolean; className?: string }) {
  const sym = SYMBOLS[id];
  if (!sym) return <GameFace id={id} className={className} />;
  const acc = accentOf(id);
  let inner: string;
  if (!title) {
    // Küçük kullanım: renkli zemin, krem mühür, simge
    inner =
      `<circle cx="60" cy="57" r="47" fill="${PAPER}" stroke="${INK}" stroke-width="1.6"/>` +
      `<g transform="translate(60 57) scale(.74) translate(-50 -50)">${sym}</g>`;
  } else {
    const L = nameLines(nameOf(id));
    const ys = L.length === 1 ? [96] : [86, 102];
    const text = L
      .map((t, i) => {
        const size = Math.min(L.length === 1 ? 19 : 16, 92 / (t.length * 0.55));
        return `<text x="60" y="${ys[i]}" text-anchor="middle" font-size="${size.toFixed(1)}" font-weight="800" font-style="italic" fill="${INK}" style="font-family:var(--font-logo),Georgia,serif">${t}</text>`;
      })
      .join('');
    inner =
      `<rect x="5" y="5" width="110" height="104" rx="3" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>` +
      `<g transform="translate(60 40) scale(.5) translate(-60 -60)">${sealSvg(id, 0.68)}</g>` +
      text;
  }
  return (
    <svg className={`cv${className ? ` ${className}` : ''}`} viewBox="0 0 120 114" preserveAspectRatio="xMidYMid meet" style={{ '--acc': acc, backgroundColor: acc } as React.CSSProperties} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: inner }} />
  );
}
