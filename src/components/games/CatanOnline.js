'use client';
import { useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { PALETTE } from '@/lib/emlak';
import { layout, RES, RES_TR, COST, WIN } from '@/lib/catan';

// Arazi renkleri ve Türkçe adları.
const TERR = { lumber: '#3f7a43', wool: '#a9cf72', grain: '#e6c65a', brick: '#c45c35', ore: '#8d96a3', desert: '#e9dcb0' };
const TERR_TR = { lumber: 'Odun', wool: 'Koyun', grain: 'Buğday', brick: 'Tuğla', ore: 'Cevher', desert: 'Çöl' };
const DEV_TR = { knight: 'Şövalye', road: 'Yol inşası', plenty: 'Bolluk', mono: 'Tekel', vp: 'Zafer puanı' };
const STEP_TR = { settle: 'köy', road: 'yol' };
const COST_TXT = (c) => Object.entries(c).map(([r, n]) => `${n} ${RES_TR[r]}`).join(', ');

const LAY = layout();
const DEG = [30, 90, 150, 210, 270, 330];
const HEX_PTS = LAY.hexes.map((h) => DEG.map((d) => `${(h.x + Math.cos((d * Math.PI) / 180)).toFixed(3)},${(h.y + Math.sin((d * Math.PI) / 180)).toFixed(3)}`).join(' '));
const XS = LAY.verts.map((v) => v.x), YS = LAY.verts.map((v) => v.y);
const VB = `${(Math.min(...XS) - 1.2).toFixed(2)} ${(Math.min(...YS) - 1.2).toFixed(2)} ${(Math.max(...XS) - Math.min(...XS) + 2.4).toFixed(2)} ${(Math.max(...YS) - Math.min(...YS) + 2.4).toFixed(2)}`;
const zero = () => Object.fromEntries(RES.map((r) => [r, 0]));

// Sayaçlı giriş (kaynak seçimi için).
function Count({ label, value, max, onChange }) {
  return (
    <div className="ct-count">
      <span>{label}</span>
      <button type="button" className="btn sm" disabled={value <= 0} onClick={() => onChange(value - 1)} aria-label={`${label} azalt`}>−</button>
      <b>{value}</b>
      <button type="button" className="btn sm" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`${label} artır`}>+</button>
    </div>
  );
}

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
    if (g.step === 'roll') return myTurn ? 'Zar atmak için dokun.' : `${nm(g.turn)} zar atıyor.`;
    if (g.step === 'discard') return needMe ? `Yedi geldi: ${needMe.n} kart atmalısın.` : 'Yedi geldi: bazı oyuncular kart atıyor.';
    if (g.step === 'robber') return myTurn ? 'Hırsızı bir araziye taşı.' : `${nm(g.turn)} hırsızı taşıyor.`;
    return myTurn ? 'Sıran: yapı kur, ticaret yap ya da turu bitir.' : `${nm(g.turn)} oynuyor.`;
  })();

  const pts = (hex) => (hex.n ? <text x={hex.x} y={hex.y + 0.1} textAnchor="middle" fontSize="0.32" fontWeight="700" fill={hex.n === 6 || hex.n === 8 ? '#b3261e' : '#2b2118'}>{hex.n}</text> : null);

  return (
    <div className="ct">

      <p className="ct-status" role="status">{status}</p>
      {g.dice && <p className="ct-hint">Son zar: {g.dice[0]} + {g.dice[1]} = {g.dice[0] + g.dice[1]}</p>}

      <svg viewBox={VB} className="ct-board" role="img" aria-label="Catan tahtası">
        {LAY.hexes.map((h, i) => (
          <polygon key={`h${i}`} points={HEX_PTS[i]} className="ct-hex" fill={TERR[g.hexes[i].t]} />
        ))}
        {LAY.hexes.map((h, i) => (
          <polygon key={`hit${i}`} points={HEX_PTS[i]} className="ct-hit" fill="transparent" onClick={() => onHex(i)} />
        ))}
        {LAY.hexes.map((h, i) => (g.hexes[i].n ? (
          <g key={`n${i}`}>
            <circle cx={h.x} cy={h.y} r="0.34" fill="#fbf6e9" stroke="#5b4630" strokeWidth="0.02" />
            {pts({ ...h, n: g.hexes[i].n })}
          </g>
        ) : null))}
        {g.ports.map((pt, i) => {
          const [a, b] = LAY.edges[pt.e];
          const mx = (LAY.verts[a].x + LAY.verts[b].x) / 2, my = (LAY.verts[a].y + LAY.verts[b].y) / 2;
          const len = Math.hypot(mx, my) || 1;
          const lx = mx + (mx / len) * 0.5, ly = my + (my / len) * 0.5;
          return (
            <g key={`p${i}`}>
              <line x1={mx} y1={my} x2={lx} y2={ly} stroke="#5b4630" strokeWidth="0.04" />
              <text x={lx} y={ly} textAnchor="middle" fontSize="0.2" fill="#2b2118">{pt.t === 'any' ? '3:1' : `2:1 ${TERR_TR[pt.t]}`}</text>
            </g>
          );
        })}
        {LAY.edges.map(([a, b], e) => {
          const o = g.eb[e];
          const x1 = LAY.verts[a].x, y1 = LAY.verts[a].y, x2 = LAY.verts[b].x, y2 = LAY.verts[b].y;
          return (
            <g key={`e${e}`}>
              {o !== null && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={PALETTE[o % PALETTE.length]} strokeWidth="0.13" strokeLinecap="round" />}
              {o === null && ((bm === 'road' && legal.road.includes(e)) || bm === 'free') && (
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={free.includes(e) ? '#ffb000' : '#fff'} strokeWidth="0.12" strokeOpacity=".8" strokeLinecap="round" />
              )}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="0.3" className="ct-hit" onClick={() => onEdge(e)} />
            </g>
          );
        })}
        {LAY.verts.map((v, i) => {
          const o = g.vb[i];
          const cand = (bm === 'settle' && legal.settle.includes(i)) || (bm === 'city' && legal.city.includes(i));
          return (
            <g key={`v${i}`}>
              {o && !o.c && <circle cx={v.x} cy={v.y} r="0.15" fill={PALETTE[o.p % PALETTE.length]} stroke="#222" strokeWidth="0.04" />}
              {o && o.c && <rect x={v.x - 0.17} y={v.y - 0.17} width="0.34" height="0.34" fill={PALETTE[o.p % PALETTE.length]} stroke="#222" strokeWidth="0.05" />}
              {cand && <circle cx={v.x} cy={v.y} r="0.13" className={`ct-cand${bm === 'city' ? ' r' : ''}`} onClick={() => onVertex(i)} />}
            </g>
          );
        })}
        <g>
          {LAY.hexes.map((h, i) => (i === g.robber ? (
            <g key="rob" pointerEvents="none">
              <circle cx={h.x} cy={h.y} r="0.2" fill="#1d1d1d" opacity=".85" />
            </g>
          ) : null))}
          {robHex !== null && <circle cx={LAY.hexes[robHex].x} cy={LAY.hexes[robHex].y} r="0.2" fill="none" stroke="#b3261e" strokeWidth="0.06" pointerEvents="none" />}
        </g>
      </svg>

      {g.over && (
        <section className="ct-panel" role="status">
          <p className="ct-status">{g.over}</p>
          <ol className="ct-score">
            {names.map((n, p) => (
              <li key={p}><span className="sw" style={{ background: PALETTE[p % PALETTE.length] }} />{n}: {P[p].pub} puan{p === g.winner ? ' (kazanan)' : ''}</li>
            ))}
          </ol>
          <button className="btn primary" disabled={busy} onClick={() => send('reset')}>Yeni oyun (lobiye dön)</button>
        </section>
      )}

      {!g.over && (
        <ul className="ct-score" aria-label="Puan durumu">
          {names.map((n, p) => (
            <li key={p} style={{ opacity: room.seats[p]?.left ? 0.45 : 1 }}>
              <span className="sw" style={{ background: PALETTE[p % PALETTE.length] }} />
              <b>{n}{p === me ? ' (sen)' : ''}</b>
              <span>{P[p].pub} puan</span>
              <span className="ct-tag">{P[p].cards} kart · {P[p].devN} gelişim · {P[p].k} şövalye</span>
              {g.lr === p && <span className="ct-tag">en uzun yol</span>}
              {g.la === p && <span className="ct-tag">en büyük ordu</span>}
              {g.turn === p && <span className="ct-tag">◀ sırada</span>}
            </li>
          ))}
        </ul>
      )}

      {!g.over && (
        <p className="ct-hint">Bankada: {RES.map((r) => `${RES_TR[r]} ${g.bank[r]}`).join(' · ')} · Gelişim kartı destesi: {g.devLeft}</p>
      )}

      {!g.over && seated && mine && (
        <section className="ct-panel">
          <div className="ct-cards" aria-label="Kartların">
            {RES.map((r) => <span key={r}>{RES_TR[r]}: {mine.res ? mine.res[r] : 0}</span>)}
          </div>
          {mine.dev && (
            <div className="ct-cards" aria-label="Gelişim kartların">
              {Object.keys(DEV_TR).map((k) => (mine.dev[k] + (mine.devNew?.[k] || 0) > 0 ? (
                <span key={k}>{DEV_TR[k]}: {mine.dev[k]}{mine.devNew?.[k] ? ` (+${mine.devNew[k]} yeni)` : ''}</span>
              ) : null))}
            </div>
          )}
          <p className="ct-hint">Puanın: {P[me].pub} (açık) · Zafer kartların gizli.</p>
        </section>
      )}

      {myTurn && g.phase === 'setup' && (
        <section className="ct-panel">
          <div className="ct-row">
            {g.step === 'settle' && <span className="ct-hint">Tahtada yeşil noktalara köy koyabilirsin.</span>}
            {g.step === 'road' && <span className="ct-hint">Son köyüne bağlı bir yol seç.</span>}
          </div>
        </section>
      )}

      {myTurn && g.phase === 'play' && g.step === 'roll' && (
        <button className="btn primary" disabled={busy} onClick={() => send('croll')}>Zar at</button>
      )}

      {needMe && (
        <section className="ct-panel" aria-label="Kart atma">
          <p className="ct-hint">{needMe.n} kart seç ve bankaya at (seçilen: {sum(disc)} / {needMe.n}).</p>
          <div className="ct-row">
            {RES.map((r) => (
              <Count key={r} label={RES_TR[r]} value={disc[r]} max={mine?.res?.[r] ?? 0} onChange={(v) => setDisc({ ...disc, [r]: v })} />
            ))}
          </div>
          <button className="btn primary" disabled={busy || sum(disc) !== needMe.n} onClick={() => { send('cdrop', { cat: { r: disc } }); setDisc(zero()); }}>Kartları at</button>
        </section>
      )}

      {myTurn && g.phase === 'play' && g.step === 'robber' && (
        <section className="ct-panel">
          <p className="ct-hint">Hırsızı taşımak için yukarıdan bir arazi seç.</p>
          {robHex !== null && (
            <>
              {victimsOf(robHex).length > 1 && (
                <div className="ct-row">
                  {victimsOf(robHex).map((p) => (
                    <button key={p} type="button" className={`btn sm${victim === p ? ' primary' : ''}`} onClick={() => setVictim(p)}>{nm(p)}dan çal</button>
                  ))}
                </div>
              )}
              <button className="btn primary" disabled={busy} onClick={sendRobber}>Hırsızı {TERR_TR[g.hexes[robHex].t]} arazisine koy</button>
            </>
          )}
        </section>
      )}

      {armed === 'knight' && myTurn && g.step !== 'robber' && (
        <section className="ct-panel">
          <p className="ct-hint">Şövalye: hırsızı taşıyacağın arazi seç, sonra onayla.</p>
          {robHex !== null && <button className="btn primary" disabled={busy} onClick={sendRobber}>Şövalyeyi oyna</button>}
          <button className="btn sm" onClick={() => { setArmed(null); setRobHex(null); }}>Vazgeç</button>
        </section>
      )}

      {armed === 'road' && myTurn && (
        <section className="ct-panel">
          <p className="ct-hint">Yol inşası: iki yol seç ({free.length} / 2).</p>
          <div className="ct-row">
            <button className="btn primary" disabled={busy || free.length < 1} onClick={() => { send('cplay', { cat: { card: 'road', edges: free } }); setFree([]); setArmed(null); }}>Yolları koy</button>
            <button className="btn sm" onClick={() => { setArmed(null); setFree([]); }}>Vazgeç</button>
          </div>
        </section>
      )}

      {myTurn && g.phase === 'play' && g.step === 'main' && (
        <>
          <section className="ct-panel" aria-label="Yapı">
            <div className="ct-row">
              {['settle', 'city', 'road'].map((m) => (
                <button key={m} type="button" className={`btn sm${build === m ? ' primary' : ''}`} onClick={() => setBuild(m)}>
                  {m === 'settle' ? 'Köy' : m === 'city' ? 'Şehir' : 'Yol'}
                </button>
              ))}
            </div>
            <p className="ct-hint">Köy: {COST_TXT(COST.settle)} · Şehir: {COST_TXT(COST.city)} · Yol: {COST_TXT(COST.road)}. Hedefler tahtada görünür.</p>
            <div className="ct-row">
              <button className="btn sm" disabled={busy} onClick={() => send('cdev')}>Gelişim kartı al ({COST_TXT(COST.dev)})</button>
            </div>
          </section>

          {canDev && mine?.dev && (
            <section className="ct-panel" aria-label="Gelişim kartları">
              <div className="ct-row">
                {mine.dev.knight > 0 && <button className="btn sm" disabled={busy} onClick={() => { setArmed('knight'); setRobHex(null); }}>Şövalye oyna</button>}
                {mine.dev.road > 0 && <button className="btn sm" disabled={busy} onClick={() => { setArmed('road'); setFree([]); }}>Yol inşası oyna</button>}
                {mine.dev.plenty > 0 && (
                  <span className="ct-row">
                    <select value={pick2[0]} onChange={(e) => setPick2([e.target.value, pick2[1]])} aria-label="Bolluk 1">{RES.map((r) => <option key={r} value={r}>{RES_TR[r]}</option>)}</select>
                    <select value={pick2[1]} onChange={(e) => setPick2([pick2[0], e.target.value])} aria-label="Bolluk 2">{RES.map((r) => <option key={r} value={r}>{RES_TR[r]}</option>)}</select>
                    <button className="btn sm" disabled={busy} onClick={() => send('cplay', { cat: { card: 'plenty', picks: pick2 } })}>Bolluk oyna</button>
                  </span>
                )}
                {mine.dev.mono > 0 && (
                  <span className="ct-row">
                    <select value={mono} onChange={(e) => setMono(e.target.value)} aria-label="Tekel kaynağı">{RES.map((r) => <option key={r} value={r}>{RES_TR[r]}</option>)}</select>
                    <button className="btn sm" disabled={busy} onClick={() => send('cplay', { cat: { card: 'mono', res: mono } })}>Tekel oyna</button>
                  </span>
                )}
              </div>
            </section>
          )}

          <section className="ct-panel" aria-label="Banka ticareti">
            <div className="ct-row">
              <span className="ct-hint">Bankaya ver:</span>
              <select value={bGive} onChange={(e) => setBGive(e.target.value)} aria-label="Verilen kaynak">{RES.map((r) => <option key={r} value={r}>{RES_TR[r]}</option>)}</select>
              <span className="ct-hint">al:</span>
              <select value={bWant} onChange={(e) => setBWant(e.target.value)} aria-label="Alınan kaynak">{RES.map((r) => <option key={r} value={r}>{RES_TR[r]}</option>)}</select>
              <button className="btn sm" disabled={busy || bGive === bWant} onClick={() => send('cbank', { cat: { give: bGive, want: bWant } })}>{bankRate(bGive)}:1 takas</button>
            </div>
          </section>

          {!g.offer && (
            <section className="ct-panel" aria-label="Oyuncular arası teklif">
              <p className="ct-hint">Oyunculara teklif: ver ve al sayılarını seç.</p>
              <div className="ct-row">
                <span className="ct-hint">Verirsin</span>
                {RES.map((r) => <Count key={`g${r}`} label={RES_TR[r]} value={og[r]} max={mine?.res?.[r] ?? 0} onChange={(v) => setOg({ ...og, [r]: v })} />)}
              </div>
              <div className="ct-row">
                <span className="ct-hint">Alırsın</span>
                {RES.map((r) => <Count key={`w${r}`} label={RES_TR[r]} value={ow[r]} max={5} onChange={(v) => setOw({ ...ow, [r]: v })} />)}
              </div>
              <button className="btn sm primary" disabled={busy || sum(og) < 1 || sum(ow) < 1} onClick={() => { send('coffer', { cat: { give: og, want: ow } }); setOg(zero()); setOw(zero()); }}>Teklifi yayınla</button>
            </section>
          )}
        </>
      )}

      {!g.over && g.offer && seated && (
        <section className="ct-panel" aria-label="Açık teklif">
          <p className="ct-hint">
            {nm(g.offer.from)} veriyor: {RES.filter((r) => g.offer.give[r]).map((r) => `${g.offer.give[r]} ${RES_TR[r]}`).join(', ')}
            {' '}— istiyor: {RES.filter((r) => g.offer.want[r]).map((r) => `${g.offer.want[r]} ${RES_TR[r]}`).join(', ')}
          </p>
          {g.offer.from === me && (
            <>
              <div className="ct-row">
                {g.offer.acc.length === 0 && <span className="ct-hint">Henüz kabul eden yok.</span>}
                {g.offer.acc.map((p) => (
                  <button key={p} type="button" className="btn sm primary" disabled={busy} onClick={() => send('cpick', { cat: { with: p } })}>{nm(p)} ile takas et</button>
                ))}
              </div>
              <button className="btn sm" disabled={busy} onClick={() => send('cclose')}>Teklifi kapat</button>
            </>
          )}
          {g.offer.from !== me && (
            g.offer.acc.includes(me)
              ? <p className="ct-hint">Kabul ettin; {nm(g.offer.from)} onayını bekliyor.</p>
              : <button className="btn sm primary" disabled={busy} onClick={() => send('cacc')}>Teklifi kabul et</button>
          )}
        </section>
      )}

      {myTurn && g.phase === 'play' && g.step === 'main' && (
        <button className="btn primary" disabled={busy} onClick={() => send('cend')}>Turu bitir</button>
      )}

      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && !g.over && (
        <button className="btn sm" disabled={busy} onClick={() => send('leave')}>Masadan ayrıl</button>
      )}
    </div>
  );
}

const sum = (o) => RES.reduce((s, r) => s + (o[r] || 0), 0);
