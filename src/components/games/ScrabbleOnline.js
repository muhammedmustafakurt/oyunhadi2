'use client';
import { useEffect, useRef, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import css from './ScrabbleOnline.module.css';
import { N, TILES, JOKER, premium, pointsOf } from '@/lib/scrabble';

// Masada Scrabble (Türkçe). Raftan taşı seç, tahtada boş bir kareye dokun; yerleşimi onayla. Hamle sunucuda
// denetlenir. Hamle yapıldıktan sonra sıradaki oyuncu hamle yapana kadar diğer oyuncular kelimeye itiraz edebilir.
const PREM = { T: ['tw', 'K3'], D: ['dw', 'K2'], '*': ['center', '★'], t: ['tl', 'H3'], d: ['dl', 'H2'] };
const LETTER_LIST = TILES.map(([l]) => l);

export default function ScrabbleOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'scrabble', pollMs: 1000 });
  const { room, err, busy, send } = ui;
  const g = room?.game;
  const me = room?.me ?? -1;
  const seated = me >= 0 && !room?.seats[me]?.left;
  const running = !!g && !g.over;
  const myTurn = running && seated && g.turn === me && !g.vote;
  const rack = g?.myRack ?? [];

  const [staged, setStaged] = useState([]); // yerel, henüz gönderilmemiş yerleşim: {r, c, ch, blank, ri}
  const [sel, setSel] = useState(null); // seçili raf indeksi
  const [blankPick, setBlankPick] = useState(null); // joker için seçilen harf
  const [swapMode, setSwapMode] = useState(false);
  const [swapSel, setSwapSel] = useState([]);
  const [sure, setSure] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [deadline, setDeadline] = useState(0);
  const timedOut = useRef(null);

  // Yeni bir hamle ya da sıra değişince yerel seçimler sıfırlanır (eski yerleşim artık geçersiz olabilir).
  const key = `${g?.msg ?? ''}|${g?.turn ?? ''}`;
  useEffect(() => {
    setStaged([]); setSel(null); setBlankPick(null); setSwapSel([]); setSwapMode(false);
  }, [key]);

  // Oylama süresi için geri sayım; süre dolunca herhangi bir oturan oyuncu zaman aşımını bildirir.
  const voting = !!g?.vote;
  useEffect(() => {
    if (g?.vote) setDeadline(Date.now() + g.vote.leftMs);
  }, [room?.version]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!voting) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [voting]);
  const voteLeft = voting ? Math.max(0, deadline - now) : 0;
  useEffect(() => {
    if (!voting || !seated || voteLeft > 0) return;
    if (timedOut.current === deadline) return;
    timedOut.current = deadline;
    send('sctimeout');
  }, [voting, voteLeft, deadline]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={4} min={2}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const names = room.seats.map((s) => s.name);
  const board = g.board;
  const stagedAt = new Map(staged.map((s) => [s.r * N + s.c, s]));
  const lastAt = new Set((g.lastMove?.tiles ?? []).map((t) => t.r * N + t.c));
  const visibleRack = rack.map((ch, i) => ({ ch, i })).filter(({ i }) => !staged.some((s) => s.ri === i));
  const selCh = sel !== null ? rack[sel] : null;
  const canPlay = myTurn && staged.length > 0 && !busy;

  // Tahtaya dokunma: yerleştirilmiş taşa dokunmak geri alır; boş kareye seçili taşı koyar.
  const onCell = (r, c) => {
    if (!myTurn || busy) return;
    const s = stagedAt.get(r * N + c);
    if (s) { setStaged(staged.filter((x) => x !== s)); return; }
    if (board[r][c] || sel === null) return;
    if (selCh === JOKER) {
      if (!blankPick) return;
      setStaged([...staged, { r, c, ch: blankPick, blank: true, ri: sel }]);
      setBlankPick(null);
    } else {
      setStaged([...staged, { r, c, ch: selCh, blank: false, ri: sel }]);
    }
    setSel(null);
  };

  const onRack = (i) => {
    if (!myTurn || busy) return;
    if (swapMode) { setSwapSel(swapSel.includes(i) ? swapSel.filter((x) => x !== i) : [...swapSel, i]); return; }
    setSel(sel === i ? null : i);
    setBlankPick(null);
  };

  const play = () => send('scplay', { tiles: staged.map(({ r, c, ch, blank }) => ({ r, c, ch, blank })) });
  const doSwap = () => { if (swapSel.length) send('scswap', { idxs: swapSel }); };
  const undo = () => setStaged(staged.slice(0, -1));
  const recall = () => { setStaged([]); setSel(null); setBlankPick(null); };

  const bar = (
    <p className={css.hint}>
      {myTurn
        ? (swapMode ? 'Değiştirmek istediğin taşları seç.' : 'Rafdan taşı seç, tahtada boş bir kareye dokun. Yerleşmiş taşa dokunursan geri alınır.')
        : g.over ? '' : running && seated ? `Sıra ${names[g.turn]}de.` : 'Oyun sürüyor; izleyici olarak takip ediyorsunuz.'}
    </p>
  );

  return (
    <div className={css.wrap}>
      {!seated && running && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}

      {g.over ? (
        <section className={css.over} role="status">
          <p>{g.over}</p>
          <ul className={css.scores}>
            {g.players.map((p, i) => (
              <li key={i} className={room.seats[i]?.left ? css.left : ''}>
                <span>{p.name}{i === me ? ' (sen)' : ''}</span>
                <small>{p.count} taş</small>
                <b>{p.score}</b>
              </li>
            ))}
          </ul>
          <button className="btn primary" disabled={busy} onClick={() => send('reset')}>Yeni oyun (lobiye dön)</button>
        </section>
      ) : null}

      <ul className={css.scores} aria-label="Puan durumu">
        {g.players.map((p, i) => (
          <li key={i} className={`${i === g.turn && running ? css.turn : ''} ${room.seats[i]?.left ? css.left : ''}`}>
            <span>{names[i] ?? p.name}{i === me ? ' (sen)' : ''}{room.seats[i]?.left ? ' · ayrıldı' : ''}</span>
            <small>{p.count} taş</small>
            <b>{p.score}</b>
          </li>
        ))}
      </ul>
      <p className={css.hint}>Torbada {g.bag} taş kaldı. {g.msg}</p>

      <div className={css.board} role="grid" aria-label="Scrabble tahtası">
        {board.map((row, r) => row.map((cell, c) => {
          const k = r * N + c;
          const st = stagedAt.get(k);
          const prem = premium(r, c);
          const [pcls, plbl] = PREM[prem] ?? [];
          const cls = [css.cell];
          if (cell) cls.push(css.tile);
          else if (pcls) cls.push(css[pcls]);
          if (cell?.blank) cls.push(css.blank);
          if (st) cls.push(css.staged);
          if (lastAt.has(k) && cell) cls.push(css.last);
          const shown = cell ? cell.ch : st ? st.ch : null;
          const label = !cell && !st ? plbl : null;
          const enabled = myTurn && !busy && (st || (!cell && sel !== null));
          return (
            <button
              key={k} type="button" role="gridcell"
              className={cls.join(' ')}
              disabled={!enabled}
              aria-label={shown ? `${r + 1}-${c + 1}: ${shown}` : `${r + 1}-${c + 1}: boş`}
              onClick={() => onCell(r, c)}
            >
              {shown ? <span>{shown}</span> : label ? <span className={css.lbl}>{label}</span> : null}
              {shown && !(cell?.blank) && <em className={css.pts}>{pointsOf(shown)}</em>}
            </button>
          );
        }))}
      </div>

      {bar}

      {g.pending && g.pending.by !== me && running && !g.vote && seated && (
        <div className={css.pending}>
          <span><b>{names[g.pending.by]}</b> "{g.pending.words.join(', ')}" ({g.pending.score} puan) oynadı.</span>
          <span>Sıradaki oyuncu hamle yapana kadar bu kelimeye itiraz edebilirsin.</span>
          <button className="btn sm danger" disabled={busy} onClick={() => send('scchallenge')}>İtiraz et</button>
        </div>
      )}
      {g.pending && g.pending.end && running && (
        <div className={css.pending}>
          <span>Taşlar bitti. Son hamle onaylanınca oyun sona erer.</span>
          <button className="btn sm primary" disabled={busy || !seated} onClick={() => send('sccommit')}>Son hamleyi onayla ve bitir</button>
        </div>
      )}

      {g.vote && (
        <div className={css.vote} role="status">
          <b>İtiraz: "{g.vote.words.join(', ')}" geçerli mi?</b>
          <span>{names[g.vote.challenger]} itiraz etti. {g.vote.valid} geçerli, {g.vote.invalid} geçersiz oy. Kalan süre {Math.ceil(voteLeft / 1000)} sn; süre dolunca oy vermeyenler geçerli sayılır.</span>
          {seated && g.vote.eligible.includes(me) && g.vote.myVote === null && (
            <div className={css.actions}>
              <button className="btn sm primary" disabled={busy} onClick={() => send('scvote', { yes: true })}>Geçerli</button>
              <button className="btn sm danger" disabled={busy} onClick={() => send('scvote', { yes: false })}>Geçersiz</button>
            </div>
          )}
          {seated && g.vote.myVote !== null && <p className={css.hint}>Oyun verildi. Diğerleri bekleniyor.</p>}
        </div>
      )}

      {myTurn && !swapMode && (
        <>
          <div className={css.rackWrap}>
            <div className={css.rack} aria-label="Raf">
              {visibleRack.map(({ ch, i }) => (
                <button
                  key={i} type="button"
                  className={`${css.tileBtn} ${ch === JOKER ? css.joker : ''} ${sel === i ? css.sel : ''}`}
                  disabled={busy}
                  onClick={() => onRack(i)}
                  aria-label={ch === JOKER ? 'joker' : `${ch} harfi`}
                  aria-pressed={sel === i}
                >
                  {ch === JOKER ? '✱' : ch}
                  {ch !== JOKER && <small>{pointsOf(ch)}</small>}
                </button>
              ))}
            </div>
            {selCh === JOKER && (
              <div className={css.picker} aria-label="Jokerin harfi">
                {LETTER_LIST.map((l) => (
                  <button key={l} type="button" className={`${css.pick} ${blankPick === l ? css.on : ''}`} onClick={() => setBlankPick(l)}>{l}</button>
                ))}
              </div>
            )}
          </div>
          <div className={css.actions}>
            <button className="btn sm" disabled={!staged.length || busy} onClick={undo}>Geri al</button>
            <button className="btn sm" disabled={!staged.length || busy} onClick={recall}>Hepsini geri al</button>
            <button className="btn sm primary" disabled={!canPlay} onClick={play}>Kelimeyi oyna</button>
          </div>
          <div className={css.actions}>
            <button className="btn sm" disabled={busy || staged.length > 0} onClick={() => send('scpass')}>Pas geç</button>
            <button className="btn sm" disabled={busy || staged.length > 0 || (g.bag < 7)} onClick={() => setSwapMode(true)}>Taş değiştir</button>
          </div>
        </>
      )}

      {myTurn && swapMode && (
        <div className={css.actions}>
          <button className="btn sm" disabled={busy} onClick={() => { setSwapMode(false); setSwapSel([]); }}>Vazgeç</button>
          <button className="btn sm primary" disabled={busy || !swapSel.length} onClick={doSwap}>Seçilenleri değiştir ({swapSel.length})</button>
        </div>
      )}

      {myTurn && swapMode && (
        <div className={css.rack} aria-label="Raf (değiştirilecek taşlar)">
          {rack.map((ch, i) => (
            <button
              key={i} type="button"
              className={`${css.tileBtn} ${ch === JOKER ? css.joker : ''} ${swapSel.includes(i) ? css.mark : ''}`}
              disabled={busy}
              onClick={() => onRack(i)}
            >
              {ch === JOKER ? '✱' : ch}
            </button>
          ))}
        </div>
      )}

      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && running && (
        sure
          ? <button className="btn sm danger" disabled={busy} onClick={() => { setSure(false); send('leave'); }}>Evet, masadan ayrıl</button>
          : <button className="btn sm" onClick={() => setSure(true)}>Masadan ayrıl</button>
      )}
    </div>
  );
}
