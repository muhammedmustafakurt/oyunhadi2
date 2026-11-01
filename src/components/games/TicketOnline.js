'use client';
import { useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { PALETTE } from '@/lib/emlak';
import { CITIES, ROUTES, COLORS, payOptions } from '@/lib/ticket';

// Vagon ve lokomotif renkleri (kart ve rota gösterimi).
const HEX = {
  purple: '#8e44ad', white: '#f1f3f5', blue: '#1971c2', yellow: '#f2c94c', orange: '#f76707',
  black: '#212529', red: '#e03131', green: '#2f9e44', gray: '#868e96', loco: '#ffd43b',
};
const NAME = {
  purple: 'Mor', white: 'Beyaz', blue: 'Mavi', yellow: 'Sarı', orange: 'Turuncu',
  black: 'Siyah', red: 'Kırmızı', green: 'Yeşil', gray: 'Gri', loco: 'Lokomotif',
};
const TOTAL_LEN = ROUTES.length;

// Masada Ticket to Ride: harita, kart çekme, rota alma, bilet çekme ve tutma. Kurallar lib/ticket.js'te.
export default function TicketOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'ticket', pollMs: 1500 });
  const { room, err, busy, send } = ui;
  const [sel, setSel] = useState(null); // seçili rota id
  const [keepSel, setKeepSel] = useState([]); // bilet tutma seçimi (teklif kimliklerinden)

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={5} min={2}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const g = room.game;
  const me = room.me;
  const seated = me >= 0 && !room.seats[me]?.left;
  const names = room.seats.map((s) => s.name);
  const name = (i) => names[i] ?? `Oyuncu ${i + 1}`;
  const av = (i) => <i className="av" style={{ background: PALETTE[i % PALETTE.length] }}>{i + 1}</i>;
  const over = g.over;
  const myTurn = seated && !over && g.phase === 'play' && g.turn === me && !g.offer;
  const selRoute = sel !== null ? ROUTES[sel] : null;
  const opts = selRoute && me >= 0 && g.hand ? payOptions(selRoute, g.hand) : [];
  const owned = (rid) => g.owner[rid] !== -1;
  const canClaimRoute = (r) => myTurn && g.drawn === 0 && !owned(r.id) && g.players[me].trains >= r.len;
  const offerIds = g.offer ? g.offer.map((t) => t.id) : [];
  const initIds = g.initOffer ? g.initOffer.map((t) => t.id) : [];
  const needKeep = g.initOffer ? 2 : 1;
  const pendingIds = g.initOffer ? initIds : offerIds;
  const iKeep = seated && (g.initOffer || g.offer) ? keepSel : [];

  const toggleKeep = (id) => setKeepSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const keep = () => {
    send('tkkeep', { keep: iKeep });
    setKeepSel([]);
  };
  const claim = (opt) => {
    send('tkclaim', { route: selRoute.id, cards: opt.cards });
    setSel(null);
  };

  // Harita: çift rotalar birbirinden ayrılarak çizilir.
  const edgeLine = (r) => {
    const a = CITIES[r.a], b = CITIES[r.b];
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    const off = r.dbl === null ? 0 : (r.id < r.dbl ? -9 : 9);
    const ox = (-dy / d) * off, oy = (dx / d) * off;
    return { x1: a.x + ox, y1: a.y + oy, x2: b.x + ox, y2: b.y + oy };
  };

  const status = over ? over.text
    : g.phase === 'tkinit' ? (g.initOffer && seated && g.initOffer ? 'Biletlerini seç: en az 2 tut.' : 'Oyuncular biletlerini seçiyor…')
      : myTurn ? (g.drawn === 1 ? 'Bir kart daha çek.' : 'Sıra sende: kart çek, rota al ya da bilet çek.')
        : g.offer && g.offer.length ? 'Biletlerden en az birini tut.'
          : `Sıra: ${name(g.turn)}`;

  return (
    <div className="tk">
      {!seated && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}
      <p className={`tk-status${myTurn ? ' mine' : ''}`} role="status">{status}</p>
      {g.endLeft != null && !over && <p className="mono-where">Son tur: vagonu azalan oyuncu oldu. Herkes bir kez daha oynar.</p>}

      <ul className="tk-players" aria-label="Oyuncular">
        {g.players.map((p, i) => (
          <li key={i} className={`${i === g.turn && !over ? 'turn' : ''} ${p.gone ? 'gone' : ''}`}>
            {av(i)}
            <span className="who">{name(i)}{i === me ? ' (sen)' : ''}{p.pending ? ' · seçiyor' : ''}</span>
            <span className="meta">
              <span><b>{p.trains}</b> vagon</span>
              <span><b>{p.routes}</b> rota puanı</span>
              <span><b>{p.tickets}</b> bilet</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="tk-map" aria-label="Türkiye harita">
        <svg viewBox="0 0 1000 560" role="img">
          <rect x="0" y="0" width="1000" height="560" fill="#eef6f1" />
          {ROUTES.map((r) => {
            const { x1, y1, x2, y2 } = edgeLine(r);
            const o = g.owner[r.id];
            const col = o !== -1 ? PALETTE[o % PALETTE.length] : HEX[r.color === 'gray' ? 'gray' : r.color];
            const clickable = o === -1;
            return (
              <g key={r.id} className={`tk-route${sel === r.id ? ' sel' : ''}`}
                onClick={() => clickable && setSel(sel === r.id ? null : r.id)}
                role={clickable ? 'button' : undefined} aria-label={`${CITIES[r.a].n} - ${CITIES[r.b].n}, ${r.len} vagon`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="26" />
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={o !== -1 ? 13 : 9}
                  strokeDasharray={o !== -1 ? undefined : '14 8'} strokeLinecap="round" />
                {o !== -1 && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1c1233" strokeWidth="3" strokeDasharray="2 10" />}
              </g>
            );
          })}
          {Object.entries(CITIES).map(([id, c]) => (
            <g key={id} className="tk-city">
              <circle cx={c.x} cy={c.y} r="7" />
              <text x={c.x + 10} y={c.y - 9}>{c.n}</text>
            </g>
          ))}
        </svg>
      </div>

      {selRoute && (
        <section className="tk-pick" aria-label="Rota seçimi">
          <h3>{CITIES[selRoute.a].n} – {CITIES[selRoute.b].n}</h3>
          <p>{selRoute.len} vagon · {NAME[selRoute.color] ?? selRoute.color}{selRoute.dbl !== null ? ' · çift rota' : ''}</p>
          {!myTurn && <p>Şu an bu rotayı alamazsın (sıra sende değil ya da kart çektin).</p>}
          {myTurn && g.drawn !== 0 && <p>Kart çektikten sonra rota alınamaz.</p>}
          {myTurn && g.drawn === 0 && opts.length === 0 && <p>Elinde bu rotayı ödeyecek kart yok.</p>}
          <div className="tk-opts">
            {opts.map((o, i) => (
              <button key={i} className="btn sm primary" disabled={busy || !canClaimRoute(selRoute)} onClick={() => claim(o)}>
                {o.color ? `${NAME[o.color]} ile öde` : 'Lokomotiflerle öde'} ({Object.entries(o.cards).map(([k, v]) => `${v} ${NAME[k]}`).join(', ')})
              </button>
            ))}
          </div>
          <button className="btn sm" onClick={() => setSel(null)}>Vazgeç</button>
        </section>
      )}

      {seated && g.hand && !over && (
        <section aria-label="Kartların">
          <ul className="tk-hand">
            {[...COLORS, 'loco'].filter((c) => g.hand[c] > 0).map((c) => (
              <li key={c} className="tk-chip"><i style={{ background: HEX[c] }} />{NAME[c]} × {g.hand[c]}</li>
            ))}
            {[...COLORS, 'loco'].every((c) => !g.hand[c]) && <li className="muted">Elinde kart yok.</li>}
          </ul>
        </section>
      )}

      {!over && (
        <section aria-label="Kart çekme">
          <div className="tk-faces">
            {g.faceUp.map((c, i) => (
              <button key={i} className={`tk-face${c ? '' : ' empty'}`} style={{ borderColor: c ? HEX[c] : undefined }}
                disabled={!myTurn || !c || busy || (c === 'loco' && g.drawn > 0)}
                onClick={() => send('tkdraw', { slot: i })}>
                {c ? NAME[c] : '—'}<span>{i + 1}</span>
              </button>
            ))}
          </div>
          <div className="tk-opts" style={{ marginTop: 8 }}>
            <button className="btn sm" disabled={!myTurn || busy || (g.deckLeft + g.discardLeft === 0)} onClick={() => send('tkdraw', { slot: 'deck' })}>
              Desteden çek ({g.deckLeft})
            </button>
            <button className="btn sm" disabled={!myTurn || busy || g.drawn !== 0 || g.ticketsLeft === 0} onClick={() => send('tktickets')}>
              Bilet çek ({g.ticketsLeft} kalan)
            </button>
          </div>
        </section>
      )}

      {seated && (g.initOffer || g.offer) && !over && (
        <section className="tk-pick" aria-label="Bilet seçimi">
          <h3>{g.initOffer ? 'Başlangıç biletleri' : 'Çekilen biletler'}</h3>
          <p>{g.initOffer ? 'En az 2 tut.' : 'En az 1 tut; tutmadıkların geri döner.'}</p>
          {(g.initOffer || g.offer)?.length > 0 && (
            <ul className="tk-tickets">
              {(g.initOffer || g.offer).map((t) => (
                <li key={t.id}>
                  <label>
                    <input type="checkbox" checked={keepSel.includes(t.id)} onChange={() => toggleKeep(t.id)} />
                    {CITIES[t.a].n} – {CITIES[t.b].n}
                  </label>
                  <b>{t.pts}</b>
                </li>
              ))}
            </ul>
          )}
          <button className="btn sm primary" disabled={busy || iKeep.length < needKeep || !pendingIds.length} onClick={keep}>
            Seçilenleri tut ({iKeep.length})
          </button>
        </section>
      )}

      {seated && g.tickets && !over && g.tickets.length > 0 && (
        <section aria-label="Biletlerin">
          <ul className="tk-tickets">
            {g.tickets.map((t) => (
              <li key={t.id}><span>{CITIES[t.a].n} – {CITIES[t.b].n}</span><b>{t.pts}</b></li>
            ))}
          </ul>
        </section>
      )}

      {over && (
        <section className="tk-over" aria-label="Sonuç">
          <table>
            <thead>
              <tr><th>Oyuncu</th><th>Rota</th><th>Bilet</th><th>Yol</th><th>Toplam</th></tr>
            </thead>
            <tbody>
              {over.ranking.map((i) => {
                const r = over.rows[i];
                return (
                  <tr key={i}>
                    <td>{av(i)} {name(i)}{room.seats[i].left ? ' (ayrıldı)' : ''}</td>
                    <td>{r.routes}</td>
                    <td>{r.ticketDelta >= 0 ? `+${r.ticketDelta}` : r.ticketDelta}</td>
                    <td>{r.bonus ? `+${r.bonus}` : '—'}</td>
                    <td><b>{r.total}</b></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <ul className="tk-tickets" style={{ marginTop: 10 }}>
            {over.rows.flatMap((r) => r.tickets.map((t) => (
              <li key={`${r.seat}-${t.id}`} className={t.ok ? 'ok' : 'no'}>
                <span>{name(r.seat)}: {CITIES[t.a].n} – {CITIES[t.b].n}</span><b>{t.ok ? '+' : '−'}{t.pts}</b>
              </li>
            )))}
          </ul>
          {seated && <button className="btn primary" disabled={busy} onClick={() => send('reset')}>Yeni oyun (lobiye dön)</button>}
        </section>
      )}

      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && !over && <p className="mono-where">Harita: rotaya dokun, altta ödeme seçeneklerini gör. Toplam {TOTAL_LEN} rota.</p>}
    </div>
  );
}
