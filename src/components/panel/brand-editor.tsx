'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Venue } from '@/lib/venue-types';
import { onColor } from '@/components/oyun/on-color';

const PRESETS = [
  ['#ff4f2e', '#ffc83d'], ['#7c3aed', '#22d3ee'], ['#0f766e', '#fde047'], ['#1d4ed8', '#f472b6'], ['#b91c1c', '#fbbf24'], ['#166534', '#f97316'],
];
const ink = '#1c1233'; // oyuncu ekranındaki --ink rengi (oyuncu.css)

// Logo ve renk seçimi; sağda masa ekranının canlı önizlemesi. Kaydet → /api/panel/venue → venues tablosu.
export default function BrandEditor({ venue }: { venue: Pick<Venue, 'name' | 'initials' | 'color' | 'accent' | 'welcome'> }) {
  const router = useRouter();
  const [color, setColor] = useState(venue.color);
  const [accent, setAccent] = useState(venue.accent);
  const [name, setName] = useState(venue.name);
  const [welcome, setWelcome] = useState(venue.welcome);
  const [busy, setBusy] = useState(false);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toLocaleUpperCase('tr')).join('') || venue.initials;

  const save = async () => {
    setBusy(true);
    const r = await fetch('/api/panel/venue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, welcome, color, accent, initials }),
    });
    setBusy(false);
    if (r.ok) { toast('Görünüm kaydedildi', { description: 'Değişiklikler bütün masalarda anında görünür.' }); router.refresh(); }
    else toast.error('Kaydedilemedi, tekrar deneyin.');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader>
          <CardTitle>Görünüm</CardTitle>
          <CardDescription>Değişiklikler kaydedince bütün masalarda anında görünür.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-lg border-2 border-foreground bg-white text-xl font-extrabold" style={{ color }}>{initials}</span>
              <span className="text-muted-foreground text-xs">Logo, mekân adınızın baş harflerinden üretilir.</span>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="vn">Mekân adı</Label>
            <Input id="vn" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wl">Karşılama cümlesi</Label>
            <Textarea id="wl" value={welcome} onChange={(e) => setWelcome(e.target.value)} maxLength={80} rows={2} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="c1">Ana renk</Label>
              <div className="flex gap-2"><input id="c1" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border-2 border-foreground" /><Input value={color} onChange={(e) => setColor(e.target.value)} className="font-mono" /></div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c2">İkinci renk</Label>
              <div className="flex gap-2"><input id="c2" type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border-2 border-foreground" /><Input value={accent} onChange={(e) => setAccent(e.target.value)} className="font-mono" /></div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Hazır renkler</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(([a, b]) => (
                <button key={a} type="button" onClick={() => { setColor(a); setAccent(b); }} className="flex overflow-hidden rounded-md border-2 border-foreground shadow-xs hover:-translate-y-0.5" aria-label={`${a} ve ${b}`}>
                  <span className="size-7" style={{ background: a }} /><span className="size-7" style={{ background: b }} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</Button>
            <Button variant="ghost" onClick={() => { setColor(venue.color); setAccent(venue.accent); setName(venue.name); setWelcome(venue.welcome); }}>Geri al</Button>
          </div>
        </CardContent>
      </Card>

      {/* Canlı önizleme: masanın oyun seçme sayfası (oyun-deste.css'teki .oh-felt yapısının sade kopyası) */}
      <div className="lg:sticky lg:top-20 lg:h-fit">
        <p className="text-muted-foreground mb-2 text-sm font-medium">Önizleme · masa ekranı</p>
        <div className="mx-auto w-[280px] rounded-[2.4rem] bg-zinc-900 p-2.5 shadow-xl">
          <div
            className="overflow-hidden rounded-[2rem]"
            style={{
              backgroundColor: '#1f6b4a',
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23ffffff' fill-opacity='.06'/%3E%3C/svg%3E\")",
              color: '#fff',
            }}
          >
            <div className="flex items-center gap-2 px-3 pt-5">
              <span className="grid size-9 flex-none place-items-center rounded-xl border-2 text-xs font-extrabold" style={{ background: '#fff', color: `color-mix(in srgb, ${color} 42%, #000)`, borderColor: ink }}>{initials}</span>
              <span className="grid min-w-0 text-sm leading-tight font-extrabold">
                {name}
                <small className="text-[10px] font-medium opacity-80">Kadıköy, İstanbul</small>
              </span>
              <span className="ml-auto flex-none rotate-3 rounded-full border-2 px-2.5 py-1 text-[11px] font-extrabold" style={{ background: accent, color: onColor(accent), borderColor: ink, boxShadow: `0 2px 0 ${ink}` }}>Masa 5</span>
            </div>
            <div className="px-3 pt-4">
              <p className="m-0 text-[1.35rem] font-extrabold leading-none" style={{ letterSpacing: '-.03em' }}>Hadi, bir oyun seçin!</p>
              <p className="mt-1.5 text-[11px] opacity-85">{welcome}</p>
            </div>
            <div className="px-7 pt-4 pb-5">
              <div className="overflow-hidden rounded-[16px] border-2" style={{ borderColor: ink, backgroundColor: '#fffdf8', color: ink, boxShadow: `0 6px 0 rgba(0, 0, 0, .28)` }}>
                <div className="relative grid h-[118px] place-items-center" style={{ background: '#e0457f', borderBottom: `2px solid ${ink}` }}>
                  <span className="rotate-6 rounded-xl border-2 bg-white px-3 py-2 text-2xl font-black" style={{ borderColor: ink, color: '#e0457f' }}>♠</span>
                  <span className="absolute top-1.5 left-2.5 grid justify-items-center text-[11px] leading-none font-black">T<br /><i className="not-italic opacity-80">tabu</i></span>
                </div>
                <div className="px-3.5 pt-2.5 pb-1">
                  <p className="m-0 text-xl font-extrabold" style={{ letterSpacing: '-.03em' }}>Tabu</p>
                  <p className="m-0 mt-1 text-[11px] leading-snug" style={{ color: '#5b5470' }}>Kelimeleri anlatın, süreyi rakip takım tutar.</p>
                </div>
                <button type="button" className="mx-3 mb-3 block w-[calc(100%-1.5rem)] rounded-[12px] border-2 py-2.5 text-center text-sm font-extrabold" style={{ background: color, color: onColor(color), borderColor: ink, boxShadow: `0 3px 0 ${ink}` }}>Oyna</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
