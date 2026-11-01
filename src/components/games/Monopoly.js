'use client';
import { useEffect, useRef, useState } from 'react';
import {
  TILES, GROUPS, COLORS, TOKENS, BID_STEPS, JAIL_KEFARET, RR_RENTS, fmt, newGame,
  roll, buy, skipBuy, bid as placeBid, passBid, payJail, useJailCard, rentOf,
  build, sellHouse, mortgage, unmortgage, canBuild, canSell, canMortgage, canUnmortgage,
} from '@/lib/emlak';
import { IMG } from '@/lib/emlak-img';

// Tahtanın kenarı boyunca 7x7 ızgarada saat yönünde yerleşim (0. kare sağ alt köşe, 6. sol alt, 12. sol üst, 18. sağ üst).
const SIDE = TILES.length / 4;
function cell(i) {
  if (i <= SIDE) return [SIDE, SIDE - i];
  if (i <= SIDE * 2) return [SIDE * 2 - i, 0];
  if (i <= SIDE * 3) return [0, i - SIDE * 2];
  return [i - SIDE * 3, SIDE];
}
// Karenin hangi kenarda olduğu: renk bandı her zaman tahtanın ortasına bakan yönde çizilir.
const sideOf = (i) => { const [r, c] = cell(i); return r === SIDE ? 'b' : c === 0 ? 'l' : r === 0 ? 't' : 'r'; };
const isCorner = (i) => i % SIDE === 0;

// Köşe karelerinde görünen kısa ad.
const CORNER = { 'Başlangıç': 'Başla', 'Hapishane': 'Hapis', 'Serbest Park': 'Park', 'Hapse Git': 'Hapse git' };
// Karede sığması için kısa şehir adı.
const SHORT = { 'Kahramanmaraş': 'K.Maraş', 'Haydarpaşa Garı': 'Haydar Gar', 'Ankara Garı': 'Ankara Gar', 'Şanlıurfa': 'Şanlıurfa', 'Nişantaşı': 'Nişantaşı' };
const kfmt = (v) => (v < 1000 ? String(v) : `${v / 1000}K`);

const RR_COLOR = '#3d4a5c';
const UTIL_COLOR = '#7a8594';
const colorOf = (t) => (t.t === 'p' ? GROUPS[t.group] : t.t === 'rr' ? RR_COLOR : t.t === 'util' ? UTIL_COLOR : undefined);
const ICON = { go: '🏁', jail: '🔒', park: '🅿️', gojail: '👮', tax: '💸', chance: '❓', chest: '🎁' };
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const CONFETTI = ['🎉', '✨', '💰', '🪙', '🎊'];

const die = () => 1 + Math.floor(Math.random() * 6);
const ownedOf = (g, o) => Object.keys(g.owner).filter((k) => g.owner[k] === o).map(Number).sort((a, b) => a - b);

function Die({ n, i }) {
  return (
    <span className="die3" style={{ '--d': i }} aria-hidden="true">
      {Array.from({ length: 9 }, (_, k) => <i key={k} className={PIPS[n].includes(k) ? 'on' : undefined} />)}
    </span>
  );
}

// Şans / Kamu Fonu kartı: ekranın ortasına gelir, arka yüzünden çevrilip metni gösterir. Dokununca kapanır.
function DrawnCard({ card, onClose }) {
  const chance = card.deck === 'chance';
  return (
    <div className="mono-draw" onClick={onClose} role="dialog" aria-label={chance ? 'Şans kartı' : 'Kamu Fonu kartı'}>
      <div className={`card3d ${chance ? 'chance' : 'chest'}`}>
        <div className="face back" aria-hidden="true"><em>{chance ? '❓' : '🎁'}</em><span>{chance ? 'ŞANS' : 'KAMU FONU'}</span></div>
        <div className="face front">
          <small>{chance ? 'ŞANS' : 'KAMU FONU'}</small>
          <em className="big" aria-hidden="true">{chance ? '❓' : '🎁'}</em>
          <p>{card.txt}</p>
          <button className="btn primary" onClick={onClose}>Tamam</button>
        </div>
      </div>
    </div>
  );
}

