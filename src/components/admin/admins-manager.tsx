'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PasswordReveal from './password-reveal';

type A = { id: number; email: string; createdAt: number; lastLogin: number | null };

async function call(url: string, method: string, body?: unknown) {
  try {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { ok: r.ok, data: await r.json().catch(() => null) };
  } catch {
    return { ok: false, data: { error: 'Bağlantı hatası.' } };
  }
}
const fmt = (t: number | null) => (t == null ? 'Hiç' : new Date(t).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Istanbul' }));

export default function AdminsManager({ admins, meId }: { admins: A[]; meId: number }) {
  const router = useRouter();
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    const r = await call('/api/admin/admins', 'POST', { email: new FormData(form).get('email') });
    setBusy(false);
    if (r.ok) { setCreated(r.data); form.reset(); router.refresh(); } else toast.error(r.data?.error || 'Eklenemedi.');
  };

  const changePw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (f.get('next') !== f.get('again')) { toast.error('Yeni şifreler eşleşmiyor.'); return; }
    const r = await call('/api/admin/password', 'POST', { current: f.get('current'), next: f.get('next') });
    if (r.ok) { toast.success('Şifre değiştirildi'); form.reset(); } else toast.error(r.data?.error || 'Değiştirilemedi.');
  };

  const remove = async (a: A) => {
    if (!window.confirm(`${a.email} yöneticisi silinsin mi? Açık oturumu hemen düşer.`)) return;
    const r = await call(`/api/admin/admins/${a.id}`, 'DELETE');
    if (r.ok) { toast.success('Silindi'); router.refresh(); } else toast.error(r.data?.error || 'Silinemedi.');
  };

  return (
    <div className="grid gap-6">
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader><TableRow><TableHead>E-posta</TableHead><TableHead>Eklenme</TableHead><TableHead>Son giriş</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {admins.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.email}{a.id === meId && <span className="text-muted-foreground ml-2 text-xs">(siz)</span>}</TableCell>
                <TableCell>{fmt(a.createdAt)}</TableCell>
                <TableCell>{fmt(a.lastLogin)}</TableCell>
                <TableCell className="text-right">
                  {a.id !== meId && admins.length > 1 && <Button size="sm" variant="destructive" onClick={() => remove(a)}>Sil</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Card>
        <CardHeader><CardTitle>Yeni yönetici</CardTitle><CardDescription>Şifre rastgele üretilir ve yalnızca bir kez gösterilir.</CardDescription></CardHeader>
        <CardContent className="grid max-w-md gap-3">
          {created && <PasswordReveal email={created.email} password={created.password} onClose={() => setCreated(null)} />}
          <form className="grid gap-3" onSubmit={add}>
            <div className="grid gap-2"><Label htmlFor="new-email">E-posta</Label><Input id="new-email" name="email" type="email" required autoComplete="off" /></div>
            <div><Button type="submit" disabled={busy}>Yönetici ekle</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Şifremi değiştir</CardTitle></CardHeader>
        <CardContent>
          <form className="grid max-w-md gap-3" onSubmit={changePw}>
            <div className="grid gap-2"><Label htmlFor="cur">Mevcut şifre</Label><Input id="cur" name="current" type="password" autoComplete="current-password" required /></div>
            <div className="grid gap-2"><Label htmlFor="nw">Yeni şifre (en az 12 karakter)</Label><Input id="nw" name="next" type="password" autoComplete="new-password" minLength={12} maxLength={256} required /></div>
            <div className="grid gap-2"><Label htmlFor="ag">Yeni şifre (tekrar)</Label><Input id="ag" name="again" type="password" autoComplete="new-password" minLength={12} maxLength={256} required /></div>
            <div><Button type="submit">Şifreyi değiştir</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
