'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Lobby from './Lobby';
import useRoom, { getPid } from './useRoom';
import { slide, MIN_MOVE_GAP_MS, TOO_FAST } from '@/lib/g2048';
import '@/styles/game-2048.css';
import '@/styles/game-2048-polish.css';

// 2048 yarışı: herkes aynı başlangıç tahtası ve aynı tohumlu karo dizisiyle 3 dakika oynar.
// Sunucu tahtayı simüle eder; buradaki kaydırma yalnızca iyimser gösterimdir (yeni karo sunucudan gelir).
// Hamleler sıraya alınır ve tek tek gönderilir; sunucudan gelen tahta her zaman esastır.
const DIRS = { l: 'sol', r: 'sağ', u: 'yukarı', d: 'aşağı' };
const ARROWS = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd' };
const MAX_QUEUE = 3;
const SEND_GAP_MS = MIN_MOVE_GAP_MS + 20; // sunucunun hamle aralığı sınırının biraz üstü (ağ titreşimi payı)

const fmt = (ms) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function Board({ b, label, mini }) {
  return (
    <div className={mini ? 'gx-board mini' : 'gx-board'} role="img" aria-label={label}>
      {b.map((v, i) => (
        <span key={i} className="gx-t" data-v={v > 2048 ? 'big' : v}>{v || ''}</span>
      ))}
    </div>
  );
}

