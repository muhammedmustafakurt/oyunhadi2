'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// Üretilen şifre yalnızca bu ekranda gösterilir; sunucuda yalnızca karması saklanır.
export default function PasswordReveal({ email, password, onClose }: { email?: string; password: string; onClose?: () => void }) {
  return (
    <div role="status" className="border-foreground bg-secondary text-primary-foreground grid gap-2 rounded-lg border-2 shadow-md p-4">
      <p className="text-sm font-semibold">Şifre bir kez gösterilir, şimdi kopyalayın.</p>
      {email && <p className="text-sm">E-posta: <span className="font-mono font-bold">{email}</span></p>}
      <p className="font-mono text-lg tracking-wide select-all">{password}</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => navigator.clipboard?.writeText(password).then(() => toast.success('Kopyalandı'), () => toast.error('Kopyalanamadı'))}>Kopyala</Button>
        {onClose && <Button size="sm" variant="outline" onClick={onClose}>Kapat</Button>}
      </div>
    </div>
  );
}
