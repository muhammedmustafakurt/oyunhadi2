'use client';
import { useEffect, useRef, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import { PALETTE } from '@/lib/emlak';

// Bu sabitler lib/cizim.js ile aynıdır; kelime listesi tarayıcıya inmesin diye oradan içe aktarılmaz.
const TURN_MS = 80 * 1000;
const REVEAL_MS = 6 * 1000;
const GRID = 1000;
const RING = 2 * Math.PI * 54;
const MEDAL = ['🥇', '🥈', '🥉'];
const CONFETTI = ['🎉', '✨', '🏆', '🎊', '⭐'];
const COLORS = ['#1c1b22', '#e03131', '#f76707', '#fcc419', '#40c057', '#12b886', '#15aabf', '#228be6', '#4c6ef5', '#7950f2', '#e64980', '#8d5524', '#000'];
const ERASER = 12;
const SIZES = [4, 9, 16, 30];
const PICK = 11; // renk düğmesi sayısı - 1

const clamp = (v, hi) => Math.max(0, Math.min(hi, v));

// Çizgileri tuvale boyar; sıralı boyandığı için silgi (destination-out) yalnızca altındakileri siler.
function paint(canvas, strokes) {
  const ctx = canvas.getContext('2d');
  const k = canvas.width / GRID;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of strokes) {
    const p = s.p;
    if (p.length < 2) continue;
    ctx.globalCompositeOperation = s.c === ERASER ? 'destination-out' : 'source-over';
    ctx.strokeStyle = ctx.fillStyle = COLORS[s.c] || '#000';
    ctx.lineWidth = SIZES[s.w] * k;
    if (p.length === 2) {
      ctx.beginPath();
      ctx.arc(p[0] * k, p[1] * k, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(p[0] * k, p[1] * k);
    for (let i = 2; i < p.length - 2; i += 2) {
      ctx.quadraticCurveTo(p[i] * k, p[i + 1] * k, ((p[i] + p[i + 2]) / 2) * k, ((p[i + 1] + p[i + 3]) / 2) * k);
    }
    ctx.lineTo(p[p.length - 2] * k, p[p.length - 1] * k);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}

// Çizim tahtası. Çizen kendi çizgilerini yerelde tutar ve parça parça sunucuya yollar; diğerleri sunucudaki çizgileri boyar.
function Board({ g, canDraw, color, size, eraser, sendRef, busyRef, apiRef, children }) {
  const cv = useRef(null);
  const L = useRef({ key: '', strokes: [], nextId: 1, keepWant: null, cur: null, raf: 0 });
  const src = useRef([]);
  const srvLen = useRef(0); // sunucudaki çizgi sayısı (gönderme döngüsü bunu okur)
  const [any, setAny] = useState(false);
  const key = `${g.turnNo}:${g.drawer}`;
  src.current = canDraw ? L.current.strokes : g.strokes;
  srvLen.current = g.strokes.length;

  const repaint = () => {
    const l = L.current;
    if (l.raf) return;
    l.raf = requestAnimationFrame(() => { l.raf = 0; if (cv.current) paint(cv.current, src.current); });
  };

  // Sunucudan yeni durum geldiğinde: tur değiştiyse sıfırla, çizenin yerel çizgileriyle sunucuyu eşitle.
  useEffect(() => {
    const l = L.current;
    if (l.key !== key) {
      l.key = key;
      l.strokes = canDraw ? g.strokes.map((s) => ({ ...s, p: [...s.p], sent: s.p.length })) : [];
      l.nextId = g.strokes.reduce((m, s) => Math.max(m, s.id), 0) + 1;
      l.keepWant = null;
      l.cur = null;
    }
    if (canDraw) {
      for (const s of l.strokes) {
        const sv = g.strokes.find((x) => x.id === s.id);
        s.sent = sv ? sv.p.length : 0; // sunucudaki gerçek uzunluk; eksik kalan noktalar yeniden gönderilir
      }
      if (l.keepWant !== null && g.strokes.length <= l.keepWant) l.keepWant = null;
    }
    src.current = canDraw ? l.strokes : g.strokes;
    setAny(src.current.length > 0);
    repaint();
  }, [g.strokes, key, canDraw]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tuval boyutu kutuya uyar (yüksek çözünürlüklü ekranlar için dpr ile).
  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const fit = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.max(1, Math.round(r.width * dpr));
      c.height = Math.max(1, Math.round(r.height * dpr));
      paint(c, src.current);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // Çizen: bekleyen geri alma ve yeni çizgi parçalarını kısa aralıkla gönderir.
  useEffect(() => {
    if (!canDraw) return;
    const id = setInterval(() => {
      const l = L.current;
      if (busyRef.current) return;
      if (l.keepWant !== null) {
        // Sunucu zaten bu sayıya inmişse bekleme biter. Aksi halde (dset yanıtı state'i değiştirmez) efekt
        // temizlemediği için çizim kilitlenirdi.
        if (srvLen.current <= l.keepWant) l.keepWant = null;
        else { sendRef.current('dset', { keep: l.keepWant }); return; }
      }
      const pieces = [];
      for (const s of l.strokes) {
        if (s.sent < s.p.length && pieces.length < 30) {
          const end = Math.min(s.p.length, s.sent + 600);
          pieces.push({ id: s.id, c: s.c, w: s.w, start: s.sent, p: s.p.slice(s.sent, end) });
          s.sent = end;
        }
      }
      if (pieces.length) sendRef.current('ddraw', { strokes: pieces });
    }, 450);
    return () => clearInterval(id);
  }, [canDraw]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    apiRef.current = {
      undo() {
        const l = L.current;
        if (!l.strokes.length) return;
        l.strokes.pop();
        l.keepWant = l.strokes.length;
        setAny(l.strokes.length > 0);
        repaint();
      },
      clear() {
        const l = L.current;
        l.strokes = [];
        l.keepWant = 0;
        setAny(false);
        repaint();
      },
    };
  });

  const at = (e) => {
    const r = cv.current.getBoundingClientRect();
    return [Math.round(clamp(((e.clientX - r.left) / r.width) * GRID, GRID)), Math.round(clamp(((e.clientY - r.top) / r.height) * GRID * 0.75, GRID * 0.75))];
  };
  const down = (e) => {
    if (!canDraw || e.button > 0) return; // yalnızca birincil dokunma/tıklama (sağ tık çizmez)
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const l = L.current;
    const s = { id: l.nextId++, c: eraser ? ERASER : color, w: size, p: at(e), sent: 0 };
    l.strokes.push(s);
    l.cur = s;
    setAny(true);
    repaint();
  };
  const move = (e) => {
    const s = L.current.cur;
    if (!s) return;
    for (const ev of e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]) {
      const [x, y] = at(ev);
      const n = s.p.length;
      if ((x - s.p[n - 2]) ** 2 + (y - s.p[n - 1]) ** 2 > 4) s.p.push(x, y);
    }
    repaint();
  };
  const up = () => { L.current.cur = null; };

  return (
    <div className="pc-paper">
      <canvas
        ref={cv}
        className={canDraw ? 'draw' : ''}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onContextMenu={(e) => { if (canDraw) e.preventDefault(); }}
        aria-label="Çizim tahtası"
      />
      {!any && g.phase === 'draw' && <p className="pc-empty">{canDraw ? 'Parmağınla çizmeye başla' : 'Çizim bekleniyor…'}</p>}
      {children}
    </div>
  );
}

const Ico = ({ d }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((x) => <path key={x} d={x} />)}
  </svg>
);
const UNDO = ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'];
const ERASE = ['m7 21-4.3-4.3a1 1 0 0 1 0-1.4l9.6-9.6a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 21', 'M22 21H7', 'm5 11 9 9'];
const TRASH = ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'];

// Masada Çiz Bakalım: biri çizer, diğerleri tahmin eder.
export default function CizimOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'cizim', pollMs: 900 });
  const { room, err, busy, send } = ui;
  const [sure, setSure] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const [text, setText] = useState('');
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(1);
  const [eraser, setEraser] = useState(false);
  const sent = useRef(false);
  const sendRef = useRef(send);
  const busyRef = useRef(busy);
  const apiRef = useRef(null);
  const chatRef = useRef(null);
  sendRef.current = send;
  busyRef.current = busy;
  const g = room?.game;
  const running = !!g && !g.over;

  // Sunucu kalan süreyi gönderir; yerel saat farkından etkilenmemek için bitiş anını burada hesaplarız.
  useEffect(() => {
    if (g) { setDeadline(Date.now() + g.leftMs); setNow(Date.now()); sent.current = false; }
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [room?.version]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = running ? Math.max(0, deadline - now) : 0;
  const me = room?.me ?? -1;
  const seated = me >= 0 && !room?.seats[me]?.left;
  useEffect(() => {
    if (running && seated && deadline && left === 0 && !sent.current) {
      sent.current = true;
      send('dtimeout');
    }
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  const chatLen = g?.chat.length ?? 0;
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatLen]);

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={10} min={3}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const names = room.seats.map((s) => s.name);
  const over = g.over;
  const drawing = g.phase === 'draw';
  const isDrawer = seated && g.drawer === me;
  const found = me >= 0 && g.got.includes(me);
  const canDraw = isDrawer && drawing;
  const total = drawing ? TURN_MS : REVEAL_MS;
  const frac = Math.min(1, left / total);
  const urgency = !drawing ? '' : left < 12000 ? 'low' : left < 30000 ? 'mid' : '';
  const av = (i) => <i className="av" style={{ background: PALETTE[i % PALETTE.length] }}>{i + 1}</i>;
  const gain = (i) => (g.last ? (g.last.gains.find((x) => x.seat === i)?.pts ?? (i === g.drawer ? g.last.drawerGain : 0)) : 0);
  const top = over ? over.ranking.filter((i) => !room.seats[i].left).slice(0, 3) : [];
  const podium = [1, 0, 2].filter((k) => k < top.length);
  const rest = over ? over.ranking.filter((i) => !top.includes(i)) : [];
  const board = [...g.scores.keys()].sort((a, b) => g.scores[b] - g.scores[a]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    send('dguess', { text });
    setText('');
  };

  return (
    <div className="pc">
      {!seated && <p className="mono-where">Oyun başladı; izleyici olarak takip ediyorsunuz.</p>}

      {over ? (
        <section className="km-over" role="status">
          <div className="km-confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.3}s`, animationDuration: `${2.4 + (i % 4) * 0.4}s` }}>{CONFETTI[i % CONFETTI.length]}</span>
            ))}
          </div>
          <p className="km-win">{over.text}</p>
          {top.length > 0 && (
            <ol className="km-podium">
              {podium.map((k) => (
                <li key={k} className={`p${k + 1}`}>
                  {av(top[k])}
                  <b>{names[top[k]]}</b>
                  <em>{g.scores[top[k]]} puan</em>
                  <div className="bar"><span>{MEDAL[k]}</span></div>
                </li>
              ))}
            </ol>
          )}
          {rest.length > 0 && (
            <ul className="km-rest">
              {rest.map((i) => (
                <li key={i}>{av(i)}<b>{names[i]}</b><em>{room.seats[i].left ? 'ayrıldı' : `${g.scores[i]} puan`}</em></li>
              ))}
            </ul>
          )}
          <button className="btn primary" disabled={busy} onClick={() => send('reset')}>Yeni oyun (lobiye dön)</button>
        </section>
      ) : (
        <section className={`pc-top${canDraw ? ' me' : ''}`} style={{ '--pc': PALETTE[g.drawer % PALETTE.length] }}>
          <div className={`pc-ring ${urgency}${drawing ? '' : ' off'}`} role="timer" aria-label="Kalan süre">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle className="track" cx="60" cy="60" r="54" />
              <circle className="bar" cx="60" cy="60" r="54" strokeDasharray={RING} strokeDashoffset={RING * (1 - frac)} />
            </svg>
            <span>{drawing ? Math.ceil(left / 1000) : '✓'}</span>
          </div>
          <div className="who">
            <small>{g.extra > 0 ? `Uzatma turu ${g.extra}` : `Tur ${Math.min(g.turnNo + 1, g.total)} / ${g.total}`}</small>
            <h2>{canDraw ? 'Sıra sende, çiz!' : `${names[g.drawer]} çiziyor`}</h2>
          </div>

          <div className="word">
            {g.hint ? (
              <>
                <div className="tiles" aria-label={`Kelime ${g.hint.filter((c) => c !== ' ').length} harfli`}>
                  {g.hint.map((c, i) => (c === ' ' ? <span key={i} className="gap" /> : <b key={`${i}${c}`} className={c === '_' ? '' : 'on'}>{c === '_' ? '' : c}</b>))}
                </div>
                <small>{g.hint.filter((c) => c !== ' ').length} harfli kelime</small>
              </>
            ) : (
              <div className="sticker">
                <small>{drawing ? (isDrawer ? 'Çizeceğin kelime' : 'Kelimeyi buldun') : 'Kelime'}</small>
                <b>{g.word}</b>
                {canDraw && (
                  <button className="btn sm" disabled={busy || g.swapped || g.strokes.length > 0} onClick={() => send('dswap')}>
                    {g.swapped ? 'Değiştirildi' : 'Başka kelime'}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {!over && (
        <>
          <Board g={g} canDraw={canDraw} color={color} size={size} eraser={eraser} sendRef={sendRef} busyRef={busyRef} apiRef={apiRef}>
            {g.phase === 'reveal' && (
              <div className="pc-reveal" role="status">
                <small>Kelime</small>
                <b>{g.last?.word}</b>
                <span>{g.got.length ? `${g.got.length} kişi buldu` : 'Kimse bulamadı'}</span>
              </div>
            )}
          </Board>

          {canDraw && (
            <div className="pc-tools">
              <div className="pc-colors" role="radiogroup" aria-label="Renk">
                {COLORS.slice(0, PICK + 1).map((c, i) => (
                  <button
                    key={c} type="button" role="radio" aria-checked={!eraser && color === i} aria-label={`Renk ${i + 1}`}
                    className={!eraser && color === i ? 'on' : ''} style={{ '--c': c }}
                    onClick={() => { setColor(i); setEraser(false); }}
                  />
                ))}
              </div>
              <div className="pc-row">
                <div className="pc-sizes" role="radiogroup" aria-label="Kalem kalınlığı">
                  {SIZES.map((_, i) => (
                    <button
                      key={i} type="button" role="radio" aria-checked={size === i} aria-label={`Kalınlık ${i + 1}`}
                      className={size === i ? 'on' : ''} style={{ '--d': `${7 + i * 6}px` }} onClick={() => setSize(i)}
                    ><i /></button>
                  ))}
                </div>
                <button type="button" className={`pc-tool${eraser ? ' on' : ''}`} aria-pressed={eraser} onClick={() => setEraser((v) => !v)}><Ico d={ERASE} />Silgi</button>
                <button type="button" className="pc-tool" onClick={() => apiRef.current?.undo()}><Ico d={UNDO} />Geri al</button>
                <button type="button" className="pc-tool" onClick={() => apiRef.current?.clear()}><Ico d={TRASH} />Temizle</button>
              </div>
            </div>
          )}

          <section className="pc-chat">
            <ul ref={chatRef} aria-live="polite">
              {g.chat.length === 0 && <li className="sys">Tahminler burada görünür.</li>}
              {g.chat.map((c, i) => (
                c.k === 'sys' ? <li key={i} className="sys">{c.t}</li>
                  : c.k === 'ok' ? <li key={i} className="ok"><span>{names[c.seat]} kelimeyi buldu!</span><b>+{c.pts}</b></li>
                  : c.k === 'close' ? <li key={i} className="close">Çok yakın! Biraz daha dene.</li>
                  : <li key={i} className="g"><b>{names[c.seat]}</b> {c.t}</li>
              ))}
            </ul>
            {seated && drawing && !isDrawer && (
              found ? <p className="pc-found">Kelimeyi buldun! Diğerlerinin tahminlerini izle.</p> : (
                <form onSubmit={submit}>
                  <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tahminin…" maxLength={40} autoComplete="off" autoCapitalize="none" enterKeyHint="send" aria-label="Tahmin" />
                  <button className="btn primary" disabled={busy || !text.trim()}>Gönder</button>
                </form>
              )
            )}
            {canDraw && <p className="pc-found">Kelimeyi söyleme ve yazma, sadece çiz!</p>}
          </section>
        </>
      )}

      {!over && (
        <ul className="pc-score" aria-label="Puanlar">
          {board.map((i, k) => (
            <li key={i} className={`${g.drawer === i && drawing ? 'draws' : ''}${g.got.includes(i) ? ' got' : ''}${room.seats[i].left ? ' left' : ''}`}>
              {av(i)}
              <span>{names[i]}{i === me ? ' (sen)' : ''}</span>
              <b>{g.scores[i]}</b>
              {g.phase === 'reveal' && gain(i) > 0 && <em>+{gain(i)}</em>}
              {drawing && g.drawer === i && <span className="tag" aria-label="çiziyor">✏️</span>}
              {drawing && g.got.includes(i) && <span className="tag" aria-label="buldu">✓</span>}
              {k === 0 && g.scores[i] > 0 && <span className="tag" aria-label="önde">👑</span>}
            </li>
          ))}
        </ul>
      )}

      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && !over && (
        sure
          ? <button className="btn sm danger" disabled={busy} onClick={() => { setSure(false); send('leave'); }}>Evet, masadan ayrıl</button>
          : <button className="btn sm" onClick={() => setSure(true)}>Masadan ayrıl</button>
      )}
    </div>
  );
}
