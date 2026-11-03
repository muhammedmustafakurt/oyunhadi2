'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EventRow } from '@/components/panel/events-manager';

/* eslint-disable @typescript-eslint/no-explicit-any */
type View = any;

async function call(body: Record<string, unknown>) {
  const r = await fetch('/api/panel/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, view: d.view as View | undefined, error: (d.error as string) || 'İşlem yapılamadı.' };
}

const mn = (m: string) => String(m).replace('masa-', '');

// Toplu etkinlik oyunlarının canlı yönetimi (tombala, masa turnuvası, çekiliş). Durum sunucudan gelir ve 3 sn'de bir
// tazelenir; tüm kurallar sunucuda uygulanır, buradaki düğmeler yalnızca istek gönderir.
export default function EventLive({ ev, tables }: { ev: EventRow; tables: number }) {
  const [view, setView] = useState<View>(null);
  const [busy, setBusy] = useState(false);
  const [masa, setMasa] = useState(1);
  const [delta, setDelta] = useState(5);
  const [note, setNote] = useState('');
  const [n, setN] = useState(1);

  const refresh = useCallback(async () => {
    const r = await call({ op: 'state', id: ev.id });
    if (r.ok) setView(r.view);
  }, [ev.id]);

  useEffect(() => {
    refresh();
    if (ev.status !== 'acik') return;
    const id = setInterval(() => { if (!document.hidden) refresh(); }, 3000);
    return () => clearInterval(id);
  }, [refresh, ev.status]);

  const act = async (body: Record<string, unknown>, ok?: string) => {
    setBusy(true);
    const r = await call({ id: ev.id, ...body });
    setBusy(false);
    if (r.ok) { if (r.view) setView(r.view); if (ok) toast(ok); } else toast.error(r.error);
  };
  const live = ev.status === 'acik';
  const confirmReset = (msg: string) => { if (confirm(msg)) act({ op: 'reset' }, 'Sıfırlandı'); };
  if (!view) return null;

  if (ev.kind === 'tombala') {
    const c = view.claims as Record<string, { name: string; masa: string } | null>;
    return (
      <div className="space-y-3 rounded-lg border p-3 text-sm">
        <p><b className="text-3xl">{view.last ?? '–'}</b> <span className="text-muted-foreground">son sayı · {view.drawn.length}/90 · {view.cards} kart</span></p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={busy || !live || view.over} onClick={() => act({ op: 'draw' })}>Sayı çek</Button>
          <label className="flex items-center gap-1">Otomatik
            <select disabled={busy || !live} value={view.auto} onChange={(e) => act({ op: 'auto', sec: Number(e.target.value) }, 'Aralık güncellendi')} className="border-input bg-background h-8 rounded-md border px-2">
              <option value={0}>Kapalı</option>{[5, 8, 10, 15, 20, 30].map((x) => <option key={x} value={x}>{x} sn</option>)}
            </select>
          </label>
          <Button size="sm" variant="ghost" disabled={busy || ev.status === 'bitti'} onClick={() => confirmReset('Çekilen sayılar, kartlar ve kazananlar silinecek. Emin misiniz?')}>Sıfırla</Button>
        </div>
        {view.drawn.length > 0 && <p className="text-muted-foreground break-words">Çekilenler: {view.drawn.join(', ')}</p>}
        <ul>
          {([['c1', '1. Çinko'], ['c2', '2. Çinko'], ['c3', 'Tombala']] as const).map(([k, t]) => (
            <li key={k}><b>{t}:</b> {c[k] ? `${c[k]!.name} (Masa ${mn(c[k]!.masa)})` : <span className="text-muted-foreground">henüz yok</span>}</li>
          ))}
        </ul>
        {!live && ev.status !== 'bitti' && <p className="text-muted-foreground">Sayı çekmek için etkinliği açın.</p>}
      </div>
    );
  }

  if (ev.kind === 'skor') {
    const rank = view.ranking as { masa: number; pts: number }[];
    return (
      <div className="space-y-3 rounded-lg border p-3 text-sm">
        <p className="font-medium">{view.game}</p>
        {live && (
          <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); act({ op: 'score', masa, delta, note }, 'Puan işlendi'); setNote(''); }}>
            <label className="grid gap-1">Masa
              <select value={masa} onChange={(e) => setMasa(Number(e.target.value))} className="border-input bg-background h-8 rounded-md border px-2">
                {Array.from({ length: tables }, (_, i) => <option key={i} value={i + 1}>Masa {i + 1}</option>)}
              </select>
            </label>
            <label className="grid gap-1">Puan (+/−)
              <Input type="number" className="h-8 w-24" value={delta} min={-1000} max={1000} onChange={(e) => setDelta(Number(e.target.value))} />
            </label>
            <label className="grid min-w-32 flex-1 gap-1">Tur notu
              <Input className="h-8" value={note} maxLength={60} onChange={(e) => setNote(e.target.value)} placeholder="Örn. 2. tur" />
            </label>
            <Button size="sm" type="submit" disabled={busy || !delta}>Uygula</Button>
          </form>
        )}
        {rank.length === 0 ? <p className="text-muted-foreground">Henüz puan girilmedi.</p> : (
          <ol className="space-y-1">
            {rank.map((r, i) => <li key={r.masa} className="flex justify-between"><span>{i + 1}. Masa {r.masa}</span><b>{r.pts}</b></li>)}
          </ol>
        )}
        {view.winners.length > 0 && ev.status === 'bitti' && <p className="font-medium">Kazanan: {view.winners.map((m: number) => `Masa ${m}`).join(' ve ')}</p>}
        {view.log.length > 0 && <ul className="text-muted-foreground">{view.log.slice(0, 5).map((l: any, i: number) => <li key={i}>Masa {l.masa}: {l.delta > 0 ? '+' : ''}{l.delta}{l.note ? ` · ${l.note}` : ''}</li>)}</ul>}
        <Button size="sm" variant="ghost" disabled={busy || ev.status === 'bitti'} onClick={() => confirmReset('Tüm puanlar silinecek. Emin misiniz?')}>Puanları sıfırla</Button>
      </div>
    );
  }

  const winners = view.winners as { name: string; masa: string }[];
  return (
    <div className="space-y-3 rounded-lg border p-3 text-sm">
      <p><b className="text-2xl">{view.entries.length}</b> katılımcı</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1">Kazanan sayısı
          <Input type="number" className="h-8 w-24" min={1} max={10} value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <Button size="sm" disabled={busy || !live || !view.entries.length} onClick={() => act({ op: 'draw', n }, 'Kazananlar çekildi')}>Kazananı çek</Button>
        <Button size="sm" variant="ghost" disabled={busy || ev.status === 'bitti'} onClick={() => confirmReset('Katılımlar ve kazananlar silinecek. Emin misiniz?')}>Sıfırla</Button>
      </div>
      {winners.length > 0 && <ul className="font-medium">{winners.map((w, i) => <li key={i}>🎉 {w.name} (Masa {mn(w.masa)})</li>)}</ul>}
      {view.entries.length > 0 && <p className="text-muted-foreground break-words">Katılanlar: {view.entries.map((e: any) => `${e.name} (${mn(e.masa)})`).join(', ')}</p>}
      {!live && ev.status !== 'bitti' && <p className="text-muted-foreground">Çekiliş için etkinliği açın.</p>}
    </div>
  );
}
