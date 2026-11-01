'use client';
import { useEffect, useRef, useState } from 'react';
import CityArt, { cityOf } from './CityArt';
import {
  TILES, GROUPS, COLORS, BID_STEPS, JAIL_KEFARET, RR_RENTS, fmt, newGame,
  roll, buy, skipBuy, bid as placeBid, passBid, payJail, useJailCard, rentOf,
  build, sellHouse, mortgage, unmortgage, canBuild, canSell, canMortgage, canUnmortgage,
} from '@/lib/emlak';

// Tahtanın kenarı boyunca 11x11 ızgarada saat yönünde yerleşim (0. kare sağ alt köşe, 10. sol alt, 20. sol üst, 30. sağ üst).
function cell(i) {
  if (i <= 10) return [10, 10 - i];
  if (i <= 20) return [20 - i, 0];
  if (i <= 30) return [0, i - 20];
  return [i - 30, 10];
}

// Küçük ekranda kareye sığsın diye kısa ad ve kısa fiyat.
const SHORT = {
  'Kahramanmaraş': 'K.Maraş', 'Elektrik İdaresi': 'Elektrik', 'Su İdaresi': 'Su', 'Gelir Vergisi': 'Vergi', 'Lüks Vergisi': 'Vergi',
  'Kamu Fonu': 'Fon', 'Haydarpaşa Garı': 'Haydar Gar', 'Alsancak Garı': 'Alsan. Gar', 'Şanlıurfa': 'Urfa', 'Nişantaşı': 'Nişan.', 'Eskişehir': 'Eskişe.', 'Serbest Park': 'Park', 'Başlangıç': 'Başla', 'Hapishane': 'Hapis', 'Hapse Git': 'Git',
};
const shortName = (n) => SHORT[n] || n.replace(/ Garı$/, ' Gar');
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

