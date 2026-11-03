'use client';
import { useEffect, useState } from 'react';
import { getPid } from '@/components/games/useRoom';

const POLL_MS = 4000;

// Ödüllü oyunda: hedefi hatırlatır, oyun bitince oyuncunun KENDİ kodunu gösterir. Kod sunucuda, oyunun nihai puanına göre
// üretilir (lib/rewards.js); bu bileşen yalnızca /api/room/reward'dan gelen kendi kodunu gösterir. rule yoksa hiçbir şey çizmez ve yoklamaz.
export default function RewardNotice({ cafe, masa, game, rule }) {
  const [reward, setReward] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const store = `oh-reward-${cafe}`;

  // Sayfa yenilense de süresi dolmamış son kod kaybolmasın.
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(store) || 'null');
      if (r && r.game === game && r.expiresAt > Date.now()) setReward(r);
    } catch {}
  }, [store, game]);

  useEffect(() => {
    if (!rule) return;
    let dead = false;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(`/api/room/reward?cafe=${cafe}&masa=${masa}&game=${game}&pid=${getPid()}`, { cache: 'no-store' });
        const d = await r.json();
        if (dead || !r.ok || !d.reward) return;
        const rw = { ...d.reward, game };
        setReward(rw);
        try { localStorage.setItem(store, JSON.stringify(rw)); } catch {}
      } catch {}
    };
    tick();
    const a = setInterval(tick, POLL_MS);
    const b = setInterval(() => setNow(Date.now()), 20000);
    return () => { dead = true; clearInterval(a); clearInterval(b); };
  }, [rule, cafe, masa, game, store]);

  if (!rule) return null;
  const live = reward && reward.expiresAt > now && !reward.used;
  if (live) {
    const until = new Date(reward.expiresAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
    return (
      <aside className="rwd win" role="status">
        <b>Ödül kazandın: {reward.prize}</b>
        <span className="rwd-code" aria-label={`Kod ${reward.code}`}>{reward.code}</span>
        <small>Garsona göster. 4 saat geçerli, {until} saatine kadar.</small>
      </aside>
    );
  }
  return (
    <aside className="rwd">
      <b>Ödüllü oyun</b>
      <small>{Number(rule.target).toLocaleString('tr-TR')} puan ve üstü: {rule.prize}</small>
    </aside>
  );
}
