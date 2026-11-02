'use client';

import { useEffect, useState } from 'react';
import GameCover from './GameCover';

type Card = { id: string; name: string; bg: string };

const LENGTH_MS = 2300;

// Karekod okutulunca masa ekranının açılış animasyonu: kartlar alttan gelip deste olur, karıştırılır,
// yelpaze gibi açılır ve masaya dağıtılır. Masa başına oturumda bir kez oynar; dokununca geçilir.
export default function DeckIntro({ cards, storageKey, table, onDone }: { cards: Card[]; storageKey: string; table: string; onDone: () => void }) {
  const [state, setState] = useState<'play' | 'leave' | 'gone'>('play');

  // "Görüldü" işareti animasyon bitince konur (başta konursa geliştirme modunda efekt iki kez çalışıp animasyonu atlar).
  const finish = () => {
    try { sessionStorage.setItem(storageKey, '1'); } catch {}
    setState('gone');
    onDone();
  };

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(storageKey) === '1'; } catch {}
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduce) { setState('gone'); onDone(); return; }
    const t1 = setTimeout(() => setState('leave'), LENGTH_MS - 350);
    const t2 = setTimeout(() => {
      try { sessionStorage.setItem(storageKey, '1'); } catch {}
      setState('gone');
      onDone();
    }, LENGTH_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [storageKey, onDone]);

  if (state === 'gone') return null;
  const five = cards.slice(0, 5);
  const mid = (five.length - 1) / 2;

  return (
    <div
      className={`dk-intro${state === 'leave' ? ' leave' : ''}`}
      role="presentation"
      onClick={finish}
    >
      <p className="dk-intro-title">Masa {table}<span>Deste karıştırılıyor…</span></p>
      <div className="dk-intro-stage" aria-hidden="true">
        {five.map((c, i) => (
          <div key={c.id} className="dk-intro-card" style={{ '--i': i - mid, '--d': `${i * 70}ms`, zIndex: i === Math.round(mid) ? 9 : 5 - Math.abs(i - mid) } as React.CSSProperties}>
            <div className="dk-intro-top"><GameCover id={c.id} title={false} className="dk-intro-cover" /></div>
            <b>{c.name}</b>
          </div>
        ))}
      </div>
      <p className="dk-intro-skip">Geçmek için dokunun</p>
    </div>
  );
}
