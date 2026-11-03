'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  const router = useRouter();
  return (
    <Button variant="outline" size="sm" onClick={async () => {
      await fetch('/api/yonetim/logout', { method: 'POST' }).catch(() => {});
      router.push('/giris');
      router.refresh();
    }}>Çıkış</Button>
  );
}
