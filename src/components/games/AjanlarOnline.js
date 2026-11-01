'use client';
import { useEffect, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { TEAM } from '@/lib/ajanlar';
import Icon from './Icon';

const CONFETTI = ['🎉', '✨', '🏆', '🎊', '⭐'];

// Masada Gizli Ajanlar: ajan şefleri anahtarı görür, ajanlar yalnızca açılan kartları.
export default function AjanlarOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'ajanlar' });
  const { room, err, busy, send } = ui;
  const [sel, setSel] = useState(null); // seçili (henüz açılmamış) kart
  const [word, setWord] = useState('');
  const [num, setNum] = useState('1');
  const [sure, setSure] = useState(false);

  // İpucu gönderildikten sonra yazılan kelime, ipucu değiştiğinde temizlenir (hata olursa kullanıcı yazdığını kaybetmez).
  const clueWord = room?.game?.clue?.word ?? null;
  useEffect(() => { setWord(''); }, [clueWord]);

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={8} min={4}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const g = room.game;
  const seated = room.me >= 0 && !room.seats[room.me]?.left;
  const me = seated ? g.me : null; // { team, spy }
  const over = g.over;
  const myTurn = !!me && me.team === g.turn && !over;
  const canClue = myTurn && me.spy && !g.clue;
  const canPick = myTurn && !me.spy && !!g.clue;
  const names = room.seats.map((s) => s.name);
  // Seçili kart yalnızca hâlâ kapalıysa geçerlidir (tur değişince eski seçim kalmasın).
  const selCard = sel !== null && !g.cards[sel]?.rev ? sel : null;
  const unlimited = !!g.clue && g.clue.num === 0;

  const members = (team) => room.seats.map((s, i) => ({ s, i })).filter(({ i }) => g.teams[i] === team);

  return (
    <div className="aj">
      {!seated && <p className="mono-where">Tur başladı; izleyici olarak takip ediyorsunuz.</p>}

      <div className="aj-score">
        <div className={`aj-team r${g.turn === 'r' && !over ? ' on' : ''}${over?.winner === 'r' ? ' won' : ''}`}>
          <b>{g.remaining.r}</b><span>{TEAM.r}</span>
        </div>
        <i>{over ? 'bitti' : 'sıra'}</i>
        <div className={`aj-team b${g.turn === 'b' && !over ? ' on' : ''}${over?.winner === 'b' ? ' won' : ''}`}>
          <b>{g.remaining.b}</b><span>{TEAM.b}</span>
        </div>
      </div>

      {me && (
        <p className={`aj-role ${me.team}`}>
          {TEAM[me.team]} takım · {me.spy ? 'Ajan şefi (anahtarı sen görüyorsun)' : 'Ajan'}
        </p>
      )}

      {over ? (
        <section className={`aj-over ${over.winner}`} role="status">
          <div className="aj-confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.3}s`, animationDuration: `${2.4 + (i % 4) * 0.4}s` }}>{CONFETTI[i % CONFETTI.length]}</span>
            ))}
          </div>
          <div className="aj-trophy" aria-hidden="true"><Icon name={over.winner === 'none' ? 'scale' : 'trophy'} /></div>
          <p>{over.text}</p>
          <button className="btn primary" disabled={busy} onClick={() => { setSel(null); send('reset'); }}>Yeni tur (lobiye dön)</button>
        </section>
      ) : (
        <section className={`aj-clue ${g.turn}`} role="status">
          {g.clue ? (
            <>
              <div className="txt">
                <span className="lbl">{TEAM[g.turn]} takımın ipucu</span>
                <b className="word">{g.clue.word}</b>
                <span className="left">{unlimited ? 'Sınırsız tahmin' : `${g.guessesLeft} tahmin hakkı`}</span>
              </div>
              <em className="num" aria-label={unlimited ? 'sınırsız' : `${g.clue.num} kelime`}>{g.clue.num === 0 ? '∞' : g.clue.num}</em>
            </>
          ) : (
            <div className="txt">
              <span className="lbl">Sıra {TEAM[g.turn]} takımda</span>
              <b className="word wait">{names[g.spies[g.turn]]} ipucu veriyor…</b>
            </div>
          )}
        </section>
      )}
      {g.note && !over && <p className="aj-note">{g.note}</p>}

      {canClue && (
        <form
          className="aj-form"
          onSubmit={(e) => { e.preventDefault(); send('clue', { word: word.trim(), num: Number(num) }); }}
        >
          <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Tek kelimelik ipucu" maxLength={24} autoComplete="off" autoCapitalize="none" required />
          <select value={num} onChange={(e) => setNum(e.target.value)} aria-label="Kaç kelime">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}</option>)}
            <option value="0">Sınırsız</option>
          </select>
          <button className="btn primary" disabled={busy}>İpucu ver</button>
        </form>
      )}

      <div className="aj-board" role="group" aria-label="Kelime tahtası">
        {g.cards.map((c, i) => (
          <button
            key={i}
            className={`aj-card${c.rev ? ` rev ${c.c}` : ''}${!c.rev && c.c ? ` key ${c.c}` : ''}${selCard === i ? ' sel' : ''}${over && !c.rev ? ' dim' : ''}`}
            disabled={!canPick || c.rev}
            onClick={() => setSel(selCard === i ? null : i)}
            aria-label={c.w}
            aria-pressed={canPick && !c.rev ? selCard === i : undefined}
          >
            <span>{c.w}</span>
            {c.c === 'a' && (c.rev || me?.spy || over) && <i aria-hidden="true"><Icon name="skull" /></i>}
            {c.rev && (c.c === 'r' || c.c === 'b') && <i className="ag" aria-hidden="true"><Icon name="spy" /></i>}
          </button>
        ))}
      </div>

      {canPick && (
        <div className="aj-actions">
          {selCard !== null ? (
            <button className="btn primary" disabled={busy} onClick={() => { send('pick', { card: selCard }); setSel(null); }}>
              &quot;{g.cards[selCard].w}&quot; kartını aç
            </button>
          ) : (
            <p className="sf-help">Açmak istediğiniz karta dokunun, sonra onaylayın.</p>
          )}
          {g.guessed >= 1 && <button className="btn" disabled={busy} onClick={() => { setSel(null); send('endturn'); }}>Turu bitir</button>}
        </div>
      )}
      {myTurn && me?.spy && g.clue && <p className="sf-help">Takımın tahmin ediyor, kartları o açacak.</p>}
      {seated && !myTurn && !over && (
        <p className="sf-help">
          {me.team === g.turn
            ? (me.spy ? '' : 'Ajan şefinin ipucu vermesini bekleyin…')
            : `Sıra ${TEAM[g.turn]} takımda, bekleyin…`}
        </p>
      )}

      <section className="aj-teams">
        {['r', 'b'].map((t) => (
          <div key={t} className={t}>
            <h2>{TEAM[t]} takım</h2>
            <ul>
              {members(t).map(({ s, i }) => (
                <li key={i} className={s.left ? 'gone' : ''}>
                  {s.name}{i === room.me ? ' (sen)' : ''}{g.spies[t] === i && <em>şef</em>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && !over && (
        sure
          ? <button className="btn sm danger" disabled={busy} onClick={() => { setSure(false); send('leave'); }}>Evet, masadan ayrıl (takım dağılır)</button>
          : <button className="btn sm" onClick={() => setSure(true)}>Masadan ayrıl</button>
      )}
    </div>
  );
}