// Alttan açılan tapu sayfası: dokunulan karenin bilgisi; satın alma kararında Satın al / Geç düğmeleri de burada.
function Sheet({ g, idx, buying, mine, busy, onBuy, onSkip, onClose }) {
  const t = TILES[idx];
  const o = g.owner[idx];
  const col = colorOf(t);
  const h = g.houses[idx] || 0;
  const kind = t.t === 'p' ? 'Tapu' : t.t === 'rr' ? 'Gar' : t.t === 'util' ? 'İşletme' : 'Özel kare';
  const who = o !== undefined ? `${TOKENS[g.players[o].tok ?? o]} ${g.players[o].name}${g.mort.includes(idx) ? ' · ipotekli' : ''}` : t.price !== undefined ? 'sahibi yok' : '';
  const cur = g.players[g.turn];
  return (
    <div className="mono-sheet" role="dialog" aria-label={t.n}>
      <div className="grab" aria-hidden="true" />
      <div className="top">
        <span className="chip" style={{ background: col || 'var(--tint)' }}>{!col && <em>{ICON[t.t]}</em>}</span>
        <h3>{t.n}<small>{kind}{who ? ` · ${who}` : ''}</small></h3>
        {!buying && <button className="x" onClick={onClose} aria-label="Kapat">✕</button>}
      </div>
      {t.price !== undefined && (
        <div className="kv">
          <span>Fiyat<b>{fmt(t.price)}</b></span>
          {t.t === 'p' && <span>Kira<b>{fmt(t.rent)}</b></span>}
          {t.t === 'p' && <span>Ev<b>{fmt(t.hc)}</b></span>}
          {t.t === 'rr' && <span>1 gar<b>{fmt(RR_RENTS[0])}</b></span>}
          {t.t === 'rr' && <span>2 gar<b>{fmt(RR_RENTS[1])}</b></span>}
        </div>
      )}
      {t.t === 'p' && (
        <div className="kv small">
          {t.rents.map((r, k) => <span key={k} className={h === k + 1 ? 'on' : undefined}>{k === 4 ? 'Otel' : `${k + 1} ev`}<b>{fmt(r)}</b></span>)}
        </div>
      )}
      {t.t === 'p' && <p className="hint">Aynı renkteki iki mülk de sizdeyse boş arsa kirası 2 katı olur.</p>}
      {t.t === 'rr' && <p className="hint">Kira, sahip olunan gar sayısına göre artar ({fmt(RR_RENTS[0])} – {fmt(RR_RENTS[3])}).</p>}
      {buying && (
        mine ? (
          <div className="acts">
            <button className="btn primary mono-b big" disabled={busy || cur.money < t.price} onClick={onBuy}>Satın al · {fmt(t.price)}</button>
            <button className="btn mono-b big" disabled={busy} onClick={onSkip}>Geç</button>
          </div>
        ) : <p className="hint">{cur.name} satın alıp almayacağına karar veriyor…</p>
      )}
      {buying && mine && cur.money < t.price && <p className="hint">Paranız yetmiyor; “Geç” derseniz açık artırma başlar.</p>}
    </div>
  );
}

// Açık artırma paneli: teklif basamakları ve çekilme.
function Auction({ g, onBid, onPass, can }) {
  const a = g.auction;
  const bidder = g.players[a.ptr];
  const top = a.high >= 0 ? `${fmt(a.bid)} (${g.players[a.high].name})` : 'henüz teklif yok';
  return (
    <div className="mono-auction">
      <p className="mono-wait">{TILES[a.tile].n} için açık artırma · en yüksek: {top} · sıra: <b>{bidder.name}</b></p>
      <div className="mono-btns">
        {BID_STEPS.map((s) => {
          const amt = a.bid + s;
          return (
            <button key={s} className="btn mono-b" disabled={!can || bidder.money < amt} onClick={() => onBid(amt)}>
              {fmt(amt)} teklif
            </button>
          );
        })}
        <button className="btn mono-b danger" disabled={!can} onClick={onPass}>Çekil</button>
      </div>
    </div>
  );
}

