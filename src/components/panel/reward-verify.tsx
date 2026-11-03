'use client';

import { useState } from 'react';
import { IconCircleCheck, IconCircleX, IconClock } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { gameName } from '@/lib/game-meta';

type Reward = { code: string; masa: string; game: string; prize: string; issuedAt: number; expiresAt: number; usedAt: number | null };
type Res = { kind: 'ok' | 'used' | 'expired' | 'none'; reward?: Reward };

const hm = (ms: number) => new Date(ms).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });

// Garsonun kod doğrulama ekranı: /api/panel/rewards'a sorar; "kodu kapat" kodu atomik olarak kullanıldı yapar.
export default function RewardVerify() {
  const [code, setCode] = useState('');
  const [res, setRes] = useState<Res | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [closed, setClosed] = useState(false); // bu ekranda az önce kapatıldı

  const send = async (op: 'verify' | 'redeem', c: string) => {
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/panel/rewards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op, code: c }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(d.error || 'İşlem yapılamadı, tekrar deneyin.'); return; }
      setClosed(!!d.redeemed);
      setRes(d.redeemed ? { kind: 'used', reward: { ...d.reward, usedAt: Date.now() } } : (d as Res));
    } catch {
      setErr('Bağlantı koptu, tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) { setRes(null); send('verify', code); }
  };

  const r = res?.reward;
  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={check} className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => { setCode(e.target.value); setRes(null); setErr(''); }}
          placeholder="HK-7Q4M"
          aria-label="Ödül kodu"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={24}
          className="h-12 text-center font-mono text-lg tracking-widest uppercase"
        />
        <Button type="submit" size="lg" className="h-12 px-5" disabled={busy}>Doğrula</Button>
      </form>
      <p className="text-muted-foreground mt-2 text-center text-xs">Misafirin ekranındaki kodu yazın; tire ve büyük/küçük harf fark etmez.</p>
      {err && <p role="alert" className="text-destructive mt-4 text-center text-sm">{err}</p>}

      {res && (
        <div
          role="status"
          className={`mt-6 rounded-2xl border-2 p-6 text-center ${res.kind === 'ok' || closed ? 'border-emerald-500 bg-emerald-500/10' : res.kind === 'none' ? 'border-destructive bg-destructive/10' : 'border-amber-500 bg-amber-500/10'}`}
        >
          {res.kind === 'ok' && <IconCircleCheck className="mx-auto size-12 text-emerald-600" />}
          {res.kind === 'none' && <IconCircleX className="text-destructive mx-auto size-12" />}
          {closed && <IconCircleCheck className="mx-auto size-12 text-emerald-600" />}
          {!closed && (res.kind === 'used' || res.kind === 'expired') && <IconClock className="mx-auto size-12 text-amber-600" />}
          <p className="mt-3 text-xl font-bold">
            {closed ? 'İkram verildi, kod kapatıldı' : res.kind === 'ok' ? 'Kod geçerli' : res.kind === 'used' ? 'Bu kod daha önce kullanıldı' : res.kind === 'expired' ? 'Kodun süresi dolmuş' : 'Böyle bir kod yok'}
          </p>
          {r && (
            <p className="text-muted-foreground mt-1">
              Masa {r.masa.replace('masa-', '')} · {gameName(r.game)} · {res.kind === 'used' && r.usedAt ? `kullanıldı ${hm(r.usedAt)}` : `son geçerlilik ${hm(r.expiresAt)}`}
            </p>
          )}
          {res.kind === 'ok' && r && (
            <>
              <p className="mt-4 text-2xl font-extrabold">{r.prize}</p>
              <Button className="mt-5 w-full" size="lg" disabled={busy} onClick={() => send('redeem', r.code)}>İkramı verdim, kodu kapat</Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