// Satın alma kararı sırasında gösterilen tapu kartı.
function Deed({ g, idx }) {
  const t = TILES[idx];
  const o = g.owner[idx];
  const col = colorOf(t);
  const art = cityOf(t.n);
  return (
    <div className="deed">
      <div className="deed-head" style={{ background: col || 'var(--blue)' }}>{t.t === 'p' ? 'Tapu' : t.t === 'rr' ? 'Gar' : t.t === 'util' ? 'İşletme' : 'Kare'}</div>
      {art && <div className="deed-art"><CityArt id={art} color={col} className="deed-svg" /></div>}
      <h3>{t.n}</h3>
      {t.price !== undefined && <p>Fiyat <b>{fmt(t.price)}</b>{o !== undefined && <> · <b style={{ color: COLORS[o] }}>{g.players[o].name}</b></>}</p>}
      {t.t === 'p' && <p>Kira <b>{fmt(t.rent)}</b> · Ev <b>{fmt(t.hc)}</b></p>}
      {t.t === 'rr' && <p>Kira <b>{fmt(RR_RENTS[0])}</b>–<b>{fmt(RR_RENTS[3])}</b> (gar sayısına göre)</p>}
      {t.t === 'util' && <p>Kira: zarın <b>4</b> (1 işletme) ya da <b>10</b> katı (2 işletme)</p>}
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

  const mover = shown.length === g.players.length ? g.players.findIndex((p, i) => shown[i] !== p.pos) : -1;
  const moving = mover >= 0;
  const cur = g.players[g.turn];
  const curTile = TILES[cur.pos];
  const over = g.phase === 'over';
  const busy = moving || !canAct;
  const deedIdx = over ? null : g.phase === 'buy' && !moving ? cur.pos : sel;

  return (
    <div className="gm-box mono-wrap">
      <div className="mono-board">
        {TILES.map((t, i) => {
          const [r, c] = cell(i);
          const o = g.owner[i];
          const h = g.houses[i] || 0;
          const active = !over && shown[moving ? mover : g.turn] === i;
          const band = colorOf(t);
          return (
            <div
              key={i}
              className={`mono-tile ${t.t}${o !== undefined ? ' owned' : ''}${active ? ' active' : ''}${sel === i ? ' sel' : ''}`}
              style={{ gridRow: r + 1, gridColumn: c + 1, '--own': o !== undefined ? COLORS[o] : undefined }}
              onClick={() => setSel(sel === i ? null : i)}
              role="button"
              tabIndex={0}
              aria-label={t.n}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(sel === i ? null : i); } }}
            >
              {(t.t === 'p' || t.t === 'rr' || t.t === 'util') && <b className="band" style={{ background: band }} />}
              {cityOf(t.n) && <CityArt id={cityOf(t.n)} color={band} />}
              {ICON[t.t] && <em className="ico">{ICON[t.t]}</em>}
              <span className="nm nm-full">{t.n.length >= 13 ? shortName(t.n) : t.n}</span>
              <span className="nm nm-short">{shortName(t.n)}</span>
              {t.price !== undefined && (
                <small className="pr">
                  <span className="pr-full">{o !== undefined ? <>kira {fmt(rentOf(g, i, o))}</> : fmt(t.price)}</span>
                  <span className="pr-short">{o !== undefined ? kfmt(rentOf(g, i, o)) : kfmt(t.price)}</span>
                </small>
              )}
              {t.t === 'p' && o === undefined && <small className="rent pr-full">kira {fmt(t.rent)}</small>}
              {h > 0 && <small className="rent hs">{h === 5 ? 'otel' : `${h} ev`}</small>}
              {g.mort.includes(i) && <small className="rent mort">ipotek</small>}
              <div className="mono-tokens">
                {g.players.map((p, k) => !p.out && shown[k] === i && (
                  <i key={k} className={`tok${hop === k ? ' hop' : ''}`} style={{ background: COLORS[k] }}>{k + 1}</i>
                ))}
              </div>
            </div>
          );
        })}

        <div className={`mono-center${deedIdx !== null ? ' has-deed' : ''}`}>
          {over ? (
            <div className="mono-win" aria-hidden="true">🏆</div>
          ) : (
            <>
              {deedIdx !== null ? <Deed g={g} idx={deedIdx} /> : <div className="mono-logo" aria-hidden="true"><span>👑</span>Emlak Krallığı</div>}
              {deedIdx === null && <span className="mono-turn" style={{ '--pc': COLORS[g.turn] }}><i />{cur.name}</span>}
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
            {g.phase === 'buy' && (
              <div className="mono-btns">
                <button className="btn primary mono-b big" disabled={busy || cur.money < curTile.price} onClick={onBuy}>Satın al</button>
                <button className="btn mono-b big" disabled={busy} onClick={onSkip}>Geç (açık artırma)</button>
              </div>
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
              <i className="av">{k + 1}</i>
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
    </div>
  );
}

const MANAGE = { build, sell: sellHouse, mortgage, unmortgage };

// Tek telefonda sırayla oynanan kip.
export default function Monopoly() {
  const [g, setG] = useState(null);
  if (!g) {
    return (
      <div className="mono-start">
        <div className="mono-crown" aria-hidden="true">👑</div>
        <p>Mülkleri al, kira topla, rakiplerini iflas ettir. Aynı telefonda sırayla oynanır.</p>
        <p className="mono-ask">Kaç kişisiniz?</p>
        <div className="gm-row">
          {[2, 3, 4].map((n) => (
            <button key={n} className="btn primary mono-n" onClick={() => setG(newGame(n))}>
              <span className="mono-dots">{Array.from({ length: n }, (_, k) => <i key={k} style={{ background: COLORS[k] }} />)}</span>
              {n} kişi
            </button>
          ))}
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
      onQuit={() => { if (window.confirm('Oyun bitirilsin mi? Bu oyun kaydedilmez.')) setG(null); }}
      onNew={() => setG(null)}
    />
    </div>
  );
}
