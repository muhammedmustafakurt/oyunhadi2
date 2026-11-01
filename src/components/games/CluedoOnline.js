'use client';
import { useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { PALETTE } from '@/lib/emlak';
import { SUSPECTS, WEAPONS, ROOMS, RING, ROOM0, PASSAGE, MIN_PLAYERS, MAX_PLAYERS, cardName, nodeName } from '@/lib/cluedo';

// Masa Cluedo'su: kendi zarfı ve eli yalnızca sunucudan gelen görünümde vardır. Not defteri yalnızca bu telefonda tutulur.
const CX = 180, CY = 180, RR = 84, RO = 135, RW = 82, RH = 40, TR = 8; // tahta: kavşak halkası (RR) ve odalar (RO)
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
  const wAt = {};
  g.pos.wpn.forEach((p) => { wAt[p] = (wAt[p] ?? 0) + 1; });
  const tokenAt = (k, x, y) => (
    <g key={`t${k}`} className={`cl-tok${cur === k ? ' cur' : ''}`}>
      <circle cx={x} cy={y} r={TR} fill={PALETTE[k % PALETTE.length]} />
      <text x={x} y={y + 4} textAnchor="middle">{k + 1}</text>
    </g>
  );
  const press = (fn) => (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };
  return (
    <svg viewBox="0 0 360 360" className="cl-map" role="group" aria-label="Tahta: odalar ve oyuncu taşları">
      <circle cx={CX} cy={CY} r={RR - 18} className="cl-hub" />
      <path d={ringPath} className="cl-ring" />
      {ringPts.map(([x, y], j) => {
        const [rx, ry] = rPt(j);
        return <line key={`d${j}`} x1={x} y1={y} x2={rx} y2={ry} className="cl-door" />;
      })}
      {ringPts.map(([x, y], j) => {
        const hi = reach.includes(j);
        return (
          <g key={`j${j}`} className={hi ? 'cl-hit' : ''} {...(hi ? { role: 'button', tabIndex: 0, 'aria-label': nodeName(j), onClick: () => onPick(j), onKeyDown: press(() => onPick(j)) } : {})}>
            {hi && <circle cx={x} cy={y} r={22} className="cl-pad" />}
            <circle cx={x} cy={y} r={hi ? 14 : 5} className={hi ? 'cl-junc hi' : 'cl-junc'} />
          </g>
        );
      })}
      {ROOMS.map((name, r) => {
        const [x, y] = rPt(r);
        const hi = reach.includes(ROOM0 + r);
        const w = wAt[ROOM0 + r] ?? 0;
        return (
          <g key={name} className={hi ? 'cl-hit' : ''} {...(hi ? { role: 'button', tabIndex: 0, 'aria-label': name, onClick: () => onPick(ROOM0 + r), onKeyDown: press(() => onPick(ROOM0 + r)) } : {})}>
            <rect x={x - RW / 2} y={y - RH / 2} width={RW} height={RH} rx={9} className={`cl-room${hi ? ' hi' : ''}`} />
            <text x={x} y={y - 4} textAnchor="middle" className="cl-rname" {...(name.length * 6.3 > RW - 8 ? { textLength: RW - 8, lengthAdjust: 'spacingAndGlyphs' } : {})}>{name}</text>
            {w > 0 && (
              <g className="cl-wb">
                <rect x={x + RW / 2 - 40} y={y - RH / 2 - 13} width={44} height={15} rx={7.5} />
                <text x={x + RW / 2 - 18} y={y - RH / 2 - 2} textAnchor="middle">{w} silah</text>
              </g>
            )}
          </g>
        );
      })}
      {Object.entries(at).map(([node, ks]) => {
        const n = Number(node);
        if (n < ROOM0) {
          const [x, y] = jPt(n);
          const step = Math.min(2 * TR + 1, 30 / Math.max(1, ks.length - 1) + 14);
          return ks.map((k, i) => tokenAt(k, x + (i - (ks.length - 1) / 2) * step, y));
        }
        const [x, y] = rPt(n - ROOM0);
        const step = Math.min(2 * TR + 1, (RW - 2 * TR - 6) / Math.max(1, ks.length - 1));
        return ks.map((k, i) => tokenAt(k, x + (i - (ks.length - 1) / 2) * step, y + 11));
      })}
    </svg>
  );
}

