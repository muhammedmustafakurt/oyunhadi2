'use client';
import { useEffect, useRef, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { LOCATIONS, DURATION_MS } from '@/lib/spyfall';
import { PALETTE } from '@/lib/emlak';

const fmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const CONFETTI = ['🎉', '✨', '🏆', '🎊', '⭐'];
const RING = 2 * Math.PI * 54;

function Avatar({ i, name, size }) {
  return <i className={`sf-av${size ? ` ${size}` : ''}`} style={{ background: PALETTE[i % PALETTE.length] }}>{(name || '?').trim().charAt(0).toUpperCase()}</i>;
}

// Masada casus oyunu: herkes kendi telefonunda gizli kartını görür.
export default function SpyfallOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'spyfall' });
  const { room, err, busy, send } = ui;
  const [show, setShow] = useState(false); // kart yanındakinin görmemesi için varsayılan kapalı
  const [struck, setStruck] = useState(() => new Set()); // listeden elediğim mekânlar
  const [pick, setPick] = useState(null); // casusun tahmin için seçtiği mekân
  const [sure, setSure] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const sentTimeout = useRef(false);
  const g = room?.game;

  // Sunucu kalan süreyi gönderir; yerel saat farkından etkilenmemek için bitiş anını burada hesaplarız.
  useEffect(() => {
    if (g) { setDeadline(Date.now() + g.leftMs); setNow(Date.now()); sentTimeout.current = false; }
    if (!g || g.over) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [room?.version]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = g && !g.over ? Math.max(0, deadline - now) : 0;
  const me = room?.me ?? -1;
  const seated = me >= 0 && !room?.seats[me]?.left;
  useEffect(() => {
    if (g && !g.over && seated && deadline && left === 0 && !sentTimeout.current) {
      sentTimeout.current = true;
      send('timeout');
    }
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  // Yeni turda kişisel durumlar (elenen mekânlar, kart, tahmin seçimi) sıfırlanır.
  useEffect(() => {
    setStruck(new Set()); setShow(false); setPick(null); setSure(false);
  }, [g?.startedAt]);

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={8} min={3}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const names = room.seats.map((s) => s.name);
  const active = room.seats.map((s, i) => (s.left ? -1 : i)).filter((i) => i >= 0);
  const over = g.over;
  // Kazanan ya da kaybeden taraf: kaybeden oyuncunun ekranında kupa çıkmaz.
  const outcome = over && seated && g.me && over.winner !== 'none' ? ((over.winner === 'spy') === g.me.spy ? 'win' : 'lose') : null;
  const vote = g.vote;
  const canVote = seated && vote && me !== vote.target && vote.votes[me] === undefined;
  const voters = vote ? active.filter((i) => i !== vote.target) : [];
  const canAccuse = seated && !over && !vote && left > 0 && !g.accused.includes(me);
  const spyGuessing = seated && g.me?.spy && !over && !vote && left > 0;
  const frac = over ? 0 : Math.min(1, left / DURATION_MS);
  const urgency = left < 60000 ? 'low' : left < 180000 ? 'mid' : '';

  return (
    <div className="sf">
      {!seated && <p className="mono-where">Tur başladı; izleyici olarak takip ediyorsunuz.</p>}

      {!over && (
        <div className={`sf-clock ${urgency}`} role="timer" aria-label="Kalan süre">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle className="track" cx="60" cy="60" r="54" />
            <circle className="bar" cx="60" cy="60" r="54" strokeDasharray={RING} strokeDashoffset={RING * (1 - frac)} />
          </svg>
          <span>{fmt(left)}</span>
        </div>
      )}
      {g.note && !over && <p className="sf-note">{g.note}</p>}

      {seated && g.me && (
        <section className="sf-deck">
          <button
            className={`sf-flip${show ? ' open' : ''}${g.me.spy ? ' spy' : ''}`}
            onClick={() => setShow((v) => !v)}
            aria-pressed={show}
            aria-label={show ? 'Kartı gizle' : 'Kartı göster'}
          >
            <span className="face front">
              <b>GİZLİ DOSYA</b>
              <i aria-hidden="true">🕵️</i>
              <small>Kartını görmek için dokun</small>
            </span>
            <span className="face back">
              {g.me.spy ? (
                <>
                  <i aria-hidden="true">🕵️</i>
                  <b>CASUSSUN</b>
                  <small>Mekânı bilmiyorsun. Sorulardan anla ve aşağıdan tahmin et.</small>
                </>
              ) : (
                <>
                  <i aria-hidden="true">{LOCATIONS[g.me.loc].icon}</i>
                  <b>{LOCATIONS[g.me.loc].name}</b>
                  <span className="role">{g.me.role}</span>
                </>
              )}
            </span>
          </button>
          <p className="sf-help">{show ? 'Kartı tekrar dokunarak gizle.' : 'Kartı yalnızca sen görürsün.'}</p>
        </section>
      )}

      {over && (
        <section className={`sf-over ${outcome === 'lose' ? 'lose' : outcome === 'win' ? 'win' : over.winner}`} role="status">
          {outcome !== 'lose' && <div className="sf-confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.3}s`, animationDuration: `${2.4 + (i % 4) * 0.4}s` }}>{CONFETTI[i % CONFETTI.length]}</span>
            ))}
          </div>}
          <div className="sf-trophy" aria-hidden="true">{outcome === 'lose' ? '😔' : outcome === 'win' ? '🏆' : over.winner === 'players' ? '🏆' : over.winner === 'spy' ? '🕵️' : '🤝'}</div>
          <p className="sf-verdict">{over.text}</p>
          <div className="sf-reveal">
            <div><Avatar i={over.spy} name={names[over.spy]} size="lg" /><span>Casus</span><b>{names[over.spy]}</b></div>
            <div><i className="sf-pin" aria-hidden="true">{LOCATIONS[over.loc].icon}</i><span>Mekân</span><b>{LOCATIONS[over.loc].name}</b></div>
          </div>
          <button className="btn primary" disabled={busy} onClick={() => { setShow(false); setPick(null); send('reset'); }}>Yeni tur (lobiye dön)</button>
        </section>
      )}

      <section className="sf-players">
        <h2>Oyuncular</h2>
        <ul>
          {room.seats.map((s, i) => (
            <li key={i} className={`${s.left ? 'gone' : ''}${i === me ? ' me' : ''}${vote?.target === i ? ' target' : ''}`}>
              <Avatar i={i} name={s.name} />
              <span className="nm">
                <b>{s.name}{i === me ? ' (sen)' : ''}</b>
                {!over && i === g.first && <em>ilk soran</em>}
                {!over && g.accused.includes(i) && <em>suçlama hakkını kullandı</em>}
                {over && g.roles && <em>{i === over.spy ? 'casus' : g.roles[i]}</em>}
              </span>
              {over?.points && <b className="sf-pts" style={{ marginLeft: 'auto' }} aria-label={`${over.points[i] ?? 0} puan`}>+{over.points[i] ?? 0}</b>}
              {canAccuse && i !== me && !s.left && (
                <button className="btn sm sf-accuse" disabled={busy} onClick={() => send('accuse', { target: i })}>Suçla</button>
              )}
            </li>
          ))}
        </ul>
        {canAccuse && <p className="sf-help">Herkes turda bir kez birini suçlayabilir. Suçlanan dışındaki herkes &quot;evet&quot; derse sonuç belli olur; tek bir &quot;hayır&quot; suçlamayı bitirir.</p>}
      </section>

      {vote && !over && (
        <section className="sf-vote" role="alert">
          <p className="sf-vote-title"><b>{names[vote.by]}</b>, <b>{names[vote.target]}</b> kişisini casus olmakla suçluyor</p>
          <div className="sf-dots" aria-label={`Evet diyenler: ${Object.keys(vote.votes).length}/${voters.length}`}>
            {voters.map((i) => <i key={i} className={vote.votes[i] ? 'yes' : ''} title={names[i]} />)}
          </div>
          {canVote ? (
            <div className="gm-row">
              <button className="btn primary" disabled={busy} onClick={() => send('vote', { yes: true })}>Evet, casus o</button>
              <button className="btn" disabled={busy} onClick={() => send('vote', { yes: false })}>Hayır</button>
            </div>
          ) : (
            <p className="sf-help">{me === vote.target ? 'Suçlanan siz olduğunuz için oy veremezsiniz.' : seated ? 'Oyunuzu verdiniz, diğerleri bekleniyor…' : ''}</p>
          )}
        </section>
      )}

      <section className="sf-locs">
        <h2>{spyGuessing ? 'Mekânı tahmin et' : 'Mekânlar'}</h2>
        {seated && !g.me?.spy && !over && <p className="sf-help">Elediğin mekânlara dokunarak üstünü çizebilirsin. Bu sadece sende görünür.</p>}
        <ul>
          {LOCATIONS.map((l, i) => (
            <li key={l.name}>
              <button
                className={`sf-loc${struck.has(i) && !spyGuessing ? ' off' : ''}${pick === i ? ' pick' : ''}${over && over.loc === i ? ' answer' : ''}`}
                onClick={() => {
                  if (spyGuessing) setPick(i);
                  else setStruck((p) => { const n = new Set(p); if (n.has(i)) n.delete(i); else n.add(i); return n; });
                }}
              >
                <i aria-hidden="true">{l.icon}</i>
                <span>{l.name}</span>
              </button>
            </li>
          ))}
        </ul>
        {spyGuessing && pick !== null && (
          <div className="sf-guess">
            <p>Mekân <b>{LOCATIONS[pick].icon} {LOCATIONS[pick].name}</b> mı? Yanlışsan tur biter ve kaybedersin.</p>
            <div className="gm-row">
              <button className="btn primary" disabled={busy} onClick={() => { send('guess', { loc: pick }); setPick(null); }}>Evet, tahmin et</button>
              <button className="btn" onClick={() => setPick(null)}>Vazgeç</button>
            </div>
          </div>
        )}
      </section>

      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && !over && (
        sure
          ? <button className="btn sm danger" disabled={busy} onClick={() => { setSure(false); send('leave'); }}>Evet, masadan ayrıl</button>
          : <button className="btn sm" onClick={() => setSure(true)}>Masadan ayrıl</button>
      )}
    </div>
  );
}
