'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Duyurular masaların oyun listesinin en üstünde görünür. Yayınla → venues.ann_title/ann_body
export default function AnnouncementForm({ initial }: { initial?: { title: string; body: string } | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const post = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!String(f.get('t') ?? '').trim()) return;
    setBusy(true);
    const r = await fetch('/api/panel/venue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcement: { title: f.get('t'), body: f.get('b') } }),
    });
    setBusy(false);
    if (r.ok) { toast('Duyuru yayınlandı', { description: 'Masalardaki oyun listesi anında güncellenir.' }); router.refresh(); }
    else toast.error('Yayınlanamadı, tekrar deneyin.');
  };

  const off = async () => {
    setBusy(true);
    const r = await fetch('/api/panel/venue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcement: null }),
    });
    setBusy(false);
    if (r.ok) { toast('Duyuru kaldırıldı'); router.refresh(); }
    else toast.error('Kaldırılamadı, tekrar deneyin.');
  };

  return (
    <form key={`${initial?.title ?? ''}|${initial?.body ?? ''}`} className="grid gap-4" onSubmit={post}>
      <div className="grid gap-2"><Label htmlFor="t">Başlık</Label><Input id="t" name="t" maxLength={60} defaultValue={initial?.title ?? ''} placeholder="Cuma akşamı Tabu turnuvası" required /></div>
      <div className="grid gap-2"><Label htmlFor="b">Metin</Label><Textarea id="b" name="b" maxLength={160} rows={3} defaultValue={initial?.body ?? ''} placeholder="Saat 20:00'de. Kazanan masaya pizza bizden!" /></div>
      <Button type="submit" disabled={busy}>{busy ? 'Yayınlanıyor…' : 'Yayınla'}</Button>
      <Button type="button" variant="ghost" onClick={off} disabled={busy}>Yayından kaldır</Button>
    </form>
  );
}
