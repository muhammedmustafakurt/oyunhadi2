'use client';
import '@/styles/game-adam.css';
import '@/styles/game-adam-polish.css';
import { useEffect, useState } from 'react';
import Lobby from './Lobby';
import LeaveButton from './LeaveButton';
import useRoom from './useRoom';
import { PALETTE } from '@/lib/emlak';

// Kelime listesi istemciye gitmesin diye lib/adam.js içe aktarılmaz; alfabe burada tekrarlanır.
const ALPHABET = ['A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'Ğ', 'H', 'I', 'İ', 'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R', 'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z'];

// Adam çizimi: yanlış sayısına göre parça parça belirir (7 aşama). Renkler CSS sınıflarından gelir (tema + mekân rengi).
// pathLength=1 sayesinde her parça "çizilerek" belirir (game-adam-polish.css).
function Gallows({ wrong, max = 7 }) {
  const dead = wrong >= max;
  const part = { pathLength: 1, className: 'asm-part' };
  return (
    <svg viewBox="0 0 160 190" className={`asm-svg${dead ? ' dead' : ''}`} role="img" aria-label={`${wrong} yanlış, ${max} haktan`}>
      <ellipse className="asm-ground" cx="70" cy="183" rx="62" ry="5" />
      <path className="asm-wood" d="M18 180 H104 M40 180 V15 H105" />
      <path className="asm-wood asm-brace" d="M40 52 L72 15" />
      <path className="asm-rope" d="M105 15 V38" />
      <g className="asm-man">
        {wrong > 0 && <circle className="asm-part asm-head" pathLength="1" cx="105" cy="55" r="17" />}
        {wrong > 1 && <path {...part} d="M105 72 V120" />}
        {wrong > 2 && <path {...part} d="M105 82 L82 106" />}
        {wrong > 3 && <path {...part} d="M105 82 L128 106" />}
        {wrong > 4 && <path {...part} d="M105 120 L88 154" />}
        {wrong > 5 && <path {...part} d="M105 120 L122 154" />}
        {dead && <path className="asm-eyes" d="M97 49 l6 6 M103 49 l-6 6 M107 49 l6 6 M113 49 l-6 6" />}
      </g>
    </svg>
  );
}

// Masada Adam Asmaca: ortak 7 hak, sırayla harf tahmini, 5 tur.
export default function AdamOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'adam' });
  const { room, err, busy, send } = ui;
  const g = room?.game;
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const playing = !!g && !g.over && g.state === 'play';

  useEffect(() => {
    if (g) { setDeadline(Date.now() + g.leftMs); setNow(Date.now()); }
    if (!playing) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [room?.version]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={8} min={1}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const me = room.me;
  const seated = me >= 0 && !room.seats[me]?.left;
  const names = room.seats.map((s) => s.name);
  const over = g.over;
  const myTurn = seated && playing && g.turn === me;
  const timedOut = playing && deadline > 0 && now >= deadline;
  const roundDone = !playing && !over;
  const av = (i) => <i className="av" style={{ background: PALETTE[i % PALETTE.length] }}>{i + 1}</i>;
  const left = g.maxWrong - g.wrong;
  const lost = roundDone && g.state !== 'won';

  return (
    <div className="asm">
      {!seated && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}

      <ul className="asm-scores">
        {room.seats.map((s, i) => (
          <li key={i} className={`${playing && g.turn === i ? 'on' : ''}${s.left ? ' left' : ''}`}>
            {av(i)}<b>{s.name}{i === me ? ' (sen)' : ''}</b><span>{g.scores[i]} puan</span>
          </li>
        ))}
      </ul>

      <section className={`asm-board${myTurn ? ' me' : ''}${lost ? ' lost' : ''}${roundDone && !lost ? ' won' : ''}`}>
        <p className="asm-meta">
          <span className="asm-chip">Tur {g.round + 1} / {g.rounds}</span>
          <span className="asm-chip">Tür: <b>{g.cat}</b></span>
        </p>

        <div className="asm-stage">
          <Gallows wrong={g.wrong} max={g.maxWrong} />
          <div className="asm-gauge">
            <p className="asm-hak-label">Kalan hak: <b>{left}</b></p>
            <ul className="asm-lives" aria-hidden="true">
              {Array.from({ length: g.maxWrong }, (_, i) => <li key={i} className={i < left ? '' : 'gone'} />)}
            </ul>
            {playing && <h2 className="asm-turn">{myTurn ? 'Sıra sende' : `${names[g.turn] ?? ''} tahmin ediyor`}</h2>}
          </div>
        </div>

        <div className="asm-word" role="img" aria-label={g.mask.map((c) => c || 'boş').join(' ')}>
          {g.mask.map((c, i) => <span key={`${i}${c || ''}`} className={c ? 'f' : ''}>{c || ''}</span>)}
        </div>

        {g.note && <p className="asm-msg" role="status">{g.note}</p>}
        {roundDone && (
          <div className="asm-round" role="status">
            <p>{g.state === 'won' ? `${names[g.solver]} kelimeyi tamamladı!` : 'Haklar bitti.'} Kelime: <b>{g.word}</b></p>
            {seated && <button type="button" className="btn primary" disabled={busy} onClick={() => send('adnext')} aria-label="Sonraki tura geç">Sonraki tur</button>}
          </div>
        )}
        {timedOut && !myTurn && seated && (
          <button type="button" className="btn sm" disabled={busy} onClick={() => send('adskip')} aria-label="Süresi dolan oyuncunun sırasını atla">Süre doldu, sırayı atla</button>
        )}
      </section>

      {playing && (
        <div className={`asm-keys${myTurn ? ' mine' : ''}`} role="group" aria-label="Türkçe harf tuş takımı">
          {ALPHABET.map((L) => {
            const used = g.guessed.includes(L);
            const hit = g.hits.includes(L);
            return (
              <button
                key={L} type="button" className={used ? (hit ? 'hit' : 'miss') : ''}
                disabled={!myTurn || used || busy}
                onClick={() => send('adguess', { pl: { letter: L } })}
                aria-label={`${L} harfi${used ? (hit ? ', bulundu' : ', yok') : ''}`}
              >{L}</button>
            );
          })}
        </div>
      )}

      {over && (
        <section className="asm-over" role="status">
          <h2>{over.text}</h2>
          <ol>
            {over.ranking.map((i, k) => (
              <li key={i} className={over.winners.includes(i) ? 'win' : ''}>
                <em>{k + 1}</em><b>{names[i]}</b><span>{over.scores[i]} puan</span>
              </li>
            ))}
          </ol>
          <button type="button" className="btn primary" disabled={busy} onClick={() => send('reset')} aria-label="Yeniden oyna, lobiye dön">Yeniden oyna</button>
        </section>
      )}

      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && !over && <LeaveButton busy={busy} onLeave={() => send('leave')} />}
    </div>
  );
}
