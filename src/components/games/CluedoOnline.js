'use client';
import { useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { PALETTE } from '@/lib/emlak';
import { SUSPECTS, WEAPONS, ROOMS, RING, ROOM0, PASSAGE, MIN_PLAYERS, MAX_PLAYERS, cardName, nodeName } from '@/lib/cluedo';

// Masa Cluedo'su: kendi zarfı ve eli yalnızca sunucudan gelen görünümde vardır. Not defteri yalnızca bu telefonda tutulur.
const CX = 180, CY = 180, RR = 92, RO = 140; // tahta: kavşak halkası (RR) ve odalar (RO)
const ang = (j) => -Math.PI / 2 + (j * 2 * Math.PI) / RING;
const jPt = (j) => [CX + RR * Math.cos(ang(j)), CY + RR * Math.sin(ang(j))];
const rPt = (r) => [CX + RO * Math.cos(ang(r)), CY + RO * Math.sin(ang(r))];
const NOTE_NEXT = { '': 'x', x: '?', '?': '' };
const NOTE_LABEL = { '': '', x: 'Elendi', '?': 'Belki' };
const SUS_OPTS = SUSPECTS.map((n, i) => ({ v: i, t: n }));
const WPN_OPTS = WEAPONS.map((n, i) => ({ v: i, t: n }));
const ROOM_OPTS = ROOMS.map((n, i) => ({ v: i, t: n }));
const ALL_CARDS = [
  ...SUSPECTS.map((n, i) => ({ id: `S${i}`, name: n, kind: 'Şüpheli' })),
  ...WEAPONS.map((n, i) => ({ id: `W${i}`, name: n, kind: 'Silah' })),
  ...ROOMS.map((n, i) => ({ id: `R${i}`, name: n, kind: 'Oda' })),
];

function Board({ g, reach, onPick, cur }) {
  const ringPts = Array.from({ length: RING }, (_, j) => jPt(j));
  const ringPath = ringPts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';
  const at = {};
  g.pos.sus.forEach((p, k) => { (at[p] ??= []).push(k); });
  const tokenAt = (k, x, y, extra = '') => (
    <g key={`t${k}`} className={`cl-tok${cur === k ? ' cur' : ''}${extra}`}>
      <circle cx={x} cy={y} r={8} fill={PALETTE[k % PALETTE.length]} />
      <text x={x} y={y + 3.5} textAnchor="middle">{k + 1}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 360 360" className="cl-map" role="img" aria-label="Tahta: odalar ve oyuncu taşları">
      <path d={ringPath} className="cl-ring" />
      {ringPts.map(([x, y], j) => {
        const [rx, ry] = rPt(j);
        return <line key={`d${j}`} x1={x} y1={y} x2={rx} y2={ry} className="cl-door" />;
      })}
      {ringPts.map(([x, y], j) => {
        const hi = reach.includes(j);
        return (
          <g key={`j${j}`} onClick={hi ? () => onPick(j) : undefined} className={hi ? 'cl-hit' : ''}>
            <circle cx={x} cy={y} r={hi ? 11 : 4} className={hi ? 'cl-junc hi' : 'cl-junc'} />
          </g>
        );
      })}
      {ROOMS.map((name, r) => {
        const [x, y] = rPt(r);
        const hi = reach.includes(ROOM0 + r);
        return (
          <g key={name} onClick={hi ? () => onPick(ROOM0 + r) : undefined} className={hi ? 'cl-hit' : ''}>
            <rect x={x - 38} y={y - 18} width={76} height={36} rx={6} className={`cl-room${hi ? ' hi' : ''}`} />
            <text x={x} y={y - 3} textAnchor="middle" className="cl-rname">{name}</text>
          </g>
        );
      })}
      {Object.entries(at).map(([node, ks]) => {
        const n = Number(node);
        if (n < ROOM0) {
          const [x, y] = jPt(n);
          return ks.map((k, i) => tokenAt(k, x + (i - (ks.length - 1) / 2) * 16, y - 16));
        }
        const [x, y] = rPt(n - ROOM0);
        return ks.map((k, i) => tokenAt(k, x + (i - (ks.length - 1) / 2) * 17, y + 28));
      })}
    </svg>
  );
}

// Tek bir kartı tıklanabilir kutu olarak gösteren not defteri satırı.
function NoteRow({ card, state, onCycle, own }) {
  return (
    <li className={`cl-note${state === 'x' ? ' x' : ''}`}>
      <button type="button" onClick={onCycle} aria-label={`${card.name}: ${NOTE_LABEL[state] || 'işaretsiz'}`}>
        <span className="cl-note-name">{card.name}</span>
        <small>{own ? 'elinde' : NOTE_LABEL[state]}</small>
      </button>
    </li>
  );
}

export default function CluedoOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'cluedo', pollMs: 1000 });
  const { room, err, busy, send } = ui;
  const [notes, setNotes] = useState({});
  const [sg, setSg] = useState({ sus: 0, wpn: 0 });
  const [ac, setAc] = useState({ sus: 0, wpn: 0, rm: 0 });
  const [showNotes, setShowNotes] = useState(false);
  const [showAccuse, setShowAccuse] = useState(false);

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={MAX_PLAYERS} min={MIN_PLAYERS}
        seatNote={(k) => SUSPECTS[k]}
      />
    );
  }

  const g = room.game;
  const names = room.seats.map((s) => s.name);
  const nameOf = (i) => names[i] ?? `Oyuncu ${i + 1}`;
  const me = room.me ?? -1;
  const seated = me >= 0 && !room.seats[me]?.left;
  const meOut = seated && !!g.out?.[me];
  const over = g.over;
  const reach = g.reach || [];
  const isTurn = !over && seated && g.turn === me && !meOut;
  const myRoom = seated && g.pos.sus[me] >= ROOM0 ? g.pos.sus[me] - ROOM0 : null;
  const inRoom = myRoom !== null;
  const canAccuse = isTurn && inRoom && (g.phase === 'roll' || g.phase === 'turn');
  const canSuggest = isTurn && inRoom && g.phase === 'turn' && !g.sugDone;
  const passage = inRoom && PASSAGE[myRoom] !== undefined ? PASSAGE[myRoom] : null;
  const hand = g.hand ?? [];
  const sugCards = g.sugg ? [`S${g.sugg.sus}`, `W${g.sugg.wpn}`, `R${g.sugg.rm}`] : [];
  const matching = g.myRefute ? hand.filter((c) => sugCards.includes(c)) : [];
  const cur = g.turn;

  const weaponsIn = (r) => g.pos.wpn.map((p, k) => (p === ROOM0 + r ? WEAPONS[k] : null)).filter(Boolean);
  const suspectsIn = (r) => g.pos.sus.map((p, k) => (p === ROOM0 + r ? SUSPECTS[k] : null)).filter(Boolean);
  const cycle = (id) => setNotes((n) => ({ ...n, [id]: NOTE_NEXT[n[id] ?? ''] }));

  const doAccuse = () => {
    if (!window.confirm('Suçlama kesindir. Yanlışsa elenirsiniz (yalnızca çürütme yapabilirsiniz). Emin misiniz?')) return;
    send('claccuse', { sus: ac.sus, wpn: ac.wpn, rm: myRoom });
  };

  let status;
  if (over) {
    status = over.winner !== null
      ? `${nameOf(over.winner)} doğru suçlayarak kazandı!`
      : 'Kimse doğru suçlayamadı.';
  } else if (g.phase === 'refute') {
    status = g.myRefute ? 'Tahmininiz çürütülüyor: göstereceğiniz kartı seçin.' : 'Tahmin çürütülmeye çalışılıyor…';
  } else if (meOut) {
    status = 'Elendiniz. Artık yalnızca tahminleri çürütebilirsiniz.';
  } else if (isTurn) {
    status = g.phase === 'roll' ? 'Sıra sizde: zar atın.' : g.phase === 'move' ? 'Gidebileceğiniz bir yer seçin.' : 'Sıra sizde.';
  } else {
    status = `Sıra ${nameOf(cur)}'de.`;
  }

  return (
    <div className="cl">
      {!seated && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}

      <section className="cl-status" role="status">
        <p>{status}</p>
        {g.dice && !over && <p className="cl-dice">Son zar: <b>{g.dice[0]}</b> + <b>{g.dice[1]}</b></p>}
      </section>

      <ul className="cl-players" aria-label="Oyuncular">
        {room.seats.map((s, i) => (
          <li key={i} className={`${i === cur && !over ? 'turn' : ''}${s.left || g.out?.[i] ? ' off' : ''}`}>
            <i className="av" style={{ background: PALETTE[i % PALETTE.length] }}>{i + 1}</i>
            <span>{s.name}{i === me ? ' (sen)' : ''}</span>
            <small>{SUSPECTS[i]}</small>
            {s.left ? <em>ayrıldı</em> : g.out?.[i] ? <em>elendi</em> : null}
          </li>
        ))}
      </ul>

      {g.reveal && (
        <section className="cl-card reveal" role="status">
          <b>Çürütme:</b> {nameOf(g.reveal.by)} size bu kartı gösterdi: <strong>{cardName(g.reveal.card)}</strong>
          <small>Bu bilgiyi yalnızca siz görürsünüz.</small>
        </section>
      )}

      {g.sugg && (
        <p className="cl-last">Son tahmin ({nameOf(g.sugg.by)}): {SUSPECTS[g.sugg.sus]}, {WEAPONS[g.sugg.wpn]}, {ROOMS[g.sugg.rm]}</p>
      )}

      <Board g={g} reach={over ? [] : isTurn && g.phase === 'move' ? reach : []} onPick={(to) => send('clmove', { to })} cur={cur} />

      {over && (
        <section className="cl-card over" role="status">
          <p className="cl-win">{status}</p>
          <p>Zarf: <b>{SUSPECTS[over.env.s]}</b>, <b>{WEAPONS[over.env.w]}</b>, <b>{ROOMS[over.env.r]}</b></p>
        </section>
      )}

      {isTurn && g.phase === 'roll' && (
        <div className="cl-actions">
          <button className="btn primary" disabled={busy} onClick={() => send('clroll')}>Zar at</button>
          {inRoom && <button className="btn" disabled={busy} onClick={() => send('clstay')}>Odada kal, tahmin et</button>}
          {passage !== null && <button className="btn" disabled={busy} onClick={() => send('clpassage')}>Gizli geçit: {ROOMS[passage]}</button>}
        </div>
      )}

      {isTurn && g.phase === 'move' && (
        <p className="cl-hint">Tahtada parlayan bir kavşak ya da odaya dokunun veya listeden seçin.</p>
      )}
      {isTurn && g.phase === 'move' && (
        <div className="cl-actions wrap">
          {reach.map((n) => (
            <button key={n} className="btn sm" disabled={busy} onClick={() => send('clmove', { to: n })}>{nodeName(n)}</button>
          ))}
        </div>
      )}

      {g.myRefute && (
        <section className="cl-card refute">
          <p>Şu kartlardan birini gösterin. Yalnızca tahmin eden görecek:</p>
          <div className="cl-actions wrap">
            {matching.map((c) => (
              <button key={c} className="btn primary" disabled={busy} onClick={() => send('clshow', { card: c })}>{cardName(c)}</button>
            ))}
          </div>
        </section>
      )}

      {canSuggest && (
        <section className="cl-card">
          <h3>Oda tahmini: {ROOMS[myRoom]}</h3>
          <p className="cl-hint">Seçtiğiniz şüpheli ve silah bu odaya taşınır. Sol taraftan başlayarak çürütülür.</p>
          <label>Şüpheli
            <select value={sg.sus} onChange={(e) => setSg({ ...sg, sus: Number(e.target.value) })}>
              {SUS_OPTS.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
            </select>
          </label>
          <label>Silah
            <select value={sg.wpn} onChange={(e) => setSg({ ...sg, wpn: Number(e.target.value) })}>
              {WPN_OPTS.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
            </select>
          </label>
          <button className="btn primary" disabled={busy} onClick={() => send('clsuggest', sg)}>Tahmin et</button>
        </section>
      )}

      {isTurn && g.phase === 'turn' && !canSuggest && !inRoom && (
        <p className="cl-hint">Tahmin için bir odada olmalısınız.</p>
      )}
      {isTurn && g.phase === 'turn' && inRoom && g.sugDone && (
        <p className="cl-hint">Bu tur tahmin hakkınızı kullandınız.</p>
      )}

      {canAccuse && (
        <section className="cl-card">
          {!showAccuse ? (
            <button className="btn" onClick={() => setShowAccuse(true)}>Suçlama yap</button>
          ) : (
            <>
              <h3>Suçlama (kesin)</h3>
              <label>Şüpheli
                <select value={ac.sus} onChange={(e) => setAc({ ...ac, sus: Number(e.target.value) })}>
                  {SUS_OPTS.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
                </select>
              </label>
              <label>Silah
                <select value={ac.wpn} onChange={(e) => setAc({ ...ac, wpn: Number(e.target.value) })}>
                  {WPN_OPTS.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
                </select>
              </label>
              <p className="cl-hint">Oda: {ROOMS[myRoom]} (bulunduğunuz oda)</p>
              <div className="cl-actions">
                <button className="btn danger" disabled={busy} onClick={doAccuse}>Suçla</button>
                <button className="btn sm" onClick={() => setShowAccuse(false)}>Vazgeç</button>
              </div>
            </>
          )}
        </section>
      )}

      {isTurn && g.phase === 'turn' && (
        <div className="cl-actions">
          <button className="btn" disabled={busy} onClick={() => send('clend')}>Turu bitir</button>
        </div>
      )}

      <section className="cl-card">
        <h3>Elin ({hand.length} kart)</h3>
        <ul className="cl-hand">
          {hand.map((c) => <li key={c}>{cardName(c)}</li>)}
          {!seated && <li>İzleyiciler kart görmez.</li>}
        </ul>
      </section>

      <section className="cl-card">
        <h3>Odalar</h3>
        <ul className="cl-rooms">
          {ROOMS.map((r, i) => {
            const ws = weaponsIn(i), ss = suspectsIn(i);
            return (
              <li key={r}>
                <b>{r}</b>
                <span>{[...ss, ...ws].join(', ') || '—'}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="cl-card">
        <button className="btn sm" onClick={() => setShowNotes((v) => !v)}>{showNotes ? 'Not defterini gizle' : 'Not defterini aç'}</button>
        {showNotes && (
          <>
            <p className="cl-hint">Kartlara dokunarak işaretleyin: Elendi → Belki → temiz. Bu notlar yalnızca bu telefonda tutulur.</p>
            {['Şüpheli', 'Silah', 'Oda'].map((kind) => (
              <div key={kind}>
                <h4>{kind === 'Şüpheli' ? 'Şüpheliler' : kind === 'Silah' ? 'Silahlar' : 'Odalar'}</h4>
                <ul className="cl-notes">
                  {ALL_CARDS.filter((c) => c.kind === kind).map((c) => (
                    <NoteRow key={c.id} card={c} state={notes[c.id] ?? ''} own={hand.includes(c.id)} onCycle={() => cycle(c.id)} />
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </section>

      <section className="cl-card">
        <h3>Olaylar</h3>
        <ol className="cl-log">
          {[...(g.log ?? [])].reverse().slice(0, 12).map((l, i) => <li key={i}>{l}</li>)}
        </ol>
      </section>

      {err && <p className="mono-err" role="alert">{err}</p>}
    </div>
  );
}
