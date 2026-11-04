'use client';
import '@/styles/game-pisti.css';
import '@/styles/game-pisti-polish.css';
import Lobby from './Lobby';
import LeaveButton from './LeaveButton';
import useRoom from './useRoom';
import { PALETTE } from '@/lib/emlak';
import { rankOf, suitOf } from '@/lib/pisti';

const SUITS = ['♣', '♦', '♥', '♠'];
const SUIT_NAMES = ['sinek', 'karo', 'kupa', 'maça'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK_NAMES = ['As', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Vale', 'Kız', 'Papaz'];

const cardName = (k) => `${SUIT_NAMES[suitOf(k)]} ${RANK_NAMES[rankOf(k) - 1]}`;

function Card({ k, onClick, disabled, big }) {
  const red = suitOf(k) === 1 || suitOf(k) === 2;
  const r = RANKS[rankOf(k) - 1];
  const s = SUITS[suitOf(k)];
  const inner = (
    <>
      <span className="r">{r}</span>
      <span className="s" aria-hidden="true">{s}</span>
    </>
  );
  const cls = `ps-card${red ? ' red' : ''}${big ? ' big' : ''}`;
  if (!onClick) return <span className={cls} role="img" aria-label={cardName(k)}>{inner}</span>;
  return (
    <button type="button" className={cls} disabled={disabled} onClick={onClick} aria-label={`${cardName(k)} kartını at`}>
      {inner}
    </button>
  );
}

// Masada Pişti: sırayla kart atılır; ortadaki son kartla aynı değer ya da vale yeri toplar.
export default function PistiOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'pisti' });
  const { room, err, busy, send } = ui;
  const g = room?.game;

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={4} min={2}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const me = room.me;
  const seated = me >= 0 && !room.seats[me]?.left;
  const names = room.seats.map((s) => s.name);
  const over = g.over;
  const myTurn = seated && !over && g.turn === me;
  const av = (i) => <i className="av" style={{ background: PALETTE[i % PALETTE.length] }}>{i + 1}</i>;

  return (
    <div className="ps">
      {!seated && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}

      <ul className="ps-players">
        {room.seats.map((s, i) => (
          <li key={i} className={`${!over && g.turn === i ? 'on' : ''}${s.left ? ' left' : ''}`}>
            {av(i)}
            <b>{s.name}{i === me ? ' (sen)' : ''}</b>
            <small>{s.left ? 'ayrıldı' : `${g.handCounts[i]} kart eli`}</small>
            <small>Aldığı: {g.takenCounts[i]} · Pişti: {g.pistiN[i]}{g.pisti[i] ? ` (+${g.pisti[i]})` : ''}</small>
          </li>
        ))}
      </ul>

      <section className="ps-table" aria-label="Masanın ortası">
        <div className="pile">
          {g.top !== null ? <Card k={g.top} big /> : <span className="ps-empty">Yer boş</span>}
          <small>{g.tableCount} kart yerde · Deste: {g.deckLeft}</small>
        </div>
        {g.note && <p className="ps-note" role="status">{g.note}</p>}
      </section>

      {over ? (
        <section className="ps-over" role="status">
          <h2>{over.text}</h2>
          <div className="ps-tablewrap">
            <table>
              <thead>
                <tr><th>Oyuncu</th><th>Kart</th><th>Kart puanı</th><th>Pişti</th><th>En çok kart</th><th>Toplam</th></tr>
              </thead>
              <tbody>
                {over.ranking.map((i) => {
                  const sc = over.scores[i];
                  return (
                    <tr key={i} className={over.winners.includes(i) ? 'win' : ''}>
                      <th scope="row">{names[i]}</th>
                      <td>{sc.count}</td><td>{sc.cards}</td><td>{sc.pisti}</td><td>{sc.most}</td><td><b>{sc.total}</b></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn primary" disabled={busy} onClick={() => send('reset')} aria-label="Yeniden oyna, lobiye dön">Yeniden oyna</button>
        </section>
      ) : (
        seated && (
          <section className={`ps-hand${myTurn ? ' me' : ''}`} aria-label="Elin">
            <h2>{myTurn ? 'Sıra sende' : `${names[g.turn] ?? ''} oynuyor`}</h2>
            <div className="cards">
              {g.hand.map((k) => <Card key={k} k={k} disabled={!myTurn || busy} onClick={() => send('psplay', { pl: { card: k } })} />)}
              {g.hand.length === 0 && <p className="muted">Elin boş; yeni dağıtım bekleniyor.</p>}
            </div>
          </section>
        )
      )}

      <p className="mono-where">Aynı değerde kart ya da vale yeri toplar. Yerde tek kart varken aynı değerle toplamak pişti (10 puan, vale ile 20).</p>
      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && !over && <LeaveButton busy={busy} onLeave={() => send('leave')} />}
    </div>
  );
}
