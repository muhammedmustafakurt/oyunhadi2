'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { TILE_DEFS, START_DEF } from '@/lib/carcassonne';

// Her oyuncunun meeple rengi (koltuk sırasına göre).
const COLORS = ['#c0392b', '#2471a3', '#1e8449', '#8e44ad', '#d68910'];
// Karo kenarı renkleri: şehir, yol, çayır.
const FILL = { c: '#c8963e', r: '#f4ecd8', f: '#9bc46b' };
// Kenar bölgeleri (N E G B), 100x100 karo koordinatlarında.
const SIDE_POLY = [
  '0,0 100,0 100,28 0,28',
  '100,0 100,100 72,100 72,0',
  '100,100 0,100 0,72 100,72',
  '0,100 0,0 28,0 28,100',
];
const ROAD_END = [[50, 0], [100, 50], [50, 100], [0, 50]];
const KIND_NAME = { c: 'Şehir', r: 'Yol', m: 'Manastır' };
const KIND_ICON = { c: '🏰', r: '🛣️', m: '⛪' };
const CELL = 64;
const CITY_D = '#8a5a1c';
const ROAD_D = '#b9a97f';

// Karo çizimi: çayır zemin, şehir (kahverengi, koyu kenarlı), yol (açık şeritli), manastır, flama.
function Tile({ e, m, p, rot = 0, size = CELL }) {
  const edges = e ? [...e].map((_, i) => e[(i - rot + 4) % 4]) : null;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="cc-tile" aria-hidden="true">
      <rect width="100" height="100" fill={FILL.f} />
      <circle cx="18" cy="82" r="3" fill="#86b25a" /><circle cx="80" cy="20" r="2.5" fill="#86b25a" />
      {edges && edges.map((t, i) => (t === 'r' ? (
        <g key={`r${i}`}>
          <line x1={ROAD_END[i][0]} y1={ROAD_END[i][1]} x2="50" y2="50" stroke={ROAD_D} strokeWidth="19" />
          <line x1={ROAD_END[i][0]} y1={ROAD_END[i][1]} x2="50" y2="50" stroke={FILL.r} strokeWidth="13" />
        </g>
      ) : null))}
      {edges && edges.some((t) => t === 'r') && <circle cx="50" cy="50" r="9" fill={FILL.r} />}
      {edges && edges.map((t, i) => (t === 'c' ? (
        <polygon key={i} points={SIDE_POLY[i]} fill={FILL.c} />
      ) : null))}
      {edges && edges.map((t, i) => {
        if (t !== 'c') return null;
        const a = edges[(i + 3) % 4] === 'c' ? 28 : 0;
        const b = edges[(i + 1) % 4] === 'c' ? 72 : 100;
        // Kuzey/Güney yatay, Doğu/Batı dikey iç kenar çizgisi.
        const pos = [28, 72, 72, 28][i];
        const [p, q] = i === 2 || i === 3 ? [100 - b, 100 - a] : [a, b];
        return i % 2 === 0
          ? <line key={`l${i}`} x1={p} y1={pos} x2={q} y2={pos} stroke={CITY_D} strokeWidth="4" strokeLinecap="square" />
          : <line key={`l${i}`} x1={pos} y1={p} x2={pos} y2={q} stroke={CITY_D} strokeWidth="4" strokeLinecap="square" />;
      })}
      {m && (
        <g>
          <rect x="33" y="40" width="34" height="26" fill="#d9c7a3" stroke="#5a3b17" strokeWidth="3" />
          <polygon points="29,41 50,24 71,41" fill="#b5442d" stroke="#5a3b17" strokeWidth="3" strokeLinejoin="round" />
          <rect x="45" y="52" width="10" height="14" fill="#5a3b17" />
        </g>
      )}
      {p && <polygon points="44,10 56,10 56,22 50,18 44,22" fill="#2471a3" stroke="#fff" strokeWidth="2" />}
      <rect x="1" y="1" width="98" height="98" fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="2" />
    </svg>
  );
}

// Meeple konumu: şehir/yol için o türdeki ilk kenarın içi, manastır ortada.
function meeplePos(tile, kind) {
  if (kind === 'm') return [50, 52];
  const i = tile?.e ? tile.e.indexOf(kind) : -1;
  if (i < 0) return [50, 50];
  const q = [[50, 13], [87, 50], [50, 87], [13, 50]];
  return q[i];
}

