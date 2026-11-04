import { onColor } from '@/components/oyun/on-color';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/panel/login-form';
import { panelVenue } from '@/lib/venues';

export const metadata = { title: 'Giriş' };

// Mekân girişi (starter'daki iki sütunlu giriş ekranı). Oturum açıksa doğrudan panele.
export default async function LoginPage() {
  if (await panelVenue()) redirect('/panel');
  return (
    <div className="relative grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-secondary text-primary-foreground border-foreground border-r-2 p-10 lg:flex">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(var(--ink)_1.5px,transparent_1.5px)] [background-size:18px_18px]" aria-hidden="true" />
        <Link href="/" className="relative z-10 flex items-center gap-2 text-lg font-bold">
          <span className="grid size-8 place-items-center rounded-md border-2 border-foreground bg-primary shadow-xs">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="5" r="2" fill="#fff" /><circle cx="11" cy="11" r="2" fill="#fff" /></svg>
          </span>
          oyunhadi
        </Link>
        <div className="relative z-10 grid grid-cols-3 gap-3" aria-hidden="true">
          {[['Tabu', '#e0457f'], ['Bil Bakalım', '#1f9d6b'], ['Casus', '#7a4b2a'], ['Vampir Köylü', '#6b2fb0'], ['Çiz Bakalım', '#f2a900'], ['Satranç', '#1d2a5c']].map(([n, c], i) => (
            <div key={n} className="rounded-lg border-2 border-foreground p-4 text-sm font-extrabold shadow-md" style={{ background: c, color: onColor(c), transform: `rotate(${[-4, 3, -2, 2, -3, 4][i]}deg)` }}>{n}</div>
          ))}
        </div>
        <blockquote className="relative z-10 space-y-2">
          <p className="text-lg">&ldquo;Hafta içi öğleden sonraları masalar artık boş kalmıyor. Öğrenciler Tabu için geliyor, iki çay daha içip gidiyor.&rdquo;</p>
          <footer className="text-sm font-bold">Örnek mekân yorumu</footer>
        </blockquote>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-black tracking-tight">Mekân girişi</h1>
          <p className="text-muted-foreground mt-1 mb-6 text-sm">Panelinize e-posta adresiniz ve şifrenizle girin.</p>
          <LoginForm />
          <p className="text-muted-foreground mt-6 text-center text-sm">
            Henüz müşterimiz değil misiniz? <Link href="/teklif" className="text-primary font-bold underline underline-offset-4">Teklif alın</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
