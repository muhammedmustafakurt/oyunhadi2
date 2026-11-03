import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/admin-sidebar';
import AdminHeader from '@/components/admin/admin-header';
import { currentAdminEmail, requireAdminPage } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// Girişli yönetim sayfalarının çerçevesi: mekân paneliyle aynı iskelet (SidebarProvider + AppSidebar + Header).
// Her sayfa ayrıca requireAdminPage() çağırır (layout tek başına yeterli değil).
export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  const email = await currentAdminEmail();
  if (!email) redirect('/admin/giris');
  const defaultOpen = (await cookies()).get('sidebar_state')?.value !== 'false';
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminSidebar email={email} />
      <SidebarInset id="main-content" className="scroll-mt-16">
        <AdminHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
