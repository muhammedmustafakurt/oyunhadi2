'use client';
import { useEffect, useMemo, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import '@/styles/game-okey.css';
import '@/styles/game-okey-polish.css';
import { tileFace, isJoker, evalGroup, evalPair } from '@/lib/okey';

// Masada Okey 101 (2-4 kişi, bireysel). Elin sıralaması yalnız bu cihazda tutulur; per doğrulaması sunucudadır,
// buradaki önizleme (toplam puan) yalnız kolaylık içindir.
const COLORS = ['kirmizi', 'mavi', 'siyah', 'sari'];
const COLOR_NAMES = ['Kırmızı', 'Mavi', 'Siyah', 'Sarı'];

function Tile({ id, ok, on, drawn, onClick, drag, small, label }) {
  const fake = id >= 104;
  const f = tileFace(ok, id);
  const joker = isJoker(ok, id);
  const cls = ['ok-tile', 'ok-' + COLORS[f.c], on ? 'on' : '', drawn ? 'new' : '', small ? 'sm' : '', joker ? 'joker' : '', fake ? 'fake' : ''].join(' ');
  const text = fake ? 'sahte okey' : `${COLOR_NAMES[f.c]} ${f.n}${joker ? ', okey' : ''}`;
  const inner = (
    <>
      <b>{fake ? '★' : f.n}</b>
      <i aria-hidden="true" />
      {joker && <u aria-hidden="true">★</u>}
    </>
  );
  if (!onClick) return <span className={cls} role="img" aria-label={label ?? text}>{inner}</span>;
  return (
    <button
      type="button" className={cls} aria-pressed={!!on} aria-label={label ?? text} onClick={onClick}
      draggable={!!drag} onDragStart={drag?.start} onDragOver={drag?.over} onDrop={drag?.drop}
    >{inner}</button>
  );
}

export default function OkeyOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'okey', pollMs: 1200 });
  const { room, err, busy, send } = ui;
  const g = room?.game;
  const me = room?.me ?? -1;
  const seated = me >= 0 && !room?.seats[me]?.left;
  const running = !!g && !g.over;
  const myTurn = running && seated && g.turn === me;
  const ok = g?.ok;

  const [order, setOrder] = useState([]); // elin yerel sıralaması
  const [sel, setSel] = useState([]); // seçili taşlar (seçim sırasıyla)
  const [draft, setDraft] = useState([]); // açma panelindeki gruplar
  const [pairsSel, setPairs] = useState(false);
  const [dragId, setDragId] = useState(null);

  const handKey = (g?.hand ?? []).join(',');
  const ordered = useMemo(() => {
    const hand = g?.hand ?? [];
    const have = new Set(hand);
    const kept = order.filter((x) => have.has(x));
    const ks = new Set(kept);
    return [...kept, ...hand.filter((x) => !ks.has(x))];
  }, [handKey, order]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sıra, adım ya da el değişince seçim temizlenir; taslak yalnız elde olmayan taş kalırsa düşer.
  const stepKey = `${g?.turn}|${g?.step}|${g?.melds?.length}`;
  useEffect(() => {
    const have = new Set(g?.hand ?? []);
    setSel((s) => s.filter((x) => have.has(x)));
    setDraft((d) => (d.every((grp) => grp.every((x) => have.has(x))) ? d : []));
  }, [stepKey, handKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;
  if (room.phase === 'lobby') {
    return (
      <Lobby masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={4} min={2}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')} />
    );
  }

  const names = g.names;
  const inDraft = new Set(draft.flat());
  const handShown = ordered.filter((id) => !inDraft.has(id));
  const opened = g.opened[me] ?? null;
  const pairs = opened ? opened === 'pairs' : pairsSel;

  const rank = (id, byNum) => {
    const f = tileFace(ok, id);
    const jk = isJoker(ok, id) ? 1000 : 0;
    return jk + (byNum ? f.n * 4 + f.c : f.c * 14 + f.n);
  };
  const sortBy = (byNum) => setOrder([...ordered].sort((a, b) => rank(a, byNum) - rank(b, byNum)));
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const moveBefore = (id, target) => {
    if (id === target) return;
    const rest = ordered.filter((x) => x !== id);
    rest.splice(rest.indexOf(target), 0, id);
    setOrder(rest);
  };
  const shift = (d) => {
    if (sel.length !== 1) return;
    const i = ordered.indexOf(sel[0]);
    const j = i + d;
    if (j < 0 || j >= ordered.length) return;
    const o = [...ordered];
    [o[i], o[j]] = [o[j], o[i]];
    setOrder(o);
  };
  const drag = (id) => ({
    start: () => setDragId(id),
    over: (e) => e.preventDefault(),
    drop: (e) => { e.preventDefault(); if (dragId !== null) moveBefore(dragId, id); setDragId(null); },
  });

  const preview = sel.length >= 2 ? (pairs ? evalPair(ok, sel) : evalGroup(ok, sel)) : null;
  const addToDraft = () => {
    if (!preview) return;
    setDraft([...draft, sel]);
    setSel([]);
  };
  const groupPts = (grp) => (pairs ? 0 : evalGroup(ok, grp)?.pts ?? 0);
  const total = draft.reduce((a, grp) => a + groupPts(grp), 0);
  const canOpen = myTurn && g.step === 'discard' && draft.length > 0 && !busy
    && (opened || (pairs ? draft.length >= 5 : total >= 101));

  const prevName = g.prev >= 0 ? names[g.prev] : '';
  const prevTop = g.prev >= 0 && g.disc[g.prev].length ? g.disc[g.prev][g.disc[g.prev].length - 1] : null;
  const indFace = tileFace({ c: 0, n: 0 }, g.ind);
  const canAdd = myTurn && g.step === 'discard' && opened === 'melds' && sel.length === 1 && g.counts[me] > 1 && !busy;

  const hint = !seated ? 'İzleyici olarak takip ediyorsunuz.'
    : g.over ? ''
      : !myTurn ? `Sıra ${names[g.turn]} oyuncusunda.`
        : g.step === 'draw' ? 'Sıra sende: desteden çek ya da önceki oyuncunun attığı taşı al.'
          : 'Per diz, taş işle ya da bir taş seçip at.';

  return (
    <div className="ok-wrap">
      {g.over && (
        <section className="ok-over" role="status">
          <h2>{g.over.text}</h2>
          <table>
            <thead><tr><th>Oyuncu</th><th>Durum</th><th>Puan</th></tr></thead>
            <tbody>
              {[...g.over.scores].sort((a, b) => a.score - b.score).map((s) => (
                <tr key={s.seat} className={s.seat === g.over.winner ? 'win' : ''}>
                  <td>{s.name}{s.seat === me ? ' (sen)' : ''}</td>
                  <td>{s.kind === 'okey' ? 'okeyle bitirdi' : s.kind}</td>
                  <td><b>{s.score}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="ok-small">Düşük puan iyidir. Elde kalan taşlar sayı toplamıyla, okey 25 ile sayılır.</p>
          {g.over.hands.map((h, i) => h.length > 0 && (
            <div key={i} className="ok-reveal"><span>{names[i]}</span>
              <div>{h.map((id) => <Tile key={id} id={id} ok={ok} small />)}</div>
            </div>
          ))}
          {seated && <button className="btn primary" disabled={busy} onClick={() => send('reset')}>Yeni oyun (lobiye dön)</button>}
        </section>
      )}

      <div className="ok-table">
        <ul className="ok-players" aria-label="Oyuncular">
          {names.map((nm, i) => {
            const turn = i === g.turn && running;
            return (
              <li key={i} className={`${turn ? 'turn' : ''} ${g.out[i] ? 'left' : ''} ${i === me ? 'me' : ''}`} aria-current={turn ? 'true' : undefined}>
                <span className="ok-pn">{turn && <em className="ok-dot" aria-hidden="true" />}{nm}{i === me ? ' (sen)' : ''}</span>
                <small>
                  {g.out[i] ? 'ayrıldı' : (
                    <>
                      <span className="ok-bk" aria-hidden="true">{g.counts[i]}</span>
                      {`${g.counts[i]} taş · ${g.opened[i] === 'pairs' ? 'çift açtı' : g.opened[i] ? 'açtı' : 'açmadı'}`}
                    </>
                  )}
                </small>
              </li>
            );
          })}
        </ul>

        <div className="ok-top">
          <div className="ok-ind">
            <span>Gösterge</span>
            <Tile id={g.ind} ok={{ c: -1, n: -1 }} small label={`Gösterge: ${COLOR_NAMES[indFace.c]} ${indFace.n}`} />
            <span className="ok-okey">Okey <b className={'ok-' + COLORS[ok.c]}><i aria-hidden="true" />{COLOR_NAMES[ok.c]} {ok.n}</b></span>
          </div>
          <div className="ok-deck">
            <span className="ok-stack" aria-hidden="true"><i /><i /><i /></span>
            <b>{g.deck}</b><span>destede</span>
          </div>
        </div>

        <div className="ok-piles" aria-label="Atılan taşlar">
          {names.map((nm, i) => {
            const pile = g.disc[i];
            const top = pile[pile.length - 1];
            const takeable = myTurn && g.step === 'draw' && g.prev === i && top !== undefined;
            return (
              <div key={i} className={'ok-pile' + (takeable ? ' take' : '')}>
                <span>{nm}</span>
                {top !== undefined ? <Tile id={top} ok={ok} small /> : <i className="ok-empty">boş</i>}
                <small>{pile.length} atık</small>
              </div>
            );
          })}
        </div>

        <section aria-label="Masadaki perler" className="ok-melds-wrap">
          <h3 className="ok-h">Masadaki perler</h3>
          {g.melds.length === 0 ? <p className="ok-small">Henüz per açılmadı.</p> : (
            <ul className="ok-melds">
              {g.melds.map((m, mi) => (
                <li key={mi}>
                  <span className="ok-owner">{names[m.owner]}</span>
                  <div className="ok-mrow">
                    {canAdd && m.k === 'run' && <button type="button" className="ok-plus" aria-label="Perin başına işle" onClick={() => send('okadd', { pl: { meld: mi, tile: sel[0], pos: 0 } })}>+</button>}
                    {m.tiles.map((t) => <Tile key={t.id} id={t.id} ok={ok} small />)}
                    {canAdd && m.k !== 'pair' && <button type="button" className="ok-plus" aria-label={m.k === 'run' ? 'Perin sonuna işle' : 'Pere işle'} onClick={() => send('okadd', { pl: { meld: mi, tile: sel[0], pos: m.tiles.length } })}>+</button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {myTurn && <p className="ok-turn" role="status"><em className="ok-dot" aria-hidden="true" />Sıra sende{g.step === 'draw' ? ': taş çek' : ': taş at'}</p>}
      <p className="mono-where">{g.note} {hint}</p>
      {err && <p className="mono-err" role="alert">{err}</p>}

      {myTurn && g.step === 'draw' && (
        <div className="ok-actions">
          <button className="btn primary" disabled={busy} onClick={() => send('okdraw', { pl: { from: 'deck' } })}>Desteden çek</button>
          <button className="btn" disabled={busy || prevTop === null} onClick={() => send('okdraw', { pl: { from: 'discard' } })}>
            {prevTop === null ? 'Alınacak taş yok' : `${prevName} oyuncusunun attığını al`}
          </button>
        </div>
      )}

      {seated && (
        <section aria-label="Elin">
          <h3 className="ok-h">Elin <small>({g.hand.length} taş)</small></h3>
          <div className="ok-rack">
            <div className="ok-hand">
              {handShown.map((id) => (
                <Tile key={id} id={id} ok={ok} on={sel.includes(id)} drawn={id === g.drawn} onClick={() => toggle(id)} drag={drag(id)} />
              ))}
            </div>
          </div>
          <div className="ok-sort">
            <button type="button" className="btn sm" onClick={() => sortBy(false)}>Renge göre diz</button>
            <button type="button" className="btn sm" onClick={() => sortBy(true)}>Sayıya göre diz</button>
            <button type="button" className="btn sm" disabled={sel.length !== 1} onClick={() => shift(-1)} aria-label="Seçili taşı sola kaydır">◀</button>
            <button type="button" className="btn sm" disabled={sel.length !== 1} onClick={() => shift(1)} aria-label="Seçili taşı sağa kaydır">▶</button>
          </div>

          {myTurn && g.step === 'discard' && (
            <div className="ok-panel">
              <div className="ok-actions">
                <button className="btn primary" disabled={busy || sel.length !== 1} onClick={() => send('okdiscard', { pl: { tile: sel[0] } })}>Taşı at</button>
                {opened !== 'melds' && (
                  <label className="ok-check">
                    <input type="checkbox" checked={pairs} disabled={opened === 'pairs' || draft.length > 0} onChange={(e) => setPairs(e.target.checked)} />
                    Çift aç
                  </label>
                )}
              </div>
              <p className="ok-small" aria-live="polite">
                {sel.length >= 2
                  ? (preview ? `Seçili: geçerli ${pairs ? 'çift' : preview.k === 'run' ? 'seri' : 'küme'}${pairs ? '' : `, ${preview.pts} puan`}.` : 'Seçili taşlar geçerli bir per değil.')
                  : 'Per için taşları sırayla seç (seride küçükten büyüğe).'}
              </p>
              <button className="btn" disabled={!preview || busy} onClick={addToDraft}>Per olarak ekle</button>
              {draft.length > 0 && (
                <div className="ok-draft">
                  {draft.map((grp, di) => (
                    <div key={di} className="ok-mrow">
                      {grp.map((id) => <Tile key={id} id={id} ok={ok} small />)}
                      <span className="ok-pts">{pairs ? 'çift' : groupPts(grp)}</span>
                      <button type="button" className="ok-x" aria-label="Bu peri taslaktan çıkar" onClick={() => setDraft(draft.filter((_, k) => k !== di))}>×</button>
                    </div>
                  ))}
                  <p className="ok-total" aria-live="polite">
                    {pairs ? `${draft.length} çift (en az 5)` : `Toplam: ${total}${opened ? '' : ' / 101'}`}
                  </p>
                  <button className="btn primary" disabled={!canOpen} onClick={() => send('okopen', { pl: { melds: draft, pairs } })}>
                    {opened ? 'Perleri diz' : 'Aç'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