// Tek bir kartı tıklanabilir kutu olarak gösteren not defteri satırı.
function NoteRow({ card, state, onCycle, own }) {
  return (
    <li className={`cl-note${state === 'x' ? ' x' : ''}${state === '?' ? ' q' : ''}${own ? ' own' : ''}`}>
      <button type="button" onClick={onCycle} aria-label={`${card.name}: ${own ? 'elinde' : NOTE_LABEL[state] || 'işaretsiz'}`}>
        <span className="cl-note-name">{card.name}</span>
        <i className="cl-note-mark" aria-hidden="true">{own ? 'El' : state === 'x' ? '✕' : state === '?' ? '?' : ''}</i>
      </button>
    </li>
  );
}

// Açılır liste yerine büyük dokunma hedefli seçim düğmeleri.
function Picker({ label, opts, value, onChange }) {
  return (
    <div className="cl-pick" role="radiogroup" aria-label={label}>
      <b>{label}</b>
      <div className="cl-chips">
        {opts.map((o) => (
          <button key={o.v} type="button" role="radio" aria-checked={value === o.v} className={`cl-chip${value === o.v ? ' on' : ''}`} onClick={() => onChange(o.v)}>{o.t}</button>
        ))}
      </div>
    </div>
  );
}

const KIND_OF = (id) => (id[0] === 'S' ? 'Şüpheli' : id[0] === 'W' ? 'Silah' : 'Oda');

