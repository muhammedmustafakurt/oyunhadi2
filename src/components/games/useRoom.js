'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

const POLL_MS = 1500;
let memPid = null; // localStorage kapalıysa en azından sayfa açıkken aynı kimlik kullanılsın

// crypto.randomUUID yalnızca güvenli bağlantıda (https/localhost) var; telefondan yerel ağ adresiyle
// (http://192.168.x.x) denerken de çalışsın diye getRandomValues yedeği kullanılır.
const newPid = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID().replace(/-/g, '');
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
};

// Bu telefonu tanıyan gizli kimlik; başka telefonlara gönderilmez.
export function getPid() {
  const ok = (p) => typeof p === 'string' && /^[a-zA-Z0-9]{16,64}$/.test(p);
  try {
    let p = localStorage.getItem('oh-pid');
    if (!ok(p)) { p = newPid(); localStorage.setItem('oh-pid', p); }
    return p;
  } catch {
    return (memPid ??= newPid());
  }
}

// Masa odasını yoklar ve hamle gönderir. Tüm masa oyunları (Emlak Krallığı, Satranç) ortak kullanır.
// event: Mekân Sınavı için etkinlik numarası (yalnızca game='bil' ile); sunucu açık olmayan etkinliği reddeder.
export default function useRoom({ cafe, masa, game, event, pollMs = POLL_MS }) {
  const [pid, setPid] = useState(null);
  const [room, setRoom] = useState(null);
  const [err, setErr] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const ver = useRef(-1);
  const geo = useRef(null); // kafe konum kontrolü yapıyorsa telefonun son konumu

  // Kafe konum kontrolü açıksa konumu izler; kafeden uzaklaşan oyuncu masadan düşer.
  const locked = !!room?.locked;
  useEffect(() => {
    if (!locked || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => { geo.current = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }; },
      () => { geo.current = null; },
      { maximumAge: 30000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [locked]);

  useEffect(() => {
    setPid(getPid());
    try { setName(localStorage.getItem('oh-name') || ''); } catch {}
  }, []);

  // Sürüm değiştiyse yeni durumu al; telefon arka plandayken yoklamayı atla.
  useEffect(() => {
    if (!pid) return;
    let dead = false;
    let inflight = false; // önceki yoklama bitmeden yenisi başlamaz
    let fails = 0, nextAt = 0; // hata sonrası üstel geri çekilme (en çok ~10 sn)
    const fail = () => { fails++; nextAt = Date.now() + Math.min(10000, pollMs * 2 ** fails); };
    const tick = async () => {
      if (document.hidden || inflight || Date.now() < nextAt) return;
      inflight = true;
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 15000); // asılı kalan istek yoklamayı sonsuza dek kilitlemesin
      try {
        const r = await fetch(`/api/room?cafe=${cafe}&masa=${masa}&game=${game}&pid=${pid}&v=${ver.current}${event ? `&event=${event}` : ''}`, { cache: 'no-store', signal: ctl.signal });
        const d = await r.json();
        if (dead) return;
        if (!r.ok) { fail(); setErr(d.error || 'Masa açılamadı.'); return; }
        fails = 0; nextAt = 0;
        setErr('');
        if (!d.unchanged) { ver.current = d.version; setRoom(d); }
      } catch {
        if (dead) return;
        fail();
        setErr('Bağlantı koptu, yeniden deneniyor…');
      } finally {
        clearTimeout(to);
        inflight = false;
      }
    };
    tick();
    const id = setInterval(tick, pollMs);
    return () => { dead = true; clearInterval(id); };
  }, [pid, cafe, masa, game, event, pollMs]);

  // Masada oturan oyuncu "buradayım" bilgisini düzenli gönderir; sayfayı kapatan oyuncu böylece fark edilir.
  const seatedNow = !!room && room.me >= 0 && !room.seats[room.me]?.left;
  useEffect(() => {
    if (!pid || !seatedNow) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafe, masa, game, event, pid, action: { type: 'ping', ...(geo.current && { geo: geo.current }) } }),
      }).catch(() => {});
    }, 20000);
    return () => clearInterval(id);
  }, [pid, seatedNow, cafe, masa, game, event]);

  const send = useCallback(async (type, extra = {}) => {
    if (!pid || busy) return;
    setBusy(true);
    try {
      const r = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafe, masa, game, event, pid, action: { type, ...(geo.current && { geo: geo.current }), ...extra } }),
      });
      const d = await r.json();
      setErr(d.error && !d.seats ? d.error : '');
      if (d.seats) { ver.current = d.version; setRoom(d); if (d.error) setErr(d.error); }
    } catch {
      setErr('Bağlantı koptu, tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  }, [pid, busy, cafe, masa, game, event]);

  const join = async (extra) => {
    const n = name.trim();
    try { localStorage.setItem('oh-name', n); } catch {}
    // Konum kontrolü açıksa ilk konum alınana kadar kısa süre beklenir.
    if (room?.locked && !geo.current && navigator.geolocation) {
      await new Promise((done) => navigator.geolocation.getCurrentPosition(
        (p) => { geo.current = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }; done(); },
        () => done(),
        { timeout: 8000, maximumAge: 60000 },
      ));
    }
    send('join', { name: n, tok: typeof extra?.tok === 'number' ? extra.tok : undefined });
  };

  return { room, err, busy, name, setName, send, join };
}
