'use client';
import { useEffect, useRef, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { PALETTE } from '@/lib/emlak';
import { TURN_MS } from '@/lib/kimim';
import KimimArt from './KimimArt';

const MEDAL = ['🥇', '🥈', '🥉'];
const CONFETTI = ['🎉', '✨', '🏆', '🎊', '⭐'];
const HIST = { ok: 'buldu', no: 'yanlış bildi', skip: 'pas geçti', time: 'süresi doldu' };
// Kart türü rengi; türün çizimi KimimArt dosyasında.
const CAT = {
  'Türk ünlü': '#d6336c', 'Tarihten': '#a8681a', 'Bilim ve sanat': '#7048e8', 'Müzik': '#e8590c', 'Sporcu': '#1f9d6b',
  'Çizgi film': '#e08a00', 'Film ve dizi': '#2438e8', 'Hayvan': '#0c8f9c', 'Meslek': '#5b6080',
};
const catOf = (c) => CAT[c] || '#5b6080';

// Masada Ben Kimim?: herkes başkalarının kartını görür, kendi kartını sorularla bulmaya çalışır.
export default function KimimOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'kimim' });
  const { room, err, busy, send } = ui;
  const [sure, setSure] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const sent = useRef(false);
  const g = room?.game;
  const running = !!g && !g.over;

  // Sunucu kalan süreyi gönderir; yerel saat farkından etkilenmemek için bitiş anını burada hesaplarız.
  useEffect(() => {
    if (g) { setDeadline(Date.now() + g.leftMs); setNow(Date.now()); sent.current = false; }
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [room?.version]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = running ? Math.max(0, deadline - now) : 0;
  const me = room?.me ?? -1;
  const seated = me >= 0 && !room?.seats[me]?.left;
  useEffect(() => {
    if (running && seated && deadline && left === 0 && !sent.current) {
      sent.current = true;
      send('ktimeout');
    }
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={10} min={3}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const names = room.seats.map((s) => s.name);
  const over = g.over;
  const myTurn = seated && g.turn === me;
  const mySolved = me >= 0 && g.solved.includes(me);
  const frac = running ? Math.min(1, left / TURN_MS) : 0;
  const urgency = left < 8000 ? 'low' : left < 18000 ? 'mid' : '';
  const rank = (i) => g.solved.indexOf(i);
  const av = (i) => <i className="av" style={{ background: PALETTE[i % PALETTE.length] }}>{i + 1}</i>;

  // Podyum: bulanların ilk üçü ortada en yüksek olacak şekilde 2-1-3 dizilir.
  const top = over ? over.ranking.slice(0, Math.min(3, g.solved.length)) : [];
  const podium = [1, 0, 2].filter((k) => k < top.length);
  const rest = over ? over.ranking.slice(top.length) : [];

  return (
    <div className="km">
      {!seated && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}

      {over ? (
        <section className="km-over" role="status">
          <div className="km-confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.3}s`, animationDuration: `${2.4 + (i % 4) * 0.4}s` }}>{CONFETTI[i % CONFETTI.length]}</span>
            ))}
          </div>
          <p className="km-win">{over.text}</p>
          {top.length > 0 && (
            <ol className="km-podium">
              {podium.map((k) => (
                <li key={k} className={`p${k + 1}`}>
                  {av(top[k])}
                  <b>{names[top[k]]}</b>
                  <em>{g.cards[top[k]].n}</em>
                  <div className="bar"><span>{MEDAL[k]}</span></div>
                </li>
              ))}
            </ol>
          )}
          {rest.length > 0 && (
            <ul className="km-rest">
              {rest.map((i) => (
                <li key={i}>{av(i)}<b>{names[i]}</b><em>{room.seats[i].left ? 'ayrıldı' : `bulamadı: ${g.cards[i].n}`}</em></li>
              ))}
            </ul>
          )}
          <button className="btn primary" disabled={busy} onClick={() => send('reset')}>Yeni oyun (lobiye dön)</button>
        </section>
      ) : (
        <section className={`km-stage${myTurn ? ' me' : ''}`} style={{ '--pc': PALETTE[g.turn % PALETTE.length] }}>
          <div className="km-head">
            <div className={`km-clock ${urgency}`} role="timer" aria-label="Kalan süre">
              <b>{Math.ceil(left / 1000)}</b><small>sn</small>
            </div>
            <div className="txt">
              <small>Tur {Math.min(g.turnNo + 1, g.maxTurns)} / {g.maxTurns}</small>
              <h2>{myTurn ? 'Sıra sende' : `${names[g.turn]} tahmin ediyor`}</h2>
              <p>
                {myTurn
                  ? 'Diğerlerine evet/hayır diye sor. Bildiğini düşünürsen tahminini yüksek sesle söyle; onlar doğru ya da yanlış desin.'
                  : seated
                    ? <>Bu kartı sen görüyorsun: <b>{g.cards[g.turn].n}</b>. Sorulara evet/hayır diye yanıt ver, tahmin gelince onayla.</>
                    : <>Kart: <b>{g.cards[g.turn].n}</b></>}
              </p>
            </div>
          </div>
          <div className={`km-drain ${urgency}`} aria-hidden="true"><i style={{ width: `${frac * 100}%` }} /></div>
          {myTurn && (
            <button className="btn km-skip" disabled={busy} onClick={() => send('kskip')}>Pas geç, sırayı ver</button>
          )}
          {!myTurn && seated && (
            <div className="km-btns">
              <button className="btn no" disabled={busy} onClick={() => send('kno')} aria-label="Tahmin yanlış, sıra sonrakine geçsin">Tahmin yanlış</button>
              <button className="btn ok" disabled={busy} onClick={() => send('kok')} aria-label="Tahmin doğru, kart bulundu">Tahmin doğru</button>
            </div>
          )}
          {g.note && <p className="km-note">{g.note}</p>}
        </section>
      )}

      <ul className="km-grid">
        {g.cards.map((c, i) => {
          const done = g.solved.includes(i);
          const self = i === me;
          const hidden = c.n === null;
          const color = catOf(c.c);
          return (
            <li
              key={i}
              className={`km-card${!over && g.turn === i ? ' on' : ''}${done ? ' done' : ''}${self && hidden ? ' self' : ''}${room.seats[i].left ? ' left' : ''}`}
              style={{ '--cc': color, '--tilt': `${i % 2 ? 1.2 : -1.2}deg` }}
            >
              <div className="top"><small>{c.c}</small><KimimArt cat={c.c} /></div>
              <div className="face" key={hidden ? 'h' : c.n}>
                {hidden ? (
                  <>
                    <b className="q" aria-hidden="true">?</b>
                    <span>{self ? 'Senin kartın' : 'Gizli'}</span>
                  </>
                ) : (
                  <b className="nm">{c.n}</b>
                )}
              </div>
              <div className="foot">
                {av(i)}
                <span>{names[i]}{self ? ' (sen)' : ''}</span>
                {done && <span className="medal" aria-label={`${rank(i) + 1}. oldu`}>{MEDAL[rank(i)] || `${rank(i) + 1}.`}</span>}
              </div>
              {done && <div className="stamp" aria-hidden="true">Buldu!</div>}
            </li>
          );
        })}
      </ul>
      {seated && !over && (
        <p className="km-hint">{mySolved ? 'Kartını buldun! Sıra başkalarındayken onay vermeye devam et.' : 'Kendi kartının adı gösterilmez, yalnızca türünü görürsün.'}</p>
      )}

      {g.history.length > 0 && (
        <section className="km-hist">
          <h2>Son hamleler</h2>
          <ul>
            {[...g.history].reverse().map((h, i) => (
              <li key={i} className={h.r}>{names[h.seat]} {HIST[h.r]}{h.card ? `: ${h.card}` : ''}</li>
            ))}
          </ul>
        </section>
      )}

      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && !over && (
        sure
          ? <button className="btn sm danger" disabled={busy} onClick={() => { setSure(false); send('leave'); }}>Evet, masadan ayrıl</button>
          : <button className="btn sm" onClick={() => setSure(true)}>Masadan ayrıl</button>
      )}
    </div>
  );
}
