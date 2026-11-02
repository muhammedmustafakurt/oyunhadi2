'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameSeal } from './GameCover';
import { accentOf, nameLines } from './emblems';
import DeckIntro from './DeckIntro';

export type DeckGame = {
  id: string;
  name: string;
  note: string;
  players: string; // "2-10"
  minutes: string;
  bg: string;
  fg: string;
  href: string;
  reward?: string;
};

const range = (p: string) => { const [a, b = a] = p.split('-').map(Number); return [a, b] as const; };
const label = (p: string) => { const [a, b] = range(p); return a === b ? `${a}` : `${a}–${b}`; };
const MAX = 10;

// Masa ekranının oyun destesi: kartlar yatay kaydırılır, ortadaki kart öne çıkar.
// Kişi sayısı seçilince yalnızca o sayıya uyan oyunlar destede kalır.
export default function GameDeck({ games, soon, introKey, table }: { games: DeckGame[]; soon: string[]; introKey: string; table: string }) {
  const [n, setN] = useState(0); // 0: fark etmez
  const [dealt, setDealt] = useState(false); // açılış animasyonu bitti mi
  const onIntroDone = useCallback(() => setDealt(true), []);
  const [active, setActive] = useState(0);
  const rail = useRef<HTMLUListElement>(null);

  const deck = useMemo(() => (n === 0 ? games : games.filter((g) => { const [a, b] = range(g.players); return n >= a && n <= b; })), [games, n]);
  const total = deck.length + (soon.length > 0 && n === 0 ? 1 : 0);

  // Ortaya en yakın kartı etkin say
  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let dist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const card = c as HTMLElement;
      const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - mid);
      if (d < dist) { dist = d; best = i; }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    el.scrollTo({ left: 0 });
    setActive(0);
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    el.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { el.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, [measure, n]);

  const go = (i: number) => {
    const el = rail.current;
    const card = el?.children[Math.max(0, Math.min(total - 1, i))] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2, behavior: 'smooth' });
  };

  return (
    <div className={`dk${dealt ? ' dealt' : ' waiting'}`}>
      <DeckIntro cards={games} storageKey={`oh-intro-${introKey}`} table={table} onDone={onIntroDone} />
      {deck.length === 0 ? (
        <div className="dk-empty" role="status">
          <p><b>{n} kişiyle</b> oynanan oyun yok.</p>
          <button type="button" className="btn sm" onClick={() => setN(0)}>Bütün oyunları göster</button>
        </div>
      ) : (
        <ul className="dk-rail" ref={rail} aria-label="Oyun destesi">
          {deck.map((g, i) => {
            const off = i - active;
            const lines = nameLines(g.name);
            const long = Math.max(...lines.map((l) => l.length)) > 10;
            const no = String(games.findIndex((x) => x.id === g.id) + 1).padStart(2, '0');
            return (
              <li key={g.id} className="dk-slot" data-active={off === 0} style={{ '--off': off, '--deal': `${Math.min(i, 4) * 90}ms` } as React.CSSProperties}>
                <article className="dk-card" aria-label={g.name} style={{ '--acc': accentOf(g.id) } as React.CSSProperties}>
                  <div className="dk-in">
                    {g.reward && <span className="dk-reward">★ Ödüllü</span>}
                    <p className="dk-no" aria-hidden="true">Oyunhadi · {no}/{String(games.length).padStart(2, '0')}</p>
                    <GameSeal id={g.id} className="dk-seal" />
                    <h2 className={`dk-logo${long ? ' long' : ''}`}>{lines.map((l) => <span key={l}>{l}</span>)}</h2>
                    <p className="dk-note">{g.note}</p>
                    <p className="dk-meta">{label(g.players)} oyuncu · {g.minutes.replace('-', '–')} dk</p>
                    {g.reward && <p className="dk-prize">{g.reward}</p>}
                    <Link href={g.href} className="dk-play" tabIndex={off === 0 ? 0 : -1}>Bu oyunu aç</Link>
                  </div>
                </article>
              </li>
            );
          })}
          {soon.length > 0 && n === 0 && (
            <li className="dk-slot" data-active={active === deck.length} style={{ '--off': deck.length - active } as React.CSSProperties}>
              <article className="dk-card dk-back" aria-label="Yakında gelecek oyunlar">
                <div className="dk-back-in">
                  <p className="dk-back-title">Yakında<br />destede</p>
                  <ul>{soon.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
              </article>
            </li>
          )}
        </ul>
      )}

      {deck.length > 0 && (
        <div className="dk-nav">
          <button type="button" className="dk-arrow" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Önceki oyun"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
          <span className="dk-dots" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => <i key={i} data-on={i === active} />)}
          </span>
          <button type="button" className="dk-arrow" onClick={() => go(active + 1)} disabled={active >= total - 1} aria-label="Sonraki oyun"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button>
        </div>
      )}

      <div className="dk-count">
        <span id="dk-count-label">Kaç kişisiniz?</span>
        <span className="dk-step" role="group" aria-labelledby="dk-count-label">
          <button type="button" onClick={() => setN((v) => (v <= 2 ? 0 : v - 1))} disabled={n === 0} aria-label="Bir kişi az">−</button>
          <output aria-live="polite">{n === 0 ? 'Fark etmez' : n === MAX ? `${MAX}+` : n}</output>
          <button type="button" onClick={() => setN((v) => (v === 0 ? 2 : Math.min(MAX, v + 1)))} disabled={n === MAX} aria-label="Bir kişi fazla">+</button>
        </span>
      </div>
    </div>
  );
}
