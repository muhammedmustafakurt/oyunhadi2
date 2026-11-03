'use client';
import { useEffect, useMemo, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { legalMoves, BAR, OFF } from '@/lib/tavla';
import '@/styles/game-tavla.css';
import '@/styles/game-tavla-polish.css';

// Masada iki telefondan Tavla: 1. koltuk Beyaz, 2. koltuk Siyah. Zarı ve tüm kuralları sunucu uygular;
// buradaki hamle listesi yalnızca geçerli noktaları vurgulamak içindir (sunucu yine denetler).
const COLOR = ['Beyaz', 'Siyah'];

function Pips({ n }) {
  return <span className="tv-die-n" aria-hidden="true">{n}</span>;
}

function Checkers({ count, color, side }) {
  const shown = Math.min(count, 5);
  return (
    <span className={`tv-stack ${side}`} aria-hidden="true">
      {Array.from({ length: shown }, (_, k) => (
        <i key={k} className={`tv-ch c${color}`}>{k === shown - 1 && count > 5 ? count : ''}</i>
      ))}
    </span>
  );
}

export default function TavlaOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'tavla' });
  const { room, err, busy, send } = ui;
  const [sel, setSel] = useState(null);
  const [sure, setSure] = useState(false);
  const g = room?.game;
  const me = room ? room.me : -1;
  const seated = me === 0 || me === 1;
  const myTurn = !!g && seated && !g.over && g.turn === me;
  const moving = myTurn && g.phase === 'move';

  const legal = useMemo(() => (moving ? legalMoves(g) : []), [g, moving]);
  const key = g ? `${g.turn}|${g.phase}|${g.dice.join('')}|${g.pts.join(',')}|${g.bar}|${g.off}` : '';
  useEffect(() => { setSel(null); }, [key]);

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;
  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={2} min={2}
        seatNote={(k) => (k === 0 ? 'Beyaz · masayı açan' : 'Siyah')}
      />
    );
  }

  const froms = new Set(legal.map((m) => m.from));
  const active = moving && g.bar[me] > 0 ? BAR : sel;
  const dests = new Set(active === null ? [] : legal.filter((m) => m.from === active).map((m) => m.to));
  const flip = me === 1;

  const play = (from, to) => send('tvmove', { pl: { from, to } });
  const tapPoint = (i) => {
    if (!moving || busy) return;
    if (active !== null && dests.has(i)) play(active, i);
    else if (froms.has(i)) setSel(sel === i ? null : i);
  };

  const rows = Array.from({ length: 12 }, (_, r) => (flip ? [11 - r, 12 + r] : [23 - r, r]));

  const cell = (i, side) => {
    const v = g.pts[i];
    const count = Math.abs(v);
    const col = v > 0 ? 0 : 1;
    const isDest = dests.has(i);
    const isSel = active === i;
    const can = froms.has(i);
    const cls = ['tv-pt', i % 2 ? 'odd' : 'even', isDest && 'dest', isSel && 'sel', can && !isSel && 'can'].filter(Boolean).join(' ');
    const label = `Nokta ${i + 1}: ${count ? `${count} ${COLOR[col]} pul` : 'boş'}${isDest ? ', hamle yapılabilir' : ''}${isSel ? ', seçili' : ''}`;
    return (
      <button key={i} type="button" className={cls} aria-label={label} aria-pressed={isSel || undefined}
        disabled={!(can || isDest) || busy} onClick={() => tapPoint(i)}>
        {count > 0 && <Checkers count={count} color={col} side={side} />}
      </button>
    );
  };

  const remaining = g.dice.slice();
  const rollDice = g.roll ? (g.roll.d[0] === g.roll.d[1] ? Array(4).fill(g.roll.d[0]) : g.roll.d) : [];
  const live = g.phase === 'move' && g.roll && g.roll.by === g.turn;
  const diceView = rollDice.map((d) => {
    let used = true;
    if (live) {
      const at = remaining.indexOf(d);
      if (at >= 0) { remaining.splice(at, 1); used = false; }
    }
    return { d, used: live ? used : false };
  });

  const status = g.over ? g.over.text
    : !seated ? `Sıra: ${g.names[g.turn]} (${COLOR[g.turn]})`
      : myTurn ? (g.phase === 'roll' ? 'Sıra sizde: zarı atın.' : g.bar[me] > 0 ? 'Kırık pulunuzu oyuna sokun.' : legal.length ? 'Bir pul seçin, sonra gideceği noktaya dokunun.' : '…')
        : `${g.names[g.turn]} oynuyor…`;

  return (
    <div className="tv-wrap">
      {!seated && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}
      {seated && <p className="mono-where">{`Siz ${COLOR[me]} oynuyorsunuz.`}</p>}

      <div className="tv-head">
        {[0, 1].map((p) => (
          <div key={p} className={`tv-pl${g.turn === p && !g.over ? ' on' : ''}`}>
            <i className={`tv-ch c${p}`} aria-hidden="true" />
            <span>{g.names[p]}{p === me ? ' (sen)' : ''}</span>
            <b aria-label={`${g.off[p]} pul çıkarıldı`}>{g.off[p]}/15</b>
          </div>
        ))}
      </div>

      <p className="tv-status" role="status" aria-live="polite">{status}</p>

      <div className="tv-board" role="group" aria-label="Tavla tahtası">
        {rows.map(([l, r], k) => (
          <div className="tv-row" key={k}>
            {cell(l, 'l')}
            {cell(r, 'r')}
          </div>
        ))}
      </div>

      <div className="tv-tray">
        {[0, 1].map((p) => {
          const mine = p === me;
          const canBar = mine && froms.has(BAR);
          return (
            <button key={p} type="button" className={`tv-bar${canBar ? ' can' : ''}${active === BAR && mine ? ' sel' : ''}`}
              disabled={!canBar || busy} onClick={() => setSel(BAR)}
              aria-label={`${COLOR[p]} kırık pul: ${g.bar[p]}`}>
              <i className={`tv-ch c${p}`} aria-hidden="true" />
              <span>Kırık</span>
              <b>{g.bar[p]}</b>
            </button>
          );
        })}
        <button type="button" className={`tv-off${dests.has(OFF) ? ' dest' : ''}`} disabled={!dests.has(OFF) || busy}
          onClick={() => play(active, OFF)} aria-label="Pulu tahtadan çıkar">
          Pulu çıkar
        </button>
      </div>

      <div className="tv-dice" aria-label="Zarlar">
        {diceView.length ? diceView.map((x, k) => (
          <span key={k} className={`tv-die${x.used ? ' used' : ''}${live ? '' : ' old'}`}><Pips n={x.d} /></span>
        )) : <span className="muted">Zar henüz atılmadı</span>}
        {g.roll && !live && <small className="muted">son atış</small>}
      </div>

      {myTurn && g.phase === 'roll' && (
        <button type="button" className="btn tv-roll" disabled={busy} onClick={() => send('tvroll')}>Zar at</button>
      )}

      {g.note && !g.over && <p className="mono-where">{g.note}</p>}
      {g.over && (
        <div className="tv-over">
          <h3>{g.over.text}</h3>
          {seated && <button type="button" className="btn" disabled={busy} onClick={() => send('reset')}>Rövanş (lobiye dön)</button>}
        </div>
      )}
      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && !g.over && (
        sure
          ? <button type="button" className="btn sm danger" disabled={busy} onClick={() => { setSure(false); send('leave'); }}>Evet, oyunu bırak (yenilirim)</button>
          : <button type="button" className="btn sm" onClick={() => setSure(true)}>Masadan ayrıl</button>
      )}
    </div>
  );
}
