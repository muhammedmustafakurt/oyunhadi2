'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GamesPicker, { type GameOpt } from './games-picker';
import PasswordReveal from './password-reveal';

type V = { id: number; name: string; city: string; email: string; tables: number; games: string[] };

async function call(url: string, method: string, body?: unknown) {
  try {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { ok: r.ok, data: await r.json().catch(() => null) };
  } catch {
    return { ok: false, data: { error: 'Bağlantı hatası.' } };
  }
}

export default function VenueEditor({ venue, games }: { venue: V; games: GameOpt[] }) {
  const router = useRouter();
  const [sel, setSel] = useState(venue.games);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState<string | null>(null);
  const [confirm, setConfirm] = useState('');

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const r = await call(`/api/admin/venues/${venue.id}`, 'PATCH', {
      name: f.get('name'), city: f.get('city'), email: f.get('email'), tables: Number(f.get('tables')), games: sel,
    });
    setBusy(false);
    if (r.ok) { toast.success('Kaydedildi'); router.refresh(); } else toast.error(r.data?.error || 'Kaydedilemedi.');
  };

  const reset = async () => {
    if (!window.confirm('Mevcut şifre geçersiz olur ve yeni bir şifre üretilir. Devam edilsin mi?')) return;
    const r = await call(`/api/admin/venues/${venue.id}/password`, 'POST');
    if (r.ok) setPw(r.data.password); else toast.error(r.data?.error || 'Sıfırlanamadı.');
  };

  const remove = async () => {
    const r = await call(`/api/admin/venues/${venue.id}`, 'DELETE', { confirmName: confirm });
    if (r.ok) { toast.success('Mekân silindi'); router.push('/admin/mekanlar'); router.refresh(); } else toast.error(r.data?.error || 'Silinemedi.');
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader><CardTitle>Bilgiler ve oyunlar</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={save}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2"><Label htmlFor="name">Mekân adı</Label><Input id="name" name="name" defaultValue={venue.name} required maxLength={80} /></div>
              <div className="grid gap-2"><Label htmlFor="city">Şehir</Label><Input id="city" name="city" defaultValue={venue.city} maxLength={80} /></div>
              <div className="grid gap-2"><Label htmlFor="email">E-posta (giriş)</Label><Input id="email" name="email" type="email" defaultValue={venue.email} required autoComplete="off" /></div>
              <div className="grid gap-2"><Label htmlFor="tables">Masa sayısı</Label><Input id="tables" name="tables" type="number" min={1} max={500} defaultValue={venue.tables} required /></div>
            </div>
            <GamesPicker games={games} value={sel} onChange={setSel} />
            <div><Button type="submit" disabled={busy}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Şifre sıfırlama</CardTitle>
          <CardDescription>Yeni rastgele şifre üretilir; yalnızca bir kez gösterilir.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {pw && <PasswordReveal email={venue.email} password={pw} onClose={() => setPw(null)} />}
          <div><Button variant="outline" onClick={reset}>Şifreyi sıfırla</Button></div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Mekânı sil</CardTitle>
          <CardDescription>Geri alınamaz. Mekân, masa oyun odaları, oyun kayıtları ve sohbet verisi kalıcı olarak silinir.</CardDescription>
        </CardHeader>
        <CardContent className="grid max-w-md gap-3">
          <Label htmlFor="confirm">Onaylamak için mekân adını yazın: <span className="font-mono">{venue.name}</span></Label>
          <Input id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
          <div><Button variant="destructive" disabled={confirm.trim() !== venue.name} onClick={remove}>Kalıcı olarak sil</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
