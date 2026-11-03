'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getPid } from './useRoom';
import '@/styles/event-games.css';

const POLL_MS = 2000;

// Toplu etkinlik oyunlarının ortak yoklaması (tombala, masa turnuvası, çekiliş). Durumu sunucu tutar ve doğrular;
// buradan yalnızca niyet gönderilir (api/event). Etkinlik açık değilse sunucu 403 döner ve hata gösterilir.
function useEvent({ cafe, masa, event }) {
  const [pid, setPid] = useState(null);
  const [view, setView] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [nextAt, setNextAt] = useState(0);
  const ver = useRef('');
  const geo = useRef(null);
  const locked = !!view?.locked;

  useEffect(() => { setPid(getPid()); try { setName(localStorage.getItem('oh-name') || ''); } catch {} }, []);

  useEffect(() => {
    if (!locked || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => { geo.current = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }; },
      () => { geo.current = null; },
      { maximumAge: 30000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [locked]);

  const apply = (d) => { ver.current = d.version; setView(d); setNextAt(d.nextMs != null ? Date.now() + d.nextMs : 0); };

  useEffect(() => {
    if (!pid) return;
    let dead = false;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(`/api/event?cafe=${cafe}&masa=${masa}&event=${event}&pid=${pid}&v=${encodeURIComponent(ver.current)}`, { cache: 'no-store' });
        const d = await r.json();
        if (dead) return;
        if (!r.ok) { setErr(d.error || 'Etkinlik açılamadı.'); return; }
        setErr('');
        if (d.unchanged) { if (d.nextMs != null) setNextAt(Date.now() + d.nextMs); } else apply(d);
      } catch {
        if (!dead) setErr('Bağlantı koptu, yeniden deneniyor…');
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => { dead = true; clearInterval(id); };
  }, [pid, cafe, masa, event]);

  const send = useCallback(async (type, extra = {}) => {
    if (!pid || busy) return;
    setBusy(true);
    try {
      // Konum kilidi açıksa katılırken ilk konum alınana kadar kısa süre beklenir.
      if (type === 'join' && view?.locked && !geo.current && navigator.geolocation) {
        await new Promise((done) => navigator.geolocation.getCurrentPosition(
          (p) => { geo.current = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }; done(); },
          () => done(), { timeout: 8000, maximumAge: 60000 },
        ));
      }
      const r = await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafe, masa, event, pid, action: { type, ...(geo.current && { geo: geo.current }), ...extra } }),
      });
      const d = await r.json();
      if (d.version) apply(d);
      setErr(d.error || '');
    } catch {
      setErr('Bağlantı koptu, tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  }, [pid, busy, cafe, masa, event, view?.locked]);

  const saveName = (n) => { setName(n); try { localStorage.setItem('oh-name', n.trim()); } catch {} };
  return { view, err, busy, name, saveName, send, nextAt };
}

function NameJoin({ ui, label, hint }) {
  return (
    <form className="eg-join" onSubmit={(e) => { e.preventDefault(); if (ui.name.trim()) ui.send('join', { name: ui.name.trim() }); }}>
      <label htmlFor="eg-name">Takma adınız</label>
      <input id="eg-name" value={ui.name} maxLength={16} onChange={(e) => ui.saveName(e.target.value)} placeholder="Örn. Elif" autoComplete="nickname" />
      <button className="btn primary" disabled={ui.busy || !ui.name.trim()}>{label}</button>
      {hint && <p className="eg-hint">{hint}</p>}
    </form>
  );
}

const Winner = ({ w }) => <b>{w.name} <small>(Masa {w.masa.replace('masa-', '')})</small></b>;

function Tombala({ ui }) {
  const v = ui.view;
  const [, force] = useState(0);
  useEffect(() => { const id = setInterval(() => force((x) => x + 1), 500); return () => clearInterval(id); }, []);
  const left = ui.nextAt ? Math.max(0, Math.ceil((ui.nextAt - Date.now()) / 1000)) : null;
  const drawn = new Set(v.drawn);
  const marks = new Set(v.card?.marks ?? []);
  const ended = v.status === 'bitti';
  return (
    <div className="eg">
      <section className="eg-ball" aria-live="polite">
        <span className="eg-lab">Son çekilen</span>
        <b className={v.last ? 'pop' : ''} key={v.last ?? 0}>{v.last ?? '–'}</b>
        <small>{v.drawn.length} / 90 sayı çekildi{left != null && !v.over && !ended ? ` · sıradaki ${left} sn` : ''}</small>
      </section>
      <ol className="eg-claims" aria-label="Kazananlar">
        {[['c1', '1. Çinko'], ['c2', '2. Çinko'], ['c3', 'Tombala']].map(([k, t]) => (
          <li key={k} className={v.claims[k] ? 'won' : ''}><span>{t}</span>{v.claims[k] ? <Winner w={v.claims[k]} /> : <em>henüz yok</em>}</li>
        ))}
      </ol>
      {v.over && !ended && <p className="eg-hint" role="status">Oyun bitti. Katıldığınız için teşekkürler!</p>}
      {ended ? <p className="eg-hint" role="status">Etkinlik sona erdi.</p> : !v.card ? (
        <NameJoin ui={ui} label="Kartımı al" hint="Cihaz başına tek kart verilir; yenilenemez." />
      ) : (
        <>
          <p className="eg-who">Kart: <b>{v.card.name}</b></p>
          <div className="eg-card" role="grid" aria-label="Tombala kartı">
            {v.card.grid.flat().map((n, i) => (
              n === 0 ? <i key={i} className="blank" />
                : <button key={i} type="button" className={`${drawn.has(n) ? 'hit' : ''}${marks.has(n) ? ' mark' : ''}`}
                    disabled={!drawn.has(n) || marks.has(n) || ui.busy || v.over} onClick={() => ui.send('mark', { n })}
                    aria-label={`${n}${marks.has(n) ? ', işaretli' : drawn.has(n) ? ', çekildi, işaretlemek için dokunun' : ''}`}>{n}</button>
            ))}
          </div>
          <div className="eg-btns">
            {[[1, '1. Çinko', 'c1'], [2, '2. Çinko', 'c2'], [3, 'Tombala!', 'c3']].map(([k, t, c]) => (
              <button key={k} className="btn primary" disabled={ui.busy || !!v.claims[c] || v.over} onClick={() => ui.send('claim', { k })}>{t}</button>
            ))}
          </div>
          <p className="eg-hint">Sayı çekilince dokunarak işaretleyin. Çinko/Tombala talebinizi sunucu kartınızla doğrular.</p>
        </>
      )}
      <ol className="eg-board" aria-label="Çekilen sayılar">
        {Array.from({ length: 90 }, (_, i) => <li key={i} className={drawn.has(i + 1) ? 'on' : ''}>{i + 1}</li>)}
      </ol>
    </div>
  );
}

function Skor({ ui }) {
  const v = ui.view;
  const rows = v.ranking;
  const meIn = rows.some((r) => r.masa === v.me);
  const list = meIn ? rows : [...rows, { masa: v.me, pts: 0 }];
  return (
    <div className="eg">
      <p className="eg-lab">{v.game}</p>
      {v.status === 'bitti' && (
        <p className="eg-win" role="status">{v.winners.length ? `Kazanan: ${v.winners.map((m) => `Masa ${m}`).join(' ve ')} 🏆` : 'Turnuva sona erdi.'}</p>
      )}
      <ol className="eg-rank" aria-label="Canlı sıralama">
        {list.map((r, i) => (
          <li key={r.masa} className={r.masa === v.me ? 'me' : ''}>
            <i>{i + 1}</i><span>Masa {r.masa}{r.masa === v.me ? ' (sizin)' : ''}</span><b>{r.pts}</b>
          </li>
        ))}
      </ol>
      {v.log.length > 0 && (
        <ul className="eg-log" aria-label="Son puanlar">
          {v.log.map((l, i) => <li key={i}>Masa {l.masa}: <b>{l.delta > 0 ? '+' : ''}{l.delta}</b>{l.note ? ` · ${l.note}` : ''}</li>)}
        </ul>
      )}
      <p className="eg-hint">Puanları mekân yetkilisi girer; sıralama canlı güncellenir.</p>
    </div>
  );
}

function Cekilis({ ui }) {
  const v = ui.view;
  const ended = v.status === 'bitti';
  return (
    <div className="eg">
      <p className="eg-count"><b>{v.count}</b> kişi katıldı</p>
      {v.winners.length > 0 && (
        <section className="eg-win" role="status">
          <span>🎉 Kazananlar</span>
          <ul>{v.winners.map((w, i) => <li key={i}><Winner w={w} /></li>)}</ul>
        </section>
      )}
      {ended ? <p className="eg-hint">Etkinlik sona erdi.</p>
        : v.joined ? <p className="eg-hint" role="status">Katıldınız. Kazananı mekân yetkilisi çekecek; ekranı açık tutun.</p>
        : v.winners.length ? <p className="eg-hint">Çekiliş yapıldı.</p>
        : <NameJoin ui={ui} label="Çekilişe katıl" hint="Cihaz başına bir katılım hakkı vardır." />}
    </div>
  );
}

export default function EventGame({ cafe, masa, event, kind }) {
  const ui = useEvent({ cafe, masa, event });
  if (!ui.view) return <p className="mono-where">{ui.err || 'Etkinlik açılıyor…'}</p>;
  const View = kind === 'tombala' ? Tombala : kind === 'skor' ? Skor : Cekilis;
  return (
    <>
      <View ui={ui} />
      {ui.err && <p className="mono-err" role="alert">{ui.err}</p>}
    </>
  );
}
