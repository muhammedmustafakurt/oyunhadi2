'use client';
import { useState } from 'react';
import { PALETTE, TOKENS } from '@/lib/emlak';

// Masa lobisi: oyuncu listesi, katılma, başlatma ve ayrılma. Emlak Krallığı ve Satranç ortak kullanır.
// seatNote(k): koltuğun yanında görünen not (ör. satrançta "Beyaz").
export default function Lobby({ masaNo, room, ui, max, min, seatNote, options, startExtra, tokens = false }) {
  const [want, setWant] = useState(0);
  const { name, setName, busy, err, join, send } = ui;
  const seated = room.me >= 0;
  const full = room.seats.length >= max;
  return (
    <div className="mono-lobby">
      <h2>Masa {masaNo}: oyuncular</h2>
      {room.seats.length === 0 ? <p className="muted">Henüz kimse katılmadı.</p> : (
        <ul className="mono-seats">
          {room.seats.map((s, k) => (
            <li key={k}>
              <i className="av" style={{ background: PALETTE[k % PALETTE.length] }}>{tokens && s.tok !== undefined ? TOKENS[s.tok] : k + 1}</i>
              <span>{s.name}{k === room.me ? ' (sen)' : ''}</span>
              <span className="host">{seatNote(k)}</span>
            </li>
          ))}
        </ul>
      )}
      {tokens && (() => {
        const taken = new Set(room.seats.filter((s, k) => k !== room.me && !s.left).map((s) => s.tok));
        const mine = seated ? room.seats[room.me].tok : want;
        return (
          <div className="tok-pick" role="radiogroup" aria-label="Piyon simgenizi seçin">
            <b>Simgenizi seçin</b>
            <div>
              {TOKENS.map((e, i) => (
                <button key={i} type="button" role="radio" aria-checked={mine === i} className={mine === i ? 'on' : undefined} disabled={busy || taken.has(i)}
                  onClick={() => (seated ? send('token', { tok: i }) : setWant(i))}>{e}</button>
              ))}
            </div>
          </div>
        );
      })()}
      {!seated ? (
        <div className="mono-join">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Adınız" maxLength={16} autoComplete="nickname" />
          <button className="btn primary" disabled={busy || full} onClick={() => join({ tok: want })}>{full ? 'Masa dolu' : 'Masaya katıl'}</button>
        </div>
      ) : (
        <>
          {options}
          <button className="btn primary" disabled={busy || room.seats.length < min} onClick={() => send('start', startExtra)}>
            {room.seats.length < min ? `En az ${min} kişi gerekli` : 'Oyunu başlat'}
          </button>
          <button className="btn sm" disabled={busy} onClick={() => send('leave')}>Masadan ayrıl</button>
        </>
      )}
      <p className="mono-where">Aynı masadaki arkadaşlarınız bu sayfayı kendi telefonlarında açıp katılabilir. En fazla {max} kişi.</p>
      {err && <p className="mono-err" role="alert">{err}</p>}
    </div>
  );
}
