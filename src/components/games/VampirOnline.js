'use client';
import { useEffect, useRef, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { ROLE } from '@/lib/vampir';
import { PALETTE } from '@/lib/emlak';

function Avatar({ i, name }) {
  return <i className="sf-av" style={{ background: PALETTE[i % PALETTE.length] }}>{(name || '?').trim().charAt(0).toUpperCase()}</i>;
}

// Masada Vampir Köylü: herkes kendi telefonunda gizli rolünü ve gece seçimini görür.
export default function VampirOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'vampir' });
  const { room, err, busy, send } = ui;
  const [show, setShow] = useState(false); // rol kartı yanındakinin görmemesi için varsayılan kapalı
  const [sure, setSure] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const sent = useRef(false);
  const g = room?.game;
  const running = !!g && !g.over;
  const seatedNow = !!room && room.me >= 0 && !room.seats[room.me]?.left;

  // Sunucu kalan süreyi gönderir; yerel saat farkından etkilenmemek için bitiş anını burada hesaplarız.
  useEffect(() => {
    if (g && g.leftMs != null) { setDeadline(Date.now() + g.leftMs); setNow(Date.now()); sent.current = false; }
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [room?.version]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = running ? Math.max(0, deadline - now) : 0;
  // Süre dolunca (gece ya da gündüz) zaman aşımı eylemi bir kez gönderilir; meşgulken gönderilemezse sonra denenir.
  useEffect(() => {
    if (running && seatedNow && deadline && left === 0 && !busy && !sent.current) {
      sent.current = true;
      send('timeout');
    }
  }, [left, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={10} min={5}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const names = room.seats.map((s) => s.name);
  const seated = room.me >= 0 && !room.seats[room.me]?.left;
  const me = seated ? g.me : null;
  const role = me?.role;
  const over = g.over;
  const alive = me ? g.alive[room.me] : false;
  const night = g.phase === 'night';
  const day = g.phase === 'day';
  const aliveIdx = g.alive.map((a, i) => (a ? i : -1)).filter((i) => i >= 0);
  const mates = me?.mates ?? [];
  const blocked = me?.blocked ?? null; // doktor: geçen gece korunan kişi bu gece seçilemez

  // Gece: kimler hedef olabilir?
  const nightTargets = !alive || !night ? [] : aliveIdx.filter((i) =>
    role === 'vampir' ? !(g.roles[i] === 'vampir' || mates.includes(i) || i === room.me)
      : role === 'kahin' ? i !== room.me
      : role === 'doktor' ? i !== blocked : false);
  const nightType = role === 'vampir' ? 'kill' : role === 'doktor' ? 'protect' : role === 'kahin' ? 'inspect' : null;
  const prompt = { vampir: 'Bu gece kimi öldüreceksiniz?', doktor: 'Bu gece kimi koruyacaksın?', kahin: 'Bu gece kime bakacaksın?' }[role];
  const voted = new Set(g.voted);

  return (
    <div className={`vp ${over ? 'over' : g.phase}`}>
      {!seated && <p className="mono-where">Tur başladı; izleyici olarak takip ediyorsunuz.</p>}

      <header className="vp-phase" role="status">
        <span className="ico" aria-hidden="true">{over ? '🏁' : night ? '🌙' : '☀️'}</span>
        <b>{over ? 'Tur bitti' : night ? `Gece ${g.day}` : `Gündüz ${g.day}`}</b>
        <small>{over ? '' : night ? 'Köy uyuyor, gizli işler dönüyor.' : 'Tartışın ve oy verin.'}</small>
        {running && deadline > 0 && <small>Kalan süre: {Math.ceil(left / 1000)} sn</small>}
      </header>

      {over && (
        <section className={`vp-over ${over.winner}`} role="status">
          <div className="vp-trophy" aria-hidden="true">{over.winner === 'village' ? '🏆' : over.winner === 'vampires' ? '🧛' : '🤝'}</div>
          <p>{over.text}</p>
          <button className="btn primary" disabled={busy} onClick={() => { setShow(false); send('reset'); }}>Yeni tur (lobiye dön)</button>
        </section>
      )}

      {me && (
        <section className="sf-deck">
          <button className={`sf-flip vpcard${show ? ' open' : ''}${role === 'vampir' ? ' spy' : ''}`} onClick={() => setShow((v) => !v)} aria-pressed={show} aria-label={show ? 'Rolü gizle' : 'Rolü göster'}>
            <span className="face front">
              <b>GİZLİ ROL</b>
              <i aria-hidden="true">🎭</i>
              <small>Rolünü görmek için dokun</small>
            </span>
            <span className="face back">
              <i aria-hidden="true">{ROLE[role].icon}</i>
              <b>{ROLE[role].name}</b>
              <small>{ROLE[role].info}</small>
              {role === 'vampir' && mates.length > 0 && <span className="role">Ortakların: {mates.map((i) => names[i]).join(', ')}</span>}
            </span>
          </button>
          <p className="sf-help">{show ? 'Tekrar dokunarak gizle.' : 'Rolünü yalnızca sen görürsün.'}</p>
        </section>
      )}

      {!over && me && !alive && <p className="vp-dead">Öldün. Oyunu izleyebilirsin ama konuşmamalı ve ipucu vermemelisin.</p>}

      {!over && night && alive && nightType && (
        <section className="vp-act">
          <h2>{prompt}</h2>
          <div className="vp-targets">
            {nightTargets.map((i) => (
              <button key={i} className={`vp-t${g.choice === i ? ' on' : ''}`} disabled={busy} onClick={() => send(nightType, { target: i })}>
                <Avatar i={i} name={names[i]} />
                <span>{names[i]}{i === room.me ? ' (sen)' : ''}</span>
                {role === 'vampir' && Object.values(g.vampChoices || {}).includes(i) && <em>🩸</em>}
              </button>
            ))}
          </div>
          {role === 'vampir' && g.vampChoices && Object.keys(g.vampChoices).length > 0 && (
            <p className="sf-help">Seçenler: {Object.entries(g.vampChoices).map(([s, t]) => `${names[s]} → ${names[t]}`).join(', ')}</p>
          )}
          <p className="sf-help">{g.choice !== null ? 'Seçimin kaydedildi. Değiştirebilirsin; herkes seçince sabah olur.' : 'Seçimini yap, herkes seçince sabah olur.'}</p>
          {role === 'doktor' && blocked !== null && <p className="sf-help">Geçen gece koruduğun kişi bu gece seçilemez.</p>}
          {role === 'kahin' && g.seer && g.seer.length > 0 && (
            <ul className="vp-seer">
              {g.seer.map((s, i) => <li key={i}>Gece {s.day}: <b>{names[s.target]}</b> {s.vamp ? '🧛 vampir!' : '🙂 vampir değil'}</li>)}
            </ul>
          )}
        </section>
      )}

      {!over && night && alive && role === 'koylu' && (
        <p className="vp-sleep">😴 Gözlerini kapat. Sabah olunca haber verilecek.</p>
      )}

      {!over && day && alive && (
        <section className="vp-act">
          <h2>Kim elensin?</h2>
          <div className="vp-targets">
            {aliveIdx.filter((i) => i !== room.me).map((i) => (
              <button key={i} className={`vp-t${g.myVote === i ? ' on' : ''}`} disabled={busy} onClick={() => send('vote', { target: i })}>
                <Avatar i={i} name={names[i]} />
                <span>{names[i]}</span>
              </button>
            ))}
            <button className={`vp-t skip${g.myVote === -1 ? ' on' : ''}`} disabled={busy} onClick={() => send('vote', { target: -1 })}>
              <i className="sf-av" style={{ background: '#8a90b4' }}>–</i><span>Oy vermiyorum</span>
            </button>
          </div>
          <p className="sf-help">{g.voted.length}/{aliveIdx.length} kişi oy verdi. Oy en çok alan elenir, eşitse kimse elenmez. Herkes oy verince sonuç belli olur.</p>
        </section>
      )}

      <section className="sf-players">
        <h2>Köy</h2>
        <ul>
          {room.seats.map((s, i) => {
            const dead = !g.alive[i];
            return (
              <li key={i} className={`${dead ? 'gone' : ''}${i === room.me ? ' me' : ''}`}>
                <Avatar i={i} name={s.name} />
                <span className="nm">
                  <b>{s.name}{i === room.me ? ' (sen)' : ''}</b>
                  {g.roles[i] && <em>{ROLE[g.roles[i]].icon} {ROLE[g.roles[i]].name}{dead ? ' (öldü)' : ''}</em>}
                  {!g.roles[i] && mates.includes(i) && <em>🧛 ortağın</em>}
                  {day && !dead && voted.has(i) && <em>✓ oy verdi</em>}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {g.log.length > 0 && (
        <ul className="mono-log" aria-label="Köyde olanlar">
          {[...g.log].reverse().map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      )}

      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && !over && (
        sure
          ? <button className="btn sm danger" disabled={busy} onClick={() => { setSure(false); send('leave'); }}>Evet, masadan ayrıl (oyundan çıkarım)</button>
          : <button className="btn sm" onClick={() => setSure(true)}>Masadan ayrıl</button>
      )}
    </div>
  );
}
