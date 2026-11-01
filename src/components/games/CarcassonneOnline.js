'use client';
import { useEffect, useMemo, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { TILE_DEFS, START_DEF } from '@/lib/carcassonne';

// Her oyuncunun meeple rengi (koltuk sırasına göre).
const COLORS = ['#c0392b', '#2471a3', '#1e8449', '#8e44ad', '#d68910'];
// Karo kenarı renkleri: şehir, yol, çayır.
const FILL = { c: '#c8963e', r: '#f4ecd8', f: '#9bc46b' };
// Kenar üçgenleri (N E G B), 100x100 karo koordinatlarında.
const SIDE_POLY = [
  '0,0 100,0 70,30 30,30',
  '100,0 100,100 70,70 70,30',
  '100,100 0,100 30,70 70,70',
  '0,100 0,0 30,30 30,70',
];
const MID = [[50, 15], [85, 50], [50, 85], [15, 50]];
const KIND_NAME = { c: 'şehir', r: 'yol', m: 'manastır' };
const CELL = 64;

// Karo çizimi: kenarlar üçgen olarak, yollar merkeze çizgi, manastır kare, flama nokta.
function Tile({ e, m, p, rot = 0, size = CELL }) {
  const edges = e ? [...e].map((_, i) => e[(i - rot + 4) % 4]) : null;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="cc-tile" aria-hidden="true">
      <rect width="100" height="100" fill={FILL.f} />
      {edges && edges.map((t, i) => (t !== 'f' ? <polygon key={i} points={SIDE_POLY[i]} fill={FILL[t]} /> : null))}
      {edges && edges.map((t, i) => (t === 'r' ? (
        <line key={`r${i}`} x1={MID[i][0]} y1={MID[i][1]} x2="50" y2="50" stroke={FILL.r} strokeWidth="14" />
      ) : null))}
      {m && <rect x="36" y="36" width="28" height="28" fill="#6d4c2a" stroke="#fff" strokeWidth="3" />}
      {p && <circle cx="50" cy="20" r="6" fill="#e74c3c" />}
    </svg>
  );
}

// Meeple'lar karonun üzerinde kendi yerlerinde (şehir üstte, yol altta, manastır ortada) durur.
const MEEPLE_AT = { c: [50, 22], r: [50, 78], m: [50, 50] };

