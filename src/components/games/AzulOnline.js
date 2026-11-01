'use client';
import { useEffect, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { PALETTE } from '@/lib/emlak';
import { COLORS, COLOR_NAME, FLOOR, MARKER, patternColor, placeError } from '@/lib/azul';

// Fayans renkleri (mavi, sarı, kırmızı, siyah, turkuaz). Kodlar lib/azul.js ile aynıdır.
const HEX = { B: '#2a6fb0', Y: '#f2c230', R: '#c93a2b', K: '#2d2a3a', T: '#1aa39a' };
const LINE_LABEL = [1, 2, 3, 4, 5];

// Renk sayımı: [renk, adet] çiftleri, yalnızca bulunanlar.
const groups = (list) => COLORS.map((c) => [c, list.filter((x) => x === c).length]).filter(([, n]) => n > 0);

function Tile({ c, ghost }) {
  return <i className={`az-cell${ghost ? ' ghost' : ''}`} style={{ background: HEX[c] }} aria-label={COLOR_NAME[c]} />;
}

// Masada Azul: fabrikadan ya da merkezden tek renk seçilir, sonra desen çizgisine ya da tabana konur.
export default function AzulOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'azul' });
  const { room, err, busy, send } = ui;
  const [sel, setSel] = useState(null); // { src, factory, color }

  // Yeni durum geldiğinde (sıra değişti ya da hamle yapıldı) seçim kalmasın.
  useEffect(() => setSel(null), [room?.version]);

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={4} min={2}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const g = room.game;
  const names = room.seats.map((s) => s.name);
  const me = room.me;
  const seated = me >= 0 && !room.seats[me]?.left;
  const over = g.over;
  const myTurn = !over && seated && g.turn === me;
  const av = (i) => <i className="av" style={{ background: PALETTE[i % PALETTE.length] }}>{i + 1}</i>;
  const isSel = (src, factory, color) => !!sel && sel.src === src && sel.factory === factory && sel.color === color;
  const toggle = (src, factory, color) => setSel(isSel(src, factory, color) ? null : { src, factory, color });

  const selList = sel ? (sel.src === 'factory' ? g.factories[sel.factory] : g.center) : [];
  const selCount = sel ? selList.filter((x) => x === sel.color).length : 0;
  const mine = me >= 0 ? g.players[me] : null;
  const reasons = mine && sel ? [...new Set(LINE_LABEL.map((_, l) => placeError(mine, sel.color, l)).filter(Boolean))] : [];

  const move = (line) => {
    if (!sel) return;
    send('atake', { src: sel.src, factory: sel.src === 'factory' ? sel.factory : undefined, color: sel.color, line });
  };

  const resultText = () => {
    const w = over.winners.map((i) => names[i]);
    const sc = over.winners.length ? g.players[over.winners[0]].score : 0;
    const head = over.lead ? `${over.lead} ` : '';
    if (w.length === 0) return `${head}Oyun bitti.`;
    if (w.length === 1) return `${head}${w[0]} kazandı! (${sc} puan)`;
    return `${head}Berabere: ${w.join(' ve ')} (${sc} puan), ortak zafer.`;
  };

  const boards = (
    <div className="az-boards">
      {g.players.map((p, i) => {
        const left = room.seats[i]?.left;
        return (
          <section key={i} className={`az-board${i === me ? ' me' : ''}${left ? ' left' : ''}`}>
            <header className="az-bhead">
              <span className="az-who">{av(i)}{names[i]}{i === me ? ' (sen)' : ''}{!over && g.turn === i ? ' · sırada' : ''}{left ? ' · ayrıldı' : ''}</span>
              <b>{p.score} puan</b>
            </header>
            <div className="az-main">
              <div className="az-wall" aria-label={`${names[i]} duvarı`}>
                {p.wall.flatMap((row, r) => row.map((c, cc) => (
                  <Tile key={`${r}-${cc}`} c={c || patternColor(r, cc)} ghost={!c} />
                )))}
              </div>
              <div className="az-lines" aria-label={`${names[i]} desen çizgileri`}>
                {p.lines.map((row, r) => (
                  <div key={r} className="az-line">
                    {Array.from({ length: r + 1 }, (_, k) => {
                      const c = row[r - k];
                      return c ? <Tile key={k} c={c} /> : <i key={k} className="az-cell empty" />;
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="az-floor" aria-label={`${names[i]} taban çizgisi`}>
              {FLOOR.map((pen, k) => {
                const x = p.floor[k];
                return (
                  <span key={k} className="az-slot">
                    {x === MARKER ? <b className="az-star">★</b> : x ? <Tile c={x} /> : <i className="az-cell empty" />}
                    <small>{pen}</small>
                  </span>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );

  return (
    <div className="az">
      {!seated && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}

      {over && (
        <section className="km-over" role="status">
          <p className="km-win">{resultText()}</p>
          <ul className="km-rest">
            {over.ranking.map((i) => (
              <li key={i}>
                {av(i)}
                <b>{names[i]}</b>
                <em>{room.seats[i]?.left ? 'ayrıldı' : `${g.players[i].score} puan (+${over.detail[i].bonus} bitiş bonusu)`}</em>
              </li>
            ))}
          </ul>
          <button className="btn primary" disabled={busy} onClick={() => send('reset')}>Yeni oyun (lobiye dön)</button>
        </section>
      )}

      {!over && (
        <>
          <div className="az-status">
            <span>Tur {g.round}</span>
            <span>Torba {g.bagLeft} · Kapak {g.lidLeft}</span>
            <span className={myTurn ? 'az-turn me' : 'az-turn'}>{myTurn ? 'Sıra sende' : `Sırada: ${names[g.turn] ?? ''}`}</span>
          </div>
          <p className="az-note">{g.note}</p>

          <ul className="az-fac-list" aria-label="Fabrikalar">
            {g.factories.map((f, i) => (
              <li key={i} className="az-fac">
                <span className="az-tag">Fabrika {i + 1}</span>
                {f.length === 0 ? <span className="muted">boş</span> : (
                  <div className="az-groups">
                    {groups(f).map(([c, n]) => (
                      <button
                        key={c} type="button" className="az-grp" aria-pressed={isSel('factory', i, c)}
                        disabled={!myTurn || busy} onClick={() => toggle('factory', i, c)}
                        aria-label={`Fabrika ${i + 1}: ${n} ${COLOR_NAME[c]}`}
                      >
                        <span className="az-dot" style={{ background: HEX[c] }} />×{n}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

          <section className="az-center">
            <span className="az-tag">Merkez</span>
            <div className="az-groups">
              {g.marker && <span className="az-chip">Başlangıç işareti</span>}
              {groups(g.center).map(([c, n]) => (
                <button
                  key={c} type="button" className="az-grp" aria-pressed={isSel('center', undefined, c)}
                  disabled={!myTurn || busy} onClick={() => toggle('center', undefined, c)}
                  aria-label={`Merkez: ${n} ${COLOR_NAME[c]}`}
                >
                  <span className="az-dot" style={{ background: HEX[c] }} />×{n}
                </button>
              ))}
              {g.center.length === 0 && !g.marker && <span className="muted">boş</span>}
            </div>
          </section>

          {myTurn && sel && (
            <section className="az-dest" aria-label="Fayansları nereye koyacaksın?">
              <p><b>{COLOR_NAME[sel.color]}</b> × {selCount}: nereye koyacaksın?</p>
              <div className="az-dest-btns">
                {LINE_LABEL.map((n, l) => {
                  const e = mine ? placeError(mine, sel.color, l) : 'Oyunda değilsiniz.';
                  return (
                    <button key={l} type="button" className="btn sm" disabled={!!e || busy} onClick={() => move(l)}>
                      Desen {n}
                    </button>
                  );
                })}
                <button type="button" className="btn sm danger" disabled={busy} onClick={() => move(-1)}>Taban</button>
              </div>
              {reasons.length > 0 && <p className="az-hint">{reasons.join(' ')}</p>}
              <button type="button" className="btn sm" onClick={() => setSel(null)}>Vazgeç</button>
            </section>
          )}
        </>
      )}

      {boards}

      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && !over && (
        <LeaveButton busy={busy} onLeave={() => send('leave')} />
      )}
    </div>
  );
}

// Yanlışlıkla ayrılmayı önlemek için iki adımlı onay (BilOnline ile aynı).
function LeaveButton({ busy, onLeave }) {
  const [sure, setSure] = useState(false);
  return sure
    ? <button className="btn sm danger" disabled={busy} onClick={() => { setSure(false); onLeave(); }}>Evet, masadan ayrıl</button>
    : <button className="btn sm" onClick={() => setSure(true)}>Masadan ayrıl</button>;
}
