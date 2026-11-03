'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type RuleRow = { id: number; game: string; gameName: string; target: number; prize: string; dailyLimit: number | null; costTry: number | null; active: boolean };
export type GameOpt = { id: string; name: string };

async function call(body: Record<string, unknown>) {
  try {
    const r = await fetch('/api/panel/rewards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    return { ok: r.ok, error: (d.error as string) || 'Kaydedilemedi, tekrar deneyin.' };
  } catch {
    return { ok: false, error: 'Bağlantı koptu, tekrar deneyin.' };
  }
}

// Ödül kuralları: liste, aç/kapat, yeni kural / düzenle formu, silme. Doğrulama sunucuda da yapılır (src/lib/rewards.js).
export default function RewardsManager({ rules, games, allNames }: { rules: RuleRow[]; games: GameOpt[]; allNames: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [game, setGame] = useState('');
  const [target, setTarget] = useState('');
  const [prize, setPrize] = useState('');
  const [limit, setLimit] = useState('');
  const [cost, setCost] = useState('');

  const open = (r?: RuleRow) => {
    setEditing(r ? r.id : 'new');
    setGame(r?.game ?? games[0]?.id ?? '');
    setTarget(r ? String(r.target) : ''); setPrize(r?.prize ?? '');
    setLimit(r?.dailyLimit == null ? '' : String(r.dailyLimit)); setCost(r?.costTry == null ? '' : String(r.costTry));
  };

  const act = async (payload: Record<string, unknown>, ok: string) => {
    setBusy(true);
    const r = await call(payload);
    setBusy(false);
    if (r.ok) { toast(ok); router.refresh(); return true; }
    toast.error(r.error);
    return false;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = { game, target: Number(target), prize, dailyLimit: limit === '' ? null : Number(limit), costTry: cost === '' ? null : Number(cost) };
    const done = editing === 'new' ? await act({ op: 'create', ...p }, 'Kural eklendi') : await act({ op: 'update', id: editing, ...p }, 'Kural güncellendi');
    if (done) setEditing(null);
  };

  const remove = async (r: RuleRow) => {
    if (!window.confirm(`${r.gameName} kuralı silinsin mi? Verilmiş kodlar geçerliliğini korur.`)) return;
    await act({ op: 'delete', id: r.id }, 'Kural silindi');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ödül kuralları</CardTitle>
        <CardDescription>Hangi oyunda, hangi puana, hangi ikram? Bir oyunda aynı anda tek açık kural olur.</CardDescription>
        <CardAction><Button size="sm" onClick={() => open()} disabled={games.length === 0}>Yeni kural</Button></CardAction>
      </CardHeader>
      <CardContent className="space-y-4 px-0 sm:px-6">
        {rules.length === 0 ? (
          <p className="text-muted-foreground px-6 text-sm sm:px-0">Henüz kural yok. “Yeni kural” ile ilk ödülünüzü tanımlayın.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Oyun</TableHead><TableHead>Hedef</TableHead><TableHead>Ödül</TableHead><TableHead className="hidden md:table-cell">Günlük sınır</TableHead><TableHead className="text-right">Açık</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.gameName}</TableCell>
                  <TableCell className="tabular-nums">{r.target.toLocaleString('tr-TR')} puan ve üstü</TableCell>
                  <TableCell>{r.prize}{r.costTry != null && <span className="text-muted-foreground"> · ₺{r.costTry}</span>}</TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">{r.dailyLimit == null ? 'Sınırsız' : `Günde ${r.dailyLimit}`}</TableCell>
                  <TableCell className="text-right">
                    <Switch checked={r.active} disabled={busy} aria-label={`${r.gameName} kuralını aç/kapat`}
                      onCheckedChange={(v) => act({ op: 'active', id: r.id, active: v }, v ? 'Kural açıldı' : 'Kural kapatıldı')} />
                  </TableCell>
                  <TableCell className="space-x-1 text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => open(r)}>Düzenle</Button>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => remove(r)}>Sil</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {editing !== null && (
          <form onSubmit={save} className="mx-6 grid gap-4 rounded-lg border p-4 sm:mx-0">
            <h3 className="font-semibold">{editing === 'new' ? 'Yeni kural' : 'Kuralı düzenle'}</h3>
            <div className="grid gap-2">
              <Label htmlFor="rw-g">Oyun</Label>
              <select id="rw-g" value={game} onChange={(e) => setGame(e.target.value)} disabled={editing !== 'new'} className="border-input bg-background h-9 rounded-md border px-3 text-sm">
                {editing === 'new' ? games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>) : <option value={game}>{rules.find((x) => x.id === editing)?.gameName}</option>}
              </select>
              <p className="text-muted-foreground text-xs">Yalnızca mekânınızda açık ve puanı sunucuda güvenilir tutulan oyunlar listelenir. Diğer oyunlar ({allNames}) puan/kazanan yapısı nedeniyle ödüle bağlanamaz.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2"><Label htmlFor="rw-t">Hedef puan</Label><Input id="rw-t" type="number" inputMode="numeric" min={1} step={1} required value={target} onChange={(e) => setTarget(e.target.value)} placeholder="6000" /></div>
              <div className="grid gap-2"><Label htmlFor="rw-p">Ödül (ikram)</Label><Input id="rw-p" required maxLength={60} value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="1 tatlı ikram" /></div>
              <div className="grid gap-2"><Label htmlFor="rw-l">Günlük sınır (boş = sınırsız)</Label><Input id="rw-l" type="number" inputMode="numeric" min={1} step={1} value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="10" /></div>
              <div className="grid gap-2"><Label htmlFor="rw-c">İkram maliyeti ₺ (isteğe bağlı)</Label><Input id="rw-c" type="number" inputMode="numeric" min={0} step={1} value={cost} onChange={(e) => setCost(e.target.value)} placeholder="45" /></div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => setEditing(null)}>Vazgeç</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
