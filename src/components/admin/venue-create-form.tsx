'use client';

import Link from 'next/link';
import { useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GamesPicker, { type GameOpt } from './games-picker';
import PasswordReveal from './password-reveal';

export default function VenueCreateForm({ games }: { games: GameOpt[] }) {
  const [sel, setSel] = useState(games.map((g) => g.id));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ id: number; password: string; email: string } | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch('/api/yonetim/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: f.get('slug'), name: f.get('name'), city: f.get('city'), email: f.get('email'), tables: Number(f.get('tables')) || 1, games: sel }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok) setDone({ id: j.id, password: j.password, email: String(f.get('email')) });
      else setErr(j?.error || 'Oluşturulamadı.');
    } catch {
      setErr('Bağlantı hatası.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="grid max-w-xl gap-4">
        <p className="font-medium">Mekân oluşturuldu.</p>
        <PasswordReveal email={done.email} password={done.password} />
        <div className="flex gap-3">
          <Link href={`/mekanlar/${done.id}`} className={buttonVariants()}>Mekân sayfasına git</Link>
          <Link href="/mekanlar" className={buttonVariants({ variant: 'outline' })}>Listeye dön</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="grid max-w-3xl gap-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor="name">Mekân adı</Label><Input id="name" name="name" required maxLength={80} /></div>
        <div className="grid gap-2"><Label htmlFor="city">Şehir</Label><Input id="city" name="city" maxLength={80} placeholder="Kadıköy, İstanbul" /></div>
        <div className="grid gap-2">
          <Label htmlFor="slug">Adres (slug)</Label>
          <Input id="slug" name="slug" required pattern="[a-z0-9\-]{3,40}" minLength={3} maxLength={40} placeholder="hadi-kafe" />
          <p className="text-muted-foreground text-xs">3-40 karakter: küçük harf, rakam, tire. Sonradan değiştirilemez.</p>
        </div>
        <div className="grid gap-2"><Label htmlFor="email">Mekân sahibi e-postası</Label><Input id="email" name="email" type="email" required autoComplete="off" /></div>
        <div className="grid gap-2"><Label htmlFor="tables">Masa sayısı</Label><Input id="tables" name="tables" type="number" min={1} max={500} defaultValue={10} required /></div>
      </div>
      <GamesPicker games={games} value={sel} onChange={setSel} />
      <p className="text-muted-foreground text-sm">Başlangıç şifresi rastgele üretilir ve oluşturma sonrası bir kez gösterilir.</p>
      {err && <p role="alert" className="text-destructive text-sm font-medium">{err}</p>}
      <div><Button type="submit" disabled={busy}>{busy ? 'Oluşturuluyor…' : 'Mekânı oluştur'}</Button></div>
    </form>
  );
}
