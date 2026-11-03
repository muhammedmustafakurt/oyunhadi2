'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type SubForm = { plan: string; status: string; start: string; end: string; totalTry: string; vatNote: string; method: string; renewal: string };
export type PayRow = { id: number; date: string; description: string; amountTry: number; status: string };

const SEL = 'border-input bg-background h-9 rounded-md border px-3 text-sm';
const PAY = { odendi: 'Ödendi', bekliyor: 'Bekliyor', iade: 'İade' } as const;

async function call(method: string, body: unknown, id: number) {
  try {
    const r = await fetch(`/api/admin/venues/${id}/subscription`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { ok: r.ok, error: ((await r.json().catch(() => null))?.error as string) || 'Kaydedilemedi.' };
  } catch {
    return { ok: false, error: 'Bağlantı hatası.' };
  }
}

// Abonelik kaydı ve ödemeler: ödeme entegrasyonu gelene kadar verinin tek giriş yolu. Doğrulama sunucuda yapılır.
export default function SubscriptionEditor({ venueId, initial, payments, today }: { venueId: number; initial: SubForm | null; payments: PayRow[]; today: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const r = await call('PUT', Object.fromEntries(f), venueId);
    setBusy(false);
    if (r.ok) { toast.success('Abonelik kaydedildi'); router.refresh(); } else toast.error(r.error);
  };

  const addPay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    const r = await call('POST', Object.fromEntries(new FormData(form)), venueId);
    setBusy(false);
    if (r.ok) { toast.success('Ödeme eklendi'); form.reset(); router.refresh(); } else toast.error(r.error);
  };

  const del = async (p: PayRow) => {
    if (!window.confirm(`${p.date} tarihli ${p.amountTry} ₺ ödeme silinsin mi?`)) return;
    const r = await call('DELETE', { paymentId: p.id }, venueId);
    if (r.ok) { toast.success('Ödeme silindi'); router.refresh(); } else toast.error(r.error);
  };

  const v = initial ?? { plan: '', status: 'aktif', start: today, end: '', totalTry: '', vatNote: '', method: '', renewal: 'elle' };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Abonelik</CardTitle>
        <CardDescription>{initial ? 'Mekân panelindeki Abonelik sayfası bu kayıttan beslenir.' : 'Bu mekân için abonelik kaydı yok; kaydedince mekân panelinde görünür.'}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <form className="grid gap-4" onSubmit={save}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2"><Label htmlFor="sb-plan">Paket</Label><Input id="sb-plan" name="plan" defaultValue={v.plan} required maxLength={60} placeholder="Yıllık paket" /></div>
            <div className="grid gap-2"><Label htmlFor="sb-st">Durum</Label>
              <select id="sb-st" name="status" defaultValue={v.status} className={SEL}>
                <option value="aktif">Aktif</option><option value="deneme">Deneme</option><option value="bitti">Bitti</option><option value="iptal">İptal</option>
              </select>
            </div>
            <div className="grid gap-2"><Label htmlFor="sb-s">Başlangıç</Label><Input id="sb-s" name="start" type="date" defaultValue={v.start} required /></div>
            <div className="grid gap-2"><Label htmlFor="sb-e">Bitiş</Label><Input id="sb-e" name="end" type="date" defaultValue={v.end} required /></div>
            <div className="grid gap-2"><Label htmlFor="sb-t">Tutar (₺)</Label><Input id="sb-t" name="totalTry" type="number" min={0} step={1} defaultValue={v.totalTry} placeholder="19900" /></div>
            <div className="grid gap-2"><Label htmlFor="sb-v">KDV notu</Label><Input id="sb-v" name="vatNote" defaultValue={v.vatNote} maxLength={30} placeholder="+ KDV" /></div>
            <div className="grid gap-2"><Label htmlFor="sb-m">Ödeme yöntemi</Label><Input id="sb-m" name="method" defaultValue={v.method} maxLength={80} placeholder="Havale / EFT" /></div>
            <div className="grid gap-2"><Label htmlFor="sb-r">Yenileme</Label>
              <select id="sb-r" name="renewal" defaultValue={v.renewal} className={SEL}><option value="elle">Elle</option><option value="otomatik">Otomatik</option></select>
            </div>
          </div>
          <div><Button type="submit" disabled={busy}>{initial ? 'Aboneliği güncelle' : 'Abonelik oluştur'}</Button></div>
        </form>

        <div className="grid gap-3">
          <h3 className="text-sm font-semibold">Ödemeler</h3>
          {payments.length === 0 ? <p className="text-muted-foreground text-sm">Ödeme kaydı yok.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Açıklama</TableHead><TableHead>Tutar</TableHead><TableHead>Durum</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow></TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.date}</TableCell><TableCell>{p.description || '—'}</TableCell>
                    <TableCell className="tabular-nums">₺{p.amountTry.toLocaleString('tr-TR')}</TableCell>
                    <TableCell>{PAY[p.status as keyof typeof PAY] ?? p.status}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => del(p)}>Sil</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <form className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2" onSubmit={addPay}>
            <div className="grid gap-2"><Label htmlFor="py-d">Tarih</Label><Input id="py-d" name="date" type="date" defaultValue={today} required /></div>
            <div className="grid gap-2"><Label htmlFor="py-a">Tutar (₺)</Label><Input id="py-a" name="amountTry" type="number" min={0} step={1} required /></div>
            <div className="grid gap-2"><Label htmlFor="py-x">Açıklama</Label><Input id="py-x" name="description" maxLength={100} placeholder="1. taksit" /></div>
            <div className="grid gap-2"><Label htmlFor="py-s">Durum</Label>
              <select id="py-s" name="status" defaultValue="odendi" className={SEL}><option value="odendi">Ödendi</option><option value="bekliyor">Bekliyor</option><option value="iade">İade</option></select>
            </div>
            <div className="grid gap-2 sm:col-span-2"><Label htmlFor="py-i">Fatura bağlantısı (isteğe bağlı, https://)</Label><Input id="py-i" name="invoiceUrl" type="url" maxLength={300} /></div>
            <div className="sm:col-span-2"><Button type="submit" variant="outline" disabled={busy}>Ödeme ekle</Button></div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
