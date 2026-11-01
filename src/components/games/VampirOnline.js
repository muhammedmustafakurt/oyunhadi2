'use client';
import { useEffect, useRef, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { ROLE } from '@/lib/vampir';
import { PALETTE } from '@/lib/emlak';
import Icon from './Icon';

const ROLE_ICON = { vampir: 'bat', koylu: 'home', doktor: 'stethoscope', kahin: 'crystal' };
// Köy meydanı: oyuncular çember üzerinde oturur (0. koltuk tepede, saat yönünde).
const seatXY = (i, n) => { const a = ((-90 + (360 / n) * i) * Math.PI) / 180; return [50 + 38 * Math.cos(a), 50 + 38 * Math.sin(a)]; };

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

  const n = room.seats.length;
  const pickable = (i) => !over && alive && (night ? nightTargets.includes(i) : day ? i !== room.me && g.alive[i] : false);
  const choose = (i) => { if (night) send(nightType, { target: i }); else send('vote', { target: i }); };
  const chosen = night ? g.choice : day ? g.myVote : null;
  const [lx, ly] = chosen !== null && chosen !== undefined && chosen >= 0 ? seatXY(chosen, n) : [50, 50];
  const vampTargets = role === 'vampir' ? Object.values(g.vampChoices || {}) : [];

  return (
    <div className={`vp ${over ? 'over' : g.phase}`}>
      {!seated && <p className="mono-where">Tur başladı; izleyici olarak takip ediyorsunuz.</p>}

      <header className="vp-top" role="status">
        <div>
          <b>{over ? 'Tur bitti' : night ? `Gece ${g.day}` : `Gündüz ${g.day}`}</b>
          <small>{over ? '' : night ? 'Köy uyuyor, gizli işler dönüyor.' : 'Tartışın ve oy verin.'}</small>
        </div>
        {me && (
          <button className={`vp-chip${role === 'vampir' ? ' vamp' : ''}`} onClick={() => setShow((v) => !v)} aria-pressed={show} aria-label={show ? 'Rolü gizle' : 'Rolü göster'}>
            <span className="ci"><Icon name={show ? ROLE_ICON[role] : 'mask'} /></span>
            {show ? ROLE[role].name : 'Rolüm'}
          </button>
        )}
      </header>

      {over && (
        <section className={`vp-over ${over.winner}`} role="status">
          <div className="vp-trophy" aria-hidden="true"><Icon name={over.winner === 'village' ? 'trophy' : over.winner === 'vampires' ? 'bat' : 'scale'} /></div>
          <p>{over.text}</p>
          <button className="btn primary" disabled={busy} onClick={() => { setShow(false); send('reset'); }}>Yeni tur (lobiye dön)</button>
        </section>
      )}

      {me && show && (
        <section className="vp-role" role="note">
          <span className="sf-badge"><Icon name={ROLE_ICON[role]} /></span>
          <div>
            <b>{ROLE[role].name}</b>
            <small>{ROLE[role].info}</small>
            {role === 'vampir' && mates.length > 0 && <small className="mates">Ortakların: {mates.map((i) => names[i]).join(', ')}</small>}
          </div>
        </section>
      )}

      {!over && me && !alive && <p className="vp-dead">Öldün. Oyunu izleyebilirsin ama konuşmamalı ve ipucu vermemelisin.</p>}

      <div className="vp-ring">
        <svg className="vp-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {chosen !== null && chosen !== undefined && chosen >= 0 && <line x1="50" y1="50" x2={lx} y2={ly} />}
        </svg>
        <div className="vp-core">
          <Icon name={over ? 'flag' : night ? 'moonstars' : 'sun'} />
          <span>{over ? 'bitti' : night ? 'uyku' : 'oylama'}</span>
          {running && deadline > 0 && <small>{Math.ceil(left / 1000)} sn</small>}
        </div>
        {room.seats.map((s, i) => {
          const dead = !g.alive[i];
          const [x, y] = seatXY(i, n);
          const can = pickable(i);
          const isMate = !g.roles[i] && mates.includes(i);
          return (
            <button
              key={i}
              className={`vp-seat${dead ? ' dead' : ''}${i === room.me ? ' me' : ''}${isMate ? ' mate' : ''}${chosen === i ? ' sel' : ''}${can ? ' can' : ''}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              disabled={busy || !can}
              onClick={() => choose(i)}
              aria-label={`${s.name}${dead ? ' (öldü)' : ''}`}
              aria-pressed={can ? chosen === i : undefined}
            >
              <i className="sf-av" style={{ background: PALETTE[i % PALETTE.length] }}>{(s.name || '?').trim().charAt(0).toUpperCase()}</i>
              <span className="nm">{s.name}{i === room.me ? ' (sen)' : ''}</span>
              {g.roles[i] && <em><Icon name={ROLE_ICON[g.roles[i]]} /> {ROLE[g.roles[i]].name}</em>}
              {isMate && <em className="mate-l">ortağın</em>}
              {day && !dead && voted.has(i) && <b className="tick" aria-label="oy verdi"><Icon name="check" /></b>}
              {vampTargets.includes(i) && <b className="drop" aria-label="vampirlerin hedefi"><Icon name="droplet" /></b>}
            </button>
          );
        })}
      </div>

      {!over && night && alive && nightType && (
        <section className="vp-act">
          <h2>{prompt}</h2>
          {role === 'vampir' && g.vampChoices && Object.keys(g.vampChoices).length > 0 && (
            <p className="sf-help">Seçenler: {Object.entries(g.vampChoices).map(([s, t]) => `${names[s]} → ${names[t]}`).join(', ')}</p>
          )}
          <p className="sf-help">{g.choice !== null ? 'Seçimin kaydedildi. Başka birine dokunarak değiştirebilirsin; herkes seçince sabah olur.' : 'Çemberden bir kişiye dokun. Herkes seçince sabah olur.'}</p>
          {role === 'doktor' && blocked !== null && <p className="sf-help">Geçen gece koruduğun kişi bu gece seçilemez.</p>}
          {role === 'kahin' && g.seer && g.seer.length > 0 && (
            <ul className="vp-seer">
              {g.seer.map((s, i) => <li key={i}>Gece {s.day}: <b>{names[s.target]}</b> {s.vamp ? 'vampir!' : 'vampir değil'}</li>)}
            </ul>
          )}
        </section>
      )}

      {!over && night && alive && role === 'koylu' && (
        <p className="vp-sleep">Gözlerini kapat. Sabah olunca haber verilecek.</p>
      )}

      {!over && day && alive && (
        <section className="vp-act">
          <h2>Kim elensin?</h2>
          <button className={`vp-t skip${g.myVote === -1 ? ' on' : ''}`} disabled={busy} onClick={() => send('vote', { target: -1 })}>Oy vermiyorum</button>
          <p className="sf-help">{g.voted.length}/{aliveIdx.length} kişi oy verdi. Çemberden elemek istediğin kişiye dokun; en çok oy alan elenir, eşitse kimse elenmez. Herkes oy verince sonuç belli olur.</p>
        </section>
      )}

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
