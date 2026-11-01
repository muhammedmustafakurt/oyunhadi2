'use client';
import { useEffect, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { PALETTE } from '@/lib/emlak';
import { TERRITORIES, CONT, NEIGH, EDGE_LIST, SYM_TR, validSet } from '@/lib/risk';

// Harita konumları (1000x560). Komşuluk çizgileri lib/risk.js'teki gerçek komşuluktan çizilir; konumlar yalnızca yerleşimdir.
const POS = {
  'Alaska': [60, 110], 'Kuzeybatı Toprakları': [150, 90], 'Grönland': [290, 50], 'Alberta': [120, 175], 'Ontario': [215, 160],
  'Quebec': [300, 170], 'Batı ABD': [120, 240], 'Doğu ABD': [215, 250], 'Orta Amerika': [170, 320],
  'Venezuela': [245, 355], 'Brezilya': [300, 410], 'Peru': [235, 420], 'Arjantin': [260, 490],
  'İzlanda': [400, 110], 'İngiltere': [430, 170], 'Kuzey Avrupa': [500, 160], 'İskandinavya': [500, 100], 'Batı Avrupa': [440, 230],
  'Güney Avrupa': [510, 230], 'Ukrayna': [580, 160],
  'Kuzey Afrika': [450, 330], 'Mısır': [530, 320], 'Doğu Afrika': [570, 390], 'Kongo': [500, 400], 'Güney Afrika': [530, 490], 'Madagaskar': [600, 470],
  'Ural': [660, 130], 'Sibirya': [740, 100], 'Yakutsk': [820, 70], 'İrkutsk': [780, 160], 'Kamçatka': [890, 90], 'Moğolistan': [820, 190],
  'Japonya': [900, 190], 'Çin': [760, 250], 'Afganistan': [650, 200], 'Orta Doğu': [600, 270], 'Hindistan': [700, 290], 'Siyam': [790, 320],
  'Endonezya': [800, 400], 'Yeni Gine': [880, 410], 'Batı Avustralya': [820, 480], 'Doğu Avustralya': [900, 490],
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

  // Her sunucu güncellemesinde hedef ve kart seçimi sıfırlanır; bölge seçimi kalır.
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

  return (
    <div className="rk">
      <p className="mono-where rk-turn">{turnText}</p>
      <ul className="rk-players">
        {room.seats.map((s, p) => (
          <li key={p} className={`rk-pl${p === g.turn && !g.over ? ' on' : ''}${s.left || !g.alive[p] ? ' out' : ''}`}>
            <i className="av" style={{ background: colorOf(p) }}>{p + 1}</i>
            <span>{s.name}{p === me ? ' (sen)' : ''}</span>
            <small>{g.alive[p] ? `${owned(p)} bölge · ${g.counts?.[p] ?? 0} kart` : 'elendi'}</small>
          </li>
        ))}
      </ul>

      <svg viewBox="0 0 1000 560" className="rk-map" role="img" aria-label="Dünya haritası">
        {EDGE_LIST.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={POS[TERRITORIES[a]][0]} y1={POS[TERRITORIES[a]][1]} x2={POS[TERRITORIES[b]][0]} y2={POS[TERRITORIES[b]][1]} className="rk-edge" />
        ))}
        {TERRITORIES.map((name, i) => {
          const [x, y] = POS[name];
          const cls = ['rk-t', i === t && 'sel', i === to && 'tg'].filter(Boolean).join(' ');
          return (
            <g key={name} className={cls} onClick={() => onMap(i)} role="button" aria-label={`${name}, ${g.armies[i]} ordu`}>
              <circle cx={x} cy={y} r={22} fill={colorOf(g.owner[i])} />
              <text x={x} y={y} dy="0.35em">{g.armies[i]}</text>
            </g>
          );
        })}
      </svg>

      <div className="rk-info">
        {sel ? (
          <p>
            <b>{sel.name}</b> · {nameOf(sel.owner)} · {sel.armies} ordu
            {to !== null && <> → <b>{TERRITORIES[to]}</b></>}
          </p>
        ) : <p className="muted">Haritadan bir bölge seçin.</p>}
        <p className="muted">Kıtalar: {CONT.map((c) => `${c.name} +${c.bonus}`).join(' · ')}</p>
        {g.last && <p className="muted">Son savaş: {TERRITORIES[g.last.from]} → {TERRITORIES[g.last.to]} · sen {g.last.aLost} kayıp, rakip {g.last.dLost} kayıp{g.last.won ? ' · fethedildi' : ''}</p>}
        {g.note && <p className="muted rk-note">{g.note}</p>}
      </div>

      {seated && myTurn && g.phase === 'reinforce' && (
        <div className="rk-box">
          {tradeNeeded && <p className="mono-err">5 ya da daha fazla kartınız var; takviyeden önce bir set takas edin.</p>}
          <div className="rk-cards">
            {hand.map((c, i) => (
              <button key={i} type="button" className={`rk-card${cards.includes(i) ? ' on' : ''}`} onClick={() => toggleCard(i)} disabled={busy}>
                <b>{SYM_TR[c.k]}</b>
                <small>{c.t === null ? 'Joker' : TERRITORIES[c.t]}</small>
              </button>
            ))}
          </div>
          {hand.length >= 3 && (
            <button className="btn sm" disabled={busy || !canTrade} onClick={() => { send('rtrade', { cards }); }}>
              Seçilen 3 kartı takas et
            </button>
          )}
          <div className="rk-row">
            <input type="number" min={1} max={g.pool} value={deployN} onChange={(e) => setN(Number(e.target.value))} aria-label="Ordu sayısı" />
            <button className="btn primary" disabled={busy || t === null || tradeNeeded} onClick={() => send('rdeploy', { t, n: deployN })}>
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
              <span>Fethedilen bölgeye ek ordu taşı (0-{g.pending.max}):</span>
              <input type="number" min={0} max={g.pending.max} value={mv} onChange={(e) => setMv(Number(e.target.value))} aria-label="Ek ordu" />
              <button className="btn sm" disabled={busy} onClick={() => send('rmove', { n: Math.min(Math.max(0, mv), g.pending.max) })}>Taşı</button>
            </div>
          )}
          {t !== null && sel.armies >= 2 && (
            <div className="rk-row">
              <span>Zar:</span>
              {Array.from({ length: maxDice }, (_, i) => i + 1).map((d) => (
                <button key={d} type="button" className={`btn sm${k === d ? ' primary' : ''}`} onClick={() => setDice(d)}>{d}</button>
              ))}
            </div>
          )}
          <div className="rk-row">
            <button className="btn primary" disabled={busy || t === null || to === null || sel.armies < 2} onClick={() => send('rattack', { from: t, to, dice: k })}>
              {to === null ? 'Komşu bir düşman bölgeye tıklayın' : `${TERRITORIES[to]} saldır`}
            </button>
            <button className="btn sm" disabled={busy} onClick={() => send('rendattack')}>Saldırıyı bitir</button>
          </div>
        </div>
      )}

      {seated && myTurn && g.phase === 'fortify' && (
        <div className="rk-box">
          <div className="rk-row">
            <input type="number" min={1} max={sel ? Math.max(1, sel.armies - 1) : 1} value={n ?? 1} onChange={(e) => setN(Number(e.target.value))} aria-label="Taşınacak ordu" />
            <button className="btn primary" disabled={busy || t === null || to === null} onClick={() => send('rfortify', { from: t, to, n: Math.max(1, n ?? 1) })}>
              {t !== null && to !== null ? `${TERRITORIES[t]} → ${TERRITORIES[to]} taşı` : 'Kaynak ve hedef seçin'}
            </button>
          </div>
        </div>
      )}

      {seated && myTurn && (g.phase === 'attack' || g.phase === 'fortify') && (
        <button className="btn sm" disabled={busy} onClick={() => send('rendturn')}>Turu bitir</button>
      )}

      {err && <p className="mono-err" role="alert">{err}</p>}

      {seated && !g.over && (
        sure
          ? <button className="btn sm danger" disabled={busy} onClick={() => { setSure(false); send('leave'); }}>Evet, oyunu bırak</button>
          : <button className="btn sm" onClick={() => setSure(true)}>Masadan ayrıl</button>
      )}
      {g.over && seated && <button className="btn sm" disabled={busy} onClick={() => send('reset')}>Rövanş (lobiye dön)</button>}
    </div>
  );
}

// Saldırı hedefi: seçili bölgenin komşusu mu.
function NEIGH_OK(from, to) {
  return NEIGH[from].includes(to);
}
