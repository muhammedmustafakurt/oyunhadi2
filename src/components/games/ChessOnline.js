'use client';
import { useState } from 'react';
import { ChessBoard } from './Chess';
import Lobby from './Lobby';
import useRoom from './useRoom';

// Masada iki ayrı telefondan satranç: 1. koltuk Beyaz, 2. koltuk Siyah.
// Hamle, terfi taşı (promo) ve beraberlik/teslim eylemleri sunucuya gönderilir; kurallar sunucuda da doğrulanır.
export default function ChessOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'satranc' });
  const { room, err, busy, send } = ui;
  const [sure, setSure] = useState(false);

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={2} min={2}
        seatNote={(k) => (k === 0 ? 'Beyaz · masayı açan' : 'Siyah')}
      />
    );
  }

  const g = room.game;
  const seated = room.me === 0 || room.me === 1;
  const color = room.me === 0 ? 'w' : room.me === 1 ? 'b' : null;
  const names = { w: room.seats[0].name, b: room.seats[1].name };
  const myTurn = seated && !g.over && g.turn === color;
  return (
    <>
      {!seated && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}
      {seated && !g.over && (
        <p className="mono-where">{`Siz ${color === 'w' ? 'Beyaz' : 'Siyah'} oynuyorsunuz. ${myTurn ? 'Sıra sizde.' : 'Rakibin hamlesi bekleniyor…'}`}</p>
      )}
      <ChessBoard
        g={g}
        names={names}
        flip={color === 'b'}
        canMove={myTurn}
        myColor={color}
        onMove={(fy, fx, ty, tx, promo) => send('move', { from: [fy, fx], to: [ty, tx], promo })}
        onAct={seated ? (type) => send(type) : undefined}
        onNew={() => send('reset')}
        newLabel="Rövanş (lobiye dön)"
      />
      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && !g.over && (
        sure
          ? <button className="btn sm danger" disabled={busy} onClick={() => { setSure(false); send('leave'); }}>Evet, oyunu bırak (yenilirim)</button>
          : <button className="btn sm" onClick={() => setSure(true)}>Masadan ayrıl</button>
      )}
    </>
  );
}
