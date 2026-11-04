'use client';
import { useEffect, useState } from 'react';

// Oyun listesinde: oyuncunun bu cihazda tuttuğu, süresi dolmamış ve kullanılmamış ödül kodunu hatırlatır.
// Veriyi yalnızca RewardNotice'ın yazdığı localStorage kaydından okur; kod yoksa hiçbir şey çizmez.
export default function ActiveReward({ cafe }) {
  const [r, setR] = useState(null);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(`oh-reward-${cafe}`) || 'null');
      if (v && v.code && !v.used && v.expiresAt > Date.now()) setR(v);
    } catch {}
  }, [cafe]);
  if (!r) return null;
  const until = new Date(r.expiresAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
  return (
    <aside className="felt-news" role="status" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 10px' }}>
      <b>Ödül</b>
      <span>Kodun: <strong style={{ fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '.1em' }}>{r.code}</strong> · {r.prize} · saat {until}&apos;e kadar · Garsona göster</span>
    </aside>
  );
}
