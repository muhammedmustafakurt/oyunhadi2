'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminLoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const post = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.get('email'), password: f.get('pw') }),
      });
      if (r.ok) { router.push('/admin'); router.refresh(); return; }
      setErr((await r.json().catch(() => null))?.error || 'Giriş yapılamadı.');
    } catch {
      setErr('Bağlantı hatası.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={post}>
      <div className="grid gap-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="pw">Şifre</Label>
        <Input id="pw" name="pw" type="password" autoComplete="current-password" required />
      </div>
      {err && <p role="alert" className="text-destructive text-sm font-medium">{err}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'Giriş yapılıyor…' : 'Giriş yap'}</Button>
    </form>
  );
}