export default function G2048Online({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'g2048' });
  const { room, err, busy, send } = ui;
  const [own, setOwn] = useState(null); // kendi isteklerimin son yanıtı
  const [pendTick, setPendTick] = useState(0);
  const [localErr, setLocalErr] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [sure, setSure] = useState(false);
  const pend = useRef([]);
  const flying = useRef(false);
  const lastSend = useRef(0);
  const endAt = useRef(0);
  const lastVer = useRef(-1);
  const endSent = useRef(0);
  const touch = useRef(null);

  // Hangi yanıt daha yeniyse o esastır.
  const best = own && (!room || own.version > room.version) ? own : room;
  const g = best?.game;
  const me = best ? best.me : -1;
  const seated = me >= 0 && !!g && me < g.players.length;

  // Kalan süre sunucudan gelir; telefon saatine değil, geliş anına göre sayılır.
  useEffect(() => {
    if (best && g && best.version !== lastVer.current) {
      lastVer.current = best.version;
      endAt.current = Date.now() + g.leftMs;
    }
  }, [best, g]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const post = useCallback(async (type, pl) => {
    const r = await fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cafe, masa, game: 'g2048', pid: getPid(), action: { type, ...(pl && { pl }) } }),
    });
    return r.json();
  }, [cafe, masa]);

  const pump = useCallback(async () => {
    if (flying.current) return;
    flying.current = true;
    while (pend.current.length) {
      const dir = pend.current[0];
      try {
        const wait = lastSend.current + SEND_GAP_MS - Date.now();
        if (wait > 0) await new Promise((res) => setTimeout(res, wait));
        lastSend.current = Date.now();
        const d = await post('gxmove', { dir });
        if (d.error === TOO_FAST) continue; // sunucu çok hızlı buldu: hamle sırada kalır, aralık sonrası yeniden denenir
        if (d.seats) { setOwn(d); setLocalErr(d.error && d.error !== 'Bu yönde kayma yok.' ? d.error : ''); }
        else { setLocalErr(d.error || 'Hamle gönderilemedi.'); pend.current = []; }
      } catch {
        setLocalErr('Bağlantı koptu, tekrar deneyin.');
        pend.current = [];
      }
      pend.current.shift();
      setPendTick((t) => t + 1);
    }
    flying.current = false;
  }, [post]);

  const mine = seated ? g.players[me] : null;
  const timeUp = !!g && !g.over && endAt.current > 0 && now >= endAt.current;
  const playing = !!mine && !g.over && !timeUp && !mine.dead;

  // İyimser gösterim: bekleyen hamleleri yeni karo olmadan kaydır.
  const show = (() => {
    if (!mine) return null;
    let b = mine.b;
    let s = mine.s;
    for (const d of pend.current) {
      const r = slide(b, d);
      if (r.moved) { b = r.b; s += r.gained; }
    }
    return { b, s };
  })();
  void pendTick;

  const move = useCallback((dir) => {
    if (!playing || pend.current.length >= MAX_QUEUE) return;
    const base = pend.current.reduce((b, d) => slide(b, d).b, mine.b);
    if (!slide(base, dir).moved) return;
    pend.current = [...pend.current, dir];
    setPendTick((t) => t + 1);
    pump();
  }, [playing, mine, pump]);

  // Süre bitince sonucu kesinleştirmek için bir kez bildir.
  useEffect(() => {
    if (timeUp && seated && endSent.current !== endAt.current) {
      endSent.current = endAt.current;
      post('gxend').then((d) => { if (d.seats) setOwn(d); }).catch(() => {});
    }
  }, [timeUp, seated, post]);

  // Yeni oyunda eski bekleyenleri at.
  const startKey = g ? g.total + ':' + (g.over ? 'o' : 'p') : '';
  useEffect(() => { if (!g || g.over) pend.current = []; }, [startKey, g]);

  const moveRef = useRef(move);
  moveRef.current = move;
  useEffect(() => {
    const onKey = (e) => {
      const d = ARROWS[e.key];
      if (!d || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      e.preventDefault();
      moveRef.current(d);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;
  if (best.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={6} min={2}
        seatNote={(k) => (k === 0 ? 'Masayı açan' : '')}
      />
    );
  }
  if (!g) return <p className="mono-where">Oyun yükleniyor…</p>;

  const left = g.over ? 0 : Math.max(0, endAt.current - now);

  const onDown = (e) => { touch.current = { x: e.clientX, y: e.clientY }; };
  const onUp = (e) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u'));
  };

  return (
    <div className="gx-wrap">
      {!seated && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}

      <div className="gx-top">
        <div className="gx-stat"><small>Puan</small><b>{show ? show.s : '–'}</b></div>
        <div className={`gx-stat time${left > 0 && left < 20000 ? ' low' : ''}`}>
          <small>Süre</small><b role="timer" aria-label={`Kalan süre ${fmt(left)}`}>{fmt(left)}</b>
        </div>
      </div>

      {seated && show && (
        <>
          <div
            className="gx-play"
            onPointerDown={onDown}
            onPointerUp={onUp}
            onPointerCancel={() => { touch.current = null; }}
          >
            <Board b={show.b} label="Sizin 2048 tahtanız" />
            {(g.over || timeUp) && <div className="gx-veil">Süre doldu</div>}
            {!g.over && !timeUp && mine.dead && <div className="gx-veil">Hamle kalmadı</div>}
          </div>
          <div className="gx-pad" role="group" aria-label="Yön tuşları">
            <button type="button" className="btn gx-u" aria-label="Yukarı" disabled={!playing} onClick={() => move('u')}>▲</button>
            <button type="button" className="btn gx-l" aria-label="Sola" disabled={!playing} onClick={() => move('l')}>◀</button>
            <button type="button" className="btn gx-d" aria-label="Aşağı" disabled={!playing} onClick={() => move('d')}>▼</button>
            <button type="button" className="btn gx-r" aria-label="Sağa" disabled={!playing} onClick={() => move('r')}>▶</button>
          </div>
        </>
      )}

      <ul className="gx-scores" aria-label="Puan durumu">
        {g.players.map((p, i) => (
          <li key={i} className={i === me ? 'me' : undefined}>
            {i !== me && <Board b={p.b} mini label={`${g.names[i]} tahtası`} />}
            <span className="nm">{g.names[i]}{i === me ? ' (sen)' : ''}</span>
            <b>{i === me && show ? show.s : p.s}</b>
            <small>en yüksek {p.mx}{p.dead ? ' · bitti' : ''}</small>
          </li>
        ))}
      </ul>

      {g.over && (
        <div className="gx-over">
          <h3>{g.over.text}</h3>
          <ol>
            {g.over.ranking.map((i) => (
              <li key={i}>{g.names[i]}: {g.over.scores[i]} puan, en yüksek karo {g.over.tiles[i]}</li>
            ))}
          </ol>
          {seated && <button type="button" className="btn" disabled={busy} onClick={() => send('reset')}>Rövanş (lobiye dön)</button>}
        </div>
      )}

      {(localErr || err) && <p className="mono-err" role="alert">{localErr || err}</p>}
      {seated && !g.over && (
        sure
          ? <button type="button" className="btn sm danger" disabled={busy} onClick={() => { setSure(false); send('leave'); }}>Evet, masadan ayrıl</button>
          : <button type="button" className="btn sm" onClick={() => setSure(true)}>Masadan ayrıl</button>
      )}
      <p className="mono-where gx-hint">Kaydırın, yön tuşlarına ya da klavye oklarına basın ({Object.values(DIRS).join(', ')}).</p>
    </div>
  );
}
