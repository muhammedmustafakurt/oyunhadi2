'use client';
import { useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { PALETTE } from '@/lib/emlak';
import { CITIES, ROUTES, COLORS, ROUTE_PTS, payOptions } from '@/lib/ticket';

// Vagon ve lokomotif renkleri (kart ve rota gösterimi).
const HEX = {
  purple: '#8e44ad', white: '#f1f3f5', blue: '#1971c2', yellow: '#f2c94c', orange: '#f76707',
  black: '#212529', red: '#e03131', green: '#2f9e44', gray: '#868e96', loco: '#ffd43b',
};
const NAME = {
  purple: 'Mor', white: 'Beyaz', blue: 'Mavi', yellow: 'Sarı', orange: 'Turuncu',
  black: 'Siyah', red: 'Kırmızı', green: 'Yeşil', gray: 'Gri', loco: 'Lokomotif',
};
// Renk körü dostu: her rengin bir sembolü ve okunur yazı rengi var.
const SYM = {
  purple: '◆', white: '○', blue: '■', yellow: '▲', orange: '★', black: '✚', red: '●', green: '▼', gray: '◇', loco: '✦',
};
const DARK_TXT = new Set(['white', 'yellow', 'loco', 'gray']);
const ink = (c) => (DARK_TXT.has(c) ? '#1c1233' : '#fff');
// Şehir etiketi yerleşimi: [hizalama, dx, dy]. Varsayılan sağ üst.
const LABEL = {
  edirne: ['start', 12, 4], istanbul: ['start', 12, -10], canakkale: ['start', 12, -10], balikesir: ['end', -12, -10],
  izmir: ['start', 12, 4], mugla: ['start', 12, 20], denizli: ['start', 12, 4], afyon: ['end', -12, -10], antalya: ['middle', 0, 30],
  konya: ['middle', 0, 28], mersin: ['middle', 0, 30], adana: ['middle', 0, 30], gaziantep: ['middle', 0, 30],
  malatya: ['start', 12, 22], diyarbakir: ['middle', 0, 30], van: ['end', 14, 30], erzurum: ['middle', 0, -14],
  trabzon: ['middle', 0, -14], samsun: ['middle', 0, -14], sivas: ['middle', 0, -14], kayseri: ['start', 12, 24],
  nevsehir: ['end', -12, 22], ankara: ['end', -12, -10], eskisehir: ['end', -12, 24], bursa: ['start', 12, 24], bolu: ['middle', 0, -14],
};
const MAP_BASE = 640; // haritanın en az genişliği (px); yakınlaştırmayla artar
const ZOOMS = [1, 1.5, 2.2];
const TOTAL_LEN = ROUTES.length;

// Masada Ticket to Ride: harita, kart çekme, rota alma, bilet çekme ve tutma. Kurallar lib/ticket.js'te.
export default function TicketOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'ticket', pollMs: 1500 });
  const { room, err, busy, send } = ui;
  const [sel, setSel] = useState(null); // seçili rota id
  const [keepSel, setKeepSel] = useState([]); // bilet tutma seçimi (teklif kimliklerinden)
  const [zoom, setZoom] = useState(0);

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
  const pcol = (i) => PALETTE[i % PALETTE.length];
  const av = (i) => <i className="tk-av" style={{ background: pcol(i) }}>{i + 1}</i>;
  const over = g.over;
  const myTurn = seated && !over && g.phase === 'play' && g.turn === me && !g.offer;
  const selRoute = sel !== null ? ROUTES[sel] : null;
  const opts = selRoute && me >= 0 && g.hand ? payOptions(selRoute, g.hand) : [];
  const owned = (rid) => g.owner[rid] !== -1;
  const canClaimRoute = (r) => myTurn && g.drawn === 0 && !owned(r.id) && g.players[me].trains >= r.len;
  const affordable = (r) => canClaimRoute(r) && g.hand && payOptions(r, g.hand).length > 0;
  const offerIds = g.offer ? g.offer.map((t) => t.id) : [];
  const initIds = g.initOffer ? g.initOffer.map((t) => t.id) : [];
  const needKeep = g.initOffer ? 2 : 1;
  const pendingIds = g.initOffer ? initIds : offerIds;
  const iKeep = seated && (g.initOffer || g.offer) ? keepSel : [];
  const pending = seated && (g.initOffer || g.offer) && !over;

  const toggleKeep = (id) => setKeepSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const keep = () => {
    send('tkkeep', { keep: iKeep });
    setKeepSel([]);
  };
  const claim = (opt) => {
    send('tkclaim', { route: selRoute.id, cards: opt.cards });
    setSel(null);
  };

  // Harita: rota, uzunluğu kadar vagon parçasına bölünür; çift rotalar birbirinden ayrılarak çizilir.
  const geo = (r) => {
    const a = CITIES[r.a], b = CITIES[r.b];
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;
    const off = r.dbl === null ? 0 : (r.id < r.dbl ? -9 : 9);
    const ox = -uy * off, oy = ux * off;
    const trim = Math.min(15, d * 0.18), gap = 3;
    const len = d - trim * 2;
    const seg = Math.max(2, (len - gap * (r.len - 1)) / r.len);
    const parts = [];
    for (let i = 0; i < r.len; i++) {
      const s0 = trim + i * (seg + gap), s1 = s0 + seg;
      parts.push({ x1: a.x + ox + ux * s0, y1: a.y + oy + uy * s0, x2: a.x + ox + ux * s1, y2: a.y + oy + uy * s1 });
    }
    return { parts, mx: a.x + ox + dx / 2, my: a.y + oy + dy / 2, x1: a.x + ox, y1: a.y + oy, x2: b.x + ox, y2: b.y + oy };
  };

  const status = over ? over.text
    : g.phase === 'tkinit' ? (g.initOffer && seated ? 'Biletlerini seç: en az 2 tut.' : 'Oyuncular biletlerini seçiyor…')
      : myTurn ? (g.drawn === 1 ? 'Bir kart daha çek.' : 'Sıra sende: kart çek, rota al ya da bilet çek.')
        : g.offer && g.offer.length ? 'Biletlerden en az birini tut.'
          : `Sıra: ${name(g.turn)}`;

  const cardFace = (c) => (
    <>
      <b className="sym" aria-hidden="true">{SYM[c]}</b>
      <span className="nm">{NAME[c]}</span>
    </>
  );

  return (
    <div className="tk">
      {!seated && <p className="tk-note">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}
      <p className={`tk-status${myTurn ? ' mine' : ''}`} role="status">{status}</p>
      {g.endLeft != null && !over && <p className="tk-note">Son tur: vagonu azalan oyuncu oldu. Herkes bir kez daha oynar.</p>}

      {pending && (
        <section className="tk-pick tk-offer" aria-label="Bilet seçimi">
          <h3>{g.initOffer ? 'Başlangıç biletleri' : 'Çekilen biletler'}</h3>
          <p>{g.initOffer ? 'En az 2 tut.' : 'En az 1 tut; tutmadıkların geri döner.'}</p>
          {(g.initOffer || g.offer)?.length > 0 && (
            <ul className="tk-tickets pick">
              {(g.initOffer || g.offer).map((t) => (
                <li key={t.id} className={keepSel.includes(t.id) ? 'on' : ''}>
                  <label>
                    <input type="checkbox" checked={keepSel.includes(t.id)} onChange={() => toggleKeep(t.id)} />
                    <span className="tk-rt">{CITIES[t.a].n} <em>→</em> {CITIES[t.b].n}</span>
                    <b>{t.pts}</b>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <button className="btn primary" disabled={busy || iKeep.length < needKeep || !pendingIds.length} onClick={keep}>
            Seçilenleri tut ({iKeep.length})
          </button>
        </section>
      )}

      <div className="tk-layout">
        <div className="tk-main">
          <div className="tk-mapbox">
            <div className="tk-zoom" role="group" aria-label="Harita yakınlaştırma">
              <button type="button" className="btn sm" disabled={zoom === 0} onClick={() => setZoom(zoom - 1)} aria-label="Uzaklaştır">−</button>
              <button type="button" className="btn sm" disabled={zoom === ZOOMS.length - 1} onClick={() => setZoom(zoom + 1)} aria-label="Yakınlaştır">+</button>
            </div>
            <div className={`tk-map${zoom > 0 ? ' zoomed' : ''}`} aria-label="Türkiye haritası">
              <svg viewBox="0 0 1000 560" role="img" style={{ minWidth: MAP_BASE * ZOOMS[zoom] }}>
                <rect x="0" y="0" width="1000" height="560" fill="#eef6f1" />
                {ROUTES.map((r) => {
                  const gm = geo(r);
                  const o = g.owner[r.id];
                  const taken = o !== -1;
                  const col = taken ? pcol(o) : HEX[r.color];
                  const can = !taken && affordable(r);
                  const isSel = sel === r.id;
                  const toggle = () => setSel(isSel ? null : r.id);
                  return (
                    <g key={r.id} className={`tk-route${isSel ? ' sel' : ''}${taken ? ' own' : ''}${can ? ' can' : ''}`}
                      onClick={taken ? undefined : toggle}
                      role={taken ? undefined : 'button'} tabIndex={taken ? undefined : 0}
                      onKeyDown={(e) => { if (!taken && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(); } }}
                      aria-label={`${CITIES[r.a].n} - ${CITIES[r.b].n}, ${r.len} vagon, ${taken ? `${name(o)} aldı` : NAME[r.color]}`}>
                      {isSel && <line className="glow" x1={gm.x1} y1={gm.y1} x2={gm.x2} y2={gm.y2} />}
                      <line className="hit" x1={gm.x1} y1={gm.y1} x2={gm.x2} y2={gm.y2} />
                      {gm.parts.map((p, i) => (
                        <line key={`r${i}`} className="rim" x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />
                      ))}
                      {gm.parts.map((p, i) => (
                        <line key={`f${i}`} className="car" x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={col} />
                      ))}
                      <g className="badge" transform={`translate(${gm.mx} ${gm.my})`}>
                        {taken ? (
                          <>
                            <circle r="12" fill={col} stroke="#1c1233" strokeWidth="2.5" />
                            <text y="5.5" fill="#fff" fontSize="15">{o + 1}</text>
                          </>
                        ) : (
                          <>
                            <rect x="-17" y="-11" width="34" height="22" rx="8" fill="#fff" stroke={can ? '#e67700' : '#1c1233'} strokeWidth={can ? 3.5 : 2.5} />
                            <text x="-5" y="5.5" fill="#1c1233" fontSize="15">{r.len}</text>
                            <text x="8" y="5" fill={r.color === 'gray' ? '#555' : HEX[r.color]} stroke={r.color === 'white' || r.color === 'yellow' ? '#1c1233' : 'none'} strokeWidth="0.6" fontSize="12">{SYM[r.color]}</text>
                          </>
                        )}
                      </g>
                    </g>
                  );
                })}
                {Object.entries(CITIES).map(([id, c]) => {
                  const [anchor, dx, dy] = LABEL[id] || ['start', 12, -10];
                  return (
                    <g key={id} className="tk-city">
                      <circle cx={c.x} cy={c.y} r="8" />
                      <text x={c.x + dx} y={c.y + dy} textAnchor={anchor}>{c.n}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {selRoute && (
            <section className="tk-pick" aria-label="Rota seçimi">
              <h3>
                <i className="tk-sw" style={{ background: HEX[selRoute.color], color: ink(selRoute.color) }}>{SYM[selRoute.color]}</i>
                {CITIES[selRoute.a].n} – {CITIES[selRoute.b].n}
              </h3>
              <p>{selRoute.len} vagon · {NAME[selRoute.color] ?? selRoute.color}{selRoute.dbl !== null ? ' · çift rota' : ''} · {ROUTE_PTS[selRoute.len]} puan</p>
              {!myTurn && <p>Şu an bu rotayı alamazsın (sıra sende değil ya da bilet seçimi var).</p>}
              {myTurn && g.drawn !== 0 && <p>Kart çektikten sonra rota alınamaz.</p>}
              {myTurn && g.drawn === 0 && g.players[me].trains < selRoute.len && <p>Yeterli vagonun yok.</p>}
              {myTurn && g.drawn === 0 && opts.length === 0 && g.players[me].trains >= selRoute.len && <p>Elinde bu rotayı ödeyecek kart yok.</p>}
              <div className="tk-opts">
                {opts.map((o, i) => (
                  <button key={i} className="btn primary" disabled={busy || !canClaimRoute(selRoute)} onClick={() => claim(o)}>
                    {o.color ? `${SYM[o.color]} ${NAME[o.color]} ile öde` : '✦ Lokomotiflerle öde'} ({Object.entries(o.cards).map(([k, v]) => `${v} ${NAME[k]}`).join(', ')})
                  </button>
                ))}
              </div>
              <button className="btn" onClick={() => setSel(null)}>Vazgeç</button>
            </section>
          )}
        </div>

        <div className="tk-side">
          <ul className="tk-players" aria-label="Oyuncular">
            {g.players.map((p, i) => (
              <li key={i} className={`${i === g.turn && !over ? 'turn' : ''} ${p.gone ? 'gone' : ''}`} style={{ '--pc': pcol(i) }}>
                {av(i)}
                <span className="who">{name(i)}{i === me ? ' (sen)' : ''}{p.pending ? ' · seçiyor' : ''}{i === g.turn && !over && !p.pending ? ' · sırada' : ''}</span>
                <span className="meta">
                  <span title="Kalan vagon"><b>{p.trains}</b> vagon</span>
                  <span title="Rota puanı"><b>{p.routes}</b> puan</span>
                  <span title="Bilet sayısı"><b>{p.tickets}</b> bilet</span>
                </span>
              </li>
            ))}
          </ul>

          {!over && (
            <section aria-label="Kart çekme" className="tk-draw">
              <div className="tk-faces">
                {g.faceUp.map((c, i) => (
                  <button key={i} className={`tk-face${c ? '' : ' empty'}`}
                    style={c ? { background: HEX[c], color: ink(c) } : undefined}
                    disabled={!myTurn || !c || busy || (c === 'loco' && g.drawn > 0)}
                    aria-label={c ? `${NAME[c]} kartı al` : 'Boş'}
                    onClick={() => send('tkdraw', { slot: i })}>
                    {c ? cardFace(c) : '—'}
                  </button>
                ))}
              </div>
              <div className="tk-opts">
                <button className="btn" disabled={!myTurn || busy || (g.deckLeft + g.discardLeft === 0)} onClick={() => send('tkdraw', { slot: 'deck' })}>
                  Desteden çek <small>({g.deckLeft})</small>
                </button>
                <button className="btn" disabled={!myTurn || busy || g.drawn !== 0 || g.ticketsLeft === 0} onClick={() => send('tktickets')}>
                  Bilet çek <small>({g.ticketsLeft} kalan)</small>
                </button>
              </div>
            </section>
          )}

          {seated && g.hand && !over && (
            <section aria-label="Kartların">
              <h3 className="tk-h">Elin</h3>
              <ul className="tk-hand">
                {[...COLORS, 'loco'].filter((c) => g.hand[c] > 0).map((c) => (
                  <li key={c} className="tk-chip" style={{ background: HEX[c], color: ink(c) }}>
                    <b className="sym" aria-hidden="true">{SYM[c]}</b>
                    <span className="nm">{NAME[c]}</span>
                    <em>{g.hand[c]}</em>
                  </li>
                ))}
                {[...COLORS, 'loco'].every((c) => !g.hand[c]) && <li className="empty">Elinde kart yok.</li>}
              </ul>
            </section>
          )}

          {seated && g.tickets && !over && g.tickets.length > 0 && (
            <section aria-label="Biletlerin">
              <h3 className="tk-h">Biletlerin</h3>
              <ul className="tk-tickets">
                {g.tickets.map((t) => (
                  <li key={t.id}><span className="tk-rt">{CITIES[t.a].n} <em>→</em> {CITIES[t.b].n}</span><b>{t.pts}</b></li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {over && (
        <section className="tk-over" aria-label="Sonuç">
          <div className="tk-table">
            <table>
              <thead>
                <tr><th>Oyuncu</th><th>Rota</th><th>Bilet</th><th>Yol</th><th>Toplam</th></tr>
              </thead>
              <tbody>
                {over.ranking.map((i, k) => {
                  const r = over.rows[i];
                  return (
                    <tr key={i} className={k === 0 ? 'win' : ''}>
                      <td><span className="pl">{av(i)} {name(i)}{room.seats[i].left ? ' (ayrıldı)' : ''}</span></td>
                      <td>{r.routes}</td>
                      <td>{r.ticketDelta >= 0 ? `+${r.ticketDelta}` : r.ticketDelta}</td>
                      <td>{r.bonus ? `+${r.bonus}` : '—'}</td>
                      <td><b>{r.total}</b></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="tk-tickets">
            {over.rows.flatMap((r) => r.tickets.map((t) => (
              <li key={`${r.seat}-${t.id}`} className={t.ok ? 'ok' : 'no'}>
                <span className="tk-rt">{name(r.seat)}: {CITIES[t.a].n} <em>→</em> {CITIES[t.b].n}</span><b>{t.ok ? '+' : '−'}{t.pts}</b>
              </li>
            )))}
          </ul>
          {seated && <button className="btn primary" disabled={busy} onClick={() => send('reset')}>Yeni oyun (lobiye dön)</button>}
        </section>
      )}

      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && !over && <p className="tk-note">Haritada rotaya dokun, altta ödeme seçeneklerini gör. Toplam {TOTAL_LEN} rota. Turuncu çerçeveli rotaları şu an alabilirsin.</p>}
    </div>
  );
}
