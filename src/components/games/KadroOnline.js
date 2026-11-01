'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import Icon from './Icon';
import { PALETTE } from '@/lib/emlak';
import { FORMATIONS, PITCH, TEAM_COLORS, FORM_MS, PICK_MS } from '@/lib/kadro-public';

const FORM_KEYS = Object.keys(FORMATIONS);
const short = (n) => n.split(' ').slice(-1)[0];
const fmt = (n) => n.toFixed(2).replace('.', ',');
const trSort = (a, b) => a.n.localeCompare(b.n, 'tr');

// Takım rozeti: iki renkli şerit (amblem çizilmez).
function Badge({ team }) {
  const [a, b] = TEAM_COLORS[team] || ['#999', '#ddd'];
  return <i className="kd-tm" style={{ '--a': a, '--b': b }} title={team} aria-hidden="true" />;
}

// Saha: formasyondaki 11 slot. slots[i]: null | { n, t, p? }. İki dokunuşla takas için onTap verilir.
function Pitch({ form, slots, next = -1, sel = -1, onTap, size = '', scores = false }) {
  const f = FORMATIONS[form];
  return (
    <div className={`kd-pitch ${size}`} role="group" aria-label={`Saha, ${form} dizilişi`}>
      <span className="kd-line mid" aria-hidden="true" />
      <span className="kd-line circle" aria-hidden="true" />
      <span className="kd-line box top" aria-hidden="true" />
      <span className="kd-line box bot" aria-hidden="true" />
      {f.coords.map((c, i) => {
        const s = slots[i];
        const cls = `kd-slot${s ? ' full' : ''}${i === next ? ' next' : ''}${i === sel ? ' sel' : ''}`;
        const style = { left: `${(c.l / PITCH.w) * 100}%`, top: `${(c.t / PITCH.h) * 100}%` };
        const body = s ? (
          <>
            <Badge team={s.t} />
            <b>{short(s.n)}</b>
            {scores && <em>{fmt(s.p)}</em>}
          </>
        ) : (
          <b>{f.labels[i]}</b>
        );
        return onTap ? (
          <button key={i} type="button" className={cls} style={style} onClick={() => onTap(i)} aria-label={`${f.gorevler[i]}${s ? `: ${s.n}` : ''}`} aria-pressed={i === sel}>{body}</button>
        ) : (
          <div key={i} className={cls} style={style} title={f.gorevler[i]}>{body}</div>
        );
      })}
    </div>
  );
}

