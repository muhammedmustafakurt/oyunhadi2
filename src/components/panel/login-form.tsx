'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { whatsappLink } from '@/lib/site';

// Derleme zamanında belirlenir (NEXT_PUBLIC değil, NODE_ENV): üretimde demo bilgisi gösterilmez.
const DEV = process.env.NODE_ENV !== 'production';
// Destek bağlantısı yalnızca gerçek bir WhatsApp numarası tanımlıysa gösterilir (site.ts'teki yedek numara sahtedir, kullanılmaz).
const HELP_HREF = whatsappLink('Merhaba, oyunhadi panel şifremi unuttum.');

// Panel girişi: /api/panel/login venues tablosundaki mekân şifresiyle karşılaştırır.
export default function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const post = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch('/api/panel/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.get('email'), password: f.get('pw') }),
      });
      if (r.ok) { router.push('/panel'); router.refresh(); }
      else setErr((await r.json().catch(() => null))?.error || 'Giriş yapılamadı.');
    } catch {
      setErr('Bağlantı kurulamadı, internetinizi kontrol edip tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={post}>
      <div className="grid gap-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder={DEV ? 'ornek@mekaniniz.com' : 'ad@mekan.com'} defaultValue={DEV ? 'elif@hadikafe.com' : undefined} required />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="pw">Şifre</Label>
          {(DEV || HELP_HREF) && (
            <a href={HELP_HREF || '#'} {...(HELP_HREF && { target: '_blank', rel: 'noopener noreferrer' })} className="text-muted-foreground text-xs underline-offset-4 hover:underline">Şifremi unuttum</a>
          )}
        </div>
        <Input id="pw" name="pw" type="password" autoComplete="current-password" placeholder={DEV ? 'demo1234' : '••••••••'} required />
      </div>
      {err && <p role="alert" className="text-destructive text-sm font-medium">{err}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'Giriş yapılıyor…' : 'Giriş yap'}</Button>
    </form>
  );
}
