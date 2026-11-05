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

// Standart iskambil dizilimi: [x%, y%]; alt yarıdaki işaretler ters çevrilir.
const L = 38, C = 50, R = 62;
const PIPS = {
  2: [[C, 22], [C, 78]],
  3: [[C, 22], [C, 50], [C, 78]],
  4: [[L, 22], [R, 22], [L, 78], [R, 78]],
  5: [[L, 22], [R, 22], [C, 50], [L, 78], [R, 78]],
  6: [[L, 22], [R, 22], [L, 50], [R, 50], [L, 78], [R, 78]],
  7: [[L, 22], [R, 22], [C, 36], [L, 50], [R, 50], [L, 78], [R, 78]],
  8: [[L, 22], [R, 22], [C, 36], [L, 50], [R, 50], [C, 64], [L, 78], [R, 78]],
  9: [[L, 22], [R, 22], [L, 41], [R, 41], [C, 50], [L, 59], [R, 59], [L, 78], [R, 78]],
  10: [[L, 22], [R, 22], [C, 31], [L, 41], [R, 41], [L, 59], [R, 59], [C, 69], [L, 78], [R, 78]],
};

function Card({ k, onClick, disabled, big, fresh }) {
  const red = suitOf(k) === 1 || suitOf(k) === 2;
  const n = rankOf(k);
  const r = RANKS[n - 1];
  const s = SUITS[suitOf(k)];
  const inner = (
    <>
      <span className="ix" aria-hidden="true"><b>{r}</b><i>{s}</i></span>
      <span className="ix lo" aria-hidden="true"><b>{r}</b><i>{s}</i></span>
      <span className="face" aria-hidden="true">
        {n === 1 && <i className="ace">{s}</i>}
        {n > 10 && <span className="court"><b>{r}</b><i>{s}</i></span>}
        {PIPS[n]?.map(([x, y], j) => (
          <i key={j} className={`pip${y > 50 ? ' flip' : ''}`} style={{ left: `${x}%`, top: `${y}%` }}>{s}</i>
        ))}
      </span>
    </>
  );
  // Atılan kartın hafif farklı eğimi: aynı kart hep aynı açıyla durur.
  const style = big ? { '--tilt': `${((k * 37) % 13) - 6}deg` } : undefined;
  const cls = `ps-card${red ? ' red' : ''}${big ? ' big' : ''}${fresh ? ' fresh' : ''}`;
  if (!onClick) return <span className={cls} style={style} role="img" aria-label={cardName(k)}>{inner}</span>;
  return (
    <button type="button" className={cls} disabled={disabled} onClick={onClick} aria-label={`${cardName(k)} kartını at`}>
      {inner}
    </button>
  );
}

// Kapalı kart (deste, rakip eli, yerdeki alt kartlar).
const Back = ({ style }) => <span className="ps-back" style={style} aria-hidden="true" />;

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

  const stat = (i) => (
    <span className="stats">
      <span title="Aldığı kart"><b>{g.takenCounts[i]}</b> kart</span>
      <span title="Pişti"><b>{g.pistiN[i]}</b> pişti{g.pisti[i] ? <em> +{g.pisti[i]}</em> : null}</span>
    </span>
  );
  // Rakipler üstte; izleyici ise herkes görünür. Oturan oyuncunun kendi bilgisi elinin başlığında.
  const others = room.seats.map((s, i) => i).filter((i) => i !== me);
  const under = Math.min(Math.max(g.tableCount - 1, 0), 4);

  return (
    <div className="ps">
      {!seated && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}

      <ul className="ps-players" data-n={others.length}>
        {others.map((i) => {
          const s = room.seats[i];
          const cnt = g.handCounts[i] ?? 0;
          return (
            <li key={i} className={`${!over && g.turn === i ? 'on' : ''}${s.left ? ' left' : ''}`}>
              {av(i)}
              <b>{s.name}</b>
              <span className="fan" aria-label={s.left ? 'ayrıldı' : `${cnt} kart eli`}>
                {s.left ? <small>ayrıldı</small> : Array.from({ length: cnt }, (_, j) => <Back key={j} style={{ '--i': j, '--n': cnt }} />)}
              </span>
              {stat(i)}
            </li>
          );
        })}
      </ul>

      <section className="ps-table" aria-label="Masanın ortası">
        <div className="ps-deck" aria-label={`Destede ${g.deckLeft} kart`}>
          {g.deckLeft > 0 ? (
            <>
              <span className="stack"><Back /><Back /><Back /></span>
              <small><b>{g.deckLeft}</b> deste</small>
            </>
          ) : <small>deste bitti</small>}
        </div>
        <div className="pile">
          <div className="spot">
            {Array.from({ length: under }, (_, j) => <Back key={j} style={{ '--j': j }} />)}
            {g.top !== null ? <Card key={`${g.top}-${g.tableCount}`} k={g.top} big fresh /> : <span className="ps-empty">Yer boş</span>}
          </div>
          <small><b>{g.tableCount}</b> kart yerde</small>
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
            <div className="head">
              <h2>{myTurn ? 'Sıra sende' : `${names[g.turn] ?? ''} oynuyor`}</h2>
              <span className="me">{av(me)}{stat(me)}</span>
            </div>
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
