'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IconCurrentLocation } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// Konum kilidi. Açıkken masaya yalnızca mekündaki telefonlar katılabilir; uzaklaşan oyuncu düşer.
// Yarıçap sabit NEAR_M (src/lib/rooms.js, 250 metre); GPS sapması kadar pay verilir.
export default function LocationCard({ lat, lng }: { lat: number | null; lng: number | null }) {
  const router = useRouter();
  const [on, setOn] = useState(lat != null);
  const [la, setLa] = useState(lat?.toFixed(6) ?? '');
  const [ln, setLn] = useState(lng?.toFixed(6) ?? '');
  const [busy, setBusy] = useState(false);

  const here = () => {
    if (!navigator.geolocation) { toast.error('Bu tarayıcı konum vermiyor.'); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setLa(p.coords.latitude.toFixed(6)); setLn(p.coords.longitude.toFixed(6)); setOn(true); },
      () => toast.error('Konum alınamadı, izin verin ya da elle girin.'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const save = async (value: boolean) => {
    if (value && (!la || !ln)) { toast.error('Önce enlem ve boylam girin.'); return; }
    setBusy(true);
    const body = value
      ? JSON.stringify({ lat: la || undefined, lng: ln || undefined })
      : JSON.stringify({ lat: null, lng: null });
    const r = await fetch('/api/panel/venue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    setBusy(false);
    if (r.ok) {
      toast(value ? 'Konum kilidi kaydedildi' : 'Konum kilidi kapatıldı', { description: value ? 'Masalar artık konum kontrolü yapar.' : 'Masalar konum sormadan açılır.' });
      router.refresh();
    } else toast.error('Kaydedilemedi. Enlem/boylam geçerli mi?');
  };

  return (
    <div className="grid gap-4">
      <label className="flex items-center justify-between gap-4 rounded-lg border-2 p-4">
        <span>
          <span className="block font-medium">Konum kilidi</span>
          <span className="text-muted-foreground text-sm">Açıkken masaya yalnızca mekânınızdaki telefonlar katılabilir; uzaklaşan oyuncu masadan düşer.</span>
        </span>
        <Switch checked={on} onCheckedChange={(v) => { setOn(v); save(v); }} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor="lat">Enlem</Label><Input id="lat" value={la} onChange={(e) => setLa(e.target.value)} inputMode="decimal" placeholder="40.990211" disabled={!on} /></div>
        <div className="grid gap-2"><Label htmlFor="lng">Boylam</Label><Input id="lng" value={ln} onChange={(e) => setLn(e.target.value)} inputMode="decimal" placeholder="29.029431" disabled={!on} /></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={here} disabled={!on}><IconCurrentLocation /> Şu anki konumumu kullan</Button>
        <Button onClick={() => save(true)} disabled={busy || !on}>Kaydet</Button>
      </div>
      <p className="text-muted-foreground text-xs">İpucu: Bu sayfayı mekâninizdayken açıp &ldquo;Şu anki konumumu kullan&rdquo;a basın. Yarıçap 250 metre + GPS sapması payıdır.</p>
    </div>
  );
}
