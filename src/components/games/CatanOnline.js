'use client';
import { useState } from 'react';
import Lobby from './Lobby';
import LeaveButton from './LeaveButton';
import useRoom from './useRoom';
import { layout, RES, RES_TR, COST } from '@/lib/catan';

// Arazi renkleri, Türkçe adları ve simgeleri (renk körü dostu: her arazide simge + ad var).
const TERR = { lumber: '#3f7a43', wool: '#a9cf72', grain: '#e6c65a', brick: '#c45c35', ore: '#8d96a3', desert: '#e9dcb0' };
const TERR_TR = { lumber: 'Odun', wool: 'Koyun', grain: 'Buğday', brick: 'Tuğla', ore: 'Cevher', desert: 'Çöl' };
const ICO = { lumber: '🌲', wool: '🐑', grain: '🌾', brick: '🧱', ore: '⛰️', desert: '🏜️' };
// Oyuncu renkleri: mavi, kırmızı, mor, beyaz (arazilerden ve birbirinden net ayrışır).
const CT_COL = ['#1d4ed8', '#e11d48', '#7e22ce', '#ffffff'];
const col = (p) => CT_COL[p % CT_COL.length];
const DEV_TR = { knight: 'Şövalye', road: 'Yol inşası', plenty: 'Bolluk', mono: 'Tekel', vp: 'Zafer puanı' };
const DEV_ICO = { knight: '⚔️', road: '🛣️', plenty: '🎁', mono: '💰', vp: '🏆' };
const STEP_TR = { settle: 'köy', road: 'yol' };
const COST_TXT = (c) => Object.entries(c).map(([r, n]) => `${n} ${RES_TR[r]}`).join(', ');
const COST_ICO = (c) => Object.entries(c).map(([r, n]) => `${n}${ICO[r]}`).join(' ');

const LAY = layout();
const DEG = [30, 90, 150, 210, 270, 330];
const HEX_PTS = LAY.hexes.map((h) => DEG.map((d) => `${(h.x + Math.cos((d * Math.PI) / 180)).toFixed(3)},${(h.y + Math.sin((d * Math.PI) / 180)).toFixed(3)}`).join(' '));
const XS = LAY.verts.map((v) => v.x), YS = LAY.verts.map((v) => v.y);
const MX = 1.5, MY = 1.25; // liman etiketleri için kenar boşluğu
const VB = `${(Math.min(...XS) - MX).toFixed(2)} ${(Math.min(...YS) - MY).toFixed(2)} ${(Math.max(...XS) - Math.min(...XS) + MX * 2).toFixed(2)} ${(Math.max(...YS) - Math.min(...YS) + MY * 2).toFixed(2)}`;
const zero = () => Object.fromEntries(RES.map((r) => [r, 0]));
const sum = (o) => RES.reduce((s, r) => s + (o[r] || 0), 0);
const hot = (n) => n === 6 || n === 8;
const dots = (n) => 6 - Math.abs(7 - n);

// Sayaçlı giriş (kaynak seçimi için).
function Count({ label, icon, value, max, onChange }) {
  return (
    <div className="ct-count">
      <span className="ct-count-l">{icon} {label}</span>
      <button type="button" className="btn sm ct-step" disabled={value <= 0} onClick={() => onChange(value - 1)} aria-label={`${label} azalt`}>−</button>
      <b>{value}</b>
      <button type="button" className="btn sm ct-step" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`${label} artır`}>+</button>
    </div>
  );
}

const ResSelect = ({ value, onChange, label }) => (
  <select className="ct-sel" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
    {RES.map((r) => <option key={r} value={r}>{ICO[r]} {RES_TR[r]}</option>)}
  </select>
);

const offerTxt = (o) => RES.filter((r) => o[r]).map((r) => `${o[r]} ${ICO[r]} ${RES_TR[r]}`).join(', ');