function Meeple({ color, size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="cc-pawn" aria-hidden="true">
      <path d="M12 2.5a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2zM5 11.5c2-1.2 4-1.7 7-1.7s5 .5 7 1.7l2.6 3.6-3.6 1.6-1.6-1.3.9 6.1H6.7l.9-6.1-1.6 1.3L2.4 15.1z" fill={color} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" paintOrder="stroke" />
    </svg>
  );
}

export default function CarcassonneOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'carcassonne', pollMs: 1000 });
  const { room, err, busy, send } = ui;
  const [sel, setSel] = useState(null); // { x, y }
  const [rot, setRot] = useState(0);
  const [zoom, setZoom] = useState(1);
  const boardRef = useRef(null);
  const pinch = useRef(null);
  const zoomRef = useRef(1);
  zoomRef.current = zoom;
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

  // İki parmakla yakınlaştırma (tek parmak kaydırma tarayıcıya kalır).
  const hasBoard = !!g && room?.phase !== 'lobby';
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return undefined;
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const start = (e) => { if (e.touches.length === 2) pinch.current = { d: dist(e.touches), z: zoomRef.current }; };
    const move = (e) => {
      if (e.touches.length === 2 && pinch.current) {
        e.preventDefault();
        setZoom(Math.min(1.8, Math.max(0.6, pinch.current.z * (dist(e.touches) / pinch.current.d))));
      }
    };
    const end = () => { pinch.current = null; };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    return () => { el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', move); el.removeEventListener('touchend', end); };
  }, [hasBoard]);

  // Son konulan karo (ya da seçilen nokta) görünür alana ortalanır.
  const focusKey = sel ? `${sel.x},${sel.y}` : g?.last || '';
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const t = (focusKey && el.querySelector(`[data-pos="${focusKey}"]`)) || el.querySelector('.cc-canvas');
    if (!t) return;
    if (!focusKey) {
      // Odak yoksa tahtanın ortasına git.
      el.scrollTo({ left: (el.scrollWidth - el.clientWidth) / 2, top: (el.scrollHeight - el.clientHeight) / 2, behavior: 'smooth' });
      return;
    }
    el.scrollTo({ left: t.offsetLeft + t.offsetWidth / 2 - el.clientWidth / 2, top: t.offsetTop + t.offsetHeight / 2 - el.clientHeight / 2, behavior: 'smooth' });
  }, [focusKey, g?.deckLeft, hasBoard]);

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
  const pad = cell * 0.6;
  const left = (x) => (x - minX) * cell + pad;
  const top = (y) => (y - minY) * cell + pad;

  const meeplesAt = (pos) => g.meeples.filter((m) => m.pos === pos);
  const lastTile = g.board[g.last];
  const canMeeple = (k) => !!lastTile && (k === 'm' ? lastTile.m : lastTile.e.includes(k)) && g.supply[me] > 0;
  const kinds = ['c', 'r', 'm'].filter(canMeeple);
  const curTile = g.tile ? { e: DEFS_E(g.tile), m: !!DEFS_M(g.tile), p: !!DEFS_P(g.tile) } : null;
  const leader = g.over ? Math.max(...g.over.scores) : null;

  return (
    <div className="cc-wrap">
      <div className="cc-status">
        {g.over ? (
          <strong>{g.msg}</strong>
        ) : (
          <span className={`cc-turn${myTurn ? ' mine' : ''}`}>
            <span className="cc-dot" style={{ background: COLORS[g.turn % COLORS.length] }} />
            {myTurn ? 'Sıra sizde' : `Sıra: ${names[g.turn]}`}
          </span>
        )}
        <span className="cc-chips">
          <span className="cc-chip"><b>{g.deckLeft}</b> karo kaldı</span>
          {me >= 0 && <span className="cc-chip"><b>{g.supply[me]}</b> meeple</span>}
        </span>
      </div>
      {g.msg && !g.over && <p className="cc-note">{g.msg}</p>}

      {!g.over && g.phase === 'place' && curTile && (
        <div className="cc-hand">
          <div className="cc-hand-tile">
            <Tile {...curTile} rot={rot} size={92} />
            <small>Çekilen karo</small>
          </div>
          <div className="cc-hand-ctrl">
            <div className="cc-rot">
              <button className="btn cc-rotbtn" disabled={!myTurn} onClick={() => setRot((rot + 3) % 4)} aria-label="Sola döndür">⟲ Sola</button>
              <button className="btn cc-rotbtn" disabled={!myTurn} onClick={() => setRot((rot + 1) % 4)} aria-label="Sağa döndür">Sağa ⟳</button>
            </div>
            <button className="btn primary cc-go" disabled={!myTurn || busy || !sel || !rotOk(sel?.x, sel?.y)} onClick={place}>
              {!myTurn ? `${names[g.turn]} oynuyor…` : !sel ? 'Tahtada parlayan bir nokta seç' : rotOk(sel.x, sel.y) ? 'Buraya koy' : 'Bu yön uymuyor, döndür'}
            </button>
          </div>
        </div>
      )}

      {!g.over && g.phase === 'meeple' && myTurn && lastTile && (
        <div className="cc-meeple">
          <p><b>Meeple koy?</b> <small>Kalan: {g.supply[me]}</small></p>
          <div className="cc-meeple-body">
            <div className="cc-pick">
              <Tile e={lastTile.e} m={lastTile.m} p={lastTile.p} size={132} />
              {kinds.map((k) => {
                const [mx, my] = meeplePos(lastTile, k);
                return (
                  <button key={k} className="cc-hot" disabled={busy} style={{ left: `${Math.min(80, Math.max(20, mx))}%`, top: `${Math.min(80, Math.max(20, my))}%` }}
                    onClick={() => send('ccmeeple', { cc: { kind: k } })} aria-label={`${KIND_NAME[k]} üzerine meeple koy`}>
                    <Meeple color={COLORS[me % COLORS.length]} size={26} />
                  </button>
                );
              })}
            </div>
            <div className="cc-meeple-btns">
              {kinds.map((k) => (
                <button key={k} className="btn" disabled={busy} onClick={() => send('ccmeeple', { cc: { kind: k } })}>
                  <span aria-hidden="true">{KIND_ICON[k]}</span> {KIND_NAME[k]}
                </button>
              ))}
              {!kinds.length && <small>Koyabileceğiniz yer yok.</small>}
              <button className="btn ghost" disabled={busy} onClick={() => send('ccmeeple', { cc: { kind: null } })}>Koyma, geç</button>
            </div>
          </div>
        </div>
      )}
      {!g.over && g.phase === 'meeple' && !myTurn && <p className="cc-note">{names[g.turn]} meeple koyuyor…</p>}

      <div className="cc-boardbox">
        <div className="cc-zoom">
          <button className="btn" onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.2).toFixed(1)))} aria-label="Yakınlaştır">+</button>
          <button className="btn" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} aria-label="Uzaklaştır">−</button>
        </div>
        <div className="cc-board" ref={boardRef}>
          <div className="cc-canvas" style={{ width: cols * cell + pad * 2, height: rows * cell + pad * 2 }}>
            {Object.entries(g.board).map(([pos, t]) => {
              const [x, y] = pos.split(',').map(Number);
              return (
                <div key={pos} data-pos={pos} className={`cc-cell${pos === g.last ? ' last' : ''}`} style={{ left: left(x), top: top(y), width: cell, height: cell }}>
                  <Tile e={t.e} m={t.m} p={t.p} size={cell} />
                  {meeplesAt(pos).map((mp, i) => {
                    const [mx, my] = meeplePos(t, mp.kind);
                    return (
                      <span key={i} className="cc-meeple-dot" style={{ left: `${mx}%`, top: `${my}%` }} title={names[mp.owner]}>
                        <Meeple color={COLORS[mp.owner % COLORS.length]} size={Math.max(18, cell * 0.36)} />
                      </span>
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
                  data-pos={k}
                  className={`cc-spot${isSel ? ' on' : ''}${isSel && !rotOk(x, y) ? ' bad' : ''}`}
                  style={{ left: left(x), top: top(y), width: cell, height: cell }}
                  disabled={!myTurn}
                  onClick={() => pick(x, y)}
                  aria-label={`Konum ${x}, ${y}`}
                >
                  {isSel && rotOk(x, y) && curTile ? <Tile {...curTile} rot={rot} size={cell} /> : <span className="cc-plus" aria-hidden="true">+</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ul className="cc-scores">
        {names.map((n, i) => (
          <li key={i} className={`${!g.over && g.turn === i ? 'turn' : ''}${leader !== null && g.over.scores[i] === leader ? ' win' : ''}`}>
            <span className="cc-dot" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="cc-name">{n}{i === me ? ' (siz)' : ''}{room.seats[i]?.left ? ' (ayrıldı)' : ''}</span>
            <span className="cc-sup" title="Kalan meeple">
              {Array.from({ length: g.supply[i] }, (_, j) => <Meeple key={j} color={COLORS[i % COLORS.length]} size={14} />)}
            </span>
            <b className="cc-pts">{g.score[i]}</b>
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
