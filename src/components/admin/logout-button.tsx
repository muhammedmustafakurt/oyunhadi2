'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  const router = useRouter();
  return (
    <Button variant="outline" size="sm" onClick={async () => {
      await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
      router.push('/admin/giris');
      router.refresh();
    }}>Çıkış</Button>
  );
}
