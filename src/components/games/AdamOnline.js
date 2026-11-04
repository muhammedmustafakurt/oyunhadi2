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

// Adam çizimi: yanlış sayısına göre parça parça belirir (7 aşama).
function Gallows({ wrong }) {
  const p = { stroke: '#1c1233', strokeWidth: 5, strokeLinecap: 'round', fill: 'none' };
  return (
    <svg viewBox="0 0 160 190" className="ad-svg" role="img" aria-label={`${wrong} yanlış, 7 haktan`}>
      <path d="M20 180 H100 M40 180 V15 H105 V38" {...p} stroke="#5a3fd1" />
      {wrong > 0 && <circle cx="105" cy="55" r="17" {...p} stroke="#ff5a36" />}
      {wrong > 1 && <path d="M105 72 V120" {...p} stroke="#ff5a36" />}
      {wrong > 2 && <path d="M105 82 L82 105" {...p} stroke="#ff5a36" />}
      {wrong > 3 && <path d="M105 82 L128 105" {...p} stroke="#ff5a36" />}
      {wrong > 4 && <path d="M105 120 L88 152" {...p} stroke="#ff5a36" />}
      {wrong > 5 && <path d="M105 120 L122 152" {...p} stroke="#ff5a36" />}
      {wrong > 6 && <path d="M98 50 l5 5 M103 50 l-5 5 M108 50 l5 5 M113 50 l-5 5" {...p} strokeWidth={2.5} stroke="#1c1233" />}
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
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={8} min={2}
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

  return (
    <div className="ad">
      {!seated && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}

      <ul className="ad-scores">
        {room.seats.map((s, i) => (
          <li key={i} className={`${playing && g.turn === i ? 'on' : ''}${s.left ? ' left' : ''}`}>
            {av(i)}<b>{s.name}{i === me ? ' (sen)' : ''}</b><span>{g.scores[i]} puan</span>
          </li>
        ))}
      </ul>

      <section className={`ad-board${myTurn ? ' me' : ''}`}>
        <p className="ad-meta">Tur {g.round + 1} / {g.rounds} · Tür: <b>{g.cat}</b> · Kalan hak: <b>{g.maxWrong - g.wrong}</b></p>
        <Gallows wrong={g.wrong} />
        <div className="ad-word" role="img" aria-label={g.mask.map((c) => c || 'boş').join(' ')}>
          {g.mask.map((c, i) => <span key={i} className={c ? 'f' : ''}>{c || ''}</span>)}
        </div>
        {playing && <h2 className="ad-turn">{myTurn ? 'Sıra sende' : `${names[g.turn] ?? ''} tahmin ediyor`}</h2>}
        {g.note && <p className="ad-note" role="status">{g.note}</p>}
        {roundDone && (
          <div className="ad-round" role="status">
            <p>{g.state === 'won' ? `${names[g.solver]} kelimeyi tamamladı!` : 'Haklar bitti.'} Kelime: <b>{g.word}</b></p>
            {seated && <button type="button" className="btn primary" disabled={busy} onClick={() => send('adnext')} aria-label="Sonraki tura geç">Sonraki tur</button>}
          </div>
        )}
        {timedOut && !myTurn && seated && (
          <button type="button" className="btn sm" disabled={busy} onClick={() => send('adskip')} aria-label="Süresi dolan oyuncunun sırasını atla">Süre doldu, sırayı atla</button>
        )}
      </section>

      {playing && (
        <div className="ad-keys" role="group" aria-label="Türkçe harf tuş takımı">
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
        <section className="ad-over" role="status">
          <h2>{over.text}</h2>
          <ol>
            {over.ranking.map((i) => (
              <li key={i} className={over.winners.includes(i) ? 'win' : ''}><b>{names[i]}</b><span>{over.scores[i]} puan</span></li>
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