// Sıra oyuncusunun mülk yönetimi (ev, sat, ipotek). Yalnızca yerel kipte gösterilir.
function Estate({ g, onManage, busy }) {
  const me = g.turn, p = g.players[me];
  const list = ownedOf(g, me);
  if (!list.length) return null;
  const btn = (label, enabled, type, idx) => (
    <button className="btn mono-b" disabled={busy || !enabled} onClick={() => onManage(type, idx)}>{label}</button>
  );
  return (
    <section className="mono-estate" aria-label={`${p.name} mülkleri`}>
      <b className="mono-estate-h">{p.name} · mülk yönetimi</b>
      {list.map((i) => {
        const t = TILES[i];
        const h = g.houses[i] || 0;
        const mort = g.mort.includes(i);
        return (
          <div key={i} className="mono-prop">
            <span className="mono-prop-n">
              <u className="sw" style={{ background: colorOf(t) }} />
              {t.n}
              {h > 0 ? ` · ${h === 5 ? 'otel' : `${h} ev`}` : ''}
              {mort ? ' · ipotekli' : ''}
            </span>
            <div className="mono-btns">
            {t.t === 'p' && btn(`Ev +${fmt(t.hc)}`, canBuild(g, i, me), 'build', i)}
            {t.t === 'p' && btn(`Sat +${fmt(t.hc / 2)}`, canSell(g, i, me), 'sell', i)}
            {!mort
              ? btn(`İpotek +${fmt(t.price / 2)}`, canMortgage(g, i, me), 'mortgage', i)
              : btn(`İpotek kaldır −${fmt((t.price / 2) * 1.1)}`, canUnmortgage(g, i, me), 'unmortgage', i)}
            </div>
          </div>
        );
      })}
    </section>
  );
}

