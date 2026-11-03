'use client';
import { useEffect, useRef, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { PALETTE } from '@/lib/emlak';

// Bu sabitler lib/bil.js ile aynıdır; sorular ve doğru cevaplar tarayıcıya inmesin diye oradan içe aktarılmaz.
const ASK_MS = 15 * 1000;
const REVEAL_MS = 5500;
const LETTERS = ['A', 'B', 'C', 'D'];
const MEDAL = ['🥇', '🥈', '🥉'];
const CONFETTI = ['🎉', '✨', '🏆', '🎊', '⭐'];
const CAT = {
  'Coğrafya': '🌍', 'Tarih': '🏛️', 'Bilim': '🔬', 'Spor': '⚽',
  'Kültür ve sanat': '🎨', 'Yemek': '🍽️', 'Genel kültür': '💡',
  'Mekân Sınavı': '🎯', 'Hayvanlar': '🐾', 'Edebiyat': '📚', 'Müzik': '🎵', 'Film ve dizi': '🎬', 'Teknoloji': '💻',
};

// Masada Bil Bakalım: herkes aynı soruyu aynı anda cevaplar, hızlı bilen daha çok puan alır.
// event verilirse Mekân Sınavı (mekân sahibinin soruları) oynanır; sunucu etkinlik açık değilse odayı vermez.
export default function BilOnline({ cafe, masa, event = /** @type {string | undefined} */ (undefined) }) {
  const ui = useRoom({ cafe, masa, game: 'bil', event, pollMs: 1000 });
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
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [room?.version]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = running ? Math.max(0, deadline - now) : 0;
  const me = room?.me ?? -1;
  const seated = me >= 0 && !room?.seats[me]?.left;
  useEffect(() => {
    if (running && seated && deadline && left === 0 && !sent.current) {
      sent.current = true;
      send('btimeout');
    }
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={10} min={2}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const names = room.seats.map((s) => s.name);
  const over = g.over;
  const asking = g.phase === 'ask';
  const shown = g.phase === 'reveal';
  const frac = Math.min(1, left / (asking ? ASK_MS : REVEAL_MS));
  const urgency = asking ? (left < 4000 ? 'low' : left < 8000 ? 'mid' : '') : 'off';
  const av = (i) => <i className="av" style={{ background: PALETTE[i % PALETTE.length] }}>{i + 1}</i>;
  const max = Math.max(1, ...g.scores);
  const lead = Math.max(...g.scores);
  const activeSeats = [...names.keys()].filter((i) => !room.seats[i].left);
  const doneCount = activeSeats.filter((i) => g.answered[i]).length;
  const myGain = shown && me >= 0 ? g.gains[me] : 0;
  const top = over ? over.ranking.filter((i) => !room.seats[i].left).slice(0, 3) : [];
  const podium = [1, 0, 2].filter((k) => k < top.length);
  const rest = over ? over.ranking.filter((i) => !top.includes(i)) : [];

  const lanes = (
    <ul className="bb-track" aria-label="Puan durumu">
      {names.map((n, i) => (
        <li key={i} className={room.seats[i].left ? 'left' : ''}>
          {av(i)}
          <div className="lane">
            <div className="who">
              <span>{n}{i === me ? ' (sen)' : ''}</span>
              {g.streak[i] >= 2 && <small aria-label={`${g.streak[i]} seri`}>🔥{g.streak[i]}</small>}
              {g.scores[i] === lead && lead > 0 && <small aria-label="önde">👑</small>}
            </div>
            <div className="bar"><i style={{ width: `${Math.max(3, (g.scores[i] / max) * 100)}%`, background: PALETTE[i % PALETTE.length] }} /></div>
          </div>
          <b>{g.scores[i]}</b>
          {shown && g.gains[i] > 0 && <em>+{g.gains[i]}</em>}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="bb">
      {!seated && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}

      {over ? (
        <>
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
                    <em>{g.scores[top[k]]} puan</em>
                    <div className="bar"><span>{MEDAL[k]}</span></div>
                  </li>
                ))}
              </ol>
            )}
            {rest.length > 0 && (
              <ul className="km-rest">
                {rest.map((i) => (
                  <li key={i}>{av(i)}<b>{names[i]}</b><em>{room.seats[i].left ? 'ayrıldı' : `${g.scores[i]} puan`}</em></li>
                ))}
              </ul>
            )}
            <button className="btn primary" disabled={busy} onClick={() => send('reset')}>Yeni oyun (lobiye dön)</button>
          </section>
        </>
      ) : (
        <>
          <div className="bb-prog" aria-label={g.extra > 0 && g.turnNo >= g.total - g.extra ? `Uzatma sorusu ${g.turnNo + 1 - (g.total - g.extra)}` : `Soru ${g.turnNo + 1} / ${g.total}`}>
            <ol>
              {Array.from({ length: g.total }, (_, i) => (
                <li key={i} className={i < g.turnNo ? 'done' : i === g.turnNo ? 'now' : ''} />
              ))}
            </ol>
            {g.extra > 0 && g.turnNo >= g.total - g.extra && <span className="cat"><b>Uzatma sorusu</b></span>}
            <span className="cat"><i aria-hidden="true">{CAT[g.cat] || '❓'}</i>{g.cat}</span>
          </div>

          <section className={`bb-q ${urgency}`}>
            <div className="clock" role="timer" aria-label="Kalan süre">
              <div className="fill" style={{ transform: `scaleX(${frac})` }} />
              <span>{asking ? Math.ceil(left / 1000) : '✓'}</span>
            </div>
            <h2>{g.q}</h2>
            {asking && (
              <ul className="who-in" aria-label="Cevap verenler">
                {activeSeats.map((i) => (
                  <li key={i} className={g.answered[i] ? 'in' : ''} title={names[i]}>{av(i)}</li>
                ))}
              </ul>
            )}
            {shown && (
              <p className={`verdict ${myGain > 0 ? 'ok' : 'no'}`} role="status">
                {me < 0 ? 'Doğru cevap açıldı' : myGain > 0 ? <>Doğru! <b>+{myGain}</b>{g.streak[me] >= 2 && ` · 🔥 ${g.streak[me]} seri`}</> : g.picks[me] === null ? 'Cevap vermedin' : 'Yanlış cevap'}
              </p>
            )}
          </section>

          <div className="bb-opts" role="group" aria-label="Seçenekler">
            {g.opts.map((t, i) => {
              const mine = g.mine === i;
              const cls = shown ? (i === g.ans ? ' right' : mine ? ' wrong' : ' dim') : mine ? ' mine' : g.mine !== null ? ' dim' : '';
              return (
                <button
                  key={i} type="button" className={`bb-opt o${i}${cls}`}
                  disabled={!asking || !seated || g.mine !== null || busy}
                  onClick={() => send('bpick', { choice: i })}
                >
                  <span className="ltr">{shown && i === g.ans ? '✓' : shown && mine ? '✗' : LETTERS[i]}</span>
                  <span className="txt">{t}</span>
                  {shown && (
                    <span className="picked">
                      {g.picks.map((p, s) => (p === i ? <span key={s}>{av(s)}</span> : null))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="bb-status">
            {asking
              ? (!seated ? `${doneCount} / ${activeSeats.length} kişi cevapladı` : g.mine === null ? 'Hızlı cevapla, erken bilen daha çok puan alır.' : `Cevabın alındı. Diğerleri bekleniyor (${doneCount} / ${activeSeats.length}).`)
              : g.turnNo + 1 < g.total ? 'Sıradaki soru geliyor…' : 'Sonuçlar hazırlanıyor…'}
          </p>

          {lanes}
        </>
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