export default function CluedoOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'cluedo', pollMs: 1000 });
  const { room, err, busy, send } = ui;
  const [notes, setNotes] = useState({});
  const [sg, setSg] = useState({ sus: 0, wpn: 0 });
  const [ac, setAc] = useState({ sus: 0, wpn: 0, rm: 0 });
  const [showNotes, setShowNotes] = useState(false);
  const [showAccuse, setShowAccuse] = useState(false);
  const [hideHand, setHideHand] = useState(false);

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

      <section className={`cl-status${isTurn ? ' mine' : ''}`} role="status">
        <i className="av" style={{ background: PALETTE[(over ? (over.winner ?? 0) : cur) % PALETTE.length] }}>{(over ? (over.winner ?? 0) : cur) + 1}</i>
        <div className="cl-status-t">
          <p>{status}</p>
                  </div>
        {g.dice && !over && (
          <div className="cl-dice" aria-label={`Son zar: ${g.dice[0]} ve ${g.dice[1]}`}>
            <b>{g.dice[0]}</b><b>{g.dice[1]}</b>
          </div>
        )}
      </section>

      <ul className="cl-players" aria-label="Oyuncular">
        {room.seats.map((s, i) => (
          <li key={i} className={`${i === cur && !over ? 'turn' : ''}${s.left || g.out?.[i] ? ' off' : ''}`}>
            <i className="av" style={{ background: PALETTE[i % PALETTE.length] }}>{i + 1}</i>
            <span className="cl-pn"><b>{s.name}{i === me ? ' (sen)' : ''}</b><small>{SUSPECTS[i]}</small></span>
            {s.left ? <em>ayrıldı</em> : g.out?.[i] ? <em>elendi</em> : i === cur && !over ? <em className="t">sıra</em> : null}
          </li>
        ))}
      </ul>

      {g.reveal && (
        <section className="cl-card reveal" role="status">
          <span className="cl-kicker">Çürütme · {nameOf(g.reveal.by)} size gösterdi</span>
          <strong className="cl-big">{cardName(g.reveal.card)}</strong>
          <small>Bu bilgiyi yalnızca siz görürsünüz. Not defterine işlemeyi unutmayın.</small>
        </section>
      )}

      {g.sugg && (
        <p className="cl-last"><b>Son tahmin · {nameOf(g.sugg.by)}</b>{SUSPECTS[g.sugg.sus]} · {WEAPONS[g.sugg.wpn]} · {ROOMS[g.sugg.rm]}</p>
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
        <p className="cl-hint">Tahtada yanıp sönen yere dokunun ya da aşağıdan seçin.</p>
      )}
      {isTurn && g.phase === 'move' && (
        <div className="cl-actions wrap">
          {reach.map((n) => (
            <button key={n} className="btn cl-go" disabled={busy} onClick={() => send('clmove', { to: n })}>{nodeName(n)}</button>
          ))}
        </div>
      )}

      {g.myRefute && (
        <section className="cl-card refute">
          <span className="cl-kicker">Çürütme sırası sizde</span>
          <p>{nameOf(g.sugg.by)} tahmin etti: {SUSPECTS[g.sugg.sus]} · {WEAPONS[g.sugg.wpn]} · {ROOMS[g.sugg.rm]}. Eşleşen kartlardan birini seçin; yalnızca tahmin eden görür.</p>
          <div className="cl-actions wrap">
            {matching.map((c) => (
              <button key={c} className="btn primary cl-show" disabled={busy} onClick={() => send('clshow', { card: c })}><small>{KIND_OF(c)}</small>{cardName(c)}</button>
            ))}
          </div>
        </section>
      )}

      {canSuggest && (
        <section className="cl-card">
          <h3>Oda tahmini: {ROOMS[myRoom]}</h3>
          <p className="cl-hint">Seçtiğiniz şüpheli ve silah bu odaya taşınır; sıradaki oyuncular çürütmeye çalışır.</p>
          <Picker label="Şüpheli" opts={SUS_OPTS} value={sg.sus} onChange={(v) => setSg({ ...sg, sus: v })} />
          <Picker label="Silah" opts={WPN_OPTS} value={sg.wpn} onChange={(v) => setSg({ ...sg, wpn: v })} />
          <p className="cl-sum">{SUSPECTS[sg.sus]} · {WEAPONS[sg.wpn]} · {ROOMS[myRoom]}</p>
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
        <section className="cl-card accuse">
          {!showAccuse ? (
            <button className="btn danger" onClick={() => setShowAccuse(true)}>Suçlama yap (kesin)</button>
          ) : (
            <>
              <h3>Suçlama (kesin)</h3>
              <Picker label="Şüpheli" opts={SUS_OPTS} value={ac.sus} onChange={(v) => setAc({ ...ac, sus: v })} />
              <Picker label="Silah" opts={WPN_OPTS} value={ac.wpn} onChange={(v) => setAc({ ...ac, wpn: v })} />
              <p className="cl-sum">{SUSPECTS[ac.sus]} · {WEAPONS[ac.wpn]} · {ROOMS[myRoom]}</p>
              <div className="cl-actions">
                <button className="btn danger" disabled={busy} onClick={doAccuse}>Suçla</button>
                <button className="btn" onClick={() => setShowAccuse(false)}>Vazgeç</button>
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
        <div className="cl-hh">
          <h3>Elin ({hand.length} kart)</h3>
          {seated && <button type="button" className="btn sm" aria-pressed={hideHand} onClick={() => setHideHand((v) => !v)}>{hideHand ? 'Göster' : 'Gizle'}</button>}
        </div>
        {hideHand ? (
          <p className="cl-hint cl-hidden">Kartların gizli. Başkası bakmasın diye saklandı.</p>
        ) : (
          <ul className="cl-hand">
            {hand.map((c) => (
              <li key={c} className={`k${c[0]}`}><small>{KIND_OF(c)}</small>{cardName(c)}</li>
            ))}
            {!seated && <li>İzleyiciler kart görmez.</li>}
          </ul>
        )}
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
        <button className="btn cl-toggle" aria-expanded={showNotes} onClick={() => setShowNotes((v) => !v)}>{showNotes ? 'Not defterini gizle' : 'Not defterini aç'}</button>
        {showNotes && (
          <>
            <p className="cl-hint">Dokunarak işaretleyin: elendi (✕) → belki (?) → boş. Notlar yalnızca bu telefonda tutulur.</p>
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
