'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getPid } from '@/components/games/useRoom';

// Sohbet oturumu ve yoklaması. Panel açıkken 2 sn, kapalıyken 12 sn'de bir yoklanır (okunmamış
// sayacı güncel kalsın diye kapalıyken de yavaş yoklama sürer). Belirteç sunucudan bir kez alınır.
const TKEY = (cafe, masa) => `oh-chat-${cafe}-${masa}`;
const NKEY = 'oh-nick';
const BKEY = 'oh-bio';

const store = {
  get(k) { try { return localStorage.getItem(k) ?? ''; } catch { return ''; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

export default function useChat({ cafe, masa, room, active = true }) {
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [live, setLive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const tok = useRef('');
  const lastId = useRef(0);
  const stop = useRef(false);
  const roomRef = useRef(room);
  roomRef.current = room;

  const join = useCallback(async () => {
    try {
      const send = (geo) => fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'join', cafe, masa, pid: getPid(),
          nick: store.get(NKEY) || undefined,
          bio: store.get(BKEY) || undefined,
          ...(geo && { geo }),
        }),
      });
      let r = await send(null);
      let d = await r.json();
      // Konum kilidi olan mekânda sunucu konum ister: izin verilirse konumla bir kez daha denenir.
      if (d.needGeo && navigator.geolocation) {
        const geo = await new Promise((done) => navigator.geolocation.getCurrentPosition(
          (p) => done({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
          () => done(null),
          { timeout: 8000, maximumAge: 60000 },
        ));
        if (geo) { r = await send(geo); d = await r.json(); }
      }
      if (!r.ok || !d.token) {
        stop.current = true;
        setError(d.error || 'Sohbet başlatılamadı.');
        return false;
      }
      tok.current = d.token;
      store.set(TKEY(cafe, masa), d.token);
      store.set(NKEY, d.me.nick);
      store.set(BKEY, d.me.bio ?? '');
      setError('');
      setLive(true);
      return true;
    } catch {
      setLive(false);
      return false;
    }
  }, [cafe, masa]);

  const refresh = useCallback(async () => {
    if (stop.current) return;
    let token = tok.current;
    if (!token) {
      if (!(await join())) return;
      token = tok.current;
    }
    try {
      const r = await fetch(`/api/chat?token=${token}&room=${roomRef.current ?? ''}&after=${lastId.current}`, { cache: 'no-store' });
      const d = await r.json();
      if (d.gone) { tok.current = ''; setData(null); return; }
      if (!r.ok || d.error) { setLive(false); return; }
      setLive(true);
      setData(d);
      if (roomRef.current && Array.isArray(d.messages) && d.messages.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const add = d.messages.filter((m) => !seen.has(m.id));
          if (!add.length) return prev;
          for (const m of add) lastId.current = Math.max(lastId.current, m.id);
          return [...prev, ...add];
        });
      }
    } catch {
      setLive(false);
    }
  }, [join]);

  // Oda değişince mesaj geçmişi baştan yüklenir (after=0, son 200 mesaj).
  useEffect(() => {
    lastId.current = 0;
    setMessages([]);
  }, [room]);

  useEffect(() => {
    stop.current = false;
    tok.current = store.get(TKEY(cafe, masa));
    setError('');
    let dead = false;
    const tick = () => { if (!dead && !document.hidden) refresh(); };
    tick();
    const a = setInterval(tick, active ? 2000 : 12000);
    return () => { dead = true; clearInterval(a); };
  }, [cafe, masa, refresh, retryTick, active]);

  const retry = useCallback(() => {
    stop.current = false;
    setError('');
    setRetryTick((t) => t + 1);
  }, []);

  const act = useCallback(async (type, payload = {}) => {
    if (!tok.current) return { error: 'Oturum yok. Sayfayı yenileyin.' };
    setBusy(true);
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tok.current, type, ...payload }),
      });
      const d = await r.json();
      if (!r.ok || d.error) return d.error ? d : { error: 'İşlem başarısız.' };
      if (type === 'profile' && d.me) {
        store.set(NKEY, d.me.nick);
        store.set(BKEY, d.me.bio ?? '');
      }
      refresh();
      return d;
    } catch {
      return { error: 'Bağlantı hatası. Tekrar deneyin.' };
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  return { data, messages, error, live, busy, act, retry };
}
