import { onColor } from '@/components/oyun/on-color';
import { redirect } from 'next/navigation';
import { IconShieldLock } from '@tabler/icons-react';
import AdminLoginForm from '@/components/admin/login-form';
import { adminLoginPageState } from '@/lib/admin';

export const metadata = { title: 'Giriş' };
export const dynamic = 'force-dynamic';

// Yönetim girişi: mekân paneliyle aynı iki sütunlu giriş tasarımı. Oturum açıksa doğrudan özete.
export default async function AdminLoginPage() {
  const { signedIn, configured } = await adminLoginPageState();
  if (signedIn) redirect('/admin');
  return (
    <div className="relative grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-secondary text-primary-foreground border-foreground border-r-2 p-10 lg:flex">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(var(--ink)_1.5px,transparent_1.5px)] [background-size:18px_18px]" aria-hidden="true" />
        <div className="relative z-10 flex items-center gap-2 text-lg font-bold">
          <span className="grid size-8 place-items-center rounded-md border-2 border-foreground bg-primary shadow-xs"><IconShieldLock className="size-4" /></span>
          oyunhadi
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-3" aria-hidden="true">
          {[['Mekânlar', '#e0457f'], ['Oyunlar', '#1f9d6b'], ['Masalar', '#7a4b2a'], ['Yöneticiler', '#6b2fb0'], ['Şifreler', '#f2a900'], ['Özet', '#1d2a5c']].map(([n, c], i) => (
            <div key={n} className="rounded-lg border-2 border-foreground p-4 text-sm font-extrabold shadow-md" style={{ background: c, color: onColor(c), transform: `rotate(${[-4, 3, -2, 2, -3, 4][i]}deg)` }}>{n}</div>
          ))}
        </div>
        <p className="relative z-10 text-sm font-bold">Platform yönetimi. Yalnızca yetkili yöneticiler içindir.</p>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-black tracking-tight">Yönetim girişi</h1>
          <p className="text-muted-foreground mt-1 mb-6 text-sm">E-posta adresiniz ve şifrenizle girin.</p>
          {configured ? (
            <AdminLoginForm />
          ) : (
            <p role="alert" className="rounded-lg border-2 p-4 text-sm">Yönetici girişi yapılandırılmamış. SESSION_SECRET, ADMIN_EMAIL ve ADMIN_PASSWORD_HASH ortam değişkenlerini ayarlayın.</p>
          )}
        </div>
      </div>
    </div>
  );
}