// Oyun ekranı: yalnızca g (oyun durumu) ve hamle işleyicilerini alır; tek telefon ve masa (çok oyunculu) kipinde ortak kullanılır.
// meIdx: bu telefondaki oyuncunun sırası (tek telefonda null); canAct: şu an zar/satın alma yapabilir mi;
// canBid: açık artırmada teklif verebilir mi. Yönetim ve hapis işleyicileri verilmezse ilgili bölüm gösterilmez.
export function Board({
  g, meIdx = null, canAct = true, canBid = canAct,
  onRoll, onBuy, onSkip, onNew, newLabel = 'Yeni oyun',
  onBid = undefined, onPass = undefined, onPayJail = undefined, onJailCard = undefined, onManage = undefined, onQuit = undefined,
}) {
  const [shown, setShown] = useState([]); // ekranda görünen taş konumları (adım adım ilerler)
  const [hop, setHop] = useState(null);
  const [deltas, setDeltas] = useState({});
  const [log, setLog] = useState([]);
  const prevMoney = useRef(null);
  const [sel, setSel] = useState(null); // dokunulan karenin bilgisi
  const [drawn, setDrawn] = useState(null); // ekranda gösterilen Şans / Kamu Fonu kartı
  const seenCard = useRef(g?.cardN || 0); // bu sayfa açıldığında var olan kartlar tekrar gösterilmez

  // Taşı hedefe kare kare yürüt; çok uzak sıçramalarda (hapse gitme, geri kart) doğrudan atla.
  useEffect(() => {
    if (!g) { setShown((s) => (s.length ? [] : s)); return; }
    if (shown.length !== g.players.length) { setShown(g.players.map((p) => p.pos)); return; }
    const k = g.players.findIndex((p, i) => shown[i] !== p.pos);
    if (k < 0) { setHop(null); return; }
    const dist = (g.players[k].pos - shown[k] + TILES.length) % TILES.length;
    const id = setTimeout(() => {
      setHop(k);
      setShown((s) => s.map((v, i) => (i === k ? (dist > 12 ? g.players[k].pos : (v + 1) % TILES.length) : v)));
    }, 170);
    return () => clearTimeout(id);
  }, [g, shown]);

  // Para değişimini oyuncu kartında kısa süre yüzen rakamla göster.
  useEffect(() => {
    if (!g) { prevMoney.current = null; setDeltas({}); return; }
    const cur = g.players.map((p) => p.money);
    const d = {};
    if (prevMoney.current?.length === cur.length) cur.forEach((m, i) => { if (m !== prevMoney.current[i]) d[i] = m - prevMoney.current[i]; });
    prevMoney.current = cur;
    setDeltas(d);
    const t = setTimeout(() => setDeltas({}), 2000);
    return () => clearTimeout(t);
  }, [g]);

  useEffect(() => {
    if (!g) { setLog([]); return; }
    setLog((l) => (l[0] === g.msg ? l : [g.msg, ...l].slice(0, 6)));
  }, [g]);

  // Çekilen kart, taş karesine varınca gösterilir; 6 sn sonra ya da dokununca kapanır.
  const walking = shown.length === g.players.length && g.players.some((p, i) => shown[i] !== p.pos);
  useEffect(() => {
    if (!g?.cardN || g.cardN <= seenCard.current || walking) return undefined;
    seenCard.current = g.cardN;
    setDrawn(g.card);
    const t = setTimeout(() => setDrawn(null), 6000);
    return () => clearTimeout(t);
  }, [g, walking]);

  const mover = shown.length === g.players.length ? g.players.findIndex((p, i) => shown[i] !== p.pos) : -1;
  const moving = mover >= 0;
  const cur = g.players[g.turn];
  const curTile = TILES[cur.pos];
  const over = g.phase === 'over';
  const busy = moving || !canAct;
  const buyingNow = g.phase === 'buy' && !moving && !over;
  const sheetIdx = over ? null : sel ?? (buyingNow ? cur.pos : null);
  const buying = buyingNow && sheetIdx === cur.pos;

  return (
    <div className="gm-box mono-wrap">
      <div className="mono-board">
        {TILES.map((t, i) => {
          const [r, c] = cell(i);
          const o = g.owner[i];
          const h = g.houses[i] || 0;
          const active = !over && shown[moving ? mover : g.turn] === i;
          const band = colorOf(t);
          const corner = isCorner(i);
          return (
            <div
              key={i}
              className={`mono-tile ${t.t} s-${sideOf(i)}${corner ? ' corner' : ''}${o !== undefined ? ' owned' : ''}${active ? ' active' : ''}${sel === i ? ' sel' : ''}${g.mort.includes(i) ? ' mortg' : ''}`}
              style={{ gridRow: r + 1, gridColumn: c + 1, '--own': o !== undefined ? COLORS[o] : undefined }}
              onClick={() => setSel(sel === i ? null : i)}
              role="button"
              tabIndex={0}
              aria-label={`${t.n}${t.price !== undefined ? `, ${fmt(t.price)}` : ''}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(sel === i ? null : i); } }}
            >
              {band && (
                <b className="band" style={{ background: band }}>
                  <small className="pr">{kfmt(o !== undefined ? rentOf(g, i, o) : t.price)}</small>
                </b>
              )}
              <span className={`mtb${IMG[t.n] ? ' photo' : ''}`} style={IMG[t.n] ? { backgroundImage: `url(${IMG[t.n].src})` } : undefined}>
                {ICON[t.t] && <em className="ico">{ICON[t.t]}</em>}
                {corner && <span className="cn">{CORNER[t.n] || t.n}</span>}
                {band && <span className="nm">{SHORT[t.n] || t.n}</span>}
                {h > 0 && <i className={`hs${h === 5 ? ' hotel' : ''}`}>{h === 5 ? null : Array.from({ length: h }, (_, k) => <s key={k} />)}</i>}
              </span>
              {o !== undefined && <span className="own-badge" style={{ background: COLORS[o] }} title={g.players[o].name}>{TOKENS[g.players[o].tok ?? o]}</span>}
              <div className="mono-tokens">
                {g.players.map((p, k) => !p.out && shown[k] === i && (
                  <i key={k} className={`tok${hop === k ? ' hop' : ''}`} style={{ background: COLORS[k] }}>{TOKENS[p.tok ?? k]}</i>
                ))}
              </div>
            </div>
          );
        })}

        <div className="mono-center">
          {over ? (
            <div className="mono-win" aria-hidden="true">🏆</div>
          ) : (
            <>
              <div className="mono-logo" aria-hidden="true"><span>👑</span>Emlak Krallığı</div>
              <span className="mono-turn" style={{ '--pc': COLORS[g.turn] }}><i />{cur.name}</span>
              {g.dice && (
                <div className="mono-dice" key={`${g.dice}${g.turn}${g.phase}${g.msg}`} aria-label={`Zar: ${g.dice[0]} ve ${g.dice[1]}`}>
                  <Die n={g.dice[0]} i={0} /><Die n={g.dice[1]} i={1} />
                </div>
              )}
            </>
          )}
        </div>

        {over && (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 28 }, (_, i) => (
              <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 9) * 0.25}s`, animationDuration: `${2.6 + (i % 5) * 0.4}s` }}>{CONFETTI[i % CONFETTI.length]}</span>
            ))}
          </div>
        )}
      </div>

      <section className="mono-panel" style={{ '--pc': COLORS[g.turn] }}>
        <p className="mono-msg" role="status">{over ? g.msg : moving ? `${g.players[mover].name} ilerliyor…` : g.msg}</p>
        {over ? (
          <button className="btn primary mono-b big" onClick={onNew}>{newLabel}</button>
        ) : (
          <>
            {!moving && !canAct && meIdx !== null && g.phase !== 'auction' && <p className="mono-wait">{cur.name} oynuyor, bekleyin…</p>}
            {g.phase === 'roll' && cur.jail > 0 && !moving && (onPayJail || onJailCard) && (
              <div className="mono-btns">
                {onPayJail && <button className="btn mono-b" disabled={busy} onClick={onPayJail}>Kefareti öde ({fmt(JAIL_KEFARET)})</button>}
                {onJailCard && cur.cards.length > 0 && <button className="btn mono-b" disabled={busy} onClick={onJailCard}>Çıkış kartı kullan</button>}
              </div>
            )}
            {g.phase === 'roll' && (
              <button className="btn primary mono-b big" disabled={busy} onClick={onRoll}>
                {cur.jail > 0 ? 'Çift için zar at' : 'Zar at'}
              </button>
            )}
            {g.phase === 'auction' && !moving && onBid && onPass && (
              <Auction g={g} onBid={onBid} onPass={onPass} can={canBid && !moving} />
            )}
          </>
        )}
      </section>

      <ul className="mono-players">
        {g.players.map((p, k) => {
          const owned = ownedOf(g, k);
          const status = p.out ? 'Oyunda değil'
            : over ? `${owned.length} mülk`
              : k === g.turn ? (p.jail > 0 ? 'Hapiste · sıra sizde' : meIdx === null || k === meIdx ? 'Sıra sizde' : 'Sırası geldi')
                : p.jail > 0 ? 'Hapiste' : `${owned.length} mülk`;
          return (
            <li key={k} className={k === g.turn && !over ? 'on' : undefined} style={{ '--pc': COLORS[k], opacity: p.out ? 0.45 : 1 }}>
              <i className="av">{TOKENS[p.tok ?? k]}</i>
              <div className="pn">
                <b>{p.name}{k === meIdx ? ' (sen)' : ''}</b>
                <span>{status}</span>
                {owned.length > 0 && (
                  <span className="chips">
                    {owned.map((i) => <u key={i} title={TILES[i].n} style={{ background: colorOf(TILES[i]) }} />)}
                  </span>
                )}
              </div>
              <div className="pm">
                {fmt(p.money)}
                {deltas[k] !== undefined && <em key={`${k}${deltas[k]}${g.msg}`} className={deltas[k] > 0 ? 'up' : 'down'}>{deltas[k] > 0 ? '+' : '−'}{fmt(Math.abs(deltas[k]))}</em>}
              </div>
            </li>
          );
        })}
      </ul>

      {!over && onManage && (g.phase === 'roll' || g.phase === 'buy') && !moving && (
        <Estate g={g} onManage={onManage} busy={busy} />
      )}

      {log.length > 1 && (
        <ul className="mono-log" aria-label="Son olaylar">
          {log.slice(1).map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      )}

      {!over && onQuit && (
        <button className="btn mono-b quit" onClick={onQuit}>Oyunu bitir</button>
      )}

      <details className="mono-credits">
        <summary>Fotoğraf kaynakları</summary>
        <ul>
          {Object.entries(IMG).map(([n, im]) => (
            <li key={n}>{n}: {im.by} · <a href={im.url} target="_blank" rel="noreferrer">{im.lic}</a></li>
          ))}
        </ul>
      </details>

      {drawn && <DrawnCard card={drawn} onClose={() => setDrawn(null)} />}

      {sheetIdx !== null && !drawn && (
        <Sheet g={g} idx={sheetIdx} buying={buying} mine={canAct} busy={busy} onBuy={onBuy} onSkip={onSkip} onClose={() => setSel(null)} />
      )}
    </div>
  );
}

