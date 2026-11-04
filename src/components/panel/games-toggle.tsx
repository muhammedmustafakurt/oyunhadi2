'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

type G = { id: string; name: string; note: string; players: string; minutes: string; color: string; fg: string; plays: number };

// Oyun aç/kapa listesi. Anında /api/panel/venue'a yazılır, masalardaki liste o anda güncellenir.
export default function GamesToggle({ games, initial }: { games: G[]; initial: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [on, setOn] = useState(() => new Set(initial));

  const flip = async (g: G, v: boolean) => {
    const next = new Set(on);
    if (v) next.add(g.id); else next.delete(g.id);
    setOn(next);
    toast(v ? `${g.name} açıldı` : `${g.name} kapatıldı`, { description: 'Masalardaki oyun listesi anında güncellenir.' });
    const r = await fetch('/api/panel/venue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ games: [...next] }),
    });
    if (!r.ok) {
      setOn(on); // geri al
      toast.error('Kaydedilemedi, tekrar deneyin.');
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <ul className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3 ${pending ? 'opacity-70' : ''}`}>
      {games.map((g) => {
        const active = on.has(g.id);
        return (
          <li key={g.id} className={`bg-card flex items-center gap-4 rounded-lg border-2 shadow-md p-4 transition-opacity ${active ? '' : 'opacity-60'}`}>
            <span className="grid size-12 shrink-0 place-items-center rounded-md border-2 border-foreground text-lg font-extrabold" style={{ background: g.color, color: g.fg }}>{g.name[0]}</span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-semibold">{g.name} {g.plays > 40 && <Badge variant="secondary">Popüler</Badge>}</p>
              <p className="text-muted-foreground truncate text-sm">{g.players.replace('-', '–')} kişi · {g.minutes.replace('-', '–')} dk · bu hafta {g.plays}</p>
            </div>
            <Switch checked={active} onCheckedChange={(v) => flip(g, v)} aria-label={`${g.name} ${active ? 'kapat' : 'aç'}`} />
          </li>
        );
      })}
    </ul>
  );
}