// Catan masası: tahta SVG, sıra ve adım bilgisi, kendi kartların, yapı/ticaret/gelişim kartı eylemleri.
export default function CatanOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'catan' });
  const { room, err, busy, send } = ui;
  const [build, setBuild] = useState('road'); // 'settle' | 'city' | 'road'
  const [armed, setArmed] = useState(null); // 'knight' | 'road' (gelişim kartı hedef bekliyor)
  const [free, setFree] = useState([]); // yol inşası kartı için seçilen kenarlar
  const [robHex, setRobHex] = useState(null);
  const [victim, setVictim] = useState(null);
  const [disc, setDisc] = useState(zero());
  const [og, setOg] = useState(zero());
  const [ow, setOw] = useState(zero());
  const [bGive, setBGive] = useState('lumber');
  const [bWant, setBWant] = useState('ore');
  const [pick2, setPick2] = useState(['wool', 'ore']);
  const [mono, setMono] = useState('wool');

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;
  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={4} min={3}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const g = room.game;
  const me = room.me;
  const seated = me >= 0 && !room.seats[me]?.left;
  const names = room.seats.map((s) => s.name);
  const nm = (p) => names[p] ?? `Oyuncu ${p + 1}`;
  const P = g.players;
  const mine = seated ? P[me] : null;
  const myTurn = seated && g.turn === me && !g.over;
  const legal = g.legal || { settle: [], city: [], road: [] };
  const needMe = g.need.find((x) => x.p === me);
  const canDev = myTurn && !g.devPlayed && (g.step === 'roll' || g.step === 'main');
  const bm = g.phase === 'setup' ? (g.step === 'settle' ? 'settle' : 'road')
    : g.step === 'robber' || armed === 'knight' ? 'robber'
    : armed === 'road' ? 'free' : build;
  const bankRate = (res) => {
    if (!mine) return 4;
    let rate = 4;
    for (const pt of g.ports) {
      const e = LAY.edges[pt.e];
      if (!e.some((v) => g.vb[v]?.p === me)) continue;
      if (pt.t === 'any') rate = Math.min(rate, 3);
      else if (pt.t === res) rate = Math.min(rate, 2);
    }
    return rate;
  };
  const victimsOf = (h) => [...new Set(LAY.hexes[h].v.map((v) => g.vb[v]).filter((o) => o && o.p !== me && P[o.p].cards > 0).map((o) => o.p))];

  const onVertex = (v) => {
    if (!myTurn) return;
    if (bm === 'settle' && legal.settle.includes(v)) send('csettle', { cat: { v } });
    else if (bm === 'city' && legal.city.includes(v)) send('ccity', { cat: { v } });
  };
  const onEdge = (e) => {
    if (!myTurn) return;
    if (bm === 'free') setFree((f) => (f.includes(e) ? f.filter((x) => x !== e) : f.length < 2 ? [...f, e] : f));
    else if (bm === 'road' && legal.road.includes(e)) send('croad', { cat: { e } });
  };
  const onHex = (h) => {
    if (!myTurn || bm !== 'robber' || h === g.robber) return;
    setRobHex(h);
    setVictim(null);
  };
  const sendRobber = () => {
    if (robHex === null) return;
    const vs = victimsOf(robHex);
    const v = vs.length ? (vs.includes(victim) ? victim : vs[0]) : null;
    if (armed === 'knight') send('cplay', { cat: { card: 'knight', hex: robHex, victim: v } });
    else send('crobber', { cat: { hex: robHex, victim: v } });
    setRobHex(null);
    setVictim(null);
    setArmed(null);
  };

  const status = (() => {
    if (g.over) return g.over;
    if (!seated) return `${nm(g.turn)} sırada.`;
    if (g.phase === 'setup') return myTurn ? `Sıra sende: bir ${STEP_TR[g.step]} koy.` : `${nm(g.turn)} ${STEP_TR[g.step]} koyuyor.`;
    if (g.step === 'roll') return myTurn ? 'Sıra sende: zarı at.' : `${nm(g.turn)} zar atıyor.`;
    if (g.step === 'discard') return needMe ? `Yedi geldi: ${needMe.n} kart atmalısın.` : 'Yedi geldi: bazı oyuncular kart atıyor.';
    if (g.step === 'robber') return myTurn ? 'Hırsızı bir araziye taşı.' : `${nm(g.turn)} hırsızı taşıyor.`;
    return myTurn ? 'Sıran: yapı kur, ticaret yap ya da turu bitir.' : `${nm(g.turn)} oynuyor.`;
  })();

  const total = mine?.res ? sum(mine.res) : 0;

  return (
    <div className="ct">
      <div className="ct-top" style={{ '--pc': col(g.turn) }}>
        <span className="ct-turn" aria-hidden="true" />
        <p className="ct-status" role="status">{status}</p>
        {g.dice && (
          <span className="ct-dice" role="img" aria-label={`Son zar: ${g.dice[0]} ve ${g.dice[1]}, toplam ${g.dice[0] + g.dice[1]}`}>
            <i>{g.dice[0]}</i><i>{g.dice[1]}</i><b>{g.dice[0] + g.dice[1]}</b>
          </span>
        )}
      </div>

      <div className="ct-sea">
        <svg viewBox={VB} className="ct-board" role="img" aria-label="Catan tahtası">
          {g.ports.map((pt, i) => {
            const [a, b] = LAY.edges[pt.e];
            const va = LAY.verts[a], vb = LAY.verts[b];
            const mx = (va.x + vb.x) / 2, my = (va.y + vb.y) / 2;
            const len = Math.hypot(mx, my) || 1;
            const lx = mx + (mx / len) * 0.88, ly = my + (my / len) * 0.88;
            return (
              <g key={`p${i}`} pointerEvents="none">
                <title>{pt.t === 'any' ? '3:1 liman' : `2:1 ${TERR_TR[pt.t]} limanı`}</title>
                <line x1={va.x} y1={va.y} x2={lx} y2={ly} className="ct-dock" />
                <line x1={vb.x} y1={vb.y} x2={lx} y2={ly} className="ct-dock" />
                <rect x={lx - 0.62} y={ly - 0.3} width="1.24" height="0.6" rx="0.3" className={`ct-port${pt.t === 'any' ? '' : ' sp'}`} />
                <text x={lx} y={ly + 0.12} textAnchor="middle" className="ct-port-t">{pt.t === 'any' ? '3:1' : `${ICO[pt.t]} 2:1`}</text>
              </g>
            );
          })}
          {LAY.hexes.map((h, i) => <polygon key={`hp${i}`} points={HEX_PTS[i]} className="ct-hex" fill={TERR[g.hexes[i].t]} />)}
          {LAY.hexes.map((h, i) => {
            const hx = g.hexes[i];
            return (
              <g key={`h${i}`}>
                <text x={h.x} y={h.y - (hx.n ? 0.5 : 0.05)} textAnchor="middle" className="ct-ico" pointerEvents="none">{ICO[hx.t]}</text>
                <text x={h.x} y={h.y + (hx.n ? 0.66 : 0.6)} textAnchor="middle" className="ct-name" pointerEvents="none">{TERR_TR[hx.t]}</text>
                {hx.n ? (
                  <g pointerEvents="none">
                    <circle cx={h.x} cy={h.y - 0.1} r="0.37" className="ct-tok" />
                    <text x={h.x} y={h.y - 0.02} textAnchor="middle" className={`ct-num${hot(hx.n) ? ' hot' : ''}`}>{hx.n}</text>
                    <text x={h.x} y={h.y + 0.2} textAnchor="middle" className={`ct-pip${hot(hx.n) ? ' hot' : ''}`}>{'•'.repeat(dots(hx.n))}</text>
                  </g>
                ) : null}
              </g>
            );
          })}
          {bm === 'robber' && myTurn && LAY.hexes.map((h, i) => (i === g.robber ? null : (
            <polygon key={`hit${i}`} points={HEX_PTS[i]} className="ct-hit" fill="transparent" onClick={() => onHex(i)} />
          )))}
          {LAY.edges.map(([a, b], e) => {
            const o = g.eb[e];
            const x1 = LAY.verts[a].x, y1 = LAY.verts[a].y, x2 = LAY.verts[b].x, y2 = LAY.verts[b].y;
            const active = myTurn && o === null && ((bm === 'road' && legal.road.includes(e)) || bm === 'free');
            return (
              <g key={`e${e}`}>
                {o !== null && (
                  <>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1b1208" strokeWidth="0.26" strokeLinecap="round" />
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col(o)} strokeWidth="0.15" strokeLinecap="round" />
                  </>
                )}
                {active && (
                  <>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1b1208" strokeOpacity=".55" strokeWidth="0.22" strokeLinecap="round" />
                    <line x1={x1} y1={y1} x2={x2} y2={y2} className={`ct-eslot${free.includes(e) ? ' on' : ''}`} strokeLinecap="round" />
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="0.8" className="ct-hit" strokeLinecap="round" onClick={() => onEdge(e)} />
                  </>
                )}
              </g>
            );
          })}
          {LAY.verts.map((v, i) => {
            const o = g.vb[i];
            const cand = myTurn && ((bm === 'settle' && legal.settle.includes(i)) || (bm === 'city' && legal.city.includes(i)));
            return (
              <g key={`v${i}`}>
                {o && !o.c && <path transform={`translate(${v.x} ${v.y}) scale(0.19)`} d="M-1 0.9 L-1 -0.35 L0 -1.25 L1 -0.35 L1 0.9 Z" fill={col(o.p)} className="ct-piece" />}
                {o && o.c && <path transform={`translate(${v.x} ${v.y}) scale(0.23)`} d="M-1.4 0.9 L-1.4 -0.3 L-0.4 -0.3 L-0.4 -0.9 L0.35 -1.4 L1.1 -0.9 L1.1 -0.3 L1.4 -0.3 L1.4 0.9 Z" fill={col(o.p)} className="ct-piece" />}
                {cand && (
                  <>
                    <circle cx={v.x} cy={v.y} r="0.32" className="ct-halo" pointerEvents="none" />
                    <circle cx={v.x} cy={v.y} r="0.17" className={`ct-cand${bm === 'city' ? ' r' : ''}`} pointerEvents="none" />
                    <circle cx={v.x} cy={v.y} r="0.62" fill="transparent" className="ct-hit" onClick={() => onVertex(i)} />
                  </>
                )}
              </g>
            );
          })}
          {LAY.hexes.map((h, i) => (i === g.robber ? (
            <g key="rob" pointerEvents="none" transform={`translate(${h.x + 0.5} ${h.y - 0.08})`}>
              <ellipse cx="0" cy="0.4" rx="0.28" ry="0.09" fill="#000" opacity=".3" />
              <path d="M-0.25 0.36 Q-0.23 -0.04 -0.1 -0.09 A0.17 0.17 0 1 1 0.1 -0.09 Q0.23 -0.04 0.25 0.36 Z" className="ct-rob" />
            </g>
          ) : null))}
          {robHex !== null && <circle cx={LAY.hexes[robHex].x} cy={LAY.hexes[robHex].y} r="0.66" className="ct-robsel" pointerEvents="none" />}
        </svg>
      </div>

      {g.over && (
        <section className="ct-panel" role="status">
          <p className="ct-status">{g.over}</p>
          <ol className="ct-score big">
            {names.map((n, p) => (
              <li key={p} className={p === g.winner ? 'turn' : ''}><span className="sw" style={{ background: col(p) }} /><b>{n}</b><span className="ct-pts">{P[p].pub}</span><span className="ct-tag">puan{p === g.winner ? ' · kazanan' : ''}</span></li>
            ))}
          </ol>
          <button className="btn primary ct-big" disabled={busy} onClick={() => send('reset')}>Yeni oyun (lobiye dön)</button>
        </section>
      )}

      {!g.over && (
        <ul className="ct-score" aria-label="Puan durumu">
          {names.map((n, p) => (
            <li key={p} className={g.turn === p ? 'turn' : ''} style={{ opacity: room.seats[p]?.left ? 0.45 : 1 }}>
              <span className="sw" style={{ background: col(p) }} aria-hidden="true" />
              <span className="ct-pname"><b>{n}{p === me ? ' (sen)' : ''}</b>
                {g.turn === p && <span className="ct-tag now">sırada</span>}
              </span>
              <span className="ct-pts" aria-label={`${P[p].pub} puan`}>{P[p].pub}<small>puan</small></span>
              <span className="ct-tags">
                <span className="ct-tag">🃏 {P[p].cards}</span>
                <span className="ct-tag">📜 {P[p].devN}</span>
                <span className="ct-tag">⚔️ {P[p].k}</span>
                {g.lr === p && <span className="ct-tag award">🛣️ en uzun yol</span>}
                {g.la === p && <span className="ct-tag award">⚔️ en büyük ordu</span>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!g.over && seated && mine && (
        <section className="ct-panel" aria-label="Kartların">
          <h3 className="ct-h">Elin <small>{total} kart</small></h3>
          <div className="ct-hand">
            {RES.map((r) => {
              const n = mine.res ? mine.res[r] : 0;
              return (
                <span key={r} className={`ct-res${n ? '' : ' zero'}`} style={{ '--rc': TERR[r] }}>
                  <em aria-hidden="true">{ICO[r]}</em>
                  <b>{n}</b>
                  <span>{RES_TR[r]}</span>
                </span>
              );
            })}
          </div>
          {mine.dev && Object.keys(DEV_TR).some((k) => mine.dev[k] + (mine.devNew?.[k] || 0) > 0) && (
            <div className="ct-cards" aria-label="Gelişim kartların">
              {Object.keys(DEV_TR).map((k) => (mine.dev[k] + (mine.devNew?.[k] || 0) > 0 ? (
                <span key={k}>{DEV_ICO[k]} {DEV_TR[k]}: {mine.dev[k]}{mine.devNew?.[k] ? ` (+${mine.devNew[k]} yeni)` : ''}</span>
              ) : null))}
            </div>
          )}
          <p className="ct-hint">Bankada: {RES.map((r) => `${ICO[r]}${g.bank[r]}`).join(' ')} · Gelişim destesi: {g.devLeft}</p>
        </section>
      )}

      {myTurn && g.phase === 'setup' && (
        <p className="ct-note">
          {g.step === 'settle' && 'Tahtada parlayan yeşil noktalara köy koyabilirsin.'}
          {g.step === 'road' && 'Son köyüne bağlı, parlayan bir yol seç.'}
        </p>
      )}

      {myTurn && g.phase === 'play' && g.step === 'roll' && (
        <button className="btn primary ct-big" disabled={busy} onClick={() => send('croll')}>🎲 Zar at</button>
      )}

      {needMe && (
        <section className="ct-panel" aria-label="Kart atma">
          <h3 className="ct-h">Kart at <small>{sum(disc)} / {needMe.n}</small></h3>
          <p className="ct-hint">Yedi geldi: {needMe.n} kartı bankaya atmalısın.</p>
          <div className="ct-counts">
            {RES.map((r) => (
              <Count key={r} icon={ICO[r]} label={RES_TR[r]} value={disc[r]} max={mine?.res?.[r] ?? 0} onChange={(v) => setDisc({ ...disc, [r]: v })} />
            ))}
          </div>
          <button className="btn primary ct-big" disabled={busy || sum(disc) !== needMe.n} onClick={() => { send('cdrop', { cat: { r: disc } }); setDisc(zero()); }}>Kartları at</button>
        </section>
      )}

      {myTurn && g.phase === 'play' && g.step === 'robber' && (
        <section className="ct-panel">
          <h3 className="ct-h">Hırsız</h3>
          <p className="ct-hint">Hırsızı taşımak için tahtadan bir araziye dokun.</p>
          {robHex !== null && (
            <>
              {victimsOf(robHex).length > 1 && (
                <div className="ct-row">
                  {victimsOf(robHex).map((p) => (
                    <button key={p} type="button" className={`btn sm${victim === p ? ' primary' : ''}`} onClick={() => setVictim(p)}>{nm(p)}dan çal</button>
                  ))}
                </div>
              )}
              <button className="btn primary ct-big" disabled={busy} onClick={sendRobber}>Hırsızı {TERR_TR[g.hexes[robHex].t]} arazisine koy</button>
            </>
          )}
        </section>
      )}

      {armed === 'knight' && myTurn && g.step !== 'robber' && (
        <section className="ct-panel">
          <h3 className="ct-h">Şövalye</h3>
          <p className="ct-hint">Hırsızı taşıyacağın araziye dokun, sonra onayla.</p>
          {robHex !== null && <button className="btn primary ct-big" disabled={busy} onClick={sendRobber}>Şövalyeyi oyna</button>}
          <button className="btn sm" onClick={() => { setArmed(null); setRobHex(null); }}>Vazgeç</button>
        </section>
      )}

      {armed === 'road' && myTurn && (
        <section className="ct-panel">
          <h3 className="ct-h">Yol inşası <small>{free.length} / 2</small></h3>
          <p className="ct-hint">Tahtada iki yol seç.</p>
          <div className="ct-row">
            <button className="btn primary" disabled={busy || free.length < 1} onClick={() => { send('cplay', { cat: { card: 'road', edges: free } }); setFree([]); setArmed(null); }}>Yolları koy</button>
            <button className="btn sm" onClick={() => { setArmed(null); setFree([]); }}>Vazgeç</button>
          </div>
        </section>
      )}

      {myTurn && g.phase === 'play' && g.step === 'main' && (
        <>
          <section className="ct-panel" aria-label="Yapı">
            <h3 className="ct-h">İnşa et</h3>
            <div className="ct-seg" role="group" aria-label="Yapı türü">
              {['road', 'settle', 'city'].map((m) => (
                <button key={m} type="button" aria-pressed={build === m} className={`ct-segb${build === m ? ' on' : ''}`} onClick={() => setBuild(m)}>
                  <b>{m === 'settle' ? '🏠 Köy' : m === 'city' ? '🏰 Şehir' : '🛣️ Yol'}</b>
                  <small>{COST_ICO(COST[m])}</small>
                </button>
              ))}
            </div>
            <p className="ct-hint">Seçtiğin yapıyı tahtada parlayan noktalara dokunarak kur.</p>
            <button className="btn ct-wide" disabled={busy} onClick={() => send('cdev')}>
              <span>📜 Gelişim kartı al</span><small>{COST_ICO(COST.dev)}</small>
            </button>
          </section>

          {canDev && mine?.dev && (mine.dev.knight > 0 || mine.dev.road > 0 || mine.dev.plenty > 0 || mine.dev.mono > 0) && (
            <section className="ct-panel" aria-label="Gelişim kartları">
              <h3 className="ct-h">Kart oyna</h3>
              <div className="ct-col">
                {mine.dev.knight > 0 && <button className="btn" disabled={busy} onClick={() => { setArmed('knight'); setRobHex(null); }}>⚔️ Şövalye oyna</button>}
                {mine.dev.road > 0 && <button className="btn" disabled={busy} onClick={() => { setArmed('road'); setFree([]); }}>🛣️ Yol inşası oyna</button>}
                {mine.dev.plenty > 0 && (
                  <div className="ct-row nw">
                    <ResSelect value={pick2[0]} onChange={(v) => setPick2([v, pick2[1]])} label="Bolluk 1" />
                    <ResSelect value={pick2[1]} onChange={(v) => setPick2([pick2[0], v])} label="Bolluk 2" />
                    <button className="btn" disabled={busy} onClick={() => send('cplay', { cat: { card: 'plenty', picks: pick2 } })}>🎁 Bolluk</button>
                  </div>
                )}
                {mine.dev.mono > 0 && (
                  <div className="ct-row nw">
                    <ResSelect value={mono} onChange={setMono} label="Tekel kaynağı" />
                    <button className="btn" disabled={busy} onClick={() => send('cplay', { cat: { card: 'mono', res: mono } })}>💰 Tekel</button>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="ct-panel" aria-label="Banka ticareti">
            <h3 className="ct-h">Banka ticareti</h3>
            <div className="ct-bank">
              <label><span>Ver</span><ResSelect value={bGive} onChange={setBGive} label="Verilen kaynak" /></label>
              <span className="ct-arrow" aria-hidden="true">→</span>
              <label><span>Al</span><ResSelect value={bWant} onChange={setBWant} label="Alınan kaynak" /></label>
            </div>
            <button className="btn primary" disabled={busy || bGive === bWant || (mine?.res?.[bGive] ?? 0) < bankRate(bGive)} onClick={() => send('cbank', { cat: { give: bGive, want: bWant } })}>{bankRate(bGive)}:1 takas yap</button>
          </section>

          {!g.offer && (
            <section className="ct-panel" aria-label="Oyuncular arası teklif">
              <h3 className="ct-h">Oyunculara teklif</h3>
              <p className="ct-sub">Verirsin</p>
              <div className="ct-counts">
                {RES.map((r) => <Count key={`g${r}`} icon={ICO[r]} label={RES_TR[r]} value={og[r]} max={mine?.res?.[r] ?? 0} onChange={(v) => setOg({ ...og, [r]: v })} />)}
              </div>
              <p className="ct-sub">Alırsın</p>
              <div className="ct-counts">
                {RES.map((r) => <Count key={`w${r}`} icon={ICO[r]} label={RES_TR[r]} value={ow[r]} max={5} onChange={(v) => setOw({ ...ow, [r]: v })} />)}
              </div>
              <button className="btn primary" disabled={busy || sum(og) < 1 || sum(ow) < 1} onClick={() => { send('coffer', { cat: { give: og, want: ow } }); setOg(zero()); setOw(zero()); }}>Teklifi yayınla</button>
            </section>
          )}
        </>
      )}

      {!g.over && g.offer && seated && (
        <section className="ct-panel" aria-label="Açık teklif">
          <h3 className="ct-h">Ticaret teklifi</h3>
          <p className="ct-offer"><b>{nm(g.offer.from)}</b> veriyor: <span>{offerTxt(g.offer.give)}</span> · istiyor: <span>{offerTxt(g.offer.want)}</span></p>
          {g.offer.from === me && (
            <>
              <div className="ct-col">
                {g.offer.acc.length === 0 && <p className="ct-hint">Henüz kabul eden yok.</p>}
                {g.offer.acc.map((p) => (
                  <button key={p} type="button" className="btn primary" disabled={busy} onClick={() => send('cpick', { cat: { with: p } })}>{nm(p)} ile takas et</button>
                ))}
              </div>
              <button className="btn" disabled={busy} onClick={() => send('cclose')}>Teklifi kapat</button>
            </>
          )}
          {g.offer.from !== me && (
            g.offer.acc.includes(me)
              ? <p className="ct-hint">Kabul ettin; {nm(g.offer.from)} onayını bekliyor.</p>
              : <button className="btn primary" disabled={busy} onClick={() => send('cacc')}>Teklifi kabul et</button>
          )}
        </section>
      )}

      {myTurn && g.phase === 'play' && g.step === 'main' && (
        <button className="btn primary ct-big" disabled={busy} onClick={() => send('cend')}>Turu bitir</button>
      )}

      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && !g.over && (
        <LeaveButton className="ct-leave" busy={busy} onLeave={() => send('leave')} />
      )}
    </div>
  );
}