export default function CarcassonneOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'carcassonne', pollMs: 1000 });
  const { room, err, busy, send } = ui;
  const [sel, setSel] = useState(null); // { x, y }
  const [rot, setRot] = useState(0);
  const [zoom, setZoom] = useState(1);
  const g = room?.game;
  const me = room?.me ?? -1;
  const myTurn = !!g && !g.over && g.turn === me;

  // Yeni karo çekildiğinde seçimi sıfırla.
  useEffect(() => { setSel(null); setRot(0); }, [g?.deckLeft, g?.turn]);

  // Bu konumda seçilen döndürmeyle yerleşim var mı? Yoksa geçerli bir döndürmeye geç.
  const spotMap = useMemo(() => {
    const map = new Map();
    for (const s of g?.spots || []) {
      const k = `${s.x},${s.y}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(s.rot);
    }
    return map;
  }, [g?.spots]);

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={5} min={2}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const names = g.names;
  const rotOk = (x, y) => (spotMap.get(`${x},${y}`) || []).includes(rot);
  const pick = (x, y) => {
    const rots = spotMap.get(`${x},${y}`) || [];
    if (!rots.length) return;
    setSel({ x, y });
    if (!rots.includes(rot)) setRot(rots[0]);
  };
  const place = () => {
    if (!sel || !rotOk(sel.x, sel.y)) return;
    send('ccplace', { cc: { x: sel.x, y: sel.y, rot } });
    setSel(null);
  };

  // Tahta sınırları ve hücreler.
  const keys = Object.keys(g.board).map((k) => k.split(',').map(Number));
  const xs = [...keys.map((k) => k[0]), ...[...spotMap.keys()].map((k) => Number(k.split(',')[0]))];
  const ys = [...keys.map((k) => k[1]), ...[...spotMap.keys()].map((k) => Number(k.split(',')[1]))];
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const cols = maxX - minX + 1, rows = maxY - minY + 1;
  const cell = CELL * zoom;
  const left = (x) => (x - minX) * cell;
  const top = (y) => (y - minY) * cell;

  const meeplesAt = (pos) => g.meeples.filter((m) => m.pos === pos);
  const lastTile = g.board[g.last];
  const canMeeple = (k) => !!lastTile && (k === 'm' ? lastTile.m : lastTile.e.includes(k)) && g.supply[me] > 0;

  return (
    <div className="cc-wrap">
      <div className="cc-status">
        {g.over ? (
          <strong>{g.msg}</strong>
        ) : (
          <span>{myTurn ? 'Sıra sizde.' : `Sıra: ${names[g.turn]}`} <small>Destede {g.deckLeft} karo</small></span>
        )}
        {g.msg && !g.over && <small className="cc-note">{g.msg}</small>}
      </div>

      {!g.over && g.phase === 'place' && g.tile && (
        <div className="cc-hand">
          <div className="cc-hand-tile">
            <Tile e={DEFS_E(g.tile)} m={!!DEFS_M(g.tile)} p={!!DEFS_P(g.tile)} rot={rot} size={72} />
          </div>
          <div className="cc-hand-ctrl">
            <button className="btn" disabled={!myTurn} onClick={() => setRot((rot + 3) % 4)} aria-label="Sola döndür">⟲</button>
            <button className="btn" disabled={!myTurn} onClick={() => setRot((rot + 1) % 4)} aria-label="Sağa döndür">⟳</button>
            <button className="btn primary" disabled={!myTurn || busy || !sel || !rotOk(sel?.x, sel?.y)} onClick={place}>
              {sel ? 'Buraya koy' : 'Tahtada bir nokta seç'}
            </button>
          </div>
        </div>
      )}

      {!g.over && g.phase === 'meeple' && myTurn && (
        <div className="cc-meeple">
          <p>Meeple koymak ister misiniz? (Kalan: {g.supply[me]})</p>
          <div className="cc-meeple-btns">
            {['c', 'r', 'm'].map((k) => (
              <button key={k} className="btn" disabled={busy || !canMeeple(k)} onClick={() => send('ccmeeple', { cc: { kind: k } })}>
                {KIND_NAME[k]}
              </button>
            ))}
            <button className="btn" disabled={busy} onClick={() => send('ccmeeple', { cc: { kind: null } })}>Koyma</button>
          </div>
        </div>
      )}

      <div className="cc-zoom">
        <button className="btn" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} aria-label="Uzaklaştır">−</button>
        <button className="btn" onClick={() => setZoom((z) => Math.min(1.8, z + 0.2))} aria-label="Yakınlaştır">+</button>
      </div>

      <div className="cc-board">
        <div className="cc-canvas" style={{ width: cols * cell, height: rows * cell }}>
          {Object.entries(g.board).map(([pos, t]) => {
            const [x, y] = pos.split(',').map(Number);
            return (
              <div key={pos} className="cc-cell" style={{ left: left(x), top: top(y), width: cell, height: cell }}>
                <Tile e={t.e} m={t.m} p={t.p} size={cell} />
                {meeplesAt(pos).map((mp, i) => {
                  const [mx, my] = MEEPLE_AT[mp.kind];
                  return (
                    <span key={i} className="cc-meeple-dot" style={{ left: `${mx}%`, top: `${my}%`, background: COLORS[mp.owner % COLORS.length] }} title={names[mp.owner]} />
                  );
                })}
              </div>
            );
          })}
          {[...spotMap.keys()].map((k) => {
            const [x, y] = k.split(',').map(Number);
            const isSel = sel && sel.x === x && sel.y === y;
            return (
              <button
                key={k}
                className={`cc-spot${isSel ? ' on' : ''}`}
                style={{ left: left(x), top: top(y), width: cell, height: cell }}
                disabled={!myTurn}
                onClick={() => pick(x, y)}
                aria-label={`Konum ${x}, ${y}`}
              >
                {isSel && rotOk(x, y) && <Tile e={DEFS_E(g.tile)} m={!!DEFS_M(g.tile)} p={!!DEFS_P(g.tile)} rot={rot} size={cell} />}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="cc-scores">
        {names.map((n, i) => (
          <li key={i}>
            <span className="cc-dot" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="cc-name">{n}{room.seats[i]?.left ? ' (ayrıldı)' : ''}{i === me ? ' (siz)' : ''}</span>
            <b>{g.score[i]}</b>
            <small>{g.supply[i]} meeple</small>
          </li>
        ))}
      </ul>

      {g.over && (
        <div className="cc-over">
          <p>Final puanları: {g.over.scores.join(' · ')}</p>
          <button className="btn primary" disabled={busy} onClick={() => send('reset')}>Yeni oyun (lobiye dön)</button>
        </div>
      )}
      {err && <p className="mono-where">{err}</p>}
    </div>
  );
}

// Karo tanımları istemcide de kullanılır (saf modül; sunucu sırrı içermez).
const DEF = Object.fromEntries([START_DEF, ...TILE_DEFS].map((d) => [d.k, d]));
function DEFS_E(k) { return DEF[k]?.e; }
function DEFS_M(k) { return DEF[k]?.m; }
function DEFS_P(k) { return DEF[k]?.p; }
