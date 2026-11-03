import Link from 'next/link';
import LogoutButton from '@/components/admin/logout-button';
import { requireAdminPage } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// Girişli yönetim sayfalarının çerçevesi. Her sayfa ayrıca requireAdminPage() çağırır (layout tek başına yeterli değil).
export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <nav className="flex items-center gap-5 text-sm font-medium" aria-label="Yönetim menüsü">
            <Link href="/admin" className="font-bold">oyunhadi yönetim</Link>
            <Link href="/admin" className="text-muted-foreground hover:text-foreground">Özet</Link>
            <Link href="/admin/mekanlar" className="text-muted-foreground hover:text-foreground">Mekânlar</Link>
            <Link href="/admin/mekanlar/yeni" className="text-muted-foreground hover:text-foreground">Yeni mekân</Link>
            <Link href="/admin/yoneticiler" className="text-muted-foreground hover:text-foreground">Yöneticiler</Link>
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl">{children}</main>
    </div>
  );
}