const MANAGE = { build, sell: sellHouse, mortgage, unmortgage };

// Tek telefonda sırayla oynanan kip.
export default function Monopoly() {
  const [g, setG] = useState(null);
  const [n, setN] = useState(0); // kaç kişi (0: henüz seçilmedi)
  const [picks, setPicks] = useState([]); // oyuncu sırasına göre seçilen simge numaraları
  if (!g) {
    if (!n) {
      return (
        <div className="mono-start">
          <div className="mono-crown" aria-hidden="true">👑</div>
          <p>Mülkleri al, kira topla, rakiplerini iflas ettir. Aynı telefonda sırayla oynanır.</p>
          <p className="mono-ask">Kaç kişisiniz?</p>
          <div className="gm-row">
            {[2, 3, 4].map((k) => (
              <button key={k} className="btn primary mono-n" onClick={() => { setN(k); setPicks(Array.from({ length: k }, (_, i) => i)); }}>
                <span className="mono-dots">{Array.from({ length: k }, (_, i) => <i key={i} style={{ background: COLORS[i] }} />)}</span>
                {k} kişi
              </button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="mono-start">
        <p className="mono-ask">Herkes simgesini seçsin</p>
        <div className="tok-rows">
          {picks.map((cur, k) => (
            <div key={k} className="tok-pick" role="radiogroup" aria-label={`${k + 1}. oyuncunun simgesi`}>
              <b><i className="av" style={{ background: COLORS[k] }}>{TOKENS[cur]}</i> {k + 1}. oyuncu</b>
              <div>
                {TOKENS.map((e, i) => (
                  <button key={i} type="button" role="radio" aria-checked={cur === i} className={cur === i ? 'on' : undefined}
                    disabled={picks.some((x, j) => j !== k && x === i)} onClick={() => setPicks(picks.map((x, j) => (j === k ? i : x)))}>{e}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="gm-row">
          <button className="btn" onClick={() => setN(0)}>Geri</button>
          <button className="btn primary" onClick={() => setG(newGame(n, picks))}>Oyunu başlat</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mono-pad">
    <Board
      g={g}
      onRoll={() => setG(roll(g, die(), die()))}
      onBuy={() => setG(buy(g))}
      onSkip={() => setG(skipBuy(g))}
      onBid={(amt) => setG(placeBid(g, g.auction.ptr, amt))}
      onPass={() => setG(passBid(g, g.auction.ptr))}
      onPayJail={() => setG(payJail(g))}
      onJailCard={() => setG(useJailCard(g))}
      onManage={(type, idx) => setG(MANAGE[type](g, idx))}
      onQuit={() => { if (window.confirm('Oyun bitirilsin mi? Bu oyun kaydedilmez.')) { setG(null); setN(0); } }}
      onNew={() => { setG(null); setN(0); }}
    />
    </div>
  );
}
