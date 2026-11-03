'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { KIND_INFO, MASS } from '@/lib/event-kinds';
import EventLive from '@/components/panel/event-live';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type EventRow = {
  id: number; title: string; body: string; kind: 'sinav' | 'tombala' | 'skor' | 'cekilis' | 'turnuva' | 'diger'; cfg?: { game?: string };
  status: 'kapali' | 'acik' | 'bitti'; questions: number; quiz: { q: string; a: string[] }[];
};
type Q = { q: string; a: string[] };

const STATE = { kapali: 'Kapalı', acik: 'Açık', bitti: 'Bitti' } as const;
const MIN = 5, MAX = 30;
const emptyQ = (): Q => ({ q: '', a: ['', '', '', ''] });

async function call(body: Record<string, unknown>) {
  const r = await fetch('/api/panel/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, error: (d.error as string) || 'Kaydedilemedi, tekrar deneyin.' };
}

// Etkinlik listesi + oluşturma/düzenleme formu + soru editörü. Durum değişikliği (Aç/Kapat/Bitir) elle yapılır.
// Doğrulama sunucuda da yapılır (src/lib/events.js); buradaki sınırlar yalnızca kullanım kolaylığı içindir.
export default function EventsManager({ events, tables }: { events: EventRow[]; tables: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<EventRow['kind']>('sinav');
  const [qs, setQs] = useState<Q[]>([]);
  const [game, setGame] = useState('');

  const open = (e?: EventRow) => {
    setEditing(e ? e.id : 'new');
    setGame(e?.cfg?.game ?? ''); setTitle(e?.title ?? ''); setBody(e?.body ?? ''); setKind(e?.kind ?? 'sinav');
    setQs(e ? e.quiz.map((q) => ({ q: q.q, a: [...q.a] })) : Array.from({ length: MIN }, emptyQ));
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
    const quiz = qs.filter((q) => q.q.trim() || q.a.some((x) => x.trim()));
    const payload = { title, body, kind, quiz: MASS.includes(kind) ? [] : quiz, cfg: { game } };
    const done = editing === 'new'
      ? await act({ op: 'create', ...payload }, 'Etkinlik oluşturuldu (kapalı)')
      : await act({ op: 'update', id: editing, ...payload }, 'Etkinlik güncellendi');
    if (done) setEditing(null);
  };

  const setQ = (i: number, f: (q: Q) => Q) => setQs((l) => l.map((q, k) => (k === i ? f(q) : q)));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,520px)]">
      <div className="space-y-4">
        {events.length === 0 && <p className="text-muted-foreground text-sm">Henüz etkinlik yok. Sağdan ilk etkinliğinizi oluşturun.</p>}
        {events.map((e) => (
          <Card key={e.id} className={e.status === 'bitti' ? 'opacity-70' : ''}>
            <CardHeader>
              <CardTitle>{e.title}</CardTitle>
              {e.body && <CardDescription>{e.body}</CardDescription>}
              <CardAction>
                <Badge className={e.status === 'acik' ? 'bg-emerald-600 text-white' : ''} variant={e.status === 'acik' ? 'default' : 'outline'}>{STATE[e.status]}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">{KIND_INFO[e.kind]?.icon} {KIND_INFO[e.kind]?.name} · {MASS.includes(e.kind) ? 'tüm masalar' : e.questions > 0 ? `${e.questions} soru` : 'sınavsız'}</p>
              {MASS.includes(e.kind) && <EventLive ev={e} tables={tables} />}
              <div className="flex flex-wrap gap-2">
                {e.status === 'kapali' && <Button size="sm" disabled={busy} onClick={() => act({ op: 'status', id: e.id, status: 'acik' }, 'Etkinlik açıldı; masalarda görünüyor')}>Aç</Button>}
                {e.status === 'acik' && <Button size="sm" variant="outline" disabled={busy} onClick={() => act({ op: 'status', id: e.id, status: 'kapali' }, 'Etkinlik kapatıldı')}>Kapat</Button>}
                {e.status !== 'bitti' && <Button size="sm" variant="outline" disabled={busy} onClick={() => { if (confirm('Etkinlik bitirilsin mi? Bitirilen etkinlik yeniden açılamaz.')) act({ op: 'status', id: e.id, status: 'bitti' }, 'Etkinlik bitirildi'); }}>Bitir</Button>}
                {e.status === 'kapali' && <Button size="sm" variant="ghost" disabled={busy} onClick={() => open(e)}>Düzenle</Button>}
                {e.status !== 'acik' && <Button size="sm" variant="ghost" disabled={busy} onClick={() => { if (confirm('Etkinlik silinsin mi?')) act({ op: 'delete', id: e.id }, 'Etkinlik silindi'); }}>Sil</Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>{editing === null ? 'Yeni etkinlik' : editing === 'new' ? 'Yeni etkinlik' : 'Etkinliği düzenle'}</CardTitle>
        </CardHeader>
        <CardContent>
          {editing === null ? (
            <Button onClick={() => open()}>Etkinlik oluştur</Button>
          ) : (
            <form className="grid gap-4" onSubmit={save}>
              <div className="grid gap-2"><Label htmlFor="ev-t">Başlık</Label><Input id="ev-t" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Cuma Mekân Sınavı" required /></div>
              <div className="grid gap-2"><Label htmlFor="ev-b">Açıklama</Label><Textarea id="ev-b" value={body} onChange={(e) => setBody(e.target.value)} maxLength={200} rows={2} placeholder="Doğru bilen masaya tatlı bizden!" /></div>
              <div className="grid gap-2">
                <Label htmlFor="ev-k">Tür</Label>
                <select id="ev-k" value={kind} onChange={(e) => setKind(e.target.value as EventRow['kind'])} className="border-input bg-background h-9 rounded-md border px-3 text-sm">
                  <option value="sinav">Sınav (soru-cevap)</option><option value="tombala">Tombala (tüm mekân)</option><option value="skor">Turnuva (masa skor tablosu)</option><option value="cekilis">Çekiliş</option>{(kind === 'turnuva' || kind === 'diger') && <option value={kind}>{KIND_INFO[kind].name} (eski)</option>}
                </select>
              </div>

              {kind === 'skor' && (
                <div className="grid gap-2"><Label htmlFor="ev-g">Turnuva oyunu</Label><Input id="ev-g" value={game} onChange={(e) => setGame(e.target.value)} maxLength={40} placeholder="Örn. Tabu, Okey, Satranç" /></div>
              )}
              {!MASS.includes(kind) && <fieldset className="grid gap-3">
                <legend className="text-sm font-medium">Mekân Sınavı soruları ({qs.filter((q) => q.q.trim()).length}/{MAX}, en az {MIN})</legend>
                <p className="text-muted-foreground text-xs">Her sorunun ilk şıkkı doğru cevaptır; oyunda şıklar karıştırılır. Soru eklemezseniz etkinlik sınavsız olur (yalnızca duyuru).</p>
                {qs.map((q, i) => (
                  <div key={i} className="grid gap-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor={`q${i}`}>Soru {i + 1}</Label>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setQs((l) => l.filter((_, k) => k !== i))}>Kaldır</Button>
                    </div>
                    <Input id={`q${i}`} value={q.q} maxLength={140} placeholder="Soru metni" onChange={(e) => setQ(i, (x) => ({ ...x, q: e.target.value }))} />
                    {q.a.map((a, j) => (
                      <Input key={j} value={a} maxLength={60} aria-label={`${i + 1}. soru ${j === 0 ? 'doğru şık' : `yanlış şık ${j}`}`}
                        placeholder={j === 0 ? 'Doğru cevap' : `Yanlış şık ${j}`}
                        onChange={(e) => setQ(i, (x) => ({ ...x, a: x.a.map((t, k) => (k === j ? e.target.value : t)) }))} />
                    ))}
                  </div>
                ))}
                {qs.length < MAX && <Button type="button" variant="outline" size="sm" onClick={() => setQs((l) => [...l, emptyQ()])}>Soru ekle</Button>}
              </fieldset>}

              <Button type="submit" disabled={busy}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => setEditing(null)}>Vazgeç</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
