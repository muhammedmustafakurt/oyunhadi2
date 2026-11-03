'use client';
import { useEffect, useState } from 'react';
import { getPid } from '@/components/games/useRoom';

const IDLE_MS = 45 * 1000; // lib/rooms.js ile aynı

// Sayfayı kapatıp giden oyuncuyu fark eder: masadaki biri onu bir tıkla masadan çıkarabilir,
// böylece oyun onu beklemeden devam eder (ya da biter).
export default function Presence({ cafe, masa, game, event = /** @type {string | undefined} */ (undefined) }) {
  const [snap, setSnap] = useState(null); // { room, at }
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let dead = false;
    let ver = -1;
    const pid = getPid();
    const poll = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(`/api/room?cafe=${cafe}&masa=${masa}&game=${game}&pid=${pid}&v=${ver}${event ? `&event=${event}` : ''}`, { cache: 'no-store' });
        const d = await r.json();
        if (dead || !r.ok || d.unchanged) return;
        ver = d.version;
        setSnap({ room: d, at: Date.now() });
      } catch {}
    };
    poll();
    const a = setInterval(poll, 6000);
    const b = setInterval(() => setTick((t) => t + 1), 5000);
    return () => { dead = true; clearInterval(a); clearInterval(b); };
  }, [cafe, masa, game, event]);

  const room = snap?.room;
  if (!room || room.me < 0 || room.seats[room.me]?.left) return null;
  const away = room.seats
    .map((s, i) => ({ ...s, i, idle: s.idleMs + (Date.now() - snap.at) }))
    .filter((s) => s.i !== room.me && !s.left && s.idle >= IDLE_MS);
  if (away.length === 0) return null;

  async function kick(target) {
    setBusy(true);
    try {
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafe, masa, game, event, pid: getPid(), action: { type: 'kick', target } }),
      });
    } catch {}
    setBusy(false);
  }

  return (
    <aside className="rt away" role="status" data-t={tick}>
      {away.map((s) => (
        <div key={s.i} className="away-row">
          <p><b>{s.name}</b> bir süredir masada görünmüyor.</p>
          <button className="btn sm danger" disabled={busy} onClick={() => kick(s.i)}>Masadan çıkar</button>
        </div>
      ))}
    </aside>
  );
}
