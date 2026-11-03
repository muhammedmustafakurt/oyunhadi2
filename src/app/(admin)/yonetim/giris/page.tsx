import { redirect } from 'next/navigation';
import AdminLoginForm from '@/components/admin/login-form';
import { adminLoginPageState } from '@/lib/admin';

export const metadata = { title: 'Giriş' };
export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const { signedIn, configured } = await adminLoginPageState();
  if (signedIn) redirect('/');
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Yönetim girişi</h1>
        <p className="text-muted-foreground mt-1 mb-6 text-sm">oyunhadi platform yönetimi.</p>
        {configured ? (
          <AdminLoginForm />
        ) : (
          <p role="alert" className="rounded-lg border p-4 text-sm">Yönetici girişi yapılandırılmamış. ADMIN_EMAIL, ADMIN_PASSWORD_HASH ve SESSION_SECRET ortam değişkenlerini ayarlayın.</p>
        )}
      </div>
    </div>
  );
}
