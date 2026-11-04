'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CardContent } from '@/components/ui/card';

type Settings = { enabled: boolean; open_mode: boolean; retention_hours: number };

const RETENTION = [
  { v: 1, label: '1 saat' },
  { v: 12, label: '12 saat' },
  { v: 24, label: '24 saat' },
  { v: 72, label: '3 gün' },
  { v: 168, label: '7 gün' },
];

// İşletme sohbet ayarları. Yalnızca kendi mekânı için yazar (API çerezden mekânı çözer).
export default function ChatSettings({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [openMode, setOpenMode] = useState(settings.open_mode);
  const [retention, setRetention] = useState(settings.retention_hours);
  const [busy, setBusy] = useState(false);

  const save = async (patch: Partial<Settings>, msg: string) => {
    setBusy(true);
    const r = await fetch('/api/panel/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'settings', patch }),
    });
    setBusy(false);
    if (r.ok) { toast(msg); router.refresh(); }
    else toast.error('Ayar kaydedilemedi.');
  };

  return (
    <CardContent className="grid gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <Label htmlFor="chat-enabled">Masalar arası sohbet</Label>
          <p className="text-muted-foreground text-xs">Kapatırsanız müşteriler sohbet ekranını kullanamaz; açık sohbetler de kapanır.</p>
        </div>
        <Switch
          id="chat-enabled"
          checked={enabled}
          disabled={busy}
          onCheckedChange={(v) => { setEnabled(v); save({ enabled: v }, v ? 'Sohbet açıldı' : 'Sohbet kapatıldı'); }}
        />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <Label htmlFor="chat-open">Herkesle açık sohbet</Label>
          <p className="text-muted-foreground text-xs">Açıkken istek onayı aranmaz; masalar doğrudan sohbet başlatabilir. Varsayılan kapalıdır.</p>
        </div>
        <Switch
          id="chat-open"
          checked={openMode}
          disabled={busy || !enabled}
          onCheckedChange={(v) => { setOpenMode(v); save({ open_mode: v }, v ? 'Açık sohbet modu açıldı' : 'Açık sohbet modu kapatıldı'); }}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="chat-retention">Mesaj saklama süresi</Label>
        <select
          id="chat-retention"
          className="border-input bg-background h-9 w-fit rounded-md border-2 px-3 text-sm"
          value={retention}
          disabled={busy}
          onChange={(e) => { const v = Number(e.target.value); setRetention(v); save({ retention_hours: v }, 'Saklama süresi güncellendi'); }}
        >
          {RETENTION.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
        </select>
        <p className="text-muted-foreground text-xs">Süresi dolan kapalı sohbetlerin mesajları otomatik silinir.</p>
      </div>

      <Button
        variant="outline"
        className="w-fit"
        disabled={busy}
        onClick={() => save({ enabled, open_mode: openMode, retention_hours: retention }, 'Ayarlar kaydedildi')}
      >
        Ayarları kaydet
      </Button>
    </CardContent>
  );
}
