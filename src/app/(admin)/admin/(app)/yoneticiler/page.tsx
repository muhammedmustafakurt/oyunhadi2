import PageContainer from '@/components/panel/page-container';
import AdminsManager from '@/components/admin/admins-manager';
import { currentAdminId, listAdmins, requireAdminPage } from '@/lib/admin';

export const metadata = { title: 'Yöneticiler' };
export const dynamic = 'force-dynamic';

export default async function AdminsPage() {
  await requireAdminPage();
  const [admins, me] = await Promise.all([listAdmins(), currentAdminId()]);
  return (
    <PageContainer title="Yöneticiler" description="Platform yönetimine erişebilen hesaplar.">
      <AdminsManager admins={admins} meId={me ?? 0} />
    </PageContainer>
  );
}
