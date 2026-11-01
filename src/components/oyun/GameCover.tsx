import GameFace from './GameFace';
import { COVERS, DEFS, buildCover } from './covers';

// Kapak sanatının ortak gradyanları; kapakları gösteren sayfada bir kez yerleştirilir.
export function CoverDefs() {
  return <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: `<defs>${DEFS}</defs>` }} />;
}

// Oyunun kapak sanatı (parlak oyun logosu dili). Kapağı olmayan oyun için eski yüz çizimi gösterilir.
export default function GameCover({ id, title = true, className }: { id: string; title?: boolean; className?: string }) {
  const entry = (COVERS as Record<string, { t: string[]; svg: string }>)[id];
  if (!entry) return <GameFace id={id} className={className} />;
  return (
    <svg className={className} viewBox="0 0 120 114" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: buildCover(entry, title) }} />
  );
}