// Masada Kadro: formasyon seç, 90 saniyede 11 oyuncu seç (puanlar gizli), yerlerini değiştirip kilitle.
export default function KadroOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'kadro', pollMs: 1000 });
  const { room, err, busy, send } = ui;
  const [sure, setSure] = useState(false);
  const [sel, setSel] = useState(-1); // takas için seçili slot
  const [open, setOpen] = useState(null); // sonuçta açık kadro
  const [deadline, setDeadline] = useState(0); // en yakın süre bitişi (herkesin)
  const [myDl, setMyDl] = useState(0); // kendi süremin bitişi
  const [now, setNow] = useState(0);
  const sentAt = useRef(0);
  const g = room?.game;
  const running = !!g && !g.over;

  // Sunucu kalan süreyi gönderir; yerel saat farkından etkilenmemek için bitiş anı burada hesaplanır.
  useEffect(() => {
    if (g) { setDeadline(Date.now() + g.nextMs); setMyDl(Date.now() + (g.mine?.leftMs ?? 0)); setNow(Date.now()); sentAt.current = 0; }
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [room?.version]); // eslint-disable-line react-hooks/exhaustive-deps

  const me = room?.me ?? -1;
  const seated = me >= 0 && !room?.seats[me]?.left;
  const mine = g?.mine;

  // Herhangi bir oyuncunun süresi dolduysa sunucuya bildirilir; sunucu süreyi kendi saatiyle doğrular.
  const waitingTime = running && g.locked.some((l, i) => !l && !g.left[i]);
  useEffect(() => {
    if (!running || !seated || !deadline || now < deadline) return;
    if (!waitingTime || Date.now() - sentAt.current < 2500) return;
    sentAt.current = Date.now();
    send('kdtimeout');
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  const pool = useMemo(() => (g?.pool ? g.pool.map(([n, t, m], i) => ({ i, n, t, m })) : []), [g?.pool]);

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={8} min={2}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const names = room.seats.map((s) => s.name);
  const av = (i) => <i className="av" style={{ background: PALETTE[i % PALETTE.length] }}>{i + 1}</i>;
  const left = running && mine && !mine.locked ? Math.max(0, myDl - now) : 0;
  const secs = Math.ceil(left / 1000);
  const active = names.map((_, i) => i).filter((i) => !room.seats[i].left);

  // Kimler kilitledi.
  const status = running && (
    <ul className="kd-who" aria-label="Kadro durumu">
      {names.map((n, i) => (
        <li key={i} className={`${g.locked[i] ? 'in' : ''}${room.seats[i].left ? ' gone' : ''}`}>
          {av(i)}
          <span>{n}{i === me ? ' (sen)' : ''}</span>
          <small>{room.seats[i].left ? 'ayrıldı' : g.locked[i] ? 'kilitledi' : g.formed[i] ? 'kuruyor' : 'formasyon seçiyor'}</small>
          {g.locked[i] && <Icon name="check" />}
        </li>
      ))}
    </ul>
  );

  const leave = seated && !g.over && (
    sure
      ? <button className="btn sm danger" disabled={busy} onClick={() => { setSure(false); send('leave'); }}>Evet, masadan ayrıl</button>
      : <button className="btn sm" onClick={() => setSure(true)}>Masadan ayrıl</button>
  );
  const errLine = err && <p className="mono-err" role="alert">{err}</p>;

  // ---------- Sonuç ----------
  if (g.over) {
    const o = g.over;
    const medal = (r) => (r === 1 ? 'gold' : r === 2 ? 'silver' : r === 3 ? 'bronze' : '');
    const winText = o.none ? 'Oyuncular masadan ayrıldığı için tur bitti.'
      : o.tops.length > 1 ? `Berabere! ${o.tops.map((i) => names[i]).join(' ve ')} ${fmt(o.avg[o.tops[0]])} ortalamayla birinci.`
      : `${names[o.tops[0]]} kazandı! (${fmt(o.avg[o.tops[0]])} ortalama)`;
    const shown = open ?? (me >= 0 ? me : o.ranking[0]);
    return (
      <div className="kd">
        {!seated && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}
        <section className="kd-over" role="status">
          <Icon name="trophy" className="kd-trophy" />
          <p className="kd-win">{winText}</p>
          <p className="kd-hint">Sıralama, seçilen 11 oyuncunun puan ortalamasına göredir. Kadroyu görmek için oyuncuya dokun.</p>
          <ol className="kd-rank">
            {o.ranking.map((i) => {
              const sq = o.squads[i];
              const on = shown === i;
              return (
                <li key={i} className={on ? 'on' : ''}>
                  <button type="button" className="kd-row" aria-expanded={on} onClick={() => setOpen(on ? -2 : i)}>
                    <span className={`kd-pos ${sq.left ? '' : medal(o.rank[i])}`}>{sq.left ? '-' : o.rank[i]}</span>
                    {av(i)}
                    <span className="nm"><b>{names[i]}{i === me ? ' (sen)' : ''}</b><small>{sq.left ? 'ayrıldı' : sq.byTime ? `${sq.form} · süre doldu` : sq.form}</small></span>
                    <span className="avg">{sq.left ? '-' : fmt(o.avg[i])}</span>
                  </button>
                  {on && (
                    <div className="kd-squad">
                      <Pitch form={sq.form} slots={sq.slots.map((s) => s || null)} scores size="big" />
                      <ul className="kd-list">
                        {FORMATIONS[sq.form].gorevler.map((gv, k) => {
                          const s = sq.slots[k];
                          return (
                            <li key={k} className={s ? '' : 'empty'}>
                              <span className="lb">{FORMATIONS[sq.form].labels[k]}</span>
                              {s ? <><Badge team={s.t} /><b>{s.n}</b><em>{fmt(s.p)}</em></> : <><b>{gv}: boş kaldı</b><em>5,00</em></>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <button className="btn primary" disabled={busy} onClick={() => send('reset')}>Yeni oyun (lobiye dön)</button>
        </section>
        {errLine}
      </div>
    );
  }

  // ---------- Kilitledi: bekleme ----------
  if (seated && mine.locked) {
    const waitFor = active.filter((i) => !g.locked[i]);
    return (
      <div className="kd">
        <section className="kd-wait" role="status">
          <Icon name="check" className="kd-ok" />
          <h2>Kadron kilitlendi</h2>
          <p>{mine.byTime ? 'Süren dolduğu için kadron kilitlendi. ' : ''}Diğerleri bekleniyor ({active.length - waitFor.length} / {active.length}). Kadrolar herkes kilitleyince açılır.</p>
        </section>
        <Pitch form={mine.form} slots={mine.slots.map((s) => (s === null ? null : { n: pool[s].n, t: pool[s].t }))} />
        {status}
        {errLine}
        {leave}
      </div>
    );
  }

  // ---------- İzleyici ----------
  if (!seated) {
    return (
      <div className="kd">
        <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>
        {status}
        {errLine}
      </div>
    );
  }

  // ---------- Formasyon seçimi ----------
  if (!mine.form) {
    return (
      <div className="kd">
        <section className={`kd-clock ${secs <= 8 ? 'low' : ''}`}>
          <div className="bar"><i style={{ transform: `scaleX(${Math.min(1, left / FORM_MS)})` }} /></div>
          <span role="timer" aria-label="Kalan süre">{secs}</span>
        </section>
        <h2 className="kd-h">Dizilişini seç</h2>
        <p className="kd-hint">Seçtikten sonra 90 saniyede 11 oyuncuyu seçersin. Oyuncuların puanları seçim sırasında gizlidir.</p>
        <div className="kd-forms" role="group" aria-label="Formasyonlar">
          {FORM_KEYS.map((k) => (
            <button key={k} type="button" className="kd-form" disabled={busy} onClick={() => send('kdformasyon', { choice: k })}>
              <span className="mini">
                {FORMATIONS[k].coords.map((c, i) => <i key={i} style={{ left: `${(c.l / PITCH.w) * 100 + 9}%`, top: `${(c.t / PITCH.h) * 100 + 4}%` }} />)}
              </span>
              <b>{k}</b>
            </button>
          ))}
        </div>
        {status}
        {errLine}
        {leave}
      </div>
    );
  }

  // ---------- Oyuncu seçimi / sahada diziliş ----------
  const f = FORMATIONS[mine.form];
  const filled = mine.slots.filter((s) => s !== null).length;
  const slotNo = mine.slots.indexOf(null);
  const full = slotNo < 0;
  const slotsView = mine.slots.map((s) => (s === null ? null : { n: pool[s].n, t: pool[s].t }));
  const options = full ? [] : pool.filter((p) => p.m === f.mevkiler[slotNo] && !mine.slots.includes(p.i)).sort(trSort);
  const ml = left;

  const tap = (i) => {
    if (sel < 0) { setSel(i); return; }
    if (sel === i) { setSel(-1); return; }
    const from = sel;
    setSel(-1);
    send('kdswap', { from, to: i });
  };

  return (
    <div className="kd">
      <section className={`kd-clock ${secs <= 10 ? 'low' : ''}`}>
        <div className="bar"><i style={{ transform: `scaleX(${Math.min(1, ml / PICK_MS)})` }} /></div>
        <span role="timer" aria-label="Kalan süre">{secs}</span>
        <em>{mine.form} · {filled} / 11</em>
      </section>

      {full ? (
        <>
          <h2 className="kd-h">Kadro hazır</h2>
          <p className="kd-hint">Yerlerini değiştirmek için iki oyuncuya sırayla dokun. Puanı değiştirmez; yalnızca diziliş. Hazır olunca kilitle.</p>
          <Pitch form={mine.form} slots={slotsView} sel={sel} onTap={tap} size="big" />
          <button className="btn primary kd-lock" disabled={busy} onClick={() => send('kdlock')}>Kadroyu kilitle</button>
        </>
      ) : (
        <>
          <div className="kd-top">
            <Pitch form={mine.form} slots={slotsView} next={slotNo} size="sm" />
            <div className="kd-picked">
              <h2 className="kd-h">
                <small>{filled + 1}. oyuncu · {f.mevkiler[slotNo]}</small>
                {f.gorevler[slotNo]}
              </h2>
              <ol aria-label="Seçtiklerin">
                {mine.slots.map((sl, k) => (
                  <li key={k} className={k === slotNo ? 'now' : sl === null ? '' : 'done'}>
                    <span>{f.labels[k]}</span>
                    {sl !== null ? <><Badge team={pool[sl].t} />{pool[sl].n}</> : k === slotNo ? 'seçiliyor…' : ''}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <ul className="kd-opts" aria-label={`${f.mevkiler[slotNo]} seçenekleri`}>
            {options.map((p) => (
              <li key={p.i}>
                <button type="button" className="kd-opt" disabled={busy} onClick={() => send('kdpick', { choice: p.i })}>
                  <Badge team={p.t} />
                  <span><b>{p.n}</b><small>{p.t}</small></span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {status}
      {errLine}
      {leave}
    </div>
  );
}
