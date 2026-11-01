'use client';
import { useEffect, useRef, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { PALETTE } from '@/lib/emlak';
import { TERRITORIES, CONT, NEIGH, EDGE_LIST, SYM_TR, validSet } from '@/lib/risk';

// Harita konumları (1000x560). Komşuluk çizgileri lib/risk.js'teki gerçek komşuluktan çizilir; konumlar yalnızca yerleşimdir.
const POS = {
  'Alaska': [55, 105], 'Kuzeybatı Toprakları': [165, 70], 'Grönland': [290, 50], 'Alberta': [120, 175], 'Ontario': [215, 160],
  'Quebec': [300, 170], 'Batı ABD': [125, 255], 'Doğu ABD': [220, 260], 'Orta Amerika': [175, 330],
  'Venezuela': [245, 355], 'Brezilya': [320, 410], 'Peru': [235, 420], 'Arjantin': [260, 490],
  'İzlanda': [400, 110], 'İngiltere': [430, 170], 'Kuzey Avrupa': [505, 165], 'İskandinavya': [500, 100], 'Batı Avrupa': [430, 252],
  'Güney Avrupa': [540, 252], 'Ukrayna': [605, 160],
  'Kuzey Afrika': [450, 340], 'Mısır': [545, 335], 'Doğu Afrika': [570, 390], 'Kongo': [500, 400], 'Güney Afrika': [530, 490], 'Madagaskar': [600, 470],
  'Ural': [660, 130], 'Sibirya': [740, 100], 'Yakutsk': [820, 70], 'İrkutsk': [780, 160], 'Kamçatka': [890, 90], 'Moğolistan': [838, 200],
  'Japonya': [925, 215], 'Çin': [760, 250], 'Afganistan': [650, 200], 'Orta Doğu': [630, 290], 'Hindistan': [725, 300], 'Siyam': [790, 320],
  'Endonezya': [800, 400], 'Yeni Gine': [880, 410], 'Batı Avustralya': [805, 485], 'Doğu Avustralya': [915, 490],
};
const NEUTRAL = '#9a9a9a';

// Masada Risk: sıra sahibi takviye, saldırı ve manevra yapar; kart takası takviyeden önce yapılır.
// Zarlar ve kurallar sunucuda işlenir; buradaki kontroller yalnızca hamle seçimini kolaylaştırır.
export default function RiskOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'risk', pollMs: 1500 });
  const { room, err, busy, send } = ui;
  const [t, setT] = useState(null); // seçili bölge (kendi bölgeniz)
  const [to, setTo] = useState(null); // hedef bölge (saldırı ya da manevra)
  const [dice, setDice] = useState(null);
  const [n, setN] = useState(null);
  const [mv, setMv] = useState(0);
  const [cards, setCards] = useState([]);
  const [sure, setSure] = useState(false);
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef(null);

  // Her sunucu güncellemesinde hedef ve kart seçimi sıfırlanır; bölge seçimi kalır.
  useEffect(() => { try { if (window.innerWidth < 700) setZoom(2); } catch {} }, []);
  // Seçilen bölge görünür kalsın: harita kaydırılabilir kutuda seçime ortalanır.
  useEffect(() => {
    const el = scrollRef.current; const f = to ?? t;
    if (!el || f === null || el.scrollWidth <= el.clientWidth + 2) return;
    const [x, y] = POS[TERRITORIES[f]];
    const k = el.scrollWidth / 1000;
    el.scrollTo({ left: x * k - el.clientWidth / 2, top: y * k - el.clientHeight / 2, behavior: "smooth" });
  }, [t, to, zoom]);
  useEffect(() => { setTo(null); setCards([]); setMv(0); }, [room?.version]);

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={6} min={2}
        seatNote={(k) => (k === 0 ? 'Masayı açan' : '')}
      />
    );
  }

  const g = room.game;
  const me = room.me;
  const seated = me >= 0 && !room.seats[me]?.left;
  const myTurn = seated && !g.over && g.turn === me;
  const nameOf = (p) => (p < 0 ? 'Tarafsız' : room.seats[p]?.name ?? `${p + 1}. oyuncu`);
  const colorOf = (p) => (p < 0 ? NEUTRAL : PALETTE[p % PALETTE.length]);
  const owned = (p) => g.owner.reduce((c, o) => c + (o === p ? 1 : 0), 0);
  const hand = seated ? g.hands[me] ?? [] : [];

  const onMap = (i) => {
    if (!myTurn) return;
    const mine = g.owner[i] === me;
    if (g.phase === 'attack') {
      if (mine) { setT(i); setTo(null); return; }
      if (t !== null && NEIGH_OK(t, i)) setTo(i);
      return;
    }
    if (g.phase === 'fortify') {
      if (!mine) return;
      if (t === null || t === i) setT(i); else setTo(i);
      return;
    }
    if (mine) setT(i);
  };

  const sel = t !== null ? { name: TERRITORIES[t], armies: g.armies[t], owner: g.owner[t] } : null;
  const maxDice = sel ? Math.min(3, sel.armies - 1) : 0;
  const k = Math.min(dice ?? maxDice, maxDice);
  const deployN = Math.min(Math.max(1, n ?? g.pool), g.pool);
  const pickedCards = cards.map((i) => hand[i]).filter(Boolean);
  const canTrade = cards.length === 3 && pickedCards.length === 3 && validSet(pickedCards);
  const toggleCard = (i) => setCards((c) => (c.includes(i) ? c.filter((x) => x !== i) : c.length < 3 ? [...c, i] : c));
  const tradeNeeded = hand.length >= 5;

  let turnText = '';
  if (g.over) turnText = g.over;
  else if (!seated) turnText = 'Oyun başladı; izleyici olarak takip ediyorsunuz.';
  else if (!myTurn) turnText = `${nameOf(g.turn)} oynuyor…`;
  else if (g.phase === 'setup') turnText = 'Sıra sizde: kendi bölgenize bir ordu yerleştirin.';
  else if (g.phase === 'reinforce') turnText = `Takviye: ${g.pool} ordunuz var.`;
  else if (g.phase === 'attack') turnText = 'Saldırı: kendi bölgenizi seçin, sonra komşu bir bölgeye saldırın.';
  else if (g.phase === 'fortify') turnText = 'Manevra: bir kez, kendi bölgeleriniz arasında ordu taşıyabilirsiniz.';

  // Seçime göre vurgulanacak aday bölgeler (saldırıda komşu düşmanlar, manevrada kendi bölgeler).
  const cand = new Set();
  if (myTurn && t !== null) {
    if (g.phase === 'attack') NEIGH[t].forEach((x) => { if (g.owner[x] !== me) cand.add(x); });
    if (g.phase === 'fortify') g.owner.forEach((o, x) => { if (o === me && x !== t) cand.add(x); });
  }
  const armiesOf = (p) => g.owner.reduce((c, o, i) => c + (o === p ? g.armies[i] : 0), 0);
  const STEPS = [['reinforce', 'Takviye'], ['attack', 'Saldırı'], ['fortify', 'Manevra']];
  const stepIdx = STEPS.findIndex(([k2]) => k2 === g.phase);
  const last = g.last;
  const zoomIn = () => setZoom((z) => Math.min(3, +(z + 0.5).toFixed(1)));
  const zoomOut = () => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)));

  return (
    <div className="rk">
      <p className={`rk-turn${myTurn ? ' mine' : ''}`}>{turnText}</p>

      {!g.over && (
        g.phase === 'setup' ? (
          <div className="rk-steps"><span className="on">Kurulum</span></div>
        ) : (
          <ol className="rk-steps" aria-label="Tur aşaması">
            {STEPS.map(([key, lbl], i) => (
              <li key={key} className={i === stepIdx ? 'on' : i < stepIdx ? 'done' : ''}><b>{i + 1}</b> {lbl}</li>
            ))}
          </ol>
        )
      )}

      <ul className="rk-players">
        {room.seats.map((s, p) => (
          <li key={p} className={`rk-pl${p === g.turn && !g.over ? ' on' : ''}${s.left || !g.alive[p] ? ' out' : ''}`}>
            <i className="av" style={{ background: colorOf(p) }}>{p + 1}</i>
            <span className="rk-nm">{s.name}{p === me ? ' (sen)' : ''}</span>
            <small>{g.alive[p] ? `${owned(p)} bölge · ${armiesOf(p)} ordu · ${g.counts?.[p] ?? 0} kart` : 'elendi'}</small>
          </li>
        ))}
      </ul>

      <div className="rk-mapbox">
        <div className="rk-zoom" role="group" aria-label="Yakınlaştır">
          <button type="button" onClick={zoomOut} disabled={zoom <= 1} aria-label="Uzaklaştır">−</button>
          <button type="button" onClick={zoomIn} disabled={zoom >= 3} aria-label="Yakınlaştır">+</button>
        </div>
        <div className="rk-scroll" ref={scrollRef}>
          <svg viewBox="0 0 1000 560" className="rk-map" style={{ width: `${zoom * 100}%` }} role="group" aria-label="Dünya haritası">
            {EDGE_LIST.map(([a, b]) => {
              const hot = t !== null && ((a === t && cand.has(b)) || (b === t && cand.has(a)));
              return <line key={`${a}-${b}`} x1={POS[TERRITORIES[a]][0]} y1={POS[TERRITORIES[a]][1]} x2={POS[TERRITORIES[b]][0]} y2={POS[TERRITORIES[b]][1]} className={`rk-edge${hot ? ' hot' : ''}`} />;
            })}
            {TERRITORIES.map((name, i) => {
              const [x, y] = POS[name];
              const cls = ['rk-t', i === t && 'sel', i === to && 'tg', cand.has(i) && 'cand'].filter(Boolean).join(' ');
              return (
                <g key={name} className={cls} onClick={() => onMap(i)} role="button" aria-label={`${name}, ${g.armies[i]} ordu, ${nameOf(g.owner[i])}`}>
                  <circle className="rk-hit" cx={x} cy={y} r={34} />
                  {(i === t || i === to || cand.has(i)) && <circle className="rk-ring" cx={x} cy={y} r={32} />}
                  <circle className="rk-dot" cx={x} cy={y} r={26} fill={colorOf(g.owner[i])} />
                  <text className="rk-n" x={x} y={y} dy="0.36em">{g.armies[i]}</text>
                  <text className="rk-name" x={x} y={y + 41}>{name}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="rk-info">
        {sel ? (
          <p className="rk-sel">
            <i className="rk-sw" style={{ background: colorOf(sel.owner) }} />
            <b>{sel.name}</b> · {nameOf(sel.owner)} · {sel.armies} ordu
            {to !== null && <> <span className="rk-arrow">→</span> <b>{TERRITORIES[to]}</b> · {g.armies[to]} ordu</>}
          </p>
        ) : <p className="muted">{myTurn ? 'Haritadan bir bölge seçin.' : 'Haritada bölgelere dokunarak bilgi alabilirsiniz.'}</p>}
        {g.note && <p className="muted rk-note">{g.note}</p>}
      </div>

      {last && (
        <div className="rk-battle" aria-live="polite">
          <div className="rk-bh">
            <b>Son savaş</b>
            <span>{TERRITORIES[last.from]} → {TERRITORIES[last.to]}</span>
          </div>
          <div className="rk-dice">
            <div className="rk-dg"><small>{nameOf(last.by)}</small>{last.a.map((v, i) => <span key={i} className="rk-die att">{v}</span>)}</div>
            <div className="rk-dg"><small>Savunma</small>{last.d.map((v, i) => <span key={i} className="rk-die def">{v}</span>)}</div>
          </div>
          <p className="rk-res">
            Saldıran −{last.aLost} · Savunan −{last.dLost}{last.won ? <b className="rk-won"> · Fethedildi!</b> : null}
          </p>
        </div>
      )}

      {seated && myTurn && g.phase === 'reinforce' && (
        <div className="rk-box">
          {tradeNeeded && <p className="mono-err">5 ya da daha fazla kartınız var; takviyeden önce bir set takas edin.</p>}
          {hand.length > 0 && (
            <>
              <p className="rk-h">Kartlarınız ({hand.length}) · takas için 3 seçin</p>
              <div className="rk-cards">
                {hand.map((c, i) => (
                  <button key={i} type="button" className={`rk-card${cards.includes(i) ? ' on' : ''}`} onClick={() => toggleCard(i)} disabled={busy}>
                    <b>{SYM_TR[c.k]}</b>
                    <small>{c.t === null ? 'Joker' : TERRITORIES[c.t]}</small>
                  </button>
                ))}
              </div>
            </>
          )}
          {hand.length >= 3 && (
            <button className="btn" disabled={busy || !canTrade} onClick={() => { send('rtrade', { cards }); }}>
              Seçilen 3 kartı takas et
            </button>
          )}
          <div className="rk-row">
            <Stepper value={deployN} min={1} max={g.pool} onChange={setN} label="Ordu sayısı" />
            <button className="btn primary rk-grow" disabled={busy || t === null || tradeNeeded} onClick={() => send('rdeploy', { t, n: deployN })}>
              {t === null ? 'Önce bir bölge seçin' : `${sel.name} bölgesine yerleştir`}
            </button>
          </div>
        </div>
      )}

      {seated && myTurn && g.phase === 'setup' && (
        <div className="rk-box">
          <button className="btn primary" disabled={busy || t === null} onClick={() => send('rdeploy', { t })}>
            {t === null ? 'Önce kendi bölgenizi seçin' : `${sel.name} bölgesine bir ordu koy`}
          </button>
        </div>
      )}

      {seated && myTurn && g.phase === 'attack' && (
        <div className="rk-box">
          {g.pending && (
            <div className="rk-row">
              <span className="rk-grow">Fethedilen bölgeye ek ordu taşı (0-{g.pending.max}):</span>
              <Stepper value={Math.min(mv, g.pending.max)} min={0} max={g.pending.max} onChange={setMv} label="Ek ordu" />
              <button className="btn" disabled={busy} onClick={() => send('rmove', { n: Math.min(Math.max(0, mv), g.pending.max) })}>Taşı</button>
            </div>
          )}
          {t !== null && sel.armies >= 2 && (
            <div className="rk-row">
              <span>Zar sayısı:</span>
              <div className="rk-dsel">
                {Array.from({ length: maxDice }, (_, i) => i + 1).map((d) => (
                  <button key={d} type="button" className={k === d ? 'on' : ''} onClick={() => setDice(d)} aria-pressed={k === d}>{d}</button>
                ))}
              </div>
            </div>
          )}
          <button className="btn primary" disabled={busy || t === null || to === null || sel.armies < 2} onClick={() => send('rattack', { from: t, to, dice: k })}>
            {to === null ? 'Komşu bir düşman bölgeye dokunun' : `${TERRITORIES[to]} bölgesine saldır`}
          </button>
        </div>
      )}

      {seated && myTurn && g.phase === 'fortify' && (
        <div className="rk-box">
          <div className="rk-row">
            <Stepper value={Math.min(Math.max(1, n ?? 1), sel ? Math.max(1, sel.armies - 1) : 1)} min={1} max={sel ? Math.max(1, sel.armies - 1) : 1} onChange={setN} label="Taşınacak ordu" />
            <button className="btn primary rk-grow" disabled={busy || t === null || to === null} onClick={() => send('rfortify', { from: t, to, n: Math.max(1, n ?? 1) })}>
              {t !== null && to !== null ? `${TERRITORIES[t]} → ${TERRITORIES[to]} taşı` : 'Kaynak ve hedef seçin'}
            </button>
          </div>
        </div>
      )}

      {seated && myTurn && (g.phase === 'attack' || g.phase === 'fortify') && (
        <button className="btn rk-end" disabled={busy} onClick={() => send(g.phase === 'attack' ? 'rendattack' : 'rendturn')}>
          {g.phase === 'attack' ? 'Saldırıyı bitir' : 'Turu bitir'}
        </button>
      )}
      {seated && myTurn && g.phase === 'attack' && (
        <button className="btn rk-end" disabled={busy} onClick={() => send('rendturn')}>Turu bitir</button>
      )}

      {err && <p className="mono-err" role="alert">{err}</p>}

      {seated && !g.over && (
        sure
          ? <button className="btn danger" disabled={busy} onClick={() => { setSure(false); send('leave'); }}>Evet, oyunu bırak</button>
          : <button className="btn" onClick={() => setSure(true)}>Masadan ayrıl</button>
      )}
      {g.over && seated && <button className="btn" disabled={busy} onClick={() => send('reset')}>Rövanş (lobiye dön)</button>}
    </div>
  );
}

// Artı/eksi düğmeli sayı seçici (telefonda büyük dokunma hedefi).
function Stepper({ value, min, max, onChange, label }) {
  return (
    <div className="rk-step" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Azalt">−</button>
      <output>{value}</output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Artır">+</button>
    </div>
  );
}

// Saldırı hedefi: seçili bölgenin komşusu mu.
function NEIGH_OK(from, to) {
  return NEIGH[from].includes(to);
}
